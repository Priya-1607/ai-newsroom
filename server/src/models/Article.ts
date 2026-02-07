import mongoose, { Document, Schema } from 'mongoose';

export type AuthenticityStatus = 'authentic' | 'mixed' | 'suspicious' | 'likely-fake' | 'verified-fake';
export type RedFlagSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface IRedFlag {
  id: string;
  type: 'headline' | 'source' | 'statistics' | 'grammar' | 'emotion' | 'logic' | 'bias' | 'verified-claim';
  severity: RedFlagSeverity;
  description: string;
  evidence: string;
  recommendation: string;
}

export interface ISourceCredibility {
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

export interface IBiasIndicators {
  politicalLean?: 'left' | 'right' | 'center';
  emotionalLanguageScore: number;
  oneSidedReportingScore: number;
  cherryPickingScore: number;
}

export interface ICrossReference {
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

export interface IFakeNewsDetection {
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
  redFlags: IRedFlag[];
  sourceCredibility?: ISourceCredibility;
  biasIndicators?: IBiasIndicators;
  crossReferences: ICrossReference[];
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
  analyzedAt?: Date;
}

export interface IArticle extends Document {
  title: string;
  content: string;
  originalContent: string;
  sourceType: 'text' | 'pdf' | 'docx' | 'url' | 'generated';
  sourceUrl?: string;
  uploadedBy: mongoose.Types.ObjectId;
  metadata: {
    wordCount: number;
    readingTime: number;
    language: string;
    topics: string[];
    sentiment: 'positive' | 'negative' | 'neutral';
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  brandVoice?: mongoose.Types.ObjectId;
  fakeNewsDetection?: IFakeNewsDetection;
  createdAt: Date;
  updatedAt: Date;
}

const articleSchema = new Schema<IArticle>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    originalContent: {
      type: String,
      required: true,
    },
    sourceType: {
      type: String,
      enum: ['text', 'pdf', 'docx', 'url', 'generated'],
      default: 'text',
    },
    sourceUrl: {
      type: String,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    metadata: {
      wordCount: {
        type: Number,
        default: 0,
      },
      readingTime: {
        type: Number,
        default: 0,
      },
      language: {
        type: String,
        default: 'en',
      },
      topics: [{
        type: String,
      }],
      sentiment: {
        type: String,
        enum: ['positive', 'negative', 'neutral'],
        default: 'neutral',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    brandVoice: {
      type: Schema.Types.ObjectId,
      ref: 'BrandVoice',
    },
    fakeNewsDetection: {
      authenticityStatus: {
        type: String,
        enum: ['authentic', 'mixed', 'suspicious', 'likely-fake', 'verified-fake'],
      },
      authenticityScore: {
        type: Number,
        default: 0,
      },
      confidenceLevel: {
        type: String,
        enum: ['high', 'medium', 'low'],
      },
      overallAssessment: String,
      summary: {
        totalClaims: Number,
        verifiedClaims: Number,
        disputedClaims: Number,
        falseClaims: Number,
        redFlagsCount: Number,
      },
      redFlags: [{
        id: String,
        type: {
          type: String,
          enum: ['headline', 'source', 'statistics', 'grammar', 'emotion', 'logic', 'bias', 'verified-claim'],
        },
        severity: {
          type: String,
          enum: ['low', 'medium', 'high', 'critical'],
        },
        description: String,
        evidence: String,
        recommendation: String,
      }],
      sourceCredibility: {
        name: String,
        url: String,
        credibilityScore: Number,
        factCheckRecord: {
          totalClaims: Number,
          verifiedClaims: Number,
          disputedClaims: Number,
          falseClaims: Number,
        },
        domainAge: String,
        ownershipInfo: String,
      },
      biasIndicators: {
        politicalLean: {
          type: String,
          enum: ['left', 'right', 'center'],
        },
        emotionalLanguageScore: Number,
        oneSidedReportingScore: Number,
        cherryPickingScore: Number,
      },
      crossReferences: [{
        claim: String,
        originalSource: String,
        otherSources: [{
          source: String,
          position: {
            type: String,
            enum: ['supports', 'contradicts', 'unclear'],
          },
          headline: String,
          url: String,
        }],
        consensus: {
          type: String,
          enum: ['confirmed', 'disputed', 'unconfirmed', 'contradicted'],
        },
      }],
      recommendations: [String],
      detailedAnalysis: {
        headlineAnalysis: {
          isClickbait: Boolean,
          emotionalLanguageUsed: Boolean,
          exaggerationLevel: {
            type: String,
            enum: ['none', 'low', 'medium', 'high'],
          },
          findings: [String],
        },
        contentAnalysis: {
          logicalFallacies: [String],
          unsupportedClaims: [String],
          exaggeratedStatements: [String],
          contradictions: [String],
        },
        evidenceAssessment: {
          hasExternalReferences: Boolean,
          referenceQuality: {
            type: String,
            enum: ['high', 'medium', 'low', 'none'],
          },
          verifiedStatistics: Number,
          unverifiedStatistics: Number,
          verifiedQuotes: Number,
          unverifiedQuotes: Number,
        },
      },
      analyzedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient searching
articleSchema.index({ title: 'text', content: 'text' });
articleSchema.index({ uploadedBy: 1, createdAt: -1 });

export default mongoose.model<IArticle>('Article', articleSchema);

