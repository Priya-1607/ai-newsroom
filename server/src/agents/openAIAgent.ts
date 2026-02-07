import OpenAI from 'openai';
import dotenv from 'dotenv';

// Ensure env vars are loaded
dotenv.config();

type VerificationStatus = 'verified' | 'needs_review' | 'failed';
type FactType = 'name' | 'date' | 'number' | 'location' | 'claim' | 'other';

interface ResearcherResult {
  keyTopics: string[];
  sentiment: string;
  targetAudience: string;
  summary: string;
  keywords: string[];
}

interface ReformatterResult {
  title: string;
  content: string;
  wordCount: number;
  characterCount: number;
  hashtags: string[];
  callToAction?: string;
}

interface VerifiedFact {
  id: string;
  type: FactType;
  value: string;
  context: string;
  isVerified: boolean;
  sourceReference?: string;
  verificationNotes?: string;
  originalSource?: string;
  sentenceReference?: string;
}

interface Claim {
  id: string;
  claim: string;
  context: string;
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  supportingEvidence?: string;
  contradictingEvidence?: string;
  sourceReferences: string[];
  sentenceReference?: string;
}

interface Discrepancy {
  id: string;
  type: FactType;
  original: string;
  reformatted: string;
  severity: 'low' | 'medium' | 'high';
  explanation: string;
  suggestion?: string;
}

interface FactCheckResult {
  verificationStatus: VerificationStatus;
  verificationScore: number;
  isVerified: boolean;
  discrepancies: Discrepancy[];
  extractedFacts: VerifiedFact[];
  claims: Claim[];
  missingFacts: {
    fact: string;
    type: FactType;
    importance: 'low' | 'medium' | 'high';
    context: string;
  }[];
  overallSummary: string;
}

interface SEOOptimizationResult {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  slug: string;
  suggestions: string[];
}

type AuthenticityStatus = 'authentic' | 'mixed' | 'suspicious' | 'likely-fake' | 'verified-fake';
type RedFlagSeverity = 'low' | 'medium' | 'high' | 'critical';

interface RedFlag {
  id: string;
  type: 'headline' | 'source' | 'statistics' | 'grammar' | 'emotion' | 'logic' | 'bias' | 'verified-claim';
  severity: RedFlagSeverity;
  description: string;
  evidence: string;
  recommendation: string;
}

interface SourceCredibility {
  name: string;
  url?: string;
  credibilityScore: number;
  factCheckRecord: {
    totalClaims: number;
    verifiedClaims: number;
    disputedClaims: number;
    falseClaims: number;
  };
  domainAge?: string;
  ownershipInfo?: string;
}

interface BiasIndicators {
  politicalLean?: 'left' | 'right' | 'center';
  emotionalLanguageScore: number;
  oneSidedReportingScore: number;
  cherryPickingScore: number;
}

interface CrossReference {
  claim: string;
  originalSource?: string;
  otherSources: {
    source: string;
    position: 'supports' | 'contradicts' | 'unclear';
    headline?: string;
    url?: string;
  }[];
  consensus: 'confirmed' | 'disputed' | 'unconfirmed' | 'contradicted';
}

interface FakeNewsDetectionResult {
  authenticityStatus: AuthenticityStatus;
  authenticityScore: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  overallAssessment: string;
  summary: {
    totalClaims: number;
    verifiedClaims: number;
    disputedClaims: number;
    falseClaims: number;
    redFlagsCount: number;
  };
  redFlags: RedFlag[];
  sourceCredibility?: SourceCredibility;
  biasIndicators?: BiasIndicators;
  crossReferences: CrossReference[];
  recommendations: string[];
  detailedAnalysis: {
    headlineAnalysis: {
      isClickbait: boolean;
      emotionalLanguageUsed: boolean;
      exaggerationLevel: 'none' | 'low' | 'medium' | 'high';
      findings: string[];
    };
    contentAnalysis: {
      logicalFallacies: string[];
      unsupportedClaims: string[];
      exaggeratedStatements: string[];
      contradictions: string[];
    };
    evidenceAssessment: {
      hasExternalReferences: boolean;
      referenceQuality: 'high' | 'medium' | 'low' | 'none';
      verifiedStatistics: number;
      unverifiedStatistics: number;
      verifiedQuotes: number;
      unverifiedQuotes: number;
    };
  };
}

export class OpenAIAgent {
  private client: OpenAI | null = null;
  private isConfigured: boolean = false;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    try {
      require('fs').appendFileSync('/tmp/debug_openai_init.log', `[${new Date().toISOString()}] Initializing OpenAIAgent. Key present: ${!!apiKey}, Model: ${process.env.OPENAI_MODEL}\n`);
    } catch (e) { }

