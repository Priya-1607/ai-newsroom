import { v4 as uuidv4 } from 'uuid';
import { Server as SocketIOServer } from 'socket.io';
import Article from '../models/Article';
import ReformattedContent from '../models/ReformattedContent';
import BrandVoice from '../models/BrandVoice';
import { OpenAIAgent } from '../agents/openAIAgent';

interface ProcessingOptions {
  articleId: string;
  articleContent: string;
  articleTitle: string;
  brandVoiceId?: string;
  platforms: string[];
  userId: string;
}

interface ReformatResult {
  platform: string;
  title: string;
  content: string;
  wordCount: number;
  characterCount: number;
  hashtags: string[];
}

export class ProcessService {
  private io: SocketIOServer;
  private openAIAgent: OpenAIAgent;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.openAIAgent = new OpenAIAgent();
  }

  async startProcessing(options: ProcessingOptions): Promise<string> {
    const jobId = uuidv4();
    const { articleId, articleContent, articleTitle, brandVoiceId, platforms, userId } = options;

    // Get brand voice if specified
    let brandVoice = null;
    if (brandVoiceId) {
      brandVoice = await BrandVoice.findById(brandVoiceId);
    }

    // Emit started event
    this.emitProcessStarted(userId, { jobId, articleId, title: articleTitle });

    try {
      // Update article status
      await Article.findByIdAndUpdate(articleId, { status: 'processing' });

      // Phase 1: Research and Analysis
      await this.runResearchPhase(userId, jobId, articleId, articleContent, brandVoice);

      // Phase 1.5: Fake News Detection
      await this.runFakeNewsDetectionPhase(userId, jobId, articleId, articleContent);

      // Phase 2: Reformat for each platform
      const reformattedResults = await this.runReformatPhase(
        userId,
        jobId,
        articleId,
        articleContent,
        articleTitle,
        platforms,
        brandVoice
      );

      // Phase 3: Fact Checking
      await this.runFactCheckPhase(
        userId,
        jobId,
        articleId,
        articleContent,
        reformattedResults
      );

      // Phase 4: SEO Optimization
      await this.runSEOPPhase(
        userId,
        jobId,
        articleId,
        reformattedResults
      );

      // Mark as completed
      await Article.findByIdAndUpdate(articleId, { status: 'completed' });

      this.emitProcessCompleted(userId, {
        jobId,
        articleId,
        results: reformattedResults,
      });

      return jobId;
    } catch (error) {
      await Article.findByIdAndUpdate(articleId, { status: 'failed' });
      this.emitProcessFailed(userId, {
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async runResearchPhase(
    userId: string,
    jobId: string,
    articleId: string,
    content: string,
    brandVoice: any
  ): Promise<void> {
    this.emitAgentStatus(userId, { agent: 'researcher', status: 'running' });

    const researchData = await this.openAIAgent.runResearcher(content);

    this.emitAgentStatus(userId, { agent: 'researcher', status: 'completed' });
  }

  private async runFakeNewsDetectionPhase(
    userId: string,
    jobId: string,
    articleId: string,
    content: string
  ): Promise<void> {
    this.emitAgentStatus(userId, { agent: 'factChecker', status: 'running' });

    this.io.to(userId).emit('process:update', {
      jobId,
      articleId,
      status: 'processing',
      progress: 25,
      currentStep: 'Analyzing content for authenticity and fake news indicators...',
    });

    const fakeNewsDetection = await this.openAIAgent.runFakeNewsDetection(content);

    // Save fake news detection results to article
    await Article.findByIdAndUpdate(articleId, {
      fakeNewsDetection: {
        ...fakeNewsDetection,
        analyzedAt: new Date(),
      },
    });

    this.emitAgentStatus(userId, { agent: 'factChecker', status: 'completed' });
  }

  private async runReformatPhase(
    userId: string,
    jobId: string,
    articleId: string,
    content: string,
    title: string,
    platforms: string[],
    brandVoice: any
  ): Promise<ReformatResult[]> {
    this.emitAgentStatus(userId, { agent: 'reformatter', status: 'running' });

    const results: ReformatResult[] = [];

    for (const platform of platforms) {
      this.io.to(userId).emit('process:update', {
        jobId,
        articleId,
        status: 'processing',
        progress: 30 + (platforms.indexOf(platform) * 10),
        currentStep: `Formatting for ${platform}...`,
      });

      const systemPrompt = brandVoice?.systemPrompt || this.getDefaultSystemPrompt(platform);

      const reformatted = await this.openAIAgent.runReformatter({
        content,
        title,
        platform,
        systemPrompt,
        brandVoiceStyle: brandVoice?.tone,
      });

      results.push({
        platform,
        title: reformatted.title,
        content: reformatted.content,
        wordCount: reformatted.wordCount,
        characterCount: reformatted.characterCount,
        hashtags: reformatted.hashtags || [],
      });
    }

    // Save reformatted content to database
    for (const result of results) {
      await ReformattedContent.findOneAndUpdate(
        { articleId: articleId as any, platform: result.platform as any },
        {
          articleId: articleId as any,
          platform: result.platform as any,
          title: result.title,
          content: result.content,
          metadata: {
            wordCount: result.wordCount,
            characterCount: result.characterCount,
            hashtags: result.hashtags,
          },
        },
        { upsert: true, new: true }
      );
    }

    this.emitAgentStatus(userId, { agent: 'reformatter', status: 'completed' });

    return results;
  }

  private async runFactCheckPhase(
    userId: string,
    jobId: string,
    articleId: string,
    originalContent: string,
    reformattedResults: ReformatResult[]
  ): Promise<void> {
    this.emitAgentStatus(userId, { agent: 'factChecker', status: 'running' });

    for (const result of reformattedResults) {
      const verification = await this.openAIAgent.runFactChecker(
        originalContent,
        result.content
      );

      await ReformattedContent.findOneAndUpdate(
        { articleId: articleId as any, platform: result.platform as any },
        {
          factCheck: {
            verificationStatus: verification.verificationStatus,
            isVerified: verification.isVerified,
            verificationScore: verification.verificationScore,
            discrepancies: verification.discrepancies,
            extractedFacts: verification.extractedFacts,
            claims: verification.claims,
            missingFacts: verification.missingFacts,
            overallSummary: verification.overallSummary,
            verifiedAt: new Date(),
          },
        }
      );
    }

    this.emitAgentStatus(userId, { agent: 'factChecker', status: 'completed' });
  }

  private async runSEOPPhase(
    userId: string,
    jobId: string,
    articleId: string,
    reformattedResults: ReformatResult[]
  ): Promise<void> {
    this.emitAgentStatus(userId, { agent: 'seoOptimizer', status: 'running' });

    const seoContent = reformattedResults.find((r) => r.platform === 'seo');

    if (seoContent) {
      const seoOptimization = await this.openAIAgent.runSEOOptimizer(
        seoContent.content,
        seoContent.title
      );

      await ReformattedContent.findOneAndUpdate(
        { articleId: articleId as any, platform: 'seo' as any },
        {
          seo: {
            metaTitle: seoOptimization.metaTitle,
            metaDescription: seoOptimization.metaDescription,
            keywords: seoOptimization.keywords,
            slug: seoOptimization.slug,
          },
        }
      );
    }

    this.emitAgentStatus(userId, { agent: 'seoOptimizer', status: 'completed' });
  }

  async reformatContent(options: {
    content: string;
    platform: string;
    brandVoiceId?: string;
  }): Promise<ReformatResult> {
    const { content, platform, brandVoiceId } = options;

    let brandVoice = null;
    if (brandVoiceId) {
      brandVoice = await BrandVoice.findById(brandVoiceId);
    }

    const systemPrompt = brandVoice?.systemPrompt || this.getDefaultSystemPrompt(platform);

    const reformatted = await this.openAIAgent.runReformatter({
      content,
      title: '',
      platform,
      systemPrompt,
      brandVoiceStyle: brandVoice?.tone,
    });

    return {
      platform,
      title: reformatted.title,
      content: reformatted.content,
      wordCount: reformatted.wordCount,
      characterCount: reformatted.characterCount,
      hashtags: reformatted.hashtags || [],
    };
  }

  private getDefaultSystemPrompt(platform: string): string {
    const prompts: Record<string, string> = {
      linkedin: `Format content for LinkedIn. Use professional tone, relevant hashtags, and engaging first-person narrative. Include a call-to-action.`,
      tiktok: `Create a short, engaging script for TikTok. Use casual language, hook the viewer in the first 3 seconds, and include trending phrases.`,
      newsletter: `Format as an email newsletter section. Use friendly, informative tone with clear headers and engaging introduction.`,
      seo: `Optimize for search engines. Include target keywords naturally, write compelling meta description, and structure with headers.`,
      'press-release': `Format as a professional press release. Use inverted pyramid style, include quotes, and follow standard PR format.`,
      twitter: `Condense into a tweet (max 280 chars). Be concise, use hashtags, and include engaging hook.`,
      instagram: `Create an Instagram caption. Use emojis, include relevant hashtags, and engaging storytelling.`,
    };

    return prompts[platform] || prompts.linkedin;
  }

  private emitProcessStarted(userId: string, data: any): void {
    this.io.to(userId).emit('process:started', data);
    this.io.to(userId).emit('process:update', {
      ...data,
      status: 'processing',
      progress: 10,
      currentStep: 'Initializing agents...',
      agentStatus: {
        researcher: 'pending',
        reformatter: 'pending',
        factChecker: 'pending',
        seoOptimizer: 'pending',
      },
    });
  }

  private emitProcessCompleted(userId: string, data: any): void {
    this.io.to(userId).emit('process:update', {
      ...data,
      status: 'completed',
      progress: 100,
      currentStep: 'Processing complete!',
    });
    this.io.to(userId).emit('process:completed', data);
  }

  private emitProcessFailed(userId: string, data: any): void {
    this.io.to(userId).emit('process:failed', data);
  }

  private emitAgentStatus(userId: string, data: { agent: string; status: string }): void {
    this.io.to(userId).emit('agent:status', data);
  }
}

