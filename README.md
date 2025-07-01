# PDF Q&A Application

A modern web application that allows users to upload PDF documents and ask questions about their content using AI. Built with React frontend and FastAPI backend with Google OAuth authentication.

## ✨ Features

- 🔐 **Google OAuth Authentication** - Secure login with Google accounts
- 📄 **PDF Document Upload** - Upload and manage multiple PDF files
- 💬 **Individual Document Chats** - Each document has its own chat history
- 🤖 **AI-Powered Q&A** - Ask questions about document content using advanced AI
- 🗑️ **Document Management** - Delete documents with confirmation
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🎨 **Modern UI** - Clean, intuitive interface with message counters

## 🏗️ Architecture

### Frontend (React)
- **Framework**: React with Hooks
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Authentication**: OAuth 2.0 with JWT tokens
- **State Management**: React useState for local state

### Backend (FastAPI)
- **Framework**: FastAPI
- **Database**: SQLite with SQLAlchemy ORM
- **Authentication**: Google OAuth + JWT
- **PDF Processing**: Custom PDF text extraction
- **AI Integration**: GROQ API for question answering
- **File Storage**: Local filesystem

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Python 3.8+
- Google Cloud Console account (for OAuth setup)
- GROQ API key

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pdf-qa-app
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Python dependencies**
   ```bash
   pip install fastapi uvicorn sqlalchemy python-multipart
   pip install python-jose[cryptography] authlib httpx
   pip install python-dotenv PyPDF2 sentence-transformers
   pip install groq  # or your preferred AI API client
   ```

4. **Set up Google OAuth**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs: `http://localhost:8000/auth`

5. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your values:
   ```env
   DATABASE_URL=sqlite:///./pdf_metadata.db
   UPLOAD_DIR=uploads
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=llama3-8b-8192
   EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   SECRET_KEY=your_jwt_secret_here
   ```

6. **Run the backend**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend  # or wherever your React app is located
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Update API base URL**
   Make sure the `API_BASE_URL` in your React app points to your backend:
   ```javascript
   const API_BASE_URL = 'http://localhost:8000';
   ```

4. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
pdf-qa-app/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI main application
│   ├── models.py            # Database models
│   ├── schemas.py           # Pydantic schemas
│   ├── crud.py              # Database operations
│   ├── database.py          # Database configuration
│   └── services/
│       ├── pdf_handler.py   # PDF text extraction
│       └── qa_engine.py     # AI question answering
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.js           # Main React component
│   │   └── index.js         # Entry point
│   ├── package.json
│   └── ...
├── uploads/                 # PDF file storage
├── .env                     # Environment variables
├── requirements.txt         # Python dependencies
└── README.md
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | SQLite database path | ✅ |
| `UPLOAD_DIR` | Directory for uploaded files | ✅ |
| `GROQ_API_KEY` | GROQ API key for AI processing | ✅ |
| `GROQ_MODEL` | AI model to use | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | ✅ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | ✅ |
| `SECRET_KEY` | JWT secret key | ✅ |
| `EMBEDDING_MODEL` | Text embedding model | ❌ |

### Google OAuth Setup

1. Create a project in Google Cloud Console
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Configure authorized origins: `http://localhost:3000`
5. Configure authorized redirect URIs: `http://localhost:8000/auth`

## 📝 API Endpoints

### Authentication
- `GET /login` - Initiate Google OAuth login
- `GET /auth` - OAuth callback endpoint

### Documents
- `POST /upload/` - Upload PDF document
- `GET /documents/` - List user's documents
- `DELETE /documents/{id}` - Delete document
- `POST /ask/` - Ask question about document

## 🎯 Usage

1. **Login**: Click "Continue with Google" to authenticate
2. **Upload PDF**: Use the upload button to add PDF documents
3. **Select Document**: Click on any document to open its chat
4. **Ask Questions**: Type questions about the document content
5. **View History**: Each document maintains separate chat history
6. **Manage Documents**: Delete documents when no longer needed

## 🔒 Security Features

- **Authentication**: Secure Google OAuth 2.0 integration
- **Authorization**: JWT tokens for API access
- **User Isolation**: Users can only access their own documents
- **File Validation**: Only PDF files are accepted
- **Error Handling**: Comprehensive error handling and user feedback

## 🚀 Deployment

### Backend Deployment (Example with Heroku)

1. **Create Procfile**
   ```
   web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

2. **Update environment variables**
   - Set all required environment variables in your hosting platform
   - Update `API_BASE_URL` in frontend to production URL

3. **Deploy**
   ```bash
   git add .
   git commit -m "Deploy to production"
   git push heroku main
   ```

### Frontend Deployment (Example with Netlify)

1. **Build the app**
   ```bash
   npm run build
   ```

2. **Deploy build folder**
   - Upload `build/` folder to your hosting service
   - Configure redirects for SPA routing

## 🛠️ Development

### Adding New Features

1. **Backend**: Add new endpoints in `main.py`
2. **Frontend**: Update React components
3. **Database**: Add new models in `models.py`
4. **API Integration**: Update frontend API calls

### Testing

```bash
# Backend tests
python -m pytest

# Frontend tests
npm test
```

## 📚 Dependencies

### Backend
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `sqlalchemy` - ORM
- `authlib` - OAuth implementation
- `python-jose` - JWT handling
- `groq` - AI API client

### Frontend
- `react` - UI framework
- `lucide-react` - Icons
- Built-in browser APIs for file handling and authentication

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Troubleshooting

### Common Issues

**Authentication not working:**
- Check Google OAuth credentials
- Verify redirect URIs in Google Console
- Ensure `SECRET_KEY` is set

**PDF upload fails:**
- Check file permissions in `UPLOAD_DIR`
- Verify file size limits
- Ensure PDF is not corrupted

**AI responses not working:**
- Verify GROQ API key
- Check API rate limits
- Ensure model is available

**CORS issues:**
- Verify backend CORS configuration
- Check frontend API_BASE_URL
