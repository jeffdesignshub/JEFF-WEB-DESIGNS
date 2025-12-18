const axios = require('axios');
const cheerio = require('cheerio');
const mysql = require('mysql2/promise');
const { performance } = require('perf_hooks');

class SEOAudit {
  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
  }

  async auditWebsite(url) {
    const startTime = performance.now();
    
    try {
      // Fetch website
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SEOAuditBot/1.0)'
        }
      });

      const loadTime = performance.now() - startTime;
      const html = response.data;
      const $ = cheerio.load(html);

      // Collect metrics
      const metrics = {
        basic: await this.checkBasicSEO($, url),
        performance: await this.checkPerformance(html, loadTime),
        mobile: await this.checkMobileFriendliness($),
        security: await this.checkSecurity(response.headers, url),
        content: await this.checkContentQuality($),
        links: await this.checkLinks($, url)
      };

      // Calculate overall score
      const scores = this.calculateScores(metrics);
      
      // Save audit
      const auditId = await this.saveAudit(url, metrics, scores);
      
      return {
        success: true,
        auditId,
        url,
        scores,
        metrics,
        recommendations: this.generateRecommendations(metrics, scores)
      };

    } catch (error) {
      console.error('SEO audit error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async checkBasicSEO($, url) {
    const title = $('title').text();
    const description = $('meta[name="description"]').attr('content') || '';
    const headings = {
      h1: $('h1').length,
      h2: $('h2').length,
      h3: $('h3').length,
      h4: $('h4').length
    };
    
    const images = $('img');
    const imagesWithAlt = images.filter((_, img) => $(img).attr('alt')).length;
    
    return {
      title: {
        text: title,
        length: title.length,
        optimal: title.length >= 50 && title.length <= 60
      },
      description: {
        text: description,
        length: description.length,
        optimal: description.length >= 150 && description.length <= 160
      },
      headings,
      images: {
        total: images.length,
        withAlt: imagesWithAlt,
        percentage: (imagesWithAlt / images.length) * 100 || 0
      },
      canonical: $('link[rel="canonical"]').attr('href'),
      robots: $('meta[name="robots"]').attr('content'),
      viewport: $('meta[name="viewport"]').attr('content')
    };
  }

  async checkPerformance(html, loadTime) {
    const htmlSize = Buffer.byteLength(html, 'utf8') / 1024; // KB
    
    // Check for render-blocking resources
    const scriptTags = html.match(/<script[^>]*>/g) || [];
    const styleTags = html.match(/<style[^>]*>/g) || [];
    const linkTags = html.match(/<link[^>]*>/g) || [];
    
    const renderBlocking = {
      scripts: scriptTags.length,
      styles: styleTags.length,
      links: linkTags.length
    };

    return {
      loadTime: Math.round(loadTime),
      htmlSize: Math.round(htmlSize * 100) / 100,
      renderBlocking,
      score: loadTime < 3000 ? 100 : Math.max(0, 100 - (loadTime - 3000) / 50)
    };
  }

  async checkMobileFriendliness($) {
    const viewport = $('meta[name="viewport"]').attr('content');
    const hasViewport = !!viewport;
    
    // Check tap target sizes
    const buttons = $('button, a, input[type="submit"], input[type="button"]');
    const smallButtons = buttons.filter((_, el) => {
      const width = $(el).width();
      const height = $(el).height();
      return (width && width < 48) || (height && height < 48);
    }).length;
    
    // Check font sizes
    const textElements = $('p, span, div, li, td, th');
    const smallText = textElements.filter((_, el) => {
      const fontSize = $(el).css('font-size');
      return fontSize && parseInt(fontSize) < 16;
    }).length;
    
    return {
      hasViewport,
      viewportContent: viewport,
      buttons: {
        total: buttons.length,
        small: smallButtons,
        percentage: (smallButtons / buttons.length) * 100 || 0
      },
      text: {
        total: textElements.length,
        small: smallText,
        percentage: (smallText / textElements.length) * 100 || 0
      }
    };
  }

  async checkSecurity(headers, url) {
    const security = {
      https: url.startsWith('https://'),
      hsts: headers['strict-transport-security'] ? true : false,
      xss: headers['x-xss-protection'] ? true : false,
      frame: headers['x-frame-options'] ? true : false,
      contentType: headers['x-content-type-options'] === 'nosniff',
      cors: headers['access-control-allow-origin'] ? true : false
    };

    return security;
  }

  async checkContentQuality($) {
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = text.split(/\s+/).length;
    
    // Check for keywords (simplified)
    const keywords = ['design', 'website', 'mobile', 'app', 'development', 'branding', 'logo'];
    const foundKeywords = keywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    
    // Check readability (simplified)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const avgSentenceLength = sentences.length > 0 
      ? text.length / sentences.length 
      : 0;
    
    return {
      wordCount,
      keywordDensity: (foundKeywords / keywords.length) * 100,
      avgSentenceLength: Math.round(avgSentenceLength),
      paragraphs: $('p').length,
      lists: $('ul, ol').length
    };
  }

  async checkLinks($, baseUrl) {
    const links = $('a');
    const internalLinks = [];
    const externalLinks = [];
    const brokenLinks = [];
    
    links.each((_, link) => {
      const href = $(link).attr('href');
      if (!href) return;
      
      const isInternal = href.startsWith('/') || href.includes(baseUrl);
      const linkData = {
        href,
        text: $(link).text().trim(),
        title: $(link).attr('title'),
        rel: $(link).attr('rel'),
        nofollow: $(link).attr('rel')?.includes('nofollow')
      };
      
      if (isInternal) {
        internalLinks.push(linkData);
      } else {
        externalLinks.push(linkData);
      }
    });
    
    return {
      total: links.length,
      internal: internalLinks.length,
      external: externalLinks.length,
      broken: brokenLinks.length,
      internalLinks,
      externalLinks
    };
  }

  calculateScores(metrics) {
    const weights = {
      basic: 25,
      performance: 25,
      mobile: 20,
      security: 15,
      content: 15
    };
    
    const scores = {
      basic: this.calculateBasicScore(metrics.basic),
      performance: metrics.performance.score,
      mobile: this.calculateMobileScore(metrics.mobile),
      security: this.calculateSecurityScore(metrics.security),
      content: this.calculateContentScore(metrics.content)
    };
    
    const total = Object.entries(scores).reduce((sum, [key, score]) => {
      return sum + (score * (weights[key] / 100));
    }, 0);
    
    return {
      ...scores,
      total: Math.round(total),
      grade: this.getGrade(total)
    };
  }

  calculateBasicScore(basic) {
    let score = 0;
    
    // Title (15 points)
    if (basic.title.optimal) score += 15;
    else if (basic.title.length > 0) score += 10;
    
    // Description (15 points)
    if (basic.description.optimal) score += 15;
    else if (basic.description.length > 0) score += 10;
    
    // Headings (20 points)
    if (basic.headings.h1 === 1) score += 10;
    if (basic.headings.h2 >= 2) score += 5;
    if (basic.headings.h3 >= 3) score += 5;
    
    // Images (20 points)
    score += Math.min(20, basic.images.percentage / 5);
    
    // Meta tags (30 points)
    if (basic.canonical) score += 10;
    if (basic.robots) score += 10;
    if (basic.viewport) score += 10;
    
    return Math.min(100, score);
  }

  calculateMobileScore(mobile) {
    let score = 0;
    
    if (mobile.hasViewport) score += 40;
    
    // Button size (30 points)
    if (mobile.buttons.percentage <= 10) score += 30;
    else if (mobile.buttons.percentage <= 20) score += 20;
    else if (mobile.buttons.percentage <= 30) score += 10;
    
    // Text size (30 points)
    if (mobile.text.percentage <= 10) score += 30;
    else if (mobile.text.percentage <= 20) score += 20;
    else if (mobile.text.percentage <= 30) score += 10;
    
    return score;
  }

  calculateSecurityScore(security) {
    let score = 0;
    
    if (security.https) score += 30;
    if (security.hsts) score += 20;
    if (security.xss) score += 15;
    if (security.frame) score += 15;
    if (security.contentType) score += 10;
    if (security.cors) score += 10;
    
    return score;
  }

  calculateContentScore(content) {
    let score = 0;
    
    // Word count (40 points)
    if (content.wordCount >= 1000) score += 40;
    else if (content.wordCount >= 500) score += 30;
    else if (content.wordCount >= 300) score += 20;
    else if (content.wordCount >= 100) score += 10;
    
    // Keyword density (30 points)
    if (content.keywordDensity >= 20) score += 30;
    else if (content.keywordDensity >= 15) score += 25;
    else if (content.keywordDensity >= 10) score += 20;
    else if (content.keywordDensity >= 5) score += 15;
    else if (content.keywordDensity >= 2) score += 10;
    
    // Structure (30 points)
    if (content.paragraphs >= 5) score += 15;
    if (content.lists >= 2) score += 15;
    
    return Math.min(100, score);
  }

  getGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  }

  async saveAudit(url, metrics, scores) {
    const [result] = await this.pool.execute(
      `INSERT INTO seo_audits 
       (url, metrics, scores, overall_score, grade, performed_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        url,
        JSON.stringify(metrics),
        JSON.stringify(scores),
        scores.total,
        scores.grade
      ]
    );

    return result.insertId;
  }

  generateRecommendations(metrics, scores) {
    const recommendations = [];
    
    // Basic SEO recommendations
    if (!metrics.basic.title.optimal) {
      recommendations.push({
        priority: 'high',
        category: 'basic',
        title: 'Optimize Page Title',
        description: `Title should be 50-60 characters. Current: ${metrics.basic.title.length}`,
        fix: 'Update the <title> tag in your HTML'
      });
    }
    
    if (!metrics.basic.description.optimal) {
      recommendations.push({
        priority: 'high',
        category: 'basic',
        title: 'Optimize Meta Description',
        description: `Description should be 150-160 characters. Current: ${metrics.basic.description.length}`,
        fix: 'Update the meta description tag'
      });
    }
    
    if (metrics.basic.images.percentage < 100) {
      recommendations.push({
        priority: 'medium',
        category: 'basic',
        title: 'Add Alt Text to Images',
        description: `${Math.round(100 - metrics.basic.images.percentage)}% of images missing alt text`,
        fix: 'Add descriptive alt attributes to all <img> tags'
      });
    }
    
    // Performance recommendations
    if (metrics.performance.loadTime > 3000) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        title: 'Improve Page Load Time',
        description: `Page loads in ${metrics.performance.loadTime}ms (should be under 3000ms)`,
        fix: 'Optimize images, enable compression, reduce render-blocking resources'
      });
    }
    
    // Mobile recommendations
    if (!metrics.mobile.hasViewport) {
      recommendations.push({
        priority: 'high',
        category: 'mobile',
        title: 'Add Viewport Meta Tag',
        description: 'Missing viewport tag for mobile responsiveness',
        fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">'
      });
    }
    
    // Security recommendations
    if (!metrics.security.https) {
      recommendations.push({
        priority: 'critical',
        category: 'security',
        title: 'Enable HTTPS',
        description: 'Website is not using HTTPS',
        fix: 'Install SSL certificate and redirect HTTP to HTTPS'
      });
    }
    
    // Content recommendations
    if (metrics.content.wordCount < 300) {
      recommendations.push({
        priority: 'medium',
        category: 'content',
        title: 'Add More Content',
        description: `Only ${metrics.content.wordCount} words (aim for 300+)`,
        fix: 'Add more valuable content to the page'
      });
    }
    
    return recommendations;
  }

  async compareWithCompetitors(url, competitors) {
    const audits = [];
    
    // Audit main website
    audits.push(await this.auditWebsite(url));
    
    // Audit competitors
    for (const competitor of competitors) {
      try {
        const audit = await this.auditWebsite(competitor);
        audits.push(audit);
      } catch (error) {
        console.error(`Failed to audit ${competitor}:`, error);
      }
    }
    
    // Generate comparison
    const comparison = {
      scores: audits.map(a => ({
        url: a.url,
        score: a.scores?.total || 0,
        grade: a.scores?.grade || 'F'
      })),
      recommendations: this.generateCompetitorRecommendations(audits)
    };
    
    return comparison;
  }

  generateCompetitorRecommendations(audits) {
    const mainAudit = audits[0];
    if (!mainAudit.success) return [];
    
    const recommendations = [];
    
    // Find best competitor
    const bestCompetitor = audits
      .slice(1)
      .filter(a => a.success)
      .sort((a, b) => (b.scores?.total || 0) - (a.scores?.total || 0))[0];
    
    if (!bestCompetitor) return [];
    
    // Compare with best competitor
    const mainScore = mainAudit.scores.total;
    const competitorScore = bestCompetitor.scores.total;
    
    if (competitorScore > mainScore) {
      recommendations.push({
        title: 'Learn from Competitor',
        description: `${bestCompetitor.url} scores ${competitorScore} vs your ${mainScore}`,
        action: `Analyze ${bestCompetitor.url} for best practices`
      });
    }
    
    return recommendations;
  }
}

module.exports = SEOAudit;