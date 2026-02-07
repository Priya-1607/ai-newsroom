# 🚀 AI Newsroom - Agentic Content Reformatting System

<div align="center">

![AI Newsroom](https://img.shields.io/badge/Liquid%20News-Agentic%20Content%20Reformatting-blue)
![React](https://img.shields.io/badge/React-18.2-blue)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

**An advanced MERN stack application with Agentic Workflow for automated news content reformatting across multiple platforms.**

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [API Reference](#-api-endpoints) • [Contributing](#-contributing)

</div>

---

## 📋 Overview

AI Newsroom is a comprehensive content reformatting platform designed for digital content managers and editors. It uses a multi-agent AI system to automatically transform news articles for various platforms while maintaining factual accuracy and brand consistency.

### Problem Solved

News companies struggle to manually reformat articles for 5+ platforms (LinkedIn, TikTok, Newsletter, SEO, etc.) while keeping facts 100% verified. AI Newsroom automates this process with intelligent agents that work together to deliver platform-optimized content.

## ✨ Features

### 🤖 Agentic Orchestration

- **Researcher Agent**: Analyzes source content, extracts key topics and sentiment
- **Re-formatter Agent**: Transforms content for specific platforms with unique constraints
- **Fact-Checker Agent**: Verifies all reformatted content against the original source
- **SEO Optimizer Agent**: Enhances content for search engine visibility

### 📰 Multi-Platform Support

- **LinkedIn**: Professional tone with industry hashtags
- **TikTok**: Short-form engaging content with hooks
- **Newsletter**: Structured, readable content with sections
- **SEO Articles**: Keyword-optimized with meta descriptions
- **Press Releases**: Formal, news-style formatting
- **Twitter/X**: Concise, punchy content
- **Instagram**: Visual-friendly captions

### 🎨 Brand Voice Replication

- Custom system prompts for brand consistency
- Tone configuration (formal/semi-formal/casual)
- Sentiment control (positive/neutral/negative)
- Energy levels (high/medium/low)
- Vocabulary complexity settings

### ✅ Verification Loop

- Cross-references all content against original
- Accuracy scoring for each version
- Discrepancy detection and reporting
- Confidence metrics for published content

### 📡 Direct Distribution

- One-click posting to connected platforms
- Scheduling with timezone support
- Queue management for bulk posting
- Real-time publishing status

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB 6+ (local or Atlas)
- OpenAI API Key (for AI agents)

### Installation

1. **Clone the repository**

   ```bash
   cd /Users/priya/Desktop/liquid-news-system
   ```

2. **Setup Server**

   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Setup Client**

   ```bash
   cd ../client
   npm install
   ```

4. **Configure Environment Variables**

   Server (`.env`):

   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/liquid-news
   JWT_SECRET=your-super-secret-key
   OPENAI_API_KEY=your-openai-api-key
   ```

   Client (`.env`):

   ```env
   VITE_API_URL=http://localhost:5000
   VITE_SOCKET_URL=http://localhost:5000
   ```

5. **Start Development Servers**

   Terminal 1 (Server):

   ```bash
   cd server
   npm run dev
   ```

   Terminal 2 (Client):

   ```bash
   cd client
   npm run dev
   ```

6. **Open in Browser**
   ```
   http://localhost:5173
   ```

## 📁 Project Structure

```
liquid-news-system/
├── server/                    # Backend (Node.js + Express)
│   ├── src/
│   │   ├── agents/           # AI Agent implementations
│   │   │   ├── openAIAgent.ts
│   │   │   ├── researcherAgent.ts
│   │   │   ├── reformatterAgent.ts
│   │   │   ├── factCheckerAgent.ts
│   │   │   └── seoOptimizerAgent.ts
│   │   ├── controllers/      # Route controllers
│   │   ├── middleware/       # Express middleware
│   │   │   ├── auth.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── requestLogger.ts
│   │   ├── models/           # Mongoose models
│   │   │   ├── User.ts
│   │   │   ├── Article.ts
│   │   │   ├── BrandVoice.ts
│   │   │   └── ReformattedContent.ts
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   │   ├── socketService.ts
│   │   │   ├── processService.ts
│   │   │   └── distributionService.ts
│   │   └── index.ts          # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── client/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/       # React components
│   │   │   └── Layout.tsx
│   │   ├── pages/            # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Articles.tsx
│   │   │   ├── ArticleDetail.tsx
│   │   │   ├── BrandVoices.tsx
│   │   │   ├── Distribution.tsx
│   │   │   ├── Settings.tsx
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── services/         # API services
│   │   │   ├── api.ts
│   │   │   └── socket.ts
│   │   ├── store/            # State management
│   │   │   └── index.ts
│   │   ├── types/            # TypeScript types
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── TODO.md                   # Development tracking
└── README.md                 # This file
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (React Frontend)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Dashboard   │  │ Content     │  │ Distribution       │ │
│  │ Manager     │  │ Editor      │  │ Hub                │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API + WebSocket
┌────────────────────────▼────────────────────────────────────┐
│                  SERVER (Node.js + Express)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Agent Orchestration Engine               │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │   │
│  │  │Research│ │Reformat │ │Fact-Check│ │SEO      │    │   │
│  │  │Agent   │ │Agent    │ │Agent    │ │Optimizer│    │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    DATABASE (MongoDB)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Users       │  │ Articles    │  │ Brand Voices       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 📡 API Endpoints

### Authentication

| Method | Endpoint             | Description          |
| ------ | -------------------- | -------------------- |
| POST   | `/api/auth/register` | Register new user    |
| POST   | `/api/auth/login`    | User login           |
| POST   | `/api/auth/refresh`  | Refresh access token |
| GET    | `/api/auth/profile`  | Get user profile     |

### Articles

| Method | Endpoint            | Description        |
| ------ | ------------------- | ------------------ |
| POST   | `/api/articles`     | Upload new article |
| GET    | `/api/articles`     | List all articles  |
| GET    | `/api/articles/:id` | Get single article |
| PUT    | `/api/articles/:id` | Update article     |
| DELETE | `/api/articles/:id` | Delete article     |

### Brand Voices

| Method | Endpoint                | Description           |
| ------ | ----------------------- | --------------------- |
| POST   | `/api/brand-voices`     | Create brand voice    |
| GET    | `/api/brand-voices`     | List all brand voices |
| PUT    | `/api/brand-voices/:id` | Update brand voice    |
| DELETE | `/api/brand-voices/:id` | Delete brand voice    |

### Content Processing

| Method | Endpoint                   | Description               |
| ------ | -------------------------- | ------------------------- |
| POST   | `/api/process/start`       | Start processing workflow |
| GET    | `/api/process/status/:id`  | Get process status        |
| GET    | `/api/process/results/:id` | Get processing results    |

### Distribution

| Method | Endpoint                   | Description              |
| ------ | -------------------------- | ------------------------ |
| POST   | `/api/distribute`          | Distribute content       |
| GET    | `/api/distribute/history`  | Get distribution history |
| POST   | `/api/distribute/schedule` | Schedule post            |

## 🔌 WebSocket Events

### Process Events

| Event               | Direction       | Description         |
| ------------------- | --------------- | ------------------- |
| `process:started`   | Server → Client | Processing started  |
| `process:update`    | Server → Client | Progress update     |
| `process:completed` | Server → Client | Processing finished |
| `process:failed`    | Server → Client | Processing error    |
| `agent:status`      | Server → Client | Agent status change |

### Distribution Events

| Event                    | Direction       | Description           |
| ------------------------ | --------------- | --------------------- |
| `distribution:started`   | Server → Client | Distribution started  |
| `distribution:completed` | Server → Client | Distribution finished |
| `distribution:failed`    | Server → Client | Distribution error    |
| `distribution:scheduled` | Server → Client | Post scheduled        |

## 🎨 Brand Voice Configuration

Create brand voices with these settings:

```typescript
{
  name: "Professional News",
  tone: {
    formality: "semi-formal",  // formal | semi-formal | casual
    sentiment: "neutral",      // positive | neutral | negative
    energy: "medium",          // high | medium | low
  },
  style: {
    sentenceLength: "medium",  // short | medium | long
    vocabulary: "moderate",    // simple | moderate | complex
    useEmojis: false,
    useHashtags: true,
  },
  keywords: ["news", "analysis", "report"],
  phrasesToUse: ["According to sources", "In a statement"],
  phrasesToAvoid: ["Breaking", "Exclusive"],
}
```

## 🧪 Testing

```bash
# Run backend tests
cd server
npm test

# Run frontend tests
cd client
npm test
```

## 📦 Deployment

### Docker

```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Manual Deployment

1. Build the client:

   ```bash
   cd client && npm run build
   ```

2. Build the server:

   ```bash
   cd server && npm run build
   ```

3. Start production server:
   ```bash
   cd server && npm start
   ```

## 🔒 Security

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Helmet.js security headers
- Input validation and sanitization
- CORS configuration

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support, email support@liquidnews.com or open an issue on GitHub.

---

<div align="center">
Made with ❤️ by the AI Newsroom Team
</div>
