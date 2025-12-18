const axios = require('axios');
const mysql = require('mysql2/promise');
const { TwitterApi } = require('twitter-api-v2');
const { IgApiClient } = require('instagram-private-api');
const { FacebookApi } = require('facebook-nodejs-business-sdk');

class SocialMediaAutomation {
  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    // Initialize APIs
    this.twitterClient = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET
    });

    this.igClient = new IgApiClient();
    this.facebookApi = FacebookApi.init(process.env.FACEBOOK_ACCESS_TOKEN);
  }

  async createPost(content, options = {}) {
    const post = {
      content: content.text,
      image: content.image,
      video: content.video,
      platforms: options.platforms || ['twitter', 'facebook', 'instagram'],
      schedule: options.schedule || new Date(),
      tags: options.tags || []
    };

    // Save to database
    const [result] = await this.pool.execute(
      `INSERT INTO social_posts 
       (content, image_url, video_url, platforms, scheduled_for, tags, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'scheduled')`,
      [
        post.content,
        post.image,
        post.video,
        JSON.stringify(post.platforms),
        post.schedule,
        JSON.stringify(post.tags)
      ]
    );

    const postId = result.insertId;

    // Schedule posts
    if (post.schedule <= new Date()) {
      await this.publishPost(postId);
    } else {
      // Schedule for later
      const delay = post.schedule.getTime() - Date.now();
      setTimeout(() => this.publishPost(postId), delay);
    }

    return {
      success: true,
      postId,
      scheduled: post.schedule,
      platforms: post.platforms
    };
  }

  async publishPost(postId) {
    try {
      // Get post from database
      const [posts] = await this.pool.execute(
        `SELECT * FROM social_posts WHERE id = ?`,
        [postId]
      );

      if (posts.length === 0) throw new Error('Post not found');

      const post = posts[0];
      const platforms = JSON.parse(post.platforms);
      const results = {};

      // Publish to each platform
      for (const platform of platforms) {
        try {
          switch (platform) {
            case 'twitter':
              results.twitter = await this.postToTwitter(post);
              break;
            case 'facebook':
              results.facebook = await this.postToFacebook(post);
              break;
            case 'instagram':
              results.instagram = await this.postToInstagram(post);
              break;
            case 'linkedin':
              results.linkedin = await this.postToLinkedIn(post);
              break;
          }
        } catch (error) {
          console.error(`Failed to post to ${platform}:`, error);
          results[platform] = { success: false, error: error.message };
        }
      }

      // Update post status
      await this.pool.execute(
        `UPDATE social_posts SET 
         status = 'published',
         published_at = NOW(),
         results = ?
         WHERE id = ?`,
        [JSON.stringify(results), postId]
      );

      // Send notification
      await this.sendPostNotification(postId, results);

      return {
        success: true,
        postId,
        results
      };

    } catch (error) {
      console.error('Publish error:', error);
      
      await this.pool.execute(
        `UPDATE social_posts SET status = 'failed', error = ? WHERE id = ?`,
        [error.message, postId]
      );

      return {
        success: false,
        error: error.message
      };
    }
  }

  async postToTwitter(post) {
    const twitter = this.twitterClient.readWrite;
    
    let mediaId = null;
    
    // Upload image if exists
    if (post.image_url) {
      const imageBuffer = await this.downloadImage(post.image_url);
      const media = await twitter.v1.uploadMedia(imageBuffer, {
        mimeType: 'image/jpeg'
      });
      mediaId = media;
    }

    // Create tweet
    const tweet = await twitter.v2.tweet({
      text: this.formatTwitterContent(post.content, post.tags),
      media: mediaId ? { media_ids: [mediaId] } : undefined
    });

    return {
      success: true,
      tweetId: tweet.data.id,
      url: `https://twitter.com/user/status/${tweet.data.id}`
    };
  }

  async postToFacebook(post) {
    // For Facebook Page
    const pageId = process.env.FACEBOOK_PAGE_ID;
    
    let attachment = {};
    
    if (post.image_url) {
      attachment = {
        url: post.image_url,
        published: false
      };
    }

    const response = await this.facebookApi.post(`${pageId}/feed`, {
      message: this.formatFacebookContent(post.content, post.tags),
      ...attachment,
      access_token: process.env.FACEBOOK_PAGE_TOKEN
    });

    return {
      success: true,
      postId: response.id,
      url: `https://facebook.com/${response.id}`
    };
  }

  async postToInstagram(post) {
    await this.igClient.state.generateDevice(process.env.INSTAGRAM_USERNAME);
    await this.igClient.account.login(
      process.env.INSTAGRAM_USERNAME,
      process.env.INSTAGRAM_PASSWORD
    );

    let publishResult;
    
    if (post.video_url) {
      // Publish video
      const videoBuffer = await this.downloadVideo(post.video_url);
      publishResult = await this.igClient.publish.video({
        video: videoBuffer,
        caption: this.formatInstagramContent(post.content, post.tags)
      });
    } else if (post.image_url) {
      // Publish image
      const imageBuffer = await this.downloadImage(post.image_url);
      publishResult = await this.igClient.publish.photo({
        file: imageBuffer,
        caption: this.formatInstagramContent(post.content, post.tags)
      });
    } else {
      // Publish story
      publishResult = await this.igClient.publish.story({
        file: await this.downloadImage(post.image_url || 'default-image.jpg'),
        caption: post.content
      });
    }

    return {
      success: true,
      mediaId: publishResult.media.id,
      url: `https://instagram.com/p/${publishResult.media.code}/`
    };
  }

  async postToLinkedIn(post) {
    const response = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      {
        author: `urn:li:person:${process.env.LINKEDIN_PERSON_URN}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: this.formatLinkedInContent(post.content, post.tags)
            },
            shareMediaCategory: post.image_url ? 'IMAGE' : 'NONE',
            media: post.image_url ? [{
              status: 'READY',
              description: {
                text: post.content.substring(0, 200)
              },
              media: post.image_url,
              title: {
                text: 'JEFF DESIGNS HUB'
              }
            }] : []
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      postId: response.data.id,
      url: `https://linkedin.com/feed/update/${response.data.id}`
    };
  }

  formatTwitterContent(content, tags) {
    const hashtags = tags.map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ');
    const maxLength = 280 - hashtags.length - 2; // 2 for space and buffer
    const truncated = content.length > maxLength 
      ? content.substring(0, maxLength - 3) + '...' 
      : content;
    
    return `${truncated} ${hashtags}`.trim();
  }

  formatFacebookContent(content, tags) {
    const hashtags = tags.map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ');
    return `${content}\n\n${hashtags}\n\n👉 Learn more: ${process.env.FRONTEND_URL}`;
  }

  formatInstagramContent(content, tags) {
    const hashtags = tags.map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ');
    const maxLength = 2200 - hashtags.length - 50; // Instagram limit
    const truncated = content.length > maxLength 
      ? content.substring(0, maxLength - 3) + '...' 
      : content;
    
    return `${truncated}\n\n${hashtags}\n\n🔗 Link in bio\n👉 ${process.env.FRONTEND_URL}`;
  }

  formatLinkedInContent(content, tags) {
    const hashtags = tags.map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ');
    return `${content}\n\n${hashtags}\n\nVisit: ${process.env.FRONTEND_URL}`;
  }

  async downloadImage(url) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data, 'binary');
  }

  async downloadVideo(url) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data, 'binary');
  }

  async sendPostNotification(postId, results) {
    const [post] = await this.pool.execute(
      `SELECT * FROM social_posts WHERE id = ?`,
      [postId]
    );

    if (!post[0]) return;

    const successPlatforms = Object.keys(results).filter(p => results[p].success);
    
    // Send email notification
    const emailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #6C63FF, #36D1DC); padding: 20px; text-align: center; color: white;">
          <h1>📱 Social Media Posts Published</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa;">
          <p>Your social media posts have been published successfully!</p>
          
          <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #10B981;">
            <h3>Publication Results:</h3>
            <ul>
              ${successPlatforms.map(platform => `
                <li>
                  <strong>${platform.toUpperCase()}:</strong> 
                  <a href="${results[platform].url}">View Post</a>
                </li>
              `).join('')}
            </ul>
          </div>
          
          <p><strong>Content Preview:</strong></p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0;">
            ${post[0].content.substring(0, 200)}...
          </div>
          
          <a href="${process.env.ADMIN_URL}/social/posts/${postId}" 
             style="display: inline-block; padding: 10px 20px; background: #6C63FF; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">
             View Analytics
          </a>
        </div>
      </div>
    `;

    // Send to admin email
    await this.sendEmail(
      'jeffdesignshub@gmail.com',
      'Social Media Posts Published',
      emailTemplate
    );
  }

  async sendEmail(to, subject, html) {
    // Implementation would use nodemailer
    console.log(`Email to ${to}: ${subject}`);
  }

  async generateContentIdeas(keywords, count = 10) {
    const ideas = [];
    const templates = [
      `How to {keyword} for Your Business`,
      `5 Best {keyword} Tips in 2024`,
      `Why {keyword} is Essential for Success`,
      `{keyword} Mistakes to Avoid`,
      `Complete Guide to {keyword}`,
      `{keyword} Trends You Need to Know`,
      `Transform Your Business with {keyword}`,
      `{keyword} Case Study: Success Story`,
      `Beginner's Guide to {keyword}`,
      `{keyword} vs Traditional Methods`
    ];

    for (let i = 0; i < count; i++) {
      const template = templates[Math.floor(Math.random() * templates.length)];
      const keyword = keywords[Math.floor(Math.random() * keywords.length)];
      const idea = template.replace('{keyword}', keyword);
      
      ideas.push({
        title: idea,
        platform: ['twitter', 'facebook', 'instagram'][Math.floor(Math.random() * 3)],
        estimatedEngagement: Math.floor(Math.random() * 1000) + 100,
        tags: [keyword, 'design', 'business', 'kenya', 'digital']
      });
    }

    return ideas;
  }

  async getAnalytics(startDate, endDate) {
    const [posts] = await this.pool.execute(
      `SELECT 
        platform,
        COUNT(*) as total_posts,
        SUM(engagement) as total_engagement,
        AVG(engagement) as avg_engagement,
        MAX(engagement) as max_engagement,
        MIN(engagement) as min_engagement
       FROM social_analytics 
       WHERE date BETWEEN ? AND ?
       GROUP BY platform`,
      [startDate, endDate]
    );

    const [bestPosts] = await this.pool.execute(
      `SELECT 
        sa.*,
        sp.content,
        sp.image_url
       FROM social_analytics sa
       JOIN social_posts sp ON sa.post_id = sp.id
       WHERE sa.date BETWEEN ? AND ?
       ORDER BY sa.engagement DESC
       LIMIT 5`,
      [startDate, endDate]
    );

    return {
      summary: posts,
      bestPosts,
      recommendations: this.generateAnalyticsRecommendations(posts)
    };
  }

  generateAnalyticsRecommendations(posts) {
    const recommendations = [];
    
    // Find best performing platform
    const bestPlatform = posts.reduce((best, current) => 
      current.avg_engagement > best.avg_engagement ? current : best
    , posts[0]);

    // Find worst performing platform
    const worstPlatform = posts.reduce((worst, current) => 
      current.avg_engagement < worst.avg_engagement ? current : worst
    , posts[0]);

    if (bestPlatform && worstPlatform) {
      recommendations.push({
        type: 'platform_focus',
        message: `Focus more on ${bestPlatform.platform} (${bestPlatform.avg_engagement} avg engagement)`,
        action: `Increase posting frequency on ${bestPlatform.platform} by 50%`
      });

      recommendations.push({
        type: 'platform_improve',
        message: `Improve ${worstPlatform.platform} performance (${worstPlatform.avg_engagement} avg engagement)`,
        action: `Test different content types on ${worstPlatform.platform}`
      });
    }

    // Timing recommendations
    recommendations.push({
      type: 'timing',
      message: 'Best posting times: 9-11 AM and 7-9 PM',
      action: 'Schedule posts during peak engagement hours'
    });

    // Content recommendations
    recommendations.push({
      type: 'content',
      message: 'Visual posts get 2.3x more engagement',
      action: 'Include images/videos in every post'
    });

    return recommendations;
  }
}

module.exports = SocialMediaAutomation;