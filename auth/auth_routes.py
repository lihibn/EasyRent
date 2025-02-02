#EasyRent - 20251W87


#Import necessary modules and libraries.
from flask import Blueprint, request, jsonify, session, make_response, redirect, render_template
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash
from models.models import User
from database.db import SessionLocal
import bcrypt
import datetime
import jwt
from werkzeug.security import check_password_hash
from dotenv import load_dotenv
import os

# Load environment variables from a .env file into the application's environment.
load_dotenv()

# Define a blueprint for organizing authentication related routes.
auth_routes = Blueprint('auth_routes', __name__)

# Retrieve the secret key from environment variables for secure operations.
SECRET_KEY = os.getenv('SECRET_KEY')


@auth_routes.route('/register', methods=['POST'])
def register():
    # Check if the auth_token cookie is already present.
    auth_token = request.cookies.get('auth_token')
    if auth_token:
        try:
            # Decode the token to check if it's valid.
            jwt.decode(auth_token, os.getenv('SECRET_KEY'), algorithms=["HS256"])
            return jsonify({"message": "Please login, you are already logged in."}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Session expired, please log in again."}), 401 # Handle expired JWT token.
        except jwt.InvalidTokenError:
            return jsonify({"message": "Please log in again."}), 401 # Handle invalid JWT token

    # Retrieve JSON data from the request body.
    data = request.get_json()
    if not data:
        return jsonify({"message": "Missing JSON"}), 400
        
    # Extract user details from the JSON payload.
    full_name = data.get('full_name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'tenant')

    # Validate required fields.
    if not full_name or not email or not password:
        return jsonify({"message": "Missing required fields"}), 400

    session_db = SessionLocal() # Open a new database session.
    try:
        # Check if a user with the provided email already exists.
        if session_db.query(User).filter_by(email=email).first():
            return jsonify({"message": "User already exists"}), 409

        # Hash the password using bcrypt.
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        # Create a new user object with hashed password.
        new_user = User(full_name=full_name, email=email, role=role, password=hashed_password.decode('utf-8'))
        session_db.add(new_user)
        session_db.commit()

        # Create JWT token.
        token = jwt.encode({
            "email": email,
            "role": role,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=30)
        }, os.getenv('SECRET_KEY'), algorithm="HS256")

        # Create an HTTP response with the JWT token.
        resp = make_response(jsonify({"message": "User created successfully", "token": token}))

        # Set the token in the cookie.
        resp.set_cookie('auth_token', token, httponly=True, secure=True, samesite='None')
        print(resp)
        return resp
    except Exception as e:
        session_db.rollback()
        return jsonify({"message": "Internal server error"}), 500
    finally:
        session_db.close()  # Close the database session.


@auth_routes.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    # Return error if no JSON data is provided.
    if not data:
        return jsonify({"message": "Missing JSON"}), 400
    
    # Extract email and password from the JSON payload.
    email = data.get('email')
    password = data.get('password')

    session = SessionLocal() # Open a new database session.
    user = session.query(User).filter_by(email=email).first()

    if not email or not password:
        return jsonify({"message": "Missing required fields"}), 400 # Return error if required fields are missing.

    
    if not user:
        return jsonify({"message": "User not found"}), 401
    else:
        if bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):  
            role = user.role
            print(role)
            user.last_login = datetime.datetime.utcnow()
            session.add(user)  # Add the user back to the session
            session.commit()  # Save

            # Generate JWT token
            token = jwt.encode({
                "user_id": user.id,
                "email": email,
                "role": role,
                "exp":  datetime.datetime.utcnow() + datetime.timedelta(days=30) 
            }, os.getenv('SECRET_KEY'), algorithm="HS256")
            print(token)
            # Prepare response with token
            resp = make_response(jsonify({"message": "Login successful", "token": token}))
            # Set the token as a cookie
            resp.set_cookie('auth_token', token, httponly=True, secure=True, samesite='None')
            
            return resp, 200

        else:
            return jsonify({"message": "Invalid credentials"}), 401
     


@auth_routes.route('/logout', methods=['GET'])
def logout():
    # Prepare a response to redirect to the home page.
    resp = make_response(redirect('/'))

    # Clear the auth token cookie.
    resp.set_cookie('auth_token', '', expires=0, httponly=True, secure=True, samesite='Strict')

    return resp


@auth_routes.route("/sign-in", methods=["GET", "POST"])
def signIn():
    auth_token = request.cookies.get('auth_token')
    user = None # Initialize user to None.
    user_role = None # Initialize user role to None.

    return render_template('sign_in.html', user=user, user_type=user_role)


# exposed data token generation
@auth_routes.route('/expos/get-token', methods=['POST'])
def get_token():
    data = request.get_json()
    user_id = data.get('userId')
    print(user_id)
    password = data.get('password')
    grant_type = data.get('grant_type')
    session = SessionLocal()
    if not user_id or not password or not grant_type: # Check if required fields are missing.
        return jsonify({"error": "Missing required fields"}), 400

    user = session.query(User).filter(User.email == user_id).first()
    
    # Check if the user exists and if the password matches.
    if user and bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
        if user.role == "developer" or user.role == "Developer":
            user.last_login = datetime.datetime.utcnow() # Update the user's last login time and commit changes.
            session.add(user)
            session.commit()

            # Generate an access token (JWT).
            token = jwt.encode({
                "user_id": user.id,
                "email": user.email,
                "role": user.role,
                "exp": datetime.datetime.utcnow() + datetime.timedelta(days=30)  # Expiration date.
            }, os.getenv('SECRET_KEY'), algorithm="HS256")

            refresh_token = jwt.encode({
                "user_id": user.id,
                "email": user.email,
                "role": user.role,
                "exp": datetime.datetime.utcnow() + datetime.timedelta(days=60)
            }, os.getenv('SECRET_KEY'), algorithm="HS256")

             # Prepare the response data with access and refresh tokens.
            response_data = {
                "access_token": token,
                "token_type": "Bearer",
                "expires_in": 1200,
                "refresh_token": refresh_token
            }
            return jsonify(response_data), 200 # Return the token data with HTTP 200.
        else:
            return jsonify({"message": "You don't have permission"}), 401 # Return error if the user doesn't have the required role.
    else:
        return jsonify({"message": "Invalid credentials"}), 401
