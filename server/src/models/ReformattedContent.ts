import mongoose, { Document, Schema } from 'mongoose';

export type VerificationStatus = 'verified' | 'needs_review' | 'failed';
export type FactType = 'name' | 'date' | 'number' | 'location' | 'claim' | 'other';
export type AuthenticityStatus = 'authentic' | 'mixed' | 'suspicious' | 'likely-fake' | 'verified-fake';
export type RedFlagSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface IVerifiedFact {
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

export interface IClaim {
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

export interface IDiscrepancy {
  id: string;
  type: FactType;
  original: string;
  reformatted: string;
  severity: 'low' | 'medium' | 'high';
  explanation: string;
  suggestion?: string;
}

export interface IFactCheck {
  verificationStatus: VerificationStatus;
  verificationScore: number;
  isVerified: boolean;
  discrepancies: IDiscrepancy[];
  extractedFacts: IVerifiedFact[];
  claims: IClaim[];
  missingFacts: {
    fact: string;
    type: FactType;
    importance: 'low' | 'medium' | 'high';
    context: string;
  }[];
  overallSummary: string;
  verifiedAt?: Date;
}

export interface IReformattedContent extends Document {
  articleId: mongoose.Types.ObjectId;
  platform: 'linkedin' | 'tiktok' | 'newsletter' | 'seo' | 'press-release' | 'twitter' | 'instagram';
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
  factCheck: IFactCheck;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords: string[];
    slug?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const reformattedContentSchema = new Schema<IReformattedContent>(
  {
    articleId: {
      type: Schema.Types.ObjectId,
      ref: 'Article',
      required: true,
    },
    platform: {
      type: String,
      enum: ['linkedin', 'tiktok', 'newsletter', 'seo', 'press-release', 'twitter', 'instagram'],
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    excerpt: {
      type: String,
    },
    metadata: {
      wordCount: {
        type: Number,
        default: 0,
      },
      characterCount: {
        type: Number,
        default: 0,
      },
      hashtags: [{
        type: String,
      }],
      mentions: [{
        type: String,
      }],
      callToAction: {
        type: String,
      },
    },
    factCheck: {
      verificationStatus: {
        type: String,
        enum: ['verified', 'needs_review', 'failed'],
        default: 'needs_review',
      },
      isVerified: {
        type: Boolean,
        default: false,
      },
      verificationScore: {
        type: Number,
        default: 0,
      },
      discrepancies: [{
        id: String,
        type: {
          type: String,
          enum: ['name', 'date', 'number', 'location', 'claim', 'other'],
        },
        original: String,
        reformatted: String,
        severity: {
          type: String,
          enum: ['low', 'medium', 'high'],
        },
        explanation: String,
        suggestion: String,
      }],
      extractedFacts: [{
        id: String,
        type: {
          type: String,
          enum: ['name', 'date', 'number', 'location', 'claim', 'other'],
        },
        value: String,
        context: String,
        isVerified: Boolean,
        sourceReference: String,
        verificationNotes: String,
        originalSource: String,
        sentenceReference: String,
      }],
      claims: [{
        id: String,
        claim: String,
        context: String,
        isVerified: Boolean,
        verificationStatus: {
          type: String,
          enum: ['verified', 'needs_review', 'failed'],
        },
        supportingEvidence: String,
        contradictingEvidence: String,
        sourceReferences: [String],
        sentenceReference: String,
      }],
      missingFacts: [{
        fact: String,
        type: {
          type: String,
          enum: ['name', 'date', 'number', 'location', 'claim', 'other'],
        },
        importance: {
          type: String,
          enum: ['low', 'medium', 'high'],
        },
        context: String,
      }],
      overallSummary: {
        type: String,
        default: '',
      },
      verifiedAt: {
        type: Date,
      },
    },
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
      slug: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique article-platform combinations
reformattedContentSchema.index({ articleId: 1, platform: 1 }, { unique: true });

export default mongoose.model<IReformattedContent>('ReformattedContent', reformattedContentSchema);

