# app/main.py
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import shutil, os
from dotenv import load_dotenv
from typing import List
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from fastapi.middleware.cors import CORSMiddleware
from starlette.config import Config
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from datetime import datetime, timedelta
from starlette.middleware.sessions import SessionMiddleware
from .database import Base, engine, SessionLocal
from . import models, crud, schemas
from .services import pdf_handler, qa_engine

import traceback
load_dotenv()
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

SECRET_KEY = os.getenv("SECRET_KEY", "secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

models.Base.metadata.create_all(bind=engine)

app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SECRET_KEY", "secret"))
# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth setup
config = Config(".env")
oauth = OAuth(config)
oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(request: Request, db: Session = Depends(get_db)):
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        payload = jwt.decode(token[7:], SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = crud.get_user_by_username(db, username)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/login")
async def login(request: Request):
    redirect_uri = request.url_for("auth")
    print("Redirect URI:", redirect_uri)
    return await oauth.google.authorize_redirect(request, redirect_uri)


@app.get("/auth")
async def auth(request: Request, db: Session = Depends(get_db)):
    token = await oauth.google.authorize_access_token(request)
    user_info = token.get("userinfo")
    if not user_info:
        raise HTTPException(status_code=400, detail="Google login failed")

    email = user_info["email"]
    user = crud.get_user_by_username(db, email)
    if not user:
        user = crud.create_user(db, schemas.UserCreate(username=email))

    access_token = create_access_token(data={"sub": user.username})

    # ✅ Redirect to frontend with access_token in query string
    frontend_url = f"http://localhost:5173?access_token={access_token}"
    return RedirectResponse(url=frontend_url)


@app.post("/upload/", response_model=schemas.DocumentResponse)
def upload_pdf(file: UploadFile = File(...), db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    try:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        text = pdf_handler.extract_text_from_pdf(file_path)
        doc = schemas.DocumentCreate(filename=file.filename, file_path=file_path, user_id=user.id)
        return crud.save_document(db, doc)
    except Exception as e:
        print("UPLOAD ERROR:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Upload failed")

@app.post("/ask/")
def ask_question(request: schemas.QuestionRequest, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    doc = crud.get_document_by_id(db, request.document_id)
    if not doc or doc.user_id != user.id:
        raise HTTPException(status_code=404, detail="Document not found or unauthorized")

    text = pdf_handler.extract_text_from_pdf(doc.file_path)
    answer = qa_engine.get_answer(text, request.question)
    return {"answer": answer}

@app.get("/documents/", response_model=List[schemas.DocumentResponse])
def list_documents(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return crud.get_documents_by_user(db, user.id)

@app.delete("/documents/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    doc = crud.get_document_by_id(db, doc_id)
    if not doc or doc.user_id != user.id:
        raise HTTPException(status_code=404, detail="Document not found or unauthorized")
    crud.delete_document(db, doc_id)
    return {"detail": "Document deleted"}

@app.delete("/documents/cleanup/")
def cleanup_documents(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    docs = crud.get_documents_by_user(db, user.id)
    deleted = 0
    for doc in docs:
        if not os.path.exists(doc.file_path):
            crud.delete_document(db, doc.id)
            deleted += 1
    return {"detail": f"Deleted {deleted} orphaned documents."}

# .env
# DATABASE_URL=sqlite:///./pdf_metadata.db
# UPLOAD_DIR=uploads
# GROQ_API_KEY=your_groq_api_key_here
# GROQ_MODEL=llama3-8b-8192
# EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
# GOOGLE_CLIENT_ID=your_google_client_id
# GOOGLE_CLIENT_SECRET=your_google_client_secret
# SECRET_KEY=your_jwt_secret_here
#uvicorn app.main:app --reload