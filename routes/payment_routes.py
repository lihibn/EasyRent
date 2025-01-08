# Import necessary modules and libraries.
from flask import Blueprint, request, render_template, jsonify, session, make_response, redirect, url_for
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from models.models import User, Payment, Property
from database.db import SessionLocal
from datetime import datetime

import jwt
import paypalrestsdk
from dotenv import load_dotenv
import os

# Load environment variables from the .env file.
load_dotenv()

# Define a blueprint for payment-related routes.
payment_routes = Blueprint('payment_routes', __name__)

# Retrieve the secret key for JWT.
SECRET_KEY = os.getenv('SECRET_KEY')

# Configure PayPal SDK using environment variables.
paypalrestsdk.configure({
    "mode": os.getenv('PAYPAL_MODE'),
    "client_id": os.getenv('PAYPAL_CLIENT_ID'),
    "client_secret": os.getenv('PAYPAL_CLIENT_SECRET')
})

# Route to display the payment page.
@payment_routes.route('/payment', methods=['GET', 'POST'])
def payment():
    auth_token = request.cookies.get('auth_token')
    user = None
    user_role = None
    payments = []

    if auth_token:
        try:
# Decode the token to extract user data.
            decoded_token = jwt.decode(auth_token, SECRET_KEY, algorithms=["HS256"])
            user_email = decoded_token.get('email')
            user_role = decoded_token.get('role')

            session = SessionLocal()
            user = session.query(User).filter(User.email == user_email).first()
            if user:
# Retrieve all payments for the tenant.
                payments = session.query(Payment).filter_by(tenant_id=user.id).all()
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token has expired. Please sign in again."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Please sign in again."}), 401

# If the user is a landlord, fetch their properties.
    if user_role and user_role.lower() == "landlord":
        properties = session.query(Property).filter(Property.owner_id == user.id).all()
        return render_template('payments.html', user=user, user_type=user_role, payments=payments,
                               expected_rental_ammount=1, properties=properties)
# Render payments for tenants.
    return render_template('payments.html', user=user, user_type=user_role, payments=payments,
                           expected_rental_ammount=1)

# Route to view payments by property for landlords.
@payment_routes.route('/payment/property/<propertyId>', methods=['GET'])
def viewPaymentByProperty(propertyId):
    print(propertyId)
    auth_token = request.cookies.get('auth_token')
    user = None
    user_role = None
    payments = []

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

# Fetch payments for a specific property, including tenant names.
    if user_role and user_role.lower() == "landlord":
        payments = session.query(Payment, User.full_name).join(User, User.id == Payment.tenant_id).filter(
            Payment.property_id == propertyId).all()

# Prepare payment data for JSON response.
        payment_data = [{
            'date': payment[0].date,
            'tenant_name': payment[1],
            'status': payment[0].status
        } for payment in payments]

        return jsonify({'payments': payment_data})

# Return empty response if user is not a landlord.
    return jsonify({'payments': []})

# Route to create a new payment using PayPal.
@payment_routes.route('/create-payment', methods=['POST'])
def create_payment():
    try:
        amount = float(request.json.get('amount', 0))

        payment = paypalrestsdk.Payment({
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                "return_url": url_for('payment_routes.execute_payment', _external=True),
                "cancel_url": url_for('payment_routes.cancel_payment', _external=True, amount=f"{amount:.2f}"),
            },
            "transactions": [{
                "amount": {
                    "total": f"{amount:.2f}",
                    "currency": "USD"
                },
                "description": " "
            }]
        })
# If payment creation is successful, return the approval URL.
        if payment.create():
            for link in payment.links:
                if link.rel == "approval_url":
                    return jsonify({"approval_url": link.href})
        else:
            return jsonify({"error": payment.error}), 400
    except ValueError:
        return jsonify({"error": "Invalid amount format."}), 400

# Route to execute a PayPal payment.
@payment_routes.route('/execute-payment', methods=['GET'])
def execute_payment(session=SessionLocal()):
    auth_token = request.cookies.get('auth_token')
    try:
        decoded_token = jwt.decode(auth_token, SECRET_KEY, algorithms=["HS256"])
        user = session.query(User).filter(User.email == decoded_token.get('email')).first()
        if not user:
            return jsonify({"message": "User not found"}), 404
    except jwt.ExpiredSignatureError:
        return jsonify({"message": "Token has expired. Please sign in again."}), 401
    except jwt.InvalidTokenError:
        return jsonify({"message": "Invalid token. Please sign in again."}), 401
        
# Extract payment details from the request.
    payment_id = request.args.get('paymentId')
    payer_id = request.args.get('PayerID')

    payment = paypalrestsdk.Payment.find(payment_id)

# Execute the payment.
    if payment.execute({"payer_id": payer_id}):
        transaction = payment.transactions[0]
        print(transaction)
        amount = float(transaction['amount']['total'])
        status = transaction['related_resources'][0]['sale']['state']
        if status == "completed":
            status = "paid"
        else:
            status = status

# Record the payment in the database.
        date = datetime.now()
        new_payment = Payment(
            amount=amount,
            status=status,
            date=date,
            tenant_id=user.id,
            property_id=1
        )

        session.add(new_payment)
        session.commit()
        session.close()

        return render_template("payment_success.html", message="Payment completed successfully.")
    else:
        return jsonify({"error": payment.error}), 400

# Route to handle payment cancellation.
@payment_routes.route('/cancel-payment', methods=['GET'])
def cancel_payment(session=SessionLocal()):
    auth_token = request.cookies.get('auth_token')
    try:
        decoded_token = jwt.decode(auth_token, SECRET_KEY, algorithms=["HS256"])
        user = session.query(User).filter(User.email == decoded_token.get('email')).first()
        if not user:
            return jsonify({"message": "User not found"}), 404
    except jwt.ExpiredSignatureError:
        return jsonify({"message": "Token has expired. Please sign in again."}), 401
    except jwt.InvalidTokenError:
        return jsonify({"message": "Invalid token. Please sign in again."}), 401

# Log the canceled payment in the database.
    amount = float(request.args.get('amount', 0))
    status = "canceled"
    date = datetime.now()

    new_payment = Payment(
        amount=amount,
        status=status,
        date=date,
        tenant_id=user.id,
        property_id=1
    )
    session.add(new_payment)
    session.commit()
    session.close()

    return render_template("payment_canceled.html", message="Payment has been canceled.")
