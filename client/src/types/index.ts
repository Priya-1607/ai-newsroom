// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  company?: string;
  avatar?: string;
  preferences: {
    notifications: boolean;
    theme: 'light' | 'dark' | 'system';
    defaultPlatforms: string[];
  };
  socialAccounts?: {
    platform: string;
    connected: boolean;
    username?: string;
    connectedAt?: string;
  }[];
  createdAt: string;
}
export interface FakeNewsDetection {
  authenticityStatus: AuthenticityStatus;
  authenticityScore: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  overallAssessment: string;
  summary?: {
    totalClaims: number;
    verifiedClaims: number;
    disputedClaims: number;
    falseClaims: number;
    redFlagsCount: number;
  };
  redFlags?: RedFlag[];
  sourceCredibility?: SourceCredibility;
  biasIndicators?: BiasIndicators;
  crossReferences?: CrossReference[];
  recommendations?: string[];
  detailedAnalysis?: {
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

// Article types
export interface Article {
  _id: string;
  title: string;
  content: string;
  originalContent: string;
  sourceType: 'text' | 'pdf' | 'docx' | 'url';
  sourceUrl?: string;
  uploadedBy: string;
  metadata: {
    wordCount: number;
    readingTime: number;
    language: string;
    topics: string[];
    sentiment: 'positive' | 'negative' | 'neutral';
    platforms?: string[];
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  brandVoice?: BrandVoice;
  reformattedContent?: ReformattedContent[];
  createdAt: string;
  updatedAt: string;
  fakeNewsDetection?: FakeNewsDetection;
}

// Brand Voice types
export interface BrandVoice {
  _id: string;
  name: string;
  description?: string;
  systemPrompt: string;
  tone: {
    formality: 'formal' | 'semi-formal' | 'casual';
    sentiment: 'positive' | 'neutral' | 'negative';
    energy: 'high' | 'medium' | 'low';
  };
  style: {
    sentenceLength: 'short' | 'medium' | 'long';
    vocabulary: 'simple' | 'moderate' | 'complex';
    useEmojis: boolean;
    useHashtags: boolean;
  };
  keywords: string[];
  phrasesToUse: string[];
  phrasesToAvoid: string[];
  platformOverrides: {
    platform: string;
    customPrompt: string;
  }[];
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Fact Check types
export type VerificationStatus = 'verified' | 'needs_review' | 'failed';

export type FactType = 'name' | 'date' | 'number' | 'location' | 'claim' | 'other';

export interface VerifiedFact {
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

export interface Claim {
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

export interface Discrepancy {
  id: string;
  type: FactType;
  original: string;
  reformatted: string;
  severity: 'low' | 'medium' | 'high';
  explanation: string;
  suggestion?: string;
}

export interface FactCheckResult {
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
  verifiedAt?: string;
}

// Reformatted Content types
export interface ReformattedContent {
  _id: string;
  articleId: string;
  platform: PlatformType;
  title: string;
  content: string;
  excerpt?: string;
  metadata: {
    wordCount: number;
    characterCount: number;
    hashtags: string[];
    mentions: string[];
    callToAction?: string;
  };
  factCheck: FactCheckResult;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords: string[];
    slug?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type PlatformType =
  | 'linkedin'
  | 'tiktok'
  | 'newsletter'
  | 'seo'
  | 'press-release'
  | 'twitter'
  | 'instagram';

// Processing types
export interface ProcessingJob {
  jobId: string;
  articleId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  agentStatus?: {
    researcher: string;
    reformatter: string;
    factChecker: string;
    seoOptimizer: string;
  };
  error?: string;
}

// Distribution types
export interface DistributionPlatform {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  username?: string;
  connectedAt?: string;
  maxLength?: number;
  supportsScheduling: boolean;
}

export interface ScheduledPost {
  id: string;
  contentId: string;
  platform: string;
  scheduledTime: string;
  content: string;
  title: string;
  status: 'scheduled' | 'cancelled' | 'published' | 'failed';
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    stack?: string;
  };
  message?: string;
}

export interface PaginatedResponse<T> {
  articles: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  company?: string;
}

// Socket event types
export interface SocketEvents {
  'process:started': (data: { jobId: string; articleId: string; title: string }) => void;
  'process:update': (data: ProcessingJob) => void;
  'process:completed': (data: { jobId: string; articleId: string; results: any }) => void;
  'process:failed': (data: { jobId: string; error: string }) => void;
  'agent:status': (data: { agent: string; status: string }) => void;
  'distribution:started': (data: { platform: string; contentId: string }) => void;
  'distribution:completed': (data: { platform: string; contentId: string; result: any }) => void;
  'distribution:failed': (data: { platform: string; contentId: string; error: string }) => void;
  'distribution:scheduled': (data: { scheduledPost: ScheduledPost }) => void;
}

// Fake News Detection Types
export type CredibilityScore = number;

export type AuthenticityStatus = 'authentic' | 'mixed' | 'suspicious' | 'likely-fake' | 'verified-fake';

export interface RedFlag {
  id: string;
  type: 'headline' | 'source' | 'statistics' | 'grammar' | 'emotion' | 'logic' | 'bias' | 'verified-claim';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string;
  recommendation: string;
}

export interface SourceCredibility {
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

export interface BiasIndicators {
  politicalLean?: 'left' | 'right' | 'center';
  emotionalLanguageScore: number;
  oneSidedReportingScore: number;
  cherryPickingScore: number;
}

export interface FactCheckSource {
  organization: string;
  url: string;
  rating: string;
  factCheckDate: string;
  relatedClaim: string;
}

export interface CrossReference {
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

export interface FakeNewsDetectionResult {
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
  factCheckSources: FactCheckSource[];
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
  analyzedAt: string;
}

