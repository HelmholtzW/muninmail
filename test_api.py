#!/usr/bin/env python3
"""
Test script for the Email Agents API
"""

import requests
import json
from datetime import datetime

# API base URL
BASE_URL = "http://localhost:8000"

# Sample email data
sample_email = {
    "subject": "Urgent: Project deadline and meeting schedule",
    "body": "Hi team, we need to complete the project report by Friday. Please review the attached documents and send your feedback. Can you also schedule a meeting for tomorrow to discuss the next steps? This is urgent and requires immediate attention.",
    "sender": "manager@company.com",
    "recipient": "team@company.com",
    "timestamp": datetime.now().isoformat(),
    "attachments": ["project_report.pdf", "budget_spreadsheet.xlsx"],
}


def test_root():
    """Test the root endpoint"""
    print("Testing root endpoint...")
    response = requests.get(f"{BASE_URL}/")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print("-" * 50)


def test_summarize():
    """Test the summarize endpoint"""
    print("Testing summarize endpoint...")
    payload = {"email": sample_email, "include_attachments": True}
    response = requests.post(f"{BASE_URL}/summarize", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print("-" * 50)


def test_extract_todos():
    """Test the extract_todos endpoint"""
    print("Testing extract_todos endpoint...")
    payload = {"email": sample_email}
    response = requests.post(f"{BASE_URL}/extract_todos", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print("-" * 50)


def test_get_flags():
    """Test the get_flags endpoint"""
    print("Testing get_flags endpoint...")
    payload = {"email": sample_email}
    response = requests.post(f"{BASE_URL}/get_flags", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print("-" * 50)


def main():
    """Run all tests"""
    print("Email Agents API Test Suite")
    print("=" * 50)

    try:
        test_root()
        test_summarize()
        test_extract_todos()
        test_get_flags()
        print("All tests completed successfully!")
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the API server.")
        print("Make sure the server is running with: python src/backend/api.py")
    except Exception as e:
        print(f"Error during testing: {e}")


if __name__ == "__main__":
    main()
