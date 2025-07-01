# app/services/qa_engine.py
from langchain_groq import ChatGroq
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.chains import RetrievalQA
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import CharacterTextSplitter
import os
from dotenv import load_dotenv

load_dotenv()

def load_qa_chain(document_text: str):
    with open("temp_doc.txt", "w", encoding="utf-8") as f:
        f.write(document_text)

    loader = TextLoader("temp_doc.txt")
    docs = loader.load()

    text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    splits = text_splitter.split_documents(docs)

    embeddings = HuggingFaceEmbeddings(model_name=os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"))
    vectorstore = Chroma.from_documents(splits, embeddings)
    retriever = vectorstore.as_retriever()

    llm = ChatGroq(
        groq_api_key=os.getenv("GROQ_API_KEY"),
        model=os.getenv("GROQ_MODEL", "llama3-8b-8192"),
    )

    qa = RetrievalQA.from_chain_type(llm=llm, retriever=retriever)
    return qa

def get_answer(document_text: str, question: str) -> str:
    qa_chain = load_qa_chain(document_text)
    return qa_chain.run(question)