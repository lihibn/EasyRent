# Import necessary modules and libraries.
from flask import Blueprint, request, jsonify, session, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.db import SessionLocal
from models.models import User,Property,Meeting
import jwt
from dotenv import load_dotenv
import os

# Load environment variables from the .env file.
load_dotenv()

# Verify JWT token sent in cookies.
def verify_token():
    current_user = get_jwt_identity()  # Get the current user from the token
    return jsonify({"status": "success", "user_id": current_user['user_id'], "role": current_user['role']}), 200

# Utility function to decode JWT and fetch user details.
def get_user_from_token(auth_token):
    session = SessionLocal()
    try:
        decoded_token = jwt.decode(auth_token, os.getenv('SECRET_KEY'), algorithms=["HS256"])
        user_email = decoded_token.get('email') # Extract the email.
        user_role = decoded_token.get('role') # Extract the role.
        user = session.query(User).filter(User.email == user_email).first() # Query the database to find the user by email.
        return user, user_role
    except jwt.ExpiredSignatureError:
        return jsonify({"message": "Token has expired. Please sign in again."}), 401
    except jwt.InvalidTokenError:
        return jsonify({"message": "Please sign in again."}), 401
    finally:
        session.close()
