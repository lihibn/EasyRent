# Import necessary modules and libraries.
import ssl
import base64
import requests
from requests.adapters import HTTPAdapter
from urllib3.poolmanager import PoolManager
from retrying import retry
from dotenv import load_dotenv
import os

# Load environment variables from the .env file.
load_dotenv()

# Retrieve DocuSign account ID and access token from environment variables.
DOCUSIGN_ACCOUNT_ID = os.getenv('DOCUSIGN_ACCOUNT_ID')
DOCUSIGN_ACCESS_TOKEN = os.getenv('DOCUSIGN_ACCESS_TOKEN')

# Function to encode a document in Base64 format for API usage.
def encode_document(file_path):
    with open(file_path, "rb") as file:
        file_data = file.read()
    print(f"File size: {len(file_data)} bytes")
    encoded = base64.b64encode(file_data).decode("utf-8")
    return encoded

# Retry logic decorator: Retries up to 3 times with a 5-second interval between attempts
@retry(stop_max_attempt_number=3, wait_fixed=5000)
def send_signature_request(file_path, signer_email, signer_name, document_id):
    print(file_path, signer_name, signer_email)
# Payload for the DocuSign API request.
    payload = {
        "documents": [
            {
                "documentBase64": encode_document(file_path),
                "documentId": document_id,
                "fileExtension": "pdf",
                "name": "document"
            }
        ],
        "emailSubject": "Contract Signing Request",
        "recipients": {
            "signers": [
                {
                    "email": signer_email,
                    "name": signer_name,
                    "recipientId": "1"
                }
            ]
        },
        "status": "sent"
    }
# Headers for the API request, including the authorization token.
    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJ0eXAiOiJNVCIsImFsZyI6IlJTMjU2Iiwia2lkIjoiNjgxODVmZjEtNGU1MS00Y2U5LWFmMWMtNjg5ODEyMjAzMzE3In0.AQsAAAABAAUABwAAFH83FTDdSAgAAFSiRVgw3UgCAHdIv1qqLk5BoFaxEE7Df3gVAAEAAAAYAAIAAAAFAAAAHQAAAA0AJAAAADY0MTczZTJiLTk4NTMtNDY0ZC1iOWZjLTE5ZGNiZDVkODMwMyIAJAAAADY0MTczZTJiLTk4NTMtNDY0ZC1iOWZjLTE5ZGNiZDVkODMwMxIAAQAAAAsAAABpbnRlcmFjdGl2ZTAAgFC1NRUw3Ug3AOGTXiaUgndHnjZtqG2VTfk.3I5EWR4hF07uIWGnStHz2MrtjG-BU5-WXMpBlVjvxZ1v-ymvB6SHIxAzTALNaP8HKp-jm1dIPzr0FIyZTvLbmh-mc4rRmATZJIuzV2u0BwPlRqMGheoyVsbQsmEMBv1X3gexdTMQeqh-M2nmyuOO-SKGNLso-qOOasZt-X05tvJmTmvX9I8H5tjylJhZCQ4s-z6hoGriEkjSReJaPy4JG0au8ZbGzB9N8llcfFSi4fc2O44Qh4oYFF9-Bd2RjNOsXbhVUXe3G2rOOok0ZsA11ifouZhdtiuMqLaQmzdqVlD4RasbsM29rLuk5g7iVf8q4ZjuCVkm9Wx06yKSWQNiKw'
    }

    try:
# Create a new HTTP session for making requests.
        session = requests.Session()
# Send a POST request to the DocuSign API to create an envelope.
        response = session.post(
            F"https://demo.docusign.net/restapi/v2.1/accounts/{os.getenv('DOCUSIGN_ACCOUNT_ID')}/envelopes",
            # Replace with your account ID
            json=payload,
            headers=headers,
            timeout=120
        )

# Check the response status.
        if response.status_code == 201:
            response_data = response.json()
            print(response_data)
            envelope_id = response_data.get("envelopeId")
            envelope_url = "https://demo.docusign.net/restapi" + response_data.get("uri")
            print(envelope_url)
            return envelope_id, envelope_url
        else:
            print(f"Error: {response.status_code}, {response.text}")
            raise Exception("Error sending DocuSign request")
# Handle exceptions related to the request.
    except requests.exceptions.RequestException as e:
        print(f"Error sending DocuSign request: {e}")
        raise
