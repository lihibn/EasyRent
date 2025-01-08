# Import necessary modules and libraries.
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables from the .env file.
load_dotenv()

# Get the database connection URL from environment variables.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Create a database engine. The `connect_args` is used to set SQLite-specific options.
# `check_same_thread=False` allows the usage of the same database connection across multiple threads.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Create a configured "Session" class, bound to the engine. 
# `autocommit=False` ensures changes are only persisted after explicit commit,  and `autoflush=False` avoids automatic flushing of the session during queries.
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

# Create a base class for all ORM models. Models will inherit from this to define database tables.
Base = declarative_base()

# Function to get a database session to manage database connections per request.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
