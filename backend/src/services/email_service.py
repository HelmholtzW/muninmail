import email
import imaplib
import os
import smtplib
from email.header import decode_header
from email.mime.text import MIMEText
from email.utils import parsedate_to_datetime
from typing import List, Optional

from dotenv import load_dotenv

from ..models import FetchEmailResponseItem

load_dotenv()

# Configuration loaded from environment variables
IMAP_SERVER = os.getenv("IMAP_SERVER")
IMAP_USERNAME = os.getenv("IMAP_USERNAME")
IMAP_PASSWORD = os.getenv("IMAP_PASSWORD")
SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")


def get_decoded_header(header_value: Optional[str]) -> str:
    """Decodes email headers to a readable string."""
    if not header_value:
        return ""
    decoded_parts = []
    for part, charset in decode_header(header_value):
        if isinstance(part, bytes):
            decoded_parts.append(part.decode(charset or "utf-8", errors="ignore"))
        else:
            decoded_parts.append(part)
    return "".join(decoded_parts)


def get_email_body(msg: email.message.Message) -> str:
    """Extracts the plain text body from an email message."""
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition"))
            if content_type == "text/plain" and "attachment" not in content_disposition:
                try:
                    return part.get_payload(decode=True).decode(
                        part.get_content_charset() or "utf-8", errors="ignore"
                    )
                except:
                    return "[Could not decode plain text body]"
        # If no plain text part found, try to get HTML (and ideally convert it, but for now just return a note)
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition"))
            if content_type == "text/html" and "attachment" not in content_disposition:
                # In a real app, you might want to strip HTML tags here
                return "[HTML body found, plain text preferred but not available]"
        return "[No plain text body found in multipart email]"
    else:
        # Not a multipart email, just get the payload
        try:
            return msg.get_payload(decode=True).decode(
                msg.get_content_charset() or "utf-8", errors="ignore"
            )
        except:
            return "[Could not decode email body]"


def get_attachment_filenames(msg: email.message.Message) -> List[str]:
    """Extracts a list of attachment filenames from an email message."""
    attachments = []
    for part in msg.walk():
        if part.get_content_maintype() == "multipart":
            continue
        if part.get("Content-Disposition") is None:
            continue
        filename = part.get_filename()
        if filename:
            decoded_filename = get_decoded_header(filename)
            attachments.append(decoded_filename)
    return attachments


def fetch_emails() -> List[FetchEmailResponseItem]:
    """Fetches emails from the IMAP server and parses them into FetchEmailResponseItem objects."""
    if not all([IMAP_SERVER, IMAP_USERNAME, IMAP_PASSWORD]):
        print("Error: IMAP server, username, or password not configured in .env file.")
        return []
    try:
        mail = imaplib.IMAP4_SSL(IMAP_SERVER)
        mail.login(IMAP_USERNAME, IMAP_PASSWORD)
        mail.select("inbox")
        status, data = mail.search(None, "ALL")
        mail_ids = []
        for block in data:
            mail_ids += block.split()

        parsed_emails: List[FetchEmailResponseItem] = []
        for i in mail_ids:
            status, data = mail.fetch(i, "(RFC822)")
            for response_part in data:
                if isinstance(response_part, tuple):
                    msg = email.message_from_bytes(response_part[1])

                    subject = get_decoded_header(msg["subject"])
                    sender = get_decoded_header(msg["from"])
                    recipient = get_decoded_header(msg["to"])

                    date_str = msg["date"]
                    timestamp_str = ""
                    if date_str:
                        try:
                            dt_object = parsedate_to_datetime(date_str)
                            timestamp_str = dt_object.isoformat()
                        except Exception as e:
                            print(f"Could not parse date string '{date_str}': {e}")
                            timestamp_str = date_str  # Fallback to raw date string

                    body = get_email_body(msg)
                    attachments = get_attachment_filenames(msg)

                    parsed_emails.append(
                        FetchEmailResponseItem(
                            id=i.decode(),
                            subject=subject or "No Subject",
                            body=body,
                            sender=sender or "Unknown Sender",
                            recipient=recipient or "Unknown Recipient",
                            timestamp=timestamp_str or "No Date",
                            attachments=attachments,
                        )
                    )
        mail.logout()
        return parsed_emails
    except Exception as e:
        print(f"Error fetching emails: {e}")
        return []


def send_email(sender: str, recipient: str, subject: str, body: str) -> bool:
    """Sends an email using the SMTP server."""
    if not all([SMTP_SERVER, SMTP_USERNAME, SMTP_PASSWORD]):
        print("Error: SMTP server, username, or password not configured in .env file.")
        return False
    try:
        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = sender
        msg["To"] = recipient

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()  # Use TLS
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(SMTP_USERNAME, recipient, msg.as_string())
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False


def fetch_email_by_id(email_id: str) -> FetchEmailResponseItem:
    """Fetches a specific email by ID."""
    return FetchEmailResponseItem(
        id=email_id,
        subject="Test Subject",
        body="Test Body",
        sender="Test Sender",
        recipient="Test Recipient",
        timestamp="2021-01-01T00:00:00Z",
    )


if __name__ == "__main__":
    # Example usage (for testing purposes)
    print("Fetching emails...")
    retrieved_emails: List[FetchEmailResponseItem] = fetch_emails()
    if retrieved_emails:
        print(f"Fetched {len(retrieved_emails)} emails.")
        for email_item in retrieved_emails:
            print(
                f"- ID: {email_item.id}, Subject: {email_item.subject}, Sender: {email_item.sender}, Recipient: {email_item.recipient}, Timestamp: {email_item.timestamp}"
            )
    else:
        print("No emails fetched or error occurred.")

    print("\nSending test email...")
    # Replace with a real recipient for testing
    # success = send_email('recipient@example.com', 'Test Email from Backend', 'This is a test email.')
    # if success:
    #     print("Test email sent successfully.")
    # else:
    #     print("Failed to send test email.")
