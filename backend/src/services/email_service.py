import imaplib
import smtplib
import os
from dotenv import load_dotenv
from email.mime.text import MIMEText
from typing import List, Dict, Any
from backend.src.models import FetchEmailResponseItem

load_dotenv()

# Configuration loaded from environment variables
IMAP_SERVER = os.getenv('IMAP_SERVER')
IMAP_USERNAME = os.getenv('IMAP_USERNAME')
IMAP_PASSWORD = os.getenv('IMAP_PASSWORD')
SMTP_SERVER = os.getenv('SMTP_SERVER')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
SMTP_USERNAME = os.getenv('SMTP_USERNAME')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')

def fetch_emails() -> List[FetchEmailResponseItem]:
    """Fetches emails from the IMAP server."""
    if not all([IMAP_SERVER, IMAP_USERNAME, IMAP_PASSWORD]):
        print("Error: IMAP server, username, or password not configured in .env file.")
        return []
    try:
        mail = imaplib.IMAP4_SSL(IMAP_SERVER)
        mail.login(IMAP_USERNAME, IMAP_PASSWORD)
        mail.select('inbox')
        status, data = mail.search(None, 'ALL')
        mail_ids = []
        for block in data:
            mail_ids += block.split()

        emails_data: List[Dict[str, Any]] = []
        for i in mail_ids:
            status, data = mail.fetch(i, '(RFC822)')
            for response_part in data:
                if isinstance(response_part, tuple):
                    import email
                    msg = email.message_from_bytes(response_part[1])
                    emails_data.append({"id": i.decode(), "subject": str(msg["subject"] or "No Subject")})
        mail.logout()
        return [FetchEmailResponseItem(**email_data) for email_data in emails_data]
    except Exception as e:
        print(f"Error fetching emails: {e}")
        return []

def send_email(to_address: str, subject: str, body: str) -> bool:
    """Sends an email using the SMTP server."""
    if not all([SMTP_SERVER, SMTP_USERNAME, SMTP_PASSWORD]):
        print("Error: SMTP server, username, or password not configured in .env file.")
        return False
    try:
        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = SMTP_USERNAME
        msg['To'] = to_address

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()  # Use TLS
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(SMTP_USERNAME, to_address, msg.as_string())
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

if __name__ == '__main__':
    # Example usage (for testing purposes)
    print("Fetching emails...")
    retrieved_emails: List[FetchEmailResponseItem] = fetch_emails()
    if retrieved_emails:
        print(f"Fetched {len(retrieved_emails)} emails.")
        for email_item in retrieved_emails:
            print(f"- ID: {email_item.id}, Subject: {email_item.subject}")
    else:
        print("No emails fetched or error occurred.")

    print("\nSending test email...")
    # Replace with a real recipient for testing
    # success = send_email('recipient@example.com', 'Test Email from Backend', 'This is a test email.')
    # if success:
    #     print("Test email sent successfully.")
    # else:
    #     print("Failed to send test email.") 