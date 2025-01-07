from flask import Blueprint, request, render_template, jsonify, session, make_response, redirect
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from models.models import User, Property, Meeting
from database.db import SessionLocal
import datetime
import jwt

meeting_routes = Blueprint('meeting_routes', __name__)
from dotenv import load_dotenv
import os

load_dotenv()

SECRET_KEY = os.getenv('SECRET_KEY')


@meeting_routes.route('/meeting', methods=['GET', 'POST'])
def meeting():
    auth_token = request.cookies.get('auth_token')
    user = None
    user_role = None
    session = SessionLocal()
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

    properties = session.query(Property).all()

    return render_template('meetings.html', user=user, user_type=user_role, properties=properties)


@meeting_routes.route('/meeting_slots/<int:property_id>', methods=['GET'])
def get_meeting_slots(property_id):
    session = SessionLocal()
    try:
        print(property_id)
        meeting_slots = (
            session.query(Meeting)
            .filter(Meeting.property_id == property_id)
            .order_by(Meeting.date, Meeting.time)
            .all()
        )
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


@meeting_routes.route('/request_meeting', methods=['POST'])
def request_meeting():
    data = request.json
    session = SessionLocal()
    auth_token = request.cookies.get('auth_token')

    try:
        try:
            decoded_token = jwt.decode(auth_token, SECRET_KEY, algorithms=["HS256"])
            user_email = decoded_token.get('email')
            user_role = decoded_token.get('role')
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token has expired. Please sign in again."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Please sign in again."}), 401

        if (user_role == "Landlord"):
            return jsonify({"message": "You can't request for meeting. Please login as tenant "}), 400
        else:
            if 'slot_id' not in data:
                return jsonify({"message": "Missing slot_id in request"}), 400

            meeting_slot = session.query(Meeting).filter(Meeting.id == data['slot_id']).first()

            if not meeting_slot or meeting_slot.attendee:
                return jsonify({"message": "Slot already booked or does not exist"}), 400

            meeting_slot.attendee = user_email
            meeting_slot.is_available = 0
            session.commit()

            return jsonify({"message": "Meeting scheduled successfully!"}), 200

    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        session.close()

