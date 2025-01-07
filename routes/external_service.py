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

load_dotenv()

SECRET_KEY = os.getenv('SECRET_KEY')

external_service_routes = Blueprint('external_service_routes', __name__)


@external_service_routes.route('/v1.0/profession', methods=['GET'])
def get_profession(session=SessionLocal()):
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"status": "401", "message": "Unauthorized"})

    try:
        token = auth_header.split(" ")[1]
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])

        user_id = decoded_token.get("user_id")
        role = decoded_token.get("role")
        print(role)

        if role.lower() == "admin":
            reports = session.query(FaultReport).all()
        elif role.lower() == "developer":
            reports = session.query(FaultReport).all()
        else:
            return jsonify({"status": "error", "message": "Access denied"}), 403

        report_data = [
            {
                "id": report.id,
                "professional_name": report.professional_name,
                "professional_rating": report.professional_rating
            }
            for report in reports
        ]
        return jsonify({"status": "success", "data": report_data}), 200

    except jwt.ExpiredSignatureError:
        return jsonify({"status": "error", "message": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"status": "error", "message": "Invalid token"}), 401
    finally:
        session.close()
