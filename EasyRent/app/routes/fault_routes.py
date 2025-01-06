from flask import Blueprint, request, jsonify, session, make_response, redirect, url_for
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.models import User, Property, FaultReport
from ..database.db import SessionLocal
from werkzeug.utils import secure_filename
import os
import datetime
import jwt
from dotenv import load_dotenv
import os

load_dotenv()

SECRET_KEY = os.getenv('SECRET_KEY')
UPLOAD_FOLDER = './uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

fault_routes = Blueprint('fault_routes', __name__)
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
UPLOAD_FOLDER = 'static/property/faults'


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@fault_routes.route('/property-add-fault', methods=['POST'])
def report_fault():
    auth_token = request.cookies.get('auth_token')
    user = None
    user_role = None

    if auth_token:
        try:
            decoded_token = jwt.decode(auth_token, SECRET_KEY, algorithms=["HS256"])
            user_email = decoded_token.get('email')
            user_role = decoded_token.get('role')
            session = SessionLocal()
            user = session.query(User).filter(User.email == user_email).first()
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token has expired. Please sign in again."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Please sign in again."}), 401

    session = SessionLocal()
    if user_role and user_role.lower() == "tenant":
        property_id = request.form.get('property_id')
        print(property_id)
        professional_name = request.form.get('professional_name')
        fault_description = request.form.get('fault_description')
        fault_details = request.form.get('fault_details')
        professional_rating = request.form.get('professional_rating')
        fault_image = request.files.get('fault_image')

        base_path = os.path.join(UPLOAD_FOLDER, f'user-{user.id}', f'property-{property_id}', 'fault-images')
        os.makedirs(base_path, exist_ok=True)

        file_url = None
        if fault_image and allowed_file(fault_image.filename):
            filename = secure_filename(fault_image.filename)
            file_path = os.path.join(base_path, filename)
            fault_image.save(file_path)
            file_url = url_for('static', filename=os.path.relpath(file_path, 'static'), _external=True)

        try:
            fault_report = FaultReport(
                property_id=property_id,
                professional_name=professional_name,
                fault_description=fault_description,
                fault_details=fault_details,
                fault_image=file_url,
                status="Pending",
                professional_rating=professional_rating,
                user_id=user.id
            )
            session.add(fault_report)
            session.commit()
            return jsonify({"message": "Fault report submitted successfully"}), 201
        except Exception as e:
            session.rollback()
            return jsonify({"error": f"An error occurred: {str(e)}"}), 500
        finally:
            session.close()
    else:
        return jsonify({"error": "Unauthorized access"}), 403


@fault_routes.route('/fetch-reports', methods=['GET'])
def fetch_reports():
    auth_token = request.cookies.get('auth_token')
    user = None
    user_role = None

    if auth_token:
        try:
            decoded_token = jwt.decode(auth_token, SECRET_KEY, algorithms=["HS256"])
            user_email = decoded_token.get('email')
            user_role = decoded_token.get('role')
            session = SessionLocal()
            user = session.query(User).filter(User.email == user_email).first()
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token has expired. Please sign in again."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Please sign in again."}), 401

    if not user:
        return redirect('/login')

    session = SessionLocal()
    try:
        fault_reports = session.query(FaultReport).filter(FaultReport.user_id == user.id).all()

        fault_properties = []
        for fault in fault_reports:
            property = session.query(Property).filter(Property.id == fault.property_id).first()
            fault_properties.append({
                "property_name": property.property_name if property else 'N/A',
                "fault_description": fault.fault_description,
                "fault_details": fault.fault_details,
                "status": fault.status,
                "professional_name": fault.professional_name,
                "professional_rating": fault.professional_rating,
            })

        return jsonify({"message": "Properties retrieved successfully!", "fault_properties": fault_properties}), 200
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
    finally:
        session.close()

