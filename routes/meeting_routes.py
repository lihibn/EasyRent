# Import necessary modules and libraries.
from flask import Blueprint, request, render_template, jsonify, session, make_response, redirect
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from models.models import User, Property, Meeting
from database.db import SessionLocal
import datetime
import jwt

# Create a Flask blueprint for meeting-related routes.
meeting_routes = Blueprint('meeting_routes', __name__)

# Load environment variables.
from dotenv import load_dotenv
import os
load_dotenv()

# Load the secret key for JWT decoding.
SECRET_KEY = os.getenv('SECRET_KEY')

# Route to display the meeting page.
@meeting_routes.route('/meeting', methods=['GET', 'POST'])
def meeting():
    auth_token = request.cookies.get('auth_token')
    user = None
    user_role = None
    session = SessionLocal()
    if auth_token:
        try:
# Decode the JWT token to fetch user information.
            decoded_token = jwt.decode(auth_token, SECRET_KEY, algorithms=["HS256"])
            user_email = decoded_token.get('email')
            user_role = decoded_token.get('role')
            session = SessionLocal()
            user = session.query(User).filter(User.email == user_email).first()
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token has expired. Please sign in again."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Please sign in again."}), 401
            
# Fetch all properties to display on the meetings page.
    properties = session.query(Property).all()
# Render the 'meetings.html' template with user and property information.
    return render_template('meetings.html', user=user, user_type=user_role, properties=properties)

# Route to retrieve meeting slots for a specific property.
@meeting_routes.route('/meeting_slots/<int:property_id>', methods=['GET'])
def get_meeting_slots(property_id):
    session = SessionLocal()
    try:
        print(property_id)
# Query all meeting slots for the specified property, ordered by date and time.
        meeting_slots = (
            session.query(Meeting)
            .filter(Meeting.property_id == property_id)
            .order_by(Meeting.date, Meeting.time)
            .all()
        )
# Format the slots for JSON response.
        slots = [
            {
                "id": slot.id,
                "date": slot.date.strftime("%Y-%m-%d"),
                "time": slot.time.strftime("%H:%M"),
                "attendee": slot.attendee,
            }
            for slot in meeting_slots
        ]

        return jsonify(slots), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

# Route to request a meeting slot.
@meeting_routes.route('/request_meeting', methods=['POST'])
def request_meeting():
    data = request.json
    session = SessionLocal()
    auth_token = request.cookies.get('auth_token')

# Decode the JWT token to fetch user information.
    try:
        try:
            decoded_token = jwt.decode(auth_token, SECRET_KEY, algorithms=["HS256"])
            user_email = decoded_token.get('email')
            user_role = decoded_token.get('role')
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token has expired. Please sign in again."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Please sign in again."}), 401

# Prevent landlords from requesting meeting slots.
        if (user_role == "Landlord"):
            return jsonify({"message": "You can't request for meeting. Please login as tenant "}), 400
# Check if the required 'slot_id' field is present in the request.
        else:
            if 'slot_id' not in data:
                return jsonify({"message": "Missing slot_id in request"}), 400

# Fetch the meeting slot using the provided slot_id.
            meeting_slot = session.query(Meeting).filter(Meeting.id == data['slot_id']).first()

# Validate that the slot exists and is not already booked.
            if not meeting_slot or meeting_slot.attendee:
                return jsonify({"message": "Slot already booked or does not exist"}), 400

# Update the meeting slot with the user's email and mark it as unavailable.
            meeting_slot.attendee = user_email
            meeting_slot.is_available = 0
            session.commit()
# Return a success message.
            return jsonify({"message": "Meeting scheduled successfully!"}), 200

    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        session.close()

