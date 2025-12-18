const OpenAI = require('openai');
const mysql = require('mysql2/promise');
const axios = require('axios');

class AIBlogGenerator {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
  }

  async generateBlogPost(topic, keywords = [], targetAudience = 'business owners') {
    try {
      // Generate content using GPT-4
      const prompt = `
        Write a comprehensive blog post about "${topic}" for ${targetAudience}.
        Include these keywords: ${keywords.join(', ')}
        
        Requirements:
        1. Title: Catchy and SEO-optimized
        2. Meta Description: 150-160 characters
        3. Introduction: Engaging hook
        4. 5-7 main sections with subheadings
        5. Practical tips and examples
        6. Conclusion with call-to-action
        7. 5 FAQ questions and answers
        8. Word count: 1500-2000 words
        
        Format as JSON with these keys:
        - title
        - meta_description
        - introduction
        - sections (array of objects with heading and content)
        - conclusion
        - faqs (array of objects with question and answer)
        - tags (array of relevant tags)
        - estimated_read_time
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a professional content writer specializing in web design, development, and digital marketing."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      });

      const content = JSON.parse(response.choices[0].message.content);
      
      // Generate featured image using DALL-E
      const imagePrompt = `Professional blog post featured image about "${topic}" for a web design agency, modern, clean, digital art`;
      
      const imageResponse = await this.openai.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1792x1024",
        quality: "hd"
      });

      content.featured_image = imageResponse.data[0].url;
      
      // Save to database
      const [result] = await this.pool.execute(
        `INSERT INTO blog_posts 
         (title, slug, excerpt, content, featured_image, tags, meta_description, read_time, status, ai_generated) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', true)`,
        [
          content.title,
          this.generateSlug(content.title),
          content.introduction.substring(0, 200) + '...',
          JSON.stringify(content),
          content.featured_image,
          JSON.stringify(content.tags),
          content.meta_description,
          content.estimated_read_time
        ]
      );

      // Generate social media posts
      await this.generateSocialMediaPosts(content.title, result.insertId);
      
      return {
        success: true,
        postId: result.insertId,
        content: content
      };

    } catch (error) {
      console.error('Blog generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }

  async generateSocialMediaPosts(title, postId) {
    const platforms = ['twitter', 'linkedin', 'facebook', 'instagram'];
    
    for (const platform of platforms) {
      const prompt = `Write a ${platform} post promoting this blog: "${title}". 
        Include relevant hashtags and a call-to-action to read the full article.`;
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a social media expert for a web design agency.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      });

      const socialPost = response.choices[0].message.content;
      
      // Save social media post
      await this.pool.execute(
        `INSERT INTO social_posts 
         (platform, content, post_id, scheduled_for) 
         VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 DAY))`,
        [platform, socialPost, postId]
      );
    }
  }

  async generateMonthlyContentCalendar() {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const currentMonth = new Date().getMonth();
    const topics = [
      'Website Design Trends',
      'SEO Best Practices',
      'Mobile App Development',
      'Branding Strategies',
      'E-commerce Solutions',
      'Social Media Marketing',
      'Content Marketing',
      'Web Performance Optimization',
      'UI/UX Design Principles',
      'Digital Transformation'
    ];

    const calendar = [];
    
    for (let i = 0; i < 3; i++) { // Next 3 months
      const month = months[(currentMonth + i) % 12];
      const monthTopics = [];
      
      // Generate 4 topics per month
      for (let j = 0; j < 4; j++) {
        const topic = topics[Math.floor(Math.random() * topics.length)];
        const keywords = await this.generateKeywords(topic);
        
        monthTopics.push({
          week: j + 1,
          topic: topic,
          keywords: keywords,
          target_audience: ['Startups', 'Small Businesses', 'Enterprises'][j % 3]
        });
      }
      
      calendar.push({
        month: month,
        topics: monthTopics
      });
    }

    // Save calendar
    await this.pool.execute(
      `INSERT INTO content_calendar (calendar_data, generated_at) 
       VALUES (?, NOW())`,
      [JSON.stringify(calendar)]
    );

    return calendar;
  }

  async generateKeywords(topic) {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an SEO expert. Generate 10 relevant keywords for the given topic."
        },
        {
          role: "user",
          content: `Topic: ${topic}\n\nGenerate 10 SEO keywords with search volume estimates.`
        }
      ],
      temperature: 0.5,
      max_tokens: 200
    });

    return response.choices[0].message.content.split('\n').filter(k => k.trim());
  }
}

module.exports = AIBlogGenerator;