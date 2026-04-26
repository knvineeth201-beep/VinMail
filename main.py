from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient

app = FastAPI()

# --- MongoDB Setup ---
# Replace the string below with your REAL connection string from Step 1
MONGO_URL = "mongodb+srv://vinmail:vineeth@cluster0.ttykelf.mongodb.net/?appName=Cluster0"
client = MongoClient(MONGO_URL)
db = client["vinmail_db"]
users_collection = db["users"]

# CORS Setup (to allow your frontend to talk to this server)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class RegisterRequest(BaseModel):
    name: str
    phone: str
    email: str
    password: str

@app.post("/api/register")
async def register(user: RegisterRequest):
    # Check if user already exists in MongoDB
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Insert user into MongoDB
    users_collection.insert_one(user.dict())
    return {"message": "Registration successful"}

@app.post("/api/login")
async def login(credentials: dict):
    user = users_collection.find_one({
        "email": credentials.get("email"),
        "password": credentials.get("password")
    })
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {
        "message": "Login successful",
        "user": {"name": user["name"]}
    }

    from fastapi_mail import FastMail, MessageSchema, ConnectionConfig

# Setup for sending mail (using Gmail as an example)
conf = ConnectionConfig(
    MAIL_USERNAME="your-system-email@gmail.com",
    MAIL_PASSWORD="your-app-password", # Use a Google App Password
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False
)

@app.post("/api/send")
async def send_email(data: dict):
    message = MessageSchema(
        subject=data.get("subject"),
        recipients=[data.get("to")],
        body=data.get("body"),
        subtype="html"
    )
    fm = FastMail(conf)
    await fm.send_message(message)
    return {"message": "Email sent successfully"}
