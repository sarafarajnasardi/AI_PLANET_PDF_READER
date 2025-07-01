import React, { useState, useEffect } from 'react';
import { Upload, FileText, Send, AlertCircle, CheckCircle, Loader, LogOut, Trash2, MessageCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentChats, setDocumentChats] = useState({}); // Store chat history for each document
  const [question, setQuestion] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Check for stored token
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
      fetchDocuments(storedToken);
    }
  }, []);

  const login = () => {
    window.location.href = `${API_BASE_URL}/login`;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setIsAuthenticated(false);
    setDocuments([]);
    setSelectedDocument(null);
    setDocumentChats({});
  };

  const fetchDocuments = async (authToken = token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        const docs = await response.json();
        setDocuments(docs);
      } else if (response.status === 401) {
        logout();
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('Failed to fetch documents');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload only PDF files');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/upload/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (response.ok) {
        const newDoc = await response.json();
        setDocuments([...documents, newDoc]);
        setSuccess('Document uploaded successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else if (response.status === 401) {
        logout();
      } else {
        setError('Failed to upload document');
      }
    } catch (error) {
      setError('Error uploading document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!selectedDocument || !question.trim()) return;

    setIsAsking(true);
    setError('');

    const userMessage = { type: 'user', content: question, timestamp: new Date() };
    
    // Update chat for this document
    setDocumentChats(prev => ({
      ...prev,
      [selectedDocument.id]: [
        ...(prev[selectedDocument.id] || []),
        userMessage
      ]
    }));

    try {
      const response = await fetch(`${API_BASE_URL}/ask/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          document_id: selectedDocument.id,
          question: question,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const botMessage = { type: 'bot', content: result.answer, timestamp: new Date() };
        
        setDocumentChats(prev => ({
          ...prev,
          [selectedDocument.id]: [
            ...(prev[selectedDocument.id] || []).slice(0, -1), // Remove the user message we just added
            userMessage, // Add it back
            botMessage // Add bot response
          ]
        }));
      } else if (response.status === 401) {
        logout();
      } else {
        setError('Failed to get answer');
      }
    } catch (error) {
      setError('Error processing question');
    } finally {
      setIsAsking(false);
      setQuestion('');
    }
  };

  const handleDeleteDocument = async (docId, docFilename) => {
    if (!window.confirm(`Are you sure you want to delete "${docFilename}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/documents/${docId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setDocuments(documents.filter(doc => doc.id !== docId));
        if (selectedDocument?.id === docId) {
          setSelectedDocument(null);
        }
        // Remove chat history for deleted document
        setDocumentChats(prev => {
          const newChats = { ...prev };
          delete newChats[docId];
          return newChats;
        });
        setSuccess('Document deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else if (response.status === 401) {
        logout();
      } else {
        setError('Failed to delete document');
      }
    } catch (error) {
      setError('Error deleting document');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskQuestion();
    }
  };

  const selectDocument = (doc) => {
    setSelectedDocument(doc);
    // Initialize chat for this document if it doesn't exist
    if (!documentChats[doc.id]) {
      setDocumentChats(prev => ({
        ...prev,
        [doc.id]: []
      }));
    }
  };

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('access_token');
    if (tokenFromUrl) {
      localStorage.setItem('access_token', tokenFromUrl);
      setToken(tokenFromUrl);
      setIsAuthenticated(true);
      fetchDocuments(tokenFromUrl);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">AI</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to PDF Q&A</h2>
            <p className="text-gray-600 mb-6">
              Upload PDF documents and ask questions about their content using AI.
            </p>
            <button
              onClick={login}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Continue with Google</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentMessages = selectedDocument ? (documentChats[selectedDocument.id] || []) : [];
  const hasMessages = selectedDocument && currentMessages.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">aiplanet</span>
              <span className="text-sm text-gray-500">Generative AI</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {selectedDocument && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>{selectedDocument.filename}</span>
                  {hasMessages && (
                    <div className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded-full">
                      <MessageCircle className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-600">{currentMessages.length}</span>
                    </div>
                  )}
                </div>
              )}
              
              <label className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>{isUploading ? 'Uploading...' : 'Upload PDF'}</span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>

              <button
                onClick={logout}
                className="text-gray-500 hover:text-gray-700 flex items-center space-x-1"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Documents List */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Documents</h2>
            
            {documents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No documents uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => {
                  const messageCount = documentChats[doc.id]?.length || 0;
                  return (
                    <div
                      key={doc.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors group ${
                        selectedDocument?.id === doc.id
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div
                        onClick={() => selectDocument(doc)}
                        className="flex-1"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {doc.filename}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDocument(doc.id, doc.filename);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500">
                            {new Date(doc.upload_date).toLocaleDateString()}
                          </p>
                          {messageCount > 0 && (
                            <div className="flex items-center space-x-1 bg-blue-100 px-2 py-0.5 rounded-full">
                              <MessageCircle className="w-3 h-3 text-blue-600" />
                              <span className="text-xs text-blue-600">{messageCount}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            {!selectedDocument ? (
              <div className="flex flex-col items-center justify-center h-96 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Welcome to PDF Q&A
                </h3>
                <p className="text-gray-600 mb-4">
                  Upload a PDF document and start asking questions about its content.
                </p>
                <label className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 cursor-pointer flex items-center space-x-2">
                  <Upload className="w-4 h-4" />
                  <span>Upload Your First PDF</span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border h-96 flex flex-col">
                {/* Chat Header */}
                <div className="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-gray-500" />
                    <h3 className="font-medium text-gray-900 truncate">
                      {selectedDocument.filename}
                    </h3>
                    {hasMessages && (
                      <span className="text-sm text-gray-500">
                        ({currentMessages.length} messages)
                      </span>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto">
                  {!hasMessages ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-green-600 font-bold">AI</span>
                      </div>
                      <p className="text-gray-600">
                        Ask me anything about "{selectedDocument.filename}"
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {currentMessages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.type === 'user'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            {message.type === 'bot' && (
                              <div className="flex items-center space-x-2 mb-1">
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">AI</span>
                                </div>
                              </div>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      ))}
                      {isAsking && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 px-4 py-2 rounded-lg flex items-center space-x-2">
                            <Loader className="w-4 h-4 animate-spin" />
                            <span className="text-sm text-gray-600">Thinking...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask a question about the document..."
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      disabled={isAsking}
                    />
                    <button
                      onClick={handleAskQuestion}
                      disabled={!question.trim() || isAsking}
                      className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2 shadow-lg">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-800">{error}</span>
            <button
              onClick={() => setError('')}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2 shadow-lg">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-800">{success}</span>
          </div>
        )}

        {isUploading && (
          <div className="fixed bottom-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center space-x-2 shadow-lg">
            <Loader className="w-5 h-5 text-blue-500 animate-spin" />
            <span className="text-blue-800">Uploading document...</span>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;