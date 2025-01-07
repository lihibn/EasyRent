import os
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

# Configuration class for the application.
class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv("SECRET_KEY", "my-very-secret-key")
