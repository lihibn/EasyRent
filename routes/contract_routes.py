# Import necessary modules and libraries.
from flask import Blueprint, request, render_template, jsonify, session, make_response, redirect
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from models.models import User, Property, Meeting, Contract
from routes.docusign_api import send_signature_request
from database.db import SessionLocal
import datetime
from database.db import SessionLocal
import datetime
import jwt
import requests
import os
from docusign_esign.client.api_exception import ApiException
import time
import base64

# Create a Blueprint object to handle routes related to contracts.
contract_routes = Blueprint('contract_routes', __name__)

# Load environment variables from a .env file.
from dotenv import load_dotenv
import os
load_dotenv()

# Secret key for JWT token decoding.
SECRET_KEY = os.getenv('SECRET_KEY')

# Route for creating or fetching contracts.
@contract_routes.route('/contract', methods=['GET', 'POST'])
def contract():
    auth_token = request.cookies.get('auth_token')
    user = None
    user_role = None
# Decode the JWT token and fetch the user details.
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
# Render contracts page based on user role.
    if user_role:
        user_role_lower = user_role.lower()
        if user_role_lower == "landlord":
            properties = session.query(Property).filter(Property.owner_id == user.id).all()
            return render_template('contracts.html', user=user, user_type=user_role, properties=properties)
        elif user_role_lower == "tenant":
            properties = session.query(Property).all()
            return render_template('contracts.html', user=user, user_type=user_role, properties=properties)

# Default render for invalid or missing role.
    return render_template('contracts.html', user=user, user_type=user_role)

# Route for fetching contracts associated with a specific property.
@contract_routes.route('/contract/<property_id>')
@contract_routes.route('/contract')
def get_contracts_for_property(property_id=None):
    auth_token = request.cookies.get('auth_token')
    session = SessionLocal()
    user = None
    user_role = None
# Decode the token to retrieve user info.
    if auth_token:
        try:
            decoded_token = jwt.decode(auth_token, SECRET_KEY, algorithms=["HS256"])
            user_email = decoded_token.get('email')
            user_role = decoded_token.get('role')
            is_logged_in = True
            session = SessionLocal()
            user = session.query(User).filter(User.email == user_email).first()
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token has expired. Please sign in again."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Please sign in again."}), 401
# Validate and fetch property details.
    try:
        if property_id is not None:
            property_id = int(property_id)
    except ValueError:
        return jsonify({"error": "Invalid property ID"}), 400
    try:
# Fetch contracts related to the property.
        contracts = session.query(Contract).filter(Contract.property_id == property_id,
                                                   Contract.is_deleted == False).all()
        property = session.query(Property).filter(Property.id == property_id).first()

        if property is None:
            return jsonify({'error': 'Property not found'}), 404

        if contracts is None:
            return jsonify({'error': 'Contracts not found'}), 404
            
# Prepare contract data for response.
        contract_list = []
        for contract in contracts:
            if user_role and user_role.lower() == "landlord":
                if contract.property_id == property.id:
                    contract_list.append({
                        'id': contract.id,
                        'property_name': property.property_name if property else "No property",
                        'contract_file': contract.file_url,
                        'status': contract.status,
                        'date_uploaded': contract.date_uploaded
                    })
            elif user_role and user_role.lower() == "tenant":
                contract_list.append({
                    'id': contract.id,
                    'property_name': property.property_name if property else "No property",
                    'contract_file': contract.file_url,
                    'status': contract.status,
                    'date_uploaded': contract.date_uploaded
                })
                
# Return contract details or appropriate message.
        if contract_list:
            return jsonify({'contracts': contract_list, 'userType': user_role})
        else:
            return jsonify({'message': 'No contracts available for the tenant'}), 404

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"message": "An error occurred while retrieving properties.", "error": str(e)}), 500
    finally:
        session.close()

# Route to mark a contract as deleted.
@contract_routes.route('/contract/delete/<int:contract_id>', methods=['PUT'])
def delete_contract(contract_id):
    auth_token = request.cookies.get('auth_token')
    session = SessionLocal()

    user = None
    user_role = None
# Decode the JWT token to identify the user.
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
# Query the contract by ID.
    try:
        contract = session.query(Contract).filter(Contract.id == contract_id).first()

        if contract is None:
            return jsonify({'error': 'Contract not found'}), 404
# delete the contract.
        contract.is_deleted = True
        session.commit()

        return jsonify({'message': "The contract has been deleted successfully."}), 200
    except Exception as e:
        session.rollback()
        print(f"Error: {e}")
        return jsonify({"message": "An error occurred while deleting the contract.", "error": str(e)}), 500
    finally:
        session.close()

# Route to handle document signing.
@contract_routes.route('/sign_document/<int:contract_id>', methods=['POST'])
def sign_document(contract_id):
    auth_token = request.cookies.get('auth_token')
# Ensure the user is authorized.
    if not auth_token:
        return jsonify({"message": "Unauthorized"}), 401

    session = SessionLocal()
# Decode the JWT token to identify the user.    
    try:
        decoded_token = jwt.decode(auth_token, SECRET_KEY, algorithms=["HS256"])
        user_email = decoded_token.get('email')
        user_role = decoded_token.get('role')
    except jwt.ExpiredSignatureError:
        return jsonify({"message": "Token has expired. Please sign in again."}), 401
    except jwt.InvalidTokenError:
        return jsonify({"message": "Invalid token. Please sign in again."}), 401
# Fetch the contract by ID.
    try:
        contract_query = session.query(Contract).filter(Contract.id == contract_id)
        contract = contract_query.first()

        if not contract:
            return jsonify({"error": "Contract not found"}), 404
# Get tenant and owner details.
        tenant = session.query(User).filter(User.email == user_email).first()
        owner = session.query(User).filter(User.role == "landlord").first()

        if not tenant:
            return jsonify({"error": "Missing signer details"}), 404

        if contract.tenant_signed == 1:
            return jsonify({"massage": "You have already signed"}), 404
# Check if the contract file exists.
        if not os.path.exists(contract.file_url):
            return jsonify({"error": "Contract file not found"}), 404
            
# Use the DocuSign API to send a signature request.
        envelope_id, envelope_url = send_signature_request(
            file_path=contract.file_url,
            signer_email=tenant.email,
            signer_name=tenant.full_name,
            document_id=contract_id
        )
        
# Update the contract status after signing.
        contract.tenant_id = tenant.id
        contract.tenant_signed = True
        contract.status = "signed"
        session.commit()
        print("ene url is ", envelope_url)
        print("ene url id", envelope_id)
# Return a success response with details.
        return jsonify({
            "message": "Signature request sent successfully",
            "envelope_id": envelope_id,
            "envelope_url": envelope_url
        }), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Failed to send signature request", "details": str(e)}), 500
    finally:
        session.close()



