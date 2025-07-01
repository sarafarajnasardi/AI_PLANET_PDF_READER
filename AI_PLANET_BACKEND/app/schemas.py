from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    username: str

class UserResponse(BaseModel):
    id: int
    username: str
    class Config:
        orm_mode = True

class DocumentCreate(BaseModel):
    filename: str
    file_path: str
    user_id: int

class DocumentResponse(BaseModel):
    id: int
    filename: str
    file_path: str
    upload_date: datetime
    user_id: int

    class Config:
        orm_mode = True

class QuestionRequest(BaseModel):
    document_id: int
    question: str
