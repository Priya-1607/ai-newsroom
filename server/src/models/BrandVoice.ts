import mongoose, { Document, Schema } from 'mongoose';

export interface IBrandVoice extends Document {
  name: string;
  description: string;
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
  createdBy: mongoose.Types.ObjectId;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const brandVoiceSchema = new Schema<IBrandVoice>(
  {
    name: {
      type: String,
      required: [true, 'Brand voice name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    systemPrompt: {
      type: String,
      required: [true, 'System prompt is required'],
    },
    tone: {
      formality: {
        type: String,
        enum: ['formal', 'semi-formal', 'casual'],
        default: 'semi-formal',
      },
      sentiment: {
        type: String,
        enum: ['positive', 'neutral', 'negative'],
        default: 'neutral',
      },
      energy: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium',
      },
    },
    style: {
      sentenceLength: {
        type: String,
        enum: ['short', 'medium', 'long'],
        default: 'medium',
      },
      vocabulary: {
        type: String,
        enum: ['simple', 'moderate', 'complex'],
        default: 'moderate',
      },
      useEmojis: {
        type: Boolean,
        default: false,
      },
      useHashtags: {
        type: Boolean,
        default: true,
      },
    },
    keywords: [{
      type: String,
    }],
    phrasesToUse: [{
      type: String,
    }],
    phrasesToAvoid: [{
      type: String,
    }],
    platformOverrides: [{
      platform: {
        type: String,
        required: true,
      },
      customPrompt: {
        type: String,
      },
    }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IBrandVoice>('BrandVoice', brandVoiceSchema);

