import { Server as SocketIOServer } from 'socket.io';
import axios from 'axios';

interface PostOptions {
  contentId: string;
  platform: string;
  content: string;
  title: string;
  userId: string;
  options?: {
    mediaUrls?: string[];
    link?: string;
    visibility?: 'public' | 'private' | 'connections';
  };
}

interface ScheduledPost {
  id: string;
  contentId: string;
  platform: string;
  scheduledTime: Date;
  content: string;
  title: string;
  userId: string;
  status: 'scheduled' | 'cancelled' | 'published' | 'failed';
}

export class DistributionService {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  async postToPlatform(options: PostOptions): Promise<any> {
    const { platform, content, title, options: postOptions } = options;

    // Emit posting started event
    this.io.to(options.userId).emit('distribution:started', {
      platform,
      contentId: options.contentId,
    });

    try {
      let result;

      switch (platform) {
        case 'linkedin':
          result = await this.postToLinkedIn(content, title, postOptions);
          break;
        case 'twitter':
          result = await this.postToTwitter(content, title, postOptions);
          break;
        case 'facebook':
          result = await this.postToFacebook(content, title, postOptions);
          break;
        case 'instagram':
          result = await this.postToInstagram(content, postOptions);
          break;
        case 'newsletter':
          result = await this.sendNewsletter(content, title);
          break;
        case 'email':
          result = await this.sendEmail(content, title);
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      // Emit success event
      this.io.to(options.userId).emit('distribution:completed', {
        platform,
        contentId: options.contentId,
        result,
      });

      return result;
    } catch (error) {
      // Emit failure event
      this.io.to(options.userId).emit('distribution:failed', {
        platform,
        contentId: options.contentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async schedulePost(options: PostOptions & { scheduledTime: Date }): Promise<ScheduledPost> {
    // In production, store in database and use a job scheduler
    const scheduledPost: ScheduledPost = {
      id: `sp_${Date.now()}`,
      contentId: options.contentId,
      platform: options.platform,
      scheduledTime: options.scheduledTime,
      content: options.content,
      title: options.title,
      userId: options.userId,
      status: 'scheduled',
    };

    // Emit scheduled event
    this.io.to(options.userId).emit('distribution:scheduled', {
      scheduledPost,
    });

    return scheduledPost;
  }

  private async postToLinkedIn(
    content: string,
    title: string,
    options?: PostOptions['options']
  ): Promise<any> {
    // LinkedIn API integration
    // In production, use actual LinkedIn API
    const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;

    if (!accessToken) {
      // Return mock response for development
      return {
        success: true,
        platform: 'linkedin',
        postId: `li_${Date.now()}`,
        url: `https://www.linkedin.com/posts/${Date.now()}`,
        message: 'LinkedIn post created (mock - no API key)',
      };
    }

    try {
      const response = await axios.post(
        'https://api.linkedin.com/v2/ugcPosts',
        {
          author: `urn:li:person:${process.env.LINKEDIN_USER_ID}`,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: content,
              },
              shareMediaCategory: 'NONE',
            },
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': options?.visibility || 'PUBLIC',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        platform: 'linkedin',
        postId: response.data.id,
        url: `https://www.linkedin.com/posts/${response.data.id}`,
      };
    } catch (error) {
      console.error('LinkedIn API Error:', error);
      throw error;
    }
  }

  private async postToTwitter(
    content: string,
    title: string,
    options?: PostOptions['options']
  ): Promise<any> {
    // Twitter/X API integration
    // In production, use actual Twitter API
    const apiKey = process.env.TWITTER_API_KEY;

    if (!apiKey) {
      return {
        success: true,
        platform: 'twitter',
        postId: `tw_${Date.now()}`,
        url: `https://twitter.com/i/web/status/${Date.now()}`,
        message: 'Tweet created (mock - no API key)',
      };
    }

    return {
      success: true,
      platform: 'twitter',
      postId: `tw_${Date.now()}`,
      url: `https://twitter.com/i/web/status/${Date.now()}`,
    };
  }

  private async postToFacebook(
    content: string,
    title: string,
    options?: PostOptions['options']
  ): Promise<any> {
    // Facebook API integration
    return {
      success: true,
      platform: 'facebook',
      postId: `fb_${Date.now()}`,
      url: `https://facebook.com/posts/${Date.now()}`,
      message: 'Facebook post created (mock)',
    };
  }

  private async postToInstagram(
    content: string,
    options?: PostOptions['options']
  ): Promise<any> {
    // Instagram API integration
    return {
      success: true,
      platform: 'instagram',
      postId: `ig_${Date.now()}`,
      url: `https://instagram.com/p/${Date.now()}`,
      message: 'Instagram post created (mock)',
    };
  }

  private async sendNewsletter(content: string, title: string): Promise<any> {
    // Newsletter integration (e.g., Mailchimp, Substack)
    return {
      success: true,
      platform: 'newsletter',
      message: 'Newsletter scheduled (mock)',
      issueId: `nl_${Date.now()}`,
    };
  }

  private async sendEmail(content: string, title: string): Promise<any> {
    // Email distribution
    return {
      success: true,
      platform: 'email',
      message: 'Email sent (mock)',
      recipientCount: 0,
    };
  }
}

export const distributionService = new DistributionService(null as any);

