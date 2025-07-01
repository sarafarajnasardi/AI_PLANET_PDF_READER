from sqlalchemy.orm import Session
from . import models, schemas

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(username=user.username)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def save_document(db: Session, doc: schemas.DocumentCreate):
    db_doc = models.Document(**doc.dict())
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return db_doc

def get_document_by_id(db: Session, doc_id: int):
    return db.query(models.Document).filter(models.Document.id == doc_id).first()

def get_documents_by_user(db: Session, user_id: int):
    return db.query(models.Document).filter(models.Document.user_id == user_id).all()

def delete_document(db: Session, doc_id: int):
    doc = get_document_by_id(db, doc_id)
    if doc:
        db.delete(doc)
        db.commit()