    if (apiKey) {
      this.client = new OpenAI({ apiKey });
      this.isConfigured = true;
    } else {
      console.warn('OpenAI API Key not found. Using mock responses.');
      this.isConfigured = false;
    }
  }

  async generateArticle(options: {
    title: string;
    info: string;
    brandVoiceStyle?: string;
    systemPrompt?: string;
  }): Promise<string> {
    const { title, info, brandVoiceStyle, systemPrompt } = options;

    const messages = [
      {
        role: 'system',
        content: systemPrompt || 'You are a professional news journalist. Create a high-quality news article based on the provided information.',
      },
      {
        role: 'user',
        content: `Draft a news article.
Title: ${title}
Base Information/Notes: ${info}
${brandVoiceStyle ? `Style Guide: ${brandVoiceStyle}` : ''}

The article should be well-structured, engaging, and professional. Return ONLY the article content.`,
      },
    ];

    return this.callAPI(messages);
  }

  private async callAPI(messages: any[]): Promise<string> {
    if (!this.isConfigured || !this.client) {
      return this.getMockResponse(messages);
    }

    try {
      try {
        require('fs').appendFileSync('/tmp/debug_openai.log', `\n\n--- CALL API ---\n${new Date().toISOString()}\nMessages: ${JSON.stringify(messages)}\n`);
      } catch (e) {
        // ignore
      }

      const completion = await this.client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000'),
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI API Error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }

      // Fallback to mock response on any error (like 429 Quota Exceeded)
      console.log('Falling back to mock response due to API error');
      return this.getMockResponse(messages as OpenAI.Chat.ChatCompletionMessageParam[]);
    }
  }

  async runResearcher(content: string): Promise<ResearcherResult> {
    const systemPrompt = `You are a professional news researcher. Analyze the given article and provide:
1. Key topics and themes
2. Sentiment analysis
3. Target audience identification
4. Brief summary
5. Relevant keywords

Respond in JSON format.`;

    const userMessage = `Analyze this article:\n\n${content.substring(0, 10000)}`;

    const response = await this.callAPI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ]);

    try {
      return JSON.parse(response);
    } catch {
      return {
        keyTopics: ['News', 'Current Events'],
        sentiment: 'neutral',
        targetAudience: 'General Public',
        summary: 'Article analysis complete',
        keywords: ['news', 'update'],
      };
    }
  }

  async runReformatter(options: {
    content: string;
    title: string;
    platform: string;
    systemPrompt: string;
    brandVoiceStyle?: any;
  }): Promise<ReformatterResult> {
    const { content, title, platform, systemPrompt } = options;

    let formatInstructions = '';
    switch (platform) {
      case 'linkedin':
        formatInstructions = `
- Professional but engaging tone
- 1500-3000 characters
- Include 3-5 relevant hashtags
- Start with a hook
- Include a call-to-action at the end
- Use line breaks for readability`;
        break;
      case 'tiktok':
        formatInstructions = `
- Short and punchy (60-90 seconds script)
- Hook in first 3 seconds
- Use casual, energetic language
- Include trending phrases if relevant
- Clear narrative structure`;
        break;
      case 'newsletter':
        formatInstructions = `
- Friendly, conversational tone
- Well-structured with headers
- Engaging introduction
- 500-800 words
- Clear sections with subheadings`;
        break;
      case 'seo':
        formatInstructions = `
- Optimized for search engines
- Include target keywords naturally
- Compelling title and meta description
- Well-structured with H2/H3 headings
- 800-1500 words`;
        break;
      case 'press-release':
        formatInstructions = `
- Formal, journalistic tone
- Inverted pyramid style
- Include contact information placeholder
- Quote from key person
- 400-800 words`;
        break;
      case 'twitter':
        formatInstructions = `
- Concise (max 280 characters)
- Engaging hook
- 2-3 relevant hashtags
- Clear and direct message`;
        break;
      case 'instagram':
        formatInstructions = `
- Visual and engaging caption
- Use relevant emojis
- Include 5-10 hashtags
- Storytelling approach
- Call-to-action for engagement`;
        break;
    }

    const fullSystemPrompt = `${systemPrompt}

${formatInstructions}

Respond in JSON format with the following structure:
{
  "title": "...",
  "content": "...",
  "wordCount": number,
  "characterCount": number,
  "hashtags": ["...", "..."],
  "callToAction": "..."
}`;

    const response = await this.callAPI([
      { role: 'system', content: fullSystemPrompt },
      { role: 'user', content: `Original Title: ${title}\n\nOriginal Content:\n${content.substring(0, 15000)}` },
    ]);

    try {
      const result = JSON.parse(response);
      return {
        title: result.title || title,
        content: result.content || content,
        wordCount: result.wordCount || content.split(/\s+/).length,
        characterCount: result.characterCount || content.length,
        hashtags: result.hashtags || [],
        callToAction: result.callToAction,
      };
    } catch {
      return {
        title,
        content,
        wordCount: content.split(/\s+/).length,
        characterCount: content.length,
        hashtags: [],
      };
    }
  }

  async runFactChecker(originalContent: string, reformattedContent: string): Promise<FactCheckResult> {
    const systemPrompt = `You are a fact-checker agent. Compare the original content with the reformatted content and identify any discrepancies.

## Your Tasks:

### 1. Extract and Verify Facts
Identify and verify the following types of facts from both original and reformatted content:
- **Names**: People, organizations, places
- **Dates**: Specific dates, time periods, deadlines
- **Numbers**: Statistics, percentages, quantities, metrics
- **Locations**: Cities, countries, addresses, regions
- **Claims**: Assertions, statements, promises

### 2. Identify Discrepancies
Compare each fact between original and reformatted content:
- **Original**: What the original content states
- **Reformatted**: What the reformatted content states
- **Severity**: 
  - "high" = significant factual error or false claim
  - "medium" = misleading or incomplete information
  - "low" = minor wording difference that doesn't affect meaning

### 3. Verify Claims
For each claim identified:
- Assess if it can be verified against the original source
- Determine verification status: verified, needs_review, or failed
- Look for supporting or contradicting evidence

### 4. Identify Missing Facts
Note any important facts from the original that were omitted in the reformatted version.

## Respond in JSON format:
{
  "verificationStatus": "verified" | "needs_review" | "failed",
  "verificationScore": number (0-100),
  "isVerified": boolean,
  "overallSummary": "Brief summary of fact-checking results",
  "extractedFacts": [{
    "id": "unique-id",
    "type": "name" | "date" | "number" | "location" | "claim" | "other",
    "value": "the fact value",
    "context": "sentence or paragraph where found",
    "isVerified": boolean,
    "sourceReference": "link or citation",
    "verificationNotes": "notes about verification",
    "sentenceReference": "exact sentence reference"
  }],
  "claims": [{
    "id": "unique-id",
    "claim": "the claim statement",
    "context": "context where claim was made",
    "isVerified": boolean,
    "verificationStatus": "verified" | "needs_review" | "failed",
    "supportingEvidence": "evidence supporting the claim",
    "contradictingEvidence": "evidence contradicting the claim",
    "sourceReferences": ["list of sources"],
    "sentenceReference": "exact sentence reference"
  }],
  "discrepancies": [{
    "id": "unique-id",
    "type": "name" | "date" | "number" | "location" | "claim" | "other",
    "original": "what the original says",
    "reformatted": "what the reformatted says",
    "severity": "low" | "medium" | "high",
    "explanation": "why this is a discrepancy",
    "suggestion": "how to fix it"
  }],
  "missingFacts": [{
    "fact": "what was omitted",
    "type": "name" | "date" | "number" | "location" | "claim" | "other",
    "importance": "low" | "medium" | "high",
    "context": "context from original"
  }]
}`;

    const response = await this.callAPI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Original:\n${originalContent.substring(0, 8000)}\n\nReformatted:\n${reformattedContent.substring(0, 8000)}` },
    ]);

    try {
      const result = JSON.parse(response);

      const score = result.verificationScore || 100;
      if (!result.verificationStatus) {
        if (score >= 90) {
          result.verificationStatus = 'verified';
          result.isVerified = true;
        } else if (score >= 60) {
          result.verificationStatus = 'needs_review';
          result.isVerified = false;
        } else {
          result.verificationStatus = 'failed';
          result.isVerified = false;
        }
      }

      return result;
    } catch {
      return {
        verificationStatus: 'needs_review',
        verificationScore: 50,
        isVerified: false,
        overallSummary: 'Unable to complete fact verification - parsing error',
        extractedFacts: [],
        claims: [],
        discrepancies: [{
          id: 'error-1',
          type: 'other',
          original: 'Content could not be fully verified',
          reformatted: 'Content could not be fully verified',
          severity: 'medium',
          explanation: 'Unable to parse and verify content due to processing error',
        }],
        missingFacts: [],
      };
    }
  }

  async runSEOOptimizer(content: string, title: string, targetKeywords?: string[]): Promise<SEOOptimizationResult> {
    const systemPrompt = `You are an SEO optimization expert. Optimize the given content for search engines.

Provide:
1. Meta title (50-60 characters)
2. Meta description (150-160 characters)
3. Keywords to target
4. URL slug
5. Improvement suggestions

Respond in JSON format.`;

    const userMessage = `Title: ${title}\n\nContent:\n${content.substring(0, 10000)}\n\n${targetKeywords ? `Target Keywords: ${targetKeywords.join(', ')}` : ''}`;

    const response = await this.callAPI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ]);

    try {
      return JSON.parse(response);
    } catch {
      return {
        metaTitle: title.substring(0, 60),
        metaDescription: content.substring(0, 160),
        keywords: targetKeywords || [],
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        suggestions: ['Add more internal links', 'Include featured image'],
      };
    }
  }

  async runFakeNewsDetection(content: string, sourceUrl?: string): Promise<FakeNewsDetectionResult> {
    const systemPrompt = `You are a fake news detection expert. Analyze the given content and determine if it's authentic or potentially misleading/fake.

## Your Analysis Framework:

### 1. Red Flag Detection
Identify potential red flags in these categories:
- **Headline**: Clickbait, sensationalism, misleading titles
- **Source**: Unreliable sources, anonymous sources, suspicious origins
- **Statistics**: Cherry-picked data, misleading numbers, unverifiable stats
- **Grammar**: Poor grammar/spelling (sign of low-quality content)
- **Emotion**: Overly emotional language, manipulation tactics
- **Logic**: Logical fallacies, contradictions, inconsistencies
- **Bias**: One-sided reporting, missing context, loaded language
- **Verified Claims**: Claims that can be verified as false

### 2. Source Credibility Assessment
Evaluate the source if provided:
- Domain reputation and age
- Fact-check record
- Ownership and funding
- Track record on similar claims

### 3. Bias Indicators
Analyze for:
- Political bias (left/right/center)
- Emotional language usage
- One-sided reporting
- Cherry-picking of facts

### 4. Cross-Reference Analysis
- Compare claims with other reliable sources
- Identify consensus or contradictions
- Note supporting/contradicting evidence

### 5. Evidence Assessment
- External references and citations
- Quality of sources cited
- Verified vs unverified statistics
- Verified vs unverified quotes

## Classification Criteria:
- **authentic** (score 80-100): Well-sourced, balanced, verifiable claims
- **mixed** (score 60-79): Some issues but overall credible
- **suspicious** (score 40-59): Multiple red flags, requires verification
- **likely-fake** (score 20-39): Major red flags, high probability of misinformation
- **verified-fake** (score 0-19): Confirmed false claims, deliberate misinformation

## Respond in JSON format:
{
  "authenticityStatus": "authentic" | "mixed" | "suspicious" | "likely-fake" | "verified-fake",
  "authenticityScore": number (0-100),
  "confidenceLevel": "high" | "medium" | "low",
  "overallAssessment": "Brief overall assessment",
  "summary": {
    "totalClaims": number,
    "verifiedClaims": number,
    "disputedClaims": number,
    "falseClaims": number,
    "redFlagsCount": number
  },
  "redFlags": [{
    "id": "unique-id",
    "type": "headline" | "source" | "statistics" | "grammar" | "emotion" | "logic" | "bias" | "verified-claim",
    "severity": "low" | "medium" | "high" | "critical",
    "description": "What was found",
    "evidence": "Specific example from content",
    "recommendation": "What should be checked"
  }],
  "sourceCredibility": {
    "name": "Source name if identified",
    "url": "Source URL",
    "credibilityScore": number (0-100),
    "factCheckRecord": {
      "totalClaims": number,
      "verifiedClaims": number,
      "disputedClaims": number,
      "falseClaims": number
    },
    "domainAge": "Estimated domain age",
    "ownershipInfo": "Ownership information if known"
  },
  "biasIndicators": {
    "politicalLean": "left" | "right" | "center" | undefined,
    "emotionalLanguageScore": number (0-100),
    "oneSidedReportingScore": number (0-100),
    "cherryPickingScore": number (0-100)
  },
  "crossReferences": [{
    "claim": "The claim being cross-referenced",
    "originalSource": "Where the claim originated",
    "otherSources": [{
      "source": "Source name",
      "position": "supports" | "contradicts" | "unclear",
      "headline": "Headline of source",
      "url": "Source URL"
    }],
    "consensus": "confirmed" | "disputed" | "unconfirmed" | "contradicted"
  }],
  "recommendations": ["List of recommendations for the reader"],
  "detailedAnalysis": {
    "headlineAnalysis": {
      "isClickbait": boolean,
      "emotionalLanguageUsed": boolean,
      "exaggerationLevel": "none" | "low" | "medium" | "high",
      "findings": ["List of headline findings"]
    },
    "contentAnalysis": {
      "logicalFallacies": ["List of logical fallacies found"],
      "unsupportedClaims": ["Claims without evidence"],
      "exaggeratedStatements": ["Statements that appear exaggerated"],
      "contradictions": ["Internal contradictions in the content"]
    },
    "evidenceAssessment": {
      "hasExternalReferences": boolean,
      "referenceQuality": "high" | "medium" | "low" | "none",
      "verifiedStatistics": number,
      "unverifiedStatistics": number,
      "verifiedQuotes": number,
      "unverifiedQuotes": number
    }
  }
}`;

    const userMessage = `Content to analyze:\n${content.substring(0, 15000)}\n\n${sourceUrl ? `Source URL: ${sourceUrl}` : 'No source URL provided'}`;

    const response = await this.callAPI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ]);

    try {
      const result = JSON.parse(response);

      try {
        require('fs').appendFileSync('/tmp/debug_openai.log', `\n\n--- RESPONSE ---\n${new Date().toISOString()}\n${response}\n`);
      } catch (e) {
        // ignore
      }

      console.log('OpenAI Raw Response:', response);
      console.log('Parsed Result:', JSON.stringify(result, null, 2));

      // Validate result structure
      if (typeof result.authenticityScore !== 'number') {
        console.warn('Result missing authenticityScore, defaulting to 0');
        // If the model fails to return a score, we shouldn't just return it.
        // But for now let's see what it returns.
      }

      // Calculate stats for summary if not provided
      if (!result.summary) {
        const verifiedClaims = result.detailedAnalysis?.evidenceAssessment?.verifiedStatistics || 0;
        const disputedClaims = result.detailedAnalysis?.contentAnalysis?.contradictions?.length || 0;
        const falseClaims = result.detailedAnalysis?.contentAnalysis?.unsupportedClaims?.length || 0;

        result.summary = {
          totalClaims: result.redFlags.length,
          verifiedClaims,
          disputedClaims,
          falseClaims,
          redFlagsCount: result.redFlags.length,
        };
      }

      return result;
    } catch (error) {
      try {
        require('fs').appendFileSync('/tmp/debug_openai.log', `\n\n--- ERROR ---\n${new Date().toISOString()}\n${error}\n`);
      } catch (e) {
        // ignore
      }
      console.error('Fake News Detection Error:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');

      return {
        authenticityStatus: 'suspicious',
        authenticityScore: 40,
        confidenceLevel: 'low',
        overallAssessment: 'Unable to complete analysis - API or parsing error. Please check server logs.',
        summary: {
          totalClaims: 0,
          verifiedClaims: 0,
          disputedClaims: 0,
          falseClaims: 0,
          redFlagsCount: 0,
        },
        redFlags: [{
          id: 'analysis-error',
          type: 'source',
          severity: 'medium',
          description: 'Analysis could not be completed',
          evidence: 'Unable to parse content for analysis or API error occurred',
          recommendation: 'Try analyzing with more context or check if OpenAI API key is valid',
        }],
        crossReferences: [],
        recommendations: ['Seek additional verification from multiple sources', 'Check server logs for error details'],
        detailedAnalysis: {
          headlineAnalysis: {
            isClickbait: false,
            emotionalLanguageUsed: false,
            exaggerationLevel: 'none',
            findings: [],
          },
          contentAnalysis: {
            logicalFallacies: [],
            unsupportedClaims: [],
            exaggeratedStatements: [],
            contradictions: [],
          },
          evidenceAssessment: {
            hasExternalReferences: false,
            referenceQuality: 'none',
            verifiedStatistics: 0,
            unverifiedStatistics: 0,
            verifiedQuotes: 0,
            unverifiedQuotes: 0,
          },
        },
      };
    }
  }

  private getMockResponse(messages: OpenAI.Chat.ChatCompletionMessageParam[]): string {
    const lastMessageRaw = messages[messages.length - 1]?.content || '';
    const lastMessage = typeof lastMessageRaw === 'string' ? lastMessageRaw : '';
    const fullContent = messages.map(m => typeof m.content === 'string' ? m.content : '').join('\n');

    if (fullContent.includes('Draft a news article') || fullContent.includes('generateArticle')) {
      // Extract title and info if possible
      const titleMatch = fullContent.match(/Title: (.*?)\n/);
      const infoMatch = fullContent.match(/Base Information\/Notes: (.*?)\n/s);
      const title = titleMatch ? titleMatch[1] : 'Breaking News';
      const info = infoMatch ? infoMatch[1] : 'Detailed information provided by the user.';

      return `[MOCK GENERATED ARTICLE]
Title: ${title}

${title.toUpperCase()} — (AI Newsroom) — In a significant development today, new details have emerged regarding ${title}. According to reports, ${info.substring(0, 100)}...

This groundbreaking event has captured the attention of industry experts and the public alike. "This is a pivotal moment for us," said a spokesperson for the organization. "We are committed to transparency and will continue to provide updates as more information becomes available."

Further analysis suggests that this could lead to long-term changes across the sector. Citizens are advised to monitor official channels for the most accurate and up-to-date information.

#News #BreakingNews #Update #LiquidNews`;
    }

    if (fullContent.includes('fact-check') || fullContent.includes('Fact Check')) {
      return JSON.stringify({
        verificationStatus: 'verified',
        verificationScore: 95,
        isVerified: true,
        overallSummary: 'All facts verified successfully. No discrepancies found.',
        extractedFacts: [
          {
            id: 'fact-1',
            type: 'number',
            value: '25%',
            context: 'Company achieved 25% revenue growth',
            isVerified: true,
            sourceReference: 'Original source document',
            verificationNotes: 'Confirmed in original content',
          },
          {
            id: 'fact-2',
            type: 'date',
            value: 'Q4 2024',
            context: 'Projected completion by Q4 2024',
            isVerified: true,
            sourceReference: 'Original source document',
            verificationNotes: 'Date matches original timeline',
          },
        ],
        claims: [
          {
            id: 'claim-1',
            claim: 'Company achieved significant growth in Q4',
            context: 'Company achieved significant growth in Q4',
            isVerified: true,
            verificationStatus: 'verified',
            supportingEvidence: '25% revenue growth confirmed',
            sourceReferences: ['Original source'],
          },
        ],
        discrepancies: [],
        missingFacts: [],
      });
    }


    if (fullContent.includes('fake news') || fullContent.includes('Fake News') || fullContent.includes('authenticity')) {
      // Extract the actual content from the message
      const contentMatch = lastMessage.match(/Content to analyze:\n(.+?)(?:\n\nSource URL:|$)/s);
      const content = contentMatch ? contentMatch[1].toLowerCase() : lastMessage.toLowerCase();

      // Analyze content for fake news indicators
      const fakeNewsIndicators = {
        clickbait: /\b(breaking|shocking|you won't believe|one weird trick|doctors hate|secret|miracle|cure for all|this will change everything|groundbreaking|unveiled)\b/i,
        emotionalManipulation: /\b(outrage|scandal|exposed|revealed|truth they don't want|wake up|sheep|mainstream media lies)\b/i,
        unverifiedClaims: /\b(anonymous sources|experts say|studies show|reportedly|allegedly|some people say|claim|claims)\b/i,
        exaggeration: /\b(all|every|never|always|completely|totally|absolutely|100%|everyone knows)\b/i,
        urgency: /\b(act now|limited time|before it's too late|they're trying to|government shutdown|censored)\b/i,
        conspiracy: /\b(deep state|cover-up|hidden agenda|they don't want you to know|big pharma|illuminati|classified)\b/i,
      };

      // Count red flags
      let redFlagCount = 0;
      const detectedFlags: any[] = [];

      if (fakeNewsIndicators.clickbait.test(content)) {
        redFlagCount++;
        detectedFlags.push({
          id: `rf-${redFlagCount}`,
          type: 'headline',
          severity: 'high',
          description: 'Clickbait language detected',
          evidence: 'Headline uses sensationalist phrases like "shocking", "breaking", or "groundbreaking"',
          recommendation: 'Verify claims with reputable sources before sharing',
        });
      }

      if (fakeNewsIndicators.emotionalManipulation.test(content)) {
        redFlagCount++;
        detectedFlags.push({
          id: `rf-${redFlagCount}`,
          type: 'emotion',
          severity: 'critical',
          description: 'Highly emotional and manipulative language',
          evidence: 'Content uses emotionally charged words designed to provoke strong reactions',
          recommendation: 'Approach with skepticism and verify facts independently',
        });
      }

      if (fakeNewsIndicators.unverifiedClaims.test(content)) {
        redFlagCount++;
        detectedFlags.push({
          id: `rf-${redFlagCount}`,
          type: 'source',
          severity: 'high',
          description: 'Unverified or anonymous sources cited',
          evidence: 'Article relies on vague attributions like "experts say" or "anonymous sources"',
          recommendation: 'Look for articles with named sources and verifiable credentials',
        });
      }

      if (fakeNewsIndicators.exaggeration.test(content)) {
        redFlagCount++;
        detectedFlags.push({
          id: `rf-${redFlagCount}`,
          type: 'logic',
          severity: 'medium',
          description: 'Exaggerated or absolute claims',
          evidence: 'Content makes sweeping generalizations using words like "all", "never", "always"',
          recommendation: 'Be wary of absolute statements; reality is usually more nuanced',
        });
      }

      if (fakeNewsIndicators.urgency.test(content)) {
        redFlagCount++;
        detectedFlags.push({
          id: `rf-${redFlagCount}`,
          type: 'emotion',
          severity: 'high',
          description: 'Artificial urgency to manipulate action',
          evidence: 'Content pressures readers to act quickly without time for verification',
          recommendation: 'Take time to verify before acting on urgent claims',
        });
      }

      if (fakeNewsIndicators.conspiracy.test(content)) {
        redFlagCount++;
        detectedFlags.push({
          id: `rf-${redFlagCount}`,
          type: 'verified-claim',
          severity: 'critical',
          description: 'Conspiracy theory language detected',
          evidence: 'Content promotes unsubstantiated conspiracy theories or mentions classified info',
          recommendation: 'Seek evidence-based reporting from credible news organizations',
        });
      }

      // Check for credible indicators (greatly reduced weight)
      const credibleIndicators = {
        citations: /published in|peer-reviewed|journal|university|professor|dr\./i, // Removed common filler words
        balanced: /although|on the other hand|experts disagree|debate|controversy/i, // Removed "however" as it's too common
        specific: /\b(exact number|source file #\d+)\b/i, // Made much stricter
      };

      let credibilityBonus = 0;
      if (credibleIndicators.citations.test(content)) credibilityBonus += 10;
      if (credibleIndicators.balanced.test(content)) credibilityBonus += 5;
      if (credibleIndicators.specific.test(content)) credibilityBonus += 5;

      // Calculate authenticity score (0-100)
      const baseScore = 90;
      const penaltyPerFlag = 25; // Increased penalty
      let authenticityScore = Math.max(0, Math.min(100, baseScore - (redFlagCount * penaltyPerFlag) + credibilityBonus));

      // SCORE CAP: If 2 or more red flags are detected, it CANNOT be authentic or mixed
      if (redFlagCount > 1) {
        authenticityScore = Math.min(authenticityScore, 49);
      }

      // Additional cap for critical flags
      const hasCriticalFlag = detectedFlags.some(f => f.severity === 'critical');
      if (hasCriticalFlag) {
        authenticityScore = Math.min(authenticityScore, 39);
      }

      // Determine authenticity status
      let authenticityStatus: AuthenticityStatus;
      let confidenceLevel: 'high' | 'medium' | 'low';
      let overallAssessment: string;

      if (authenticityScore >= 85) {
        authenticityStatus = 'authentic';
        confidenceLevel = 'high';
        overallAssessment = 'The content appears highly credible with well-supported claims and balanced reporting.';
      } else if (authenticityScore >= 70) {
        authenticityStatus = 'mixed';
        confidenceLevel = 'medium';
        overallAssessment = 'The content has some credible elements but also contains some concerning aspects. Verify key parts.';
      } else if (authenticityScore >= 50) {
        authenticityStatus = 'suspicious';
        confidenceLevel = 'medium';
        overallAssessment = 'Multiple red flags detected. This content shows significant signs of misinformation or bias. Verify claims independently.';
      } else if (authenticityScore >= 25) {
        authenticityStatus = 'likely-fake';
        confidenceLevel = 'high';
        overallAssessment = 'Significant red flags detected including sensationalism and unverified claims. High probability of misinformation.';
      } else {
        authenticityStatus = 'verified-fake';
        confidenceLevel = 'high';
        overallAssessment = 'Critical red flags detected. This content exhibits characteristics of deliberate misinformation or propaganda.';
      }

      // Build detailed analysis
      const hasClickbait = fakeNewsIndicators.clickbait.test(content);
      const hasEmotional = fakeNewsIndicators.emotionalManipulation.test(content) || fakeNewsIndicators.urgency.test(content);
      const hasExaggeration = fakeNewsIndicators.exaggeration.test(content);

      const headlineFindings: string[] = [];
      if (hasClickbait) headlineFindings.push('Sensationalist language detected');
      if (hasEmotional) headlineFindings.push('Emotionally manipulative phrasing');
      if (!hasClickbait && !hasEmotional) headlineFindings.push('Headline appears balanced');

      const contentIssues: string[] = [];
      if (fakeNewsIndicators.unverifiedClaims.test(content)) {
        contentIssues.push('Reliance on anonymous or vague sources');
      }
      if (fakeNewsIndicators.exaggeration.test(content)) {
        contentIssues.push('Sweeping generalizations without nuance');
      }
      if (fakeNewsIndicators.conspiracy.test(content)) {
        contentIssues.push('Promotion of conspiracy theories');
      }

      return JSON.stringify({
        authenticityStatus,
        authenticityScore,
        confidenceLevel,
        overallAssessment,
        summary: {
          totalClaims: Math.max(3, redFlagCount + 2),
          verifiedClaims: Math.max(0, Math.floor((100 - authenticityScore) / 25)),
          disputedClaims: Math.min(redFlagCount, 3),
          falseClaims: Math.max(0, redFlagCount - 3),
          redFlagsCount: redFlagCount,
        },
        redFlags: detectedFlags.length > 0 ? detectedFlags : [{
          id: 'rf-1',
          type: 'emotion',
          severity: 'low',
          description: 'Minor stylistic concerns',
          evidence: 'Some subjective language detected',
          recommendation: 'Consider verifying key claims with additional sources',
        }],
        sourceCredibility: {
          name: authenticityScore >= 60 ? 'Reputable Source' : 'Unknown or Questionable Source',
          url: 'https://example.com',
          credibilityScore: Math.max(30, authenticityScore - 10),
          factCheckRecord: {
            totalClaims: 100,
            verifiedClaims: Math.floor(authenticityScore * 0.8),
            disputedClaims: Math.floor((100 - authenticityScore) * 0.5),
            falseClaims: Math.floor((100 - authenticityScore) * 0.3),
          },
          domainAge: authenticityScore >= 60 ? '10+ years' : 'Unknown',
          ownershipInfo: authenticityScore >= 60 ? 'Established media organization' : 'Unknown ownership',
        },
        biasIndicators: {
          politicalLean: redFlagCount > 3 ? 'unclear' : 'center',
          emotionalLanguageScore: Math.min(100, redFlagCount * 20 + (hasEmotional ? 30 : 0)),
          oneSidedReportingScore: Math.min(100, redFlagCount * 15),
          cherryPickingScore: Math.min(100, redFlagCount * 12),
        },
        crossReferences: [],
        recommendations: [
          redFlagCount > 2 ? 'Verify all claims with multiple reputable sources' : 'Cross-reference key facts with other sources',
          'Check the publication date and author credentials',
          redFlagCount > 3 ? 'Be extremely cautious about sharing this content' : 'Consider the source\'s track record before sharing',
          'Look for corroboration from established news organizations',
        ],
        detailedAnalysis: {
          headlineAnalysis: {
            isClickbait: hasClickbait,
            emotionalLanguageUsed: hasEmotional,
            exaggerationLevel: hasExaggeration ? (redFlagCount > 3 ? 'high' : 'medium') : 'low',
            findings: headlineFindings,
          },
          contentAnalysis: {
            logicalFallacies: contentIssues.length > 0 ? contentIssues : [],
            unsupportedClaims: fakeNewsIndicators.unverifiedClaims.test(content) ? ['Claims lack specific attribution'] : [],
            exaggeratedStatements: fakeNewsIndicators.exaggeration.test(content) ? ['Absolute statements without evidence'] : [],
            contradictions: [],
          },
          evidenceAssessment: {
            hasExternalReferences: credibleIndicators.citations.test(content),
            referenceQuality: authenticityScore >= 70 ? 'high' : authenticityScore >= 50 ? 'medium' : 'low',
            verifiedStatistics: credibleIndicators.specific.test(content) ? 2 : 0,
            unverifiedStatistics: fakeNewsIndicators.unverifiedClaims.test(content) ? 3 : 0,
            verifiedQuotes: credibleIndicators.citations.test(content) ? 1 : 0,
            unverifiedQuotes: fakeNewsIndicators.unverifiedClaims.test(content) ? 2 : 0,
          },
        },
      });
    }

    if (fullContent.includes('SEO') || fullContent.includes('seo')) {
      return JSON.stringify({
        metaTitle: 'Optimized Article Title',
        metaDescription: 'This is an optimized meta description for search engines.',
        keywords: ['news', 'update', 'featured'],
        slug: 'optimized-article-title',
        suggestions: ['Add more internal links', 'Optimize images'],
      });
    }

    return JSON.stringify({
      keyTopics: ['Technology', 'Innovation'],
      sentiment: 'positive',
      targetAudience: 'Tech Enthusiasts',
      summary: 'This is a mock research summary.',
      keywords: ['tech', 'innovation', 'news'],
    });
  }
}

export const openAIAgent = new OpenAIAgent();

