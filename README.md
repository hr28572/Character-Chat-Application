# Character Chat Application

A mobile-ready character chat application where users can have conversations with AI-powered fictional characters using OpenAI's GPT models.

## Tech Stack

- **Monorepo**: pnpm Workspaces
- **Backend**: NestJS with TypeScript (running in Docker)
- **Database**: PostgreSQL (running in Docker)
- **Frontend**: React Native Expo
- **AI**: Multi-provider support (Ollama local models + OpenAI GPT models)

## Features

### Backend (NestJS)
- REST API with character and chat endpoints
- OpenAI integration with advanced prompt engineering
- PostgreSQL database with Prisma ORM
- Three pre-defined characters with distinct personalities:
  - **Gandalf the Grey**: Wise wizard with ancient knowledge
  - **SARGE-7**: Sarcastic military robot with dry humor  
  - **Captain Ruby Redbeard**: Cheerful pirate captain with adventurous spirit

### Frontend (React Native Expo)
- Character selection screen
- Real-time chat interface with message history
- Loading states and error handling
- Mobile-responsive design
- Cross-platform support (iOS, Android, Web)

## Setup Instructions

### Prerequisites
- Node.js v24.4.1 or later
- pnpm package manager
- Docker and Docker Compose
- OpenAI API key

### 1. Database Setup
```bash
# Start PostgreSQL database
docker compose up -d db
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd packages/backend

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Add your OpenAI API key to .env:
# OPENAI_API_KEY=your-openai-api-key-here

# Run database migrations and seed
pnpm prisma db push
pnpm ts-node prisma/seed.ts

# Start development server
npm run start:dev
```

Backend will be available at: `http://localhost:3000`

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd packages/frontend

# Install dependencies
npm install

# Start Expo development server
npm start
```

Frontend will be available at: `http://localhost:8081`

## API Endpoints

### Characters
- `GET /characters` - List all available characters
- `GET /characters/:id` - Get character details by ID

### Chat
- `POST /chat` - Send a message to a character
- `GET /chat/conversation/:id` - Get conversation history
- `GET /chat/character/:characterId/latest-conversation` - Get latest conversation for character

### AI Provider Management
- `GET /chat/ai/info` - Get current AI provider and model information
- `POST /chat/ai/switch` - Switch between Ollama and OpenAI providers

### Example Chat Request
```json
{
  "characterId": "1",
  "message": "Hello, how are you?",
  "conversationId": "optional-uuid"
}
```

## Advanced Prompt Engineering

Implements sophisticated prompt engineering techniques for character consistency:

### 1. **Structured Character Definition**
   - **Core Personality Traits**: Detailed psychological profiles
   - **Speaking Patterns**: Signature phrases, terminology, and speech quirks  
   - **Knowledge Boundaries**: What the character knows and constraints on responses
   - **Behavioral Reinforcement Rules**: Consistent personality maintenance

### 2. **Intelligent Context Management**
   - **Dynamic History Optimization**: Token-aware conversation summarization
   - **Context Window Management**: 2048+ tokens for Ollama, 1500+ for OpenAI
   - **Multi-turn Coherence**: References previous exchanges for natural flow
   - **Conversation Summarization**: Automatic compression of long histories

### 3. **Character Consistency Techniques**
   - **Few-shot Examples**: 3+ example exchanges per character showing personality
   - **Trait Reinforcement**: System-level prompts that reinforce character behavior
   - **Response Validation**: Automatic filtering of out-of-character responses
   - **Personality Persistence**: Consistent behavior across conversation restarts

### 4. **Technical Implementation**
   - **Provider-Agnostic**: Works with both Ollama and OpenAI models
   - **Token Optimization**: Smart truncation and summarization strategies
   - **Quality Assurance**: Response validation and cleanup processes
   - **Performance Tuning**: Optimized temperature, top_p, and penalty settings

## Project Structure

```
character-chat-app/
├── packages/
│   ├── backend/              # NestJS backend
│   │   ├── src/
│   │   │   ├── characters/   # Character management
│   │   │   ├── chat/         # Chat functionality
│   │   │   ├── openai/       # OpenAI integration
│   │   │   └── prisma/       # Database service
│   │   ├── prisma/           # Database schema & seed
│   │   └── Dockerfile
│   └── frontend/             # React Native Expo app
│       ├── src/
│       │   ├── screens/      # App screens
│       │   ├── services/     # API services
│       │   └── types/        # TypeScript types
│       └── App.tsx
├── docker-compose.yml        # Database configuration
└── pnpm-workspace.yaml      # Workspace configuration
```

## Usage

1. **Start the application**: Follow the setup instructions above
2. **Select a character**: Choose from Gandalf, SARGE-7, or Captain Ruby
3. **Start chatting**: Send messages and receive AI-generated responses
4. **View history**: Previous conversations are automatically saved

## Development Notes

### Shortcuts Taken
- Used emoji avatars instead of actual images
- Simplified authentication (no user accounts)
- Basic error handling
- Local-only deployment (no cloud services)

### Key Features Implemented
- Complete full-stack architecture
- Advanced prompt engineering with character consistency
- Real-time chat interface
- Conversation persistence
- Cross-platform frontend
- Docker containerization

### Testing
- Backend API endpoints can be tested with curl or Postman
- Frontend can be tested on web, iOS simulator, or Android emulator
- All character personalities have been tested for consistency

## Environment Variables

### Backend (.env)
```bash
# Database Configuration
DATABASE_URL="postgresql://chatuser:chatpass@localhost:5432/chatapp?schema=public"

# AI Provider Configuration
AI_PROVIDER="ollama"  # Options: "ollama" or "openai"

# Ollama Configuration (for local AI)
OLLAMA_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.1:8b"  # or "llama2", "mistral", etc.

# OpenAI Configuration (for cloud AI)
OPENAI_API_KEY="your-openai-api-key-here"
OPENAI_MODEL="gpt-3.5-turbo"  # or "gpt-4", "gpt-4-turbo"

# Server Configuration  
PORT=3000
```

### Switching AI Providers

**Use Local Ollama (Free, Private)**:
```bash
# Install Ollama first: https://ollama.ai
ollama pull llama3.1:8b
# Set in .env:
AI_PROVIDER="ollama"
```

**Use OpenAI (Paid, Cloud)**:
```bash
# Get API key from: https://platform.openai.com/api-keys
# Set in .env:
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-your-actual-key-here"
```

**Runtime Switching** (via API):
```bash
# Switch to Ollama
curl -X POST http://localhost:3000/chat/ai/switch \
  -H "Content-Type: application/json" \
  -d '{"provider": "ollama", "model": "llama3.1:8b"}'

# Switch to OpenAI  
curl -X POST http://localhost:3000/chat/ai/switch \
  -H "Content-Type: application/json" \
  -d '{"provider": "openai", "model": "gpt-4"}'
```

## Troubleshooting

### Common Issues

1. **Database connection errors**: Ensure PostgreSQL container is running
2. **OpenAI API errors**: Verify API key is valid and has credits
3. **Frontend connection issues**: Check that backend is running on port 3000
4. **Expo installation issues**: Try clearing node_modules and reinstalling

### Logs
- Backend logs: Available in the terminal running the NestJS server
- Frontend logs: Available in the Expo development tools
- Database logs: `docker compose logs db`

## License

MIT License - feel free to use for learning and development purposes.