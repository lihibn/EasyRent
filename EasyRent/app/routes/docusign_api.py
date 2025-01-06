import ssl
import base64
import requests
from requests.adapters import HTTPAdapter
from urllib3.poolmanager import PoolManager
from retrying import retry
from dotenv import load_dotenv
import os

load_dotenv()

DOCUSIGN_ACCOUNT_ID = os.getenv('DOCUSIGN_ACCOUNT_ID')
DOCUSIGN_ACCESS_TOKEN = os.getenv('DOCUSIGN_ACCESS_TOKEN')


def encode_document(file_path):
    with open(file_path, "rb") as file:
        file_data = file.read()
    print(f"File size: {len(file_data)} bytes")
    encoded = base64.b64encode(file_data).decode("utf-8")
    return encoded


# Retry logic for transient errors
@retry(stop_max_attempt_number=3, wait_fixed=5000)
def send_signature_request(file_path, signer_email, signer_name, document_id):
    print(file_path, signer_name, signer_email)
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

    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJ0eXAiOiJNVCIsImFsZyI6IlJTMjU2Iiwia2lkIjoiNjgxODVmZjEtNGU1MS00Y2U5LWFmMWMtNjg5ODEyMjAzMzE3In0.AQsAAAABAAUABwCA-DSVwyzdSAgAgDhYowYt3UgCAHdIv1qqLk5BoFaxEE7Df3gVAAEAAAAYAAIAAAAFAAAAHQAAAA0AJAAAADY0MTczZTJiLTk4NTMtNDY0ZC1iOWZjLTE5ZGNiZDVkODMwMyIAJAAAADY0MTczZTJiLTk4NTMtNDY0ZC1iOWZjLTE5ZGNiZDVkODMwMxIAAQAAAAsAAABpbnRlcmFjdGl2ZTAAgMsDlMMs3Ug3AOGTXiaUgndHnjZtqG2VTfk.f0Zgohfk_gyG0DDXsy9kxlqOYlwikh1xqZPbVe2CG9k-GEsBJkcF1QNsjTmzFDr9c6G_k603cj20OiQCcTBQWWv_wyNDN4tmRx9L9tiQzqj9HfyMcFSIlnjczH77gBoEZX-Lgy94ZDyY_4HoGakDy-KKD9NhQyRKUTDn_-5dPbcGoOtOLgzmeryLRYab1mpbeqBNTA-sVPeo9goOl-9dT80NCoplc_4URKUYdsSLHkuAVZdmVfqDf8br5mf-h6VKMZZH5IVuwYQNofL61xWAv1_oDRz8wo9U_bMKGioBagFBopNbwYqzqtRz0pzc7zu2qTJRkeil5TwvJa-p4tDGtg'
        # Replace with your actual DocuSign access token
    }

    try:
        session = requests.Session()

        response = session.post(
            F"https://demo.docusign.net/restapi/v2.1/accounts/{os.getenv('DOCUSIGN_ACCOUNT_ID')}/envelopes",
            # Replace with your account ID
            json=payload,
            headers=headers,
            timeout=120
        )

        # Check the response status
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

    except requests.exceptions.RequestException as e:
        print(f"Error sending DocuSign request: {e}")
        raise
