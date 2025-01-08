# Import necessary modules and libraries.
from flask import Blueprint, request, jsonify, session, make_response, redirect, url_for
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.models import User, Property, FaultReport
from werkzeug.security import check_password_hash
from database.db import SessionLocal
from werkzeug.utils import secure_filename
import os
import datetime
import jwt
import bcrypt
import datetime
from dotenv import load_dotenv
import os

# Load environment variables from the .env file.
load_dotenv()

# Retrieve the secret key for JWT decoding.
SECRET_KEY = os.getenv('SECRET_KEY')

# Define a Flask blueprint for external service-related routes.
external_service_routes = Blueprint('external_service_routes', __name__)

# Route to retrieve profession data, accessible only to authenticated users with specific roles.
@external_service_routes.route('/v1.0/profession', methods=['GET'])
def get_profession(session=SessionLocal()):
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"status": "401", "message": "Unauthorized"})

    try:
# Extract the token from the Authorization header.
        token = auth_header.split(" ")[1]
# Decode the JWT token using the secret key.
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])

# Extract user details from the decoded token.
        user_id = decoded_token.get("user_id")
        role = decoded_token.get("role")
        print(role)

# Fetch fault reports based on the user's role.
        if role.lower() == "admin":
            reports = session.query(FaultReport).all()
        elif role.lower() == "developer":
            reports = session.query(FaultReport).all()
        else:
            return jsonify({"status": "error", "message": "Access denied"}), 403

# Prepare the report data for the response.
        report_data = [
            {
                "id": report.id,
                "professional_name": report.professional_name,
                "professional_rating": report.professional_rating
            }
            for report in reports
        ]
# Return the report data as a JSON response.
        return jsonify({"status": "success", "data": report_data}), 200

# Handle token expiration errors.
    except jwt.ExpiredSignatureError:
        return jsonify({"status": "error", "message": "Token expired"}), 401
# Handle invalid token errors.
    except jwt.InvalidTokenError:
        return jsonify({"status": "error", "message": "Invalid token"}), 401
# Ensure the database session is closed regardless of outcome.
    finally:
        session.close()
