from flask import Flask, render_template, request, jsonify, send_file, session, make_response, abort, redirect, current_app, url_for
from flask_oauthlib.client import OAuth
from urllib.parse import quote, unquote, urlencode
from database.db import engine, SessionLocal, Base
from models.models import User, Property, Payment, Contract
from auth.auth_routes import auth_routes
from routes.property_routes import property_routes
from routes.meeting_routes import meeting_routes
from routes.contract_routes import contract_routes
from routes.payment_routes import payment_routes
from routes.fault_routes import fault_routes
from routes.external_service import external_service_routes
from config import Config
from auth.auth_utils import get_user_from_token
import jwt
import os
from flask_cors import CORS
import shutil  # For backup - Lihi

app = Flask(__name__)
CORS(app)  # This will allow all origins by default
app.secret_key = os.urandom(24)

CORS(app, resources={r"/*": {"origins": "*"}})
CORS(app, resources={r"/api/*": {"origins": "*"}})  # Adjust for your needs
# Register Bluerints
app.register_blueprint(auth_routes, url_prefix='/auth')
app.register_blueprint(property_routes)
app.register_blueprint(fault_routes)
app.register_blueprint(external_service_routes, url_prefix='/api')
app.register_blueprint(meeting_routes)
app.register_blueprint(contract_routes)
app.register_blueprint(payment_routes)

SECRET_KEY = os.getenv('SECRET_KEY')

@app.route("/")

# Lihi add it
DB_PATH = os.getenv('DB_PATH', '/opt/render/project/src/easyrent.db')

def index():
    auth_token = request.cookies.get('auth_token')
    print(auth_token)
    user = None
    user_role = None
    session = SessionLocal()
    if auth_token:
        try:
            decoded_token = jwt.decode(auth_token, SECRET_KEY, algorithms=["HS256"])
            user_email = decoded_token.get('email')  # Extract user email
            user_role = decoded_token.get('role')  # Extract user email
            print(user_role)
            is_logged_in = True
            session = SessionLocal()
            user = session.query(User).filter(User.email == user_email).first()
        except jwt.ExpiredSignatureError:
            pass
        except jwt.InvalidTokenError:
            pass

    # Extract unique cities as plain strings
    unique_cities = [city[0].title() for city in session.query(Property.city).distinct().all()]
    properties = session.query(Property).all()

    print(unique_cities)
    return render_template(
        'index.html',
        user=user,
        user_type=user_role,
        cities=unique_cities if unique_cities else None, properties=properties)

# Lihi change from here
@app.route("/download-db", methods=["GET"])
def download_db():
    try:
        return send_file(DB_PATH, as_attachment=True)
    except Exception as e:
        return {"error": str(e)}, 500

@app.route("/backup-db", methods=["GET"])
def backup_db():
    backup_path = f"{DB_PATH}.backup"
    try:
        shutil.copy(DB_PATH, backup_path)
        return {"message": f"Backup created at {backup_path}"}
    except Exception as e:
        return {"error": str(e)}, 500

@app.route("/update-user/<int:user_id>", methods=["POST"])
def update_user(user_id):
    session = SessionLocal()
    try:
        user = session.query(User).filter(User.id == user_id).first()
        if not user:
            return {"error": "User not found"}, 404

        user.name = request.json.get("name", user.name)
        user.email = request.json.get("email", user.email)
        session.commit()
        return {"message": "User updated successfully"}
    except Exception as e:
        return {"error": str(e)}, 500
    finally:
        session.close()

# To here

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response


with app.app_context():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
