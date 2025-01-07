from flask import Blueprint, request, render_template, jsonify, session, make_response, redirect
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from models.models import User, Property, Meeting, Contract
from database.db import SessionLocal
import datetime
import jwt
from werkzeug.utils import secure_filename
import os
import json
from dotenv import load_dotenv
import os

load_dotenv()  # Load environment variables from .env file

# Secret key for JWT
SECRET_KEY = os.getenv('SECRET_KEY')

# Configuration for file storage
UPLOAD_FOLDER = './uploads'  # Base upload directory
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf', 'docx'}  # Allowed file types

property_routes = Blueprint('property_routes', __name__)


# Helper function to check if a file has an allowed extension
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# Route for handling property actions
@property_routes.route('/property/<action>', methods=['GET', 'POST'])
@property_routes.route('/property', methods=['GET', 'POST'])
def property(action=None):
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
    if user_role and user_role.lower() == "landlord":
        try:
            if (action == "add-property" and request.method == "GET"):
                print(action)
                return render_template('add_property.html', user=user, user_type=user_role, action=action)

            if action == "add-property" and request.method == "POST":
                data = request.form
                user_id = user.id

                property_name = data.get('propertyName')
                if not property_name:
                    return jsonify({"message": "Property name is required."}), 400
                property_name = secure_filename(property_name)

                base_path = os.path.join('static', 'property', f'user-{user_id}', f'property-{property_name}')
                pictures_path = os.path.join(base_path, 'picture')
                contract_path = os.path.join(base_path, 'contract')
                os.makedirs(pictures_path, exist_ok=True)
                os.makedirs(contract_path, exist_ok=True)

                uploaded_photos = request.files.getlist('property_photos')
                if not uploaded_photos:
                    return jsonify({"message": "At least one property photo is required."}), 400

                photo_paths = []
                for file in uploaded_photos:
                    if file and allowed_file(file.filename):
                        picture_name = secure_filename(file.filename)
                        file_path = os.path.join(pictures_path, f'picture-{picture_name}')
                        file.save(file_path)
                        photo_paths.append(file_path)

                contract_file = request.files.get('contract_path')

                contract_name = secure_filename(contract_file.filename)
                contract_file_path = os.path.join(contract_path, f'contract-{contract_name}')
                contract_file.save(contract_file_path)

                entry_date_str = data.get('entry_date')

                entry_date = None

                if entry_date_str:
                    entry_date = datetime.datetime.strptime(entry_date_str, "%Y-%m-%d")

                property_id_valid = session.query(Property).count()
                if property_id_valid != 0:
                    property_id_valid = property_id_valid + 1
                else:
                    property_id_valid = 1

                new_property = Property(
                    owner_id=user_id,
                    property_name=property_name,
                    city=data.get('city'),
                    street=data.get('street'),
                    house_number=data.get('house_number'),
                    entrance=data.get('entrance'),
                    floor=int(data.get('floor')),
                    property_type=data.get('property_type'),
                    airflow=data.get('airflow'),
                    rooms=float(data.get('rooms')),
                    square_meters=float(data.get('square_meters')),
                    property_photos=",".join(photo_paths),
                    comments=data.get('comments'),
                    monthly_rent=float(data.get('monthly_rent')),
                    building_maintenance=float(data.get('building_maintenance')),
                    entry_date=entry_date,
                    contract_path=contract_file_path
                )

                new_contract = Contract(property_id=property_id_valid, file_url=contract_file_path, status="pending")
                session.add(new_property)
                session.add(new_contract)
                session.flush()

                meetings_json = data.get('meetings')
                try:
                    meetings = json.loads(meetings_json)
                except json.JSONDecodeError:
                    return jsonify({"message": "Invalid JSON format for 'meetings' field."}), 400

                # Loop through and save each meeting
                for meeting in meetings:
                    meeting_date = datetime.datetime.strptime(meeting['date'], "%Y-%m-%d").date()
                    meeting_time = datetime.datetime.strptime(meeting['time'], "%H:%M").time()

                    new_meeting = Meeting(
                        property_id=new_property.id,
                        date=meeting_date,
                        time=meeting_time,
                        user_id=user_id
                    )
                    session.add(new_meeting)

                session.commit()

                return jsonify({"message": "Property added successfully!"}), 200

            properties = session.query(Property).filter(Property.owner_id == user.id).all()

            return render_template('property.html', user=user, user_type=user_role, action=action,
                                   properties=properties)

        except Exception as e:
            session.rollback()
            print(e)
            return jsonify({"message": "Something Went wrong"}), 500
    else:
        properties = session.query(Property).all()
    return render_template('property.html', user=user, user_type=user_role, properties=properties)


@property_routes.route('/property/filter-search', methods=['GET'])
def propertyFilter():
    auth_token = request.cookies.get('auth_token')
    print(auth_token)
    user = None
    user_role = None
    if auth_token:
        try:
            decoded_token = jwt.decode(auth_token, SECRET_KEY, algorithms=["HS256"])
            user_email = decoded_token.get('email')
            user_role = decoded_token.get('role')
            print(user_role)
            is_logged_in = True
            session = SessionLocal()
            user = session.query(User).filter(User.email == user_email).first()
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token has expired. Please sign in again."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Please sign in again."}), 401

    session = SessionLocal()
    try:
        # Extract query parameters
        city = request.args.get('city').lower()
        price_min = request.args.get('price_min', type=float, default=0)
        price_max = request.args.get('price_max', type=float, default=float('inf'))
        property_type = request.args.get('property_type').lower()
        rooms = request.args.get('rooms', type=int, default=0)
        print(city, price_min, price_max, property_type, rooms)

        query = session.query(Property)

        if city:
            query = query.filter(Property.city.ilike(city))
        if price_min:
            query = query.filter(Property.monthly_rent >= price_min)
        if price_max:
            query = query.filter(Property.monthly_rent <= price_max)
        if property_type:
            query = query.filter(Property.property_type == property_type)
        if rooms:
            query = query.filter(Property.rooms >= rooms)

        properties = query.all()
        if not properties:
            return jsonify({"message": "No properties found matching the criteria."}), 404

        properties_data = [
            {
                "id": property.id,
                "propertyName": property.property_name,
                "propertyImg": property.property_photos,
                "city": property.city.title(),
                "price": property.monthly_rent,
                "type": property.property_type,
                "rooms": property.rooms,
                "street": property.street,
                "floor": property.floor,
                "airflow": property.airflow,
                "square_meters": property.square_meters,
                "entry_date": property.entry_date,
                "entrance": property.entrance,
                "house_number": property.house_number,
                "building_maintenance": property.building_maintenance,
                "address": f"{property.street}, {property.house_number}, {property.city.title()}",
            }
            for property in properties
        ]
        return jsonify({"message": "Properties retrieved successfully!", "properties": properties_data,
                        "userType": user_role}), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"message": "An error occurred while retrieving properties.", "error": str(e)}), 500

    finally:
        session.close()  # Close the database session in all cases
