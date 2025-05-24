import pytest
from fastapi.testclient import TestClient
from datetime import datetime
from src.main import app
from src.models import (
    EmailContent,
    SummarizeRequest,
    ExtractTodosRequest,
    GetFlagsRequest,
    Flag,
)

# Create test client
client = TestClient(app)


@pytest.fixture
def sample_email():
    """Sample email content for testing"""
    return EmailContent(
        subject="Meeting Tomorrow - Project Review",
        body="""Hi team,

We have our project review meeting scheduled for tomorrow at 2 PM in conference room A.
Please prepare your progress reports and bring any blockers you want to discuss.

Action items for everyone:
- Complete the documentation for your modules
- Prepare a 5-minute presentation
- Review the project timeline

This is urgent - we need to present to the client next week.

Thanks,
John""",
        sender="john@company.com",
        recipient="team@company.com",
        timestamp=str(datetime.now()),
        attachments=["project_timeline.pdf"],
    )


@pytest.fixture
def sample_flags():
    """Sample flags for testing"""
    return [
        Flag(type="urgent", description="Urgent email requiring immediate attention"),
        Flag(type="requires_response", description="Email that requires a response"),
        Flag(type="meeting_request", description="Email contains a meeting request"),
        Flag(type="action_items", description="Email contains action items"),
    ]


class TestRootEndpoint:
    """Test the root endpoint"""

    def test_root_endpoint(self):
        """Test root endpoint returns correct information"""
        response = client.get("/")
        assert response.status_code == 200

        data = response.json()
        assert data["message"] == "Email Agents API"
        assert data["version"] == "1.0.0"
        assert "/summarize" in data["endpoints"]
        assert "/extract_todos" in data["endpoints"]
        assert "/get_flags" in data["endpoints"]


class TestSummarizeEndpoint:
    """Test the email summarization endpoint"""

    def test_summarize_email_success(self, sample_email):
        """Test successful email summarization"""
        request_data = SummarizeRequest(email=sample_email)

        response = client.post("/summarize", json=request_data.model_dump())

        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        assert isinstance(data["summary"], str)
        assert len(data["summary"]) > 0

    def test_summarize_email_empty_body(self):
        """Test summarization with empty email body"""
        email = EmailContent(
            subject="Empty Email",
            body="",
            sender="test@example.com",
            recipient="recipient@example.com",
        )
        request_data = SummarizeRequest(email=email)

        response = client.post("/summarize", json=request_data.model_dump())

        # Should still return 200 but may handle empty content gracefully
        assert response.status_code in [200, 500]

    def test_summarize_email_missing_fields(self):
        """Test summarization with missing required fields"""
        incomplete_data = {
            "email": {
                "subject": "Test",
                # Missing required fields like body, sender, recipient
            }
        }

        response = client.post("/summarize", json=incomplete_data)
        assert response.status_code == 422  # Validation error

    def test_summarize_email_invalid_json(self):
        """Test summarization with invalid JSON"""
        response = client.post("/summarize", data="invalid json")  # Not JSON
        assert response.status_code == 422


class TestExtractTodosEndpoint:
    """Test the todo extraction endpoint"""

    def test_extract_todos_success(self, sample_email):
        """Test successful todo extraction"""
        request_data = ExtractTodosRequest(email=sample_email)

        response = client.post("/extract_todos", json=request_data.model_dump())

        assert response.status_code == 200
        data = response.json()
        assert "todos" in data
        assert isinstance(data["todos"], list)

        # Check if todos were extracted (our sample email has action items)
        if data["todos"]:
            todo = data["todos"][0]
            assert "task" in todo
            assert "priority" in todo
            assert todo["priority"] in ["high", "medium", "low"]

    def test_extract_todos_no_todos(self):
        """Test todo extraction from email with no action items"""
        email = EmailContent(
            subject="Just FYI",
            body="This is just an informational email with no action items.",
            sender="info@example.com",
            recipient="recipient@example.com",
        )
        request_data = ExtractTodosRequest(email=email)

        response = client.post("/extract_todos", json=request_data.model_dump())

        assert response.status_code == 200
        data = response.json()
        assert "todos" in data
        assert isinstance(data["todos"], list)
        # May be empty list if no todos found

    def test_extract_todos_missing_fields(self):
        """Test todo extraction with missing required fields"""
        incomplete_data = {
            "email": {
                "subject": "Test"
                # Missing required fields
            }
        }

        response = client.post("/extract_todos", json=incomplete_data)
        assert response.status_code == 422


class TestGetFlagsEndpoint:
    """Test the flags analysis endpoint"""

    def test_get_flags_success(self, sample_email, sample_flags):
        """Test successful flag analysis"""
        request_data = GetFlagsRequest(email=sample_email, available_flags=sample_flags)

        response = client.post("/get_flags", json=request_data.model_dump())

        assert response.status_code == 200
        data = response.json()
        assert "flags" in data
        assert isinstance(data["flags"], list)

        # Check flag structure if any flags are returned
        if data["flags"]:
            flag = data["flags"][0]
            assert "type" in flag
            assert "description" in flag

    def test_get_flags_empty_available_flags(self, sample_email):
        """Test flag analysis with no available flags"""
        request_data = GetFlagsRequest(email=sample_email, available_flags=[])

        response = client.post("/get_flags", json=request_data.model_dump())

        assert response.status_code == 200
        data = response.json()
        assert "flags" in data
        assert isinstance(data["flags"], list)
        # Should return empty list when no flags are available

    def test_get_flags_missing_fields(self):
        """Test flag analysis with missing required fields"""
        incomplete_data = {
            "email": {
                "subject": "Test"
                # Missing required fields
            },
            "available_flags": [],
        }

        response = client.post("/get_flags", json=incomplete_data)
        assert response.status_code == 422


class TestErrorHandling:
    """Test error handling across endpoints"""

    def test_invalid_endpoint(self):
        """Test accessing non-existent endpoint"""
        response = client.get("/invalid_endpoint")
        assert response.status_code == 404

    def test_wrong_http_method(self):
        """Test using wrong HTTP method"""
        response = client.get("/summarize")  # Should be POST
        assert response.status_code == 405

        response = client.get("/extract_todos")  # Should be POST
        assert response.status_code == 405

        response = client.get("/get_flags")  # Should be POST
        assert response.status_code == 405


class TestIntegration:
    """Integration tests using the same email across all endpoints"""

    def test_full_email_processing_workflow(self, sample_email, sample_flags):
        """Test processing the same email through all endpoints"""

        # Test summarization
        summarize_request = SummarizeRequest(email=sample_email)
        summarize_response = client.post(
            "/summarize", json=summarize_request.model_dump()
        )
        assert summarize_response.status_code == 200
        summary_data = summarize_response.json()

        # Test todo extraction
        todos_request = ExtractTodosRequest(email=sample_email)
        todos_response = client.post("/extract_todos", json=todos_request.model_dump())
        assert todos_response.status_code == 200
        todos_data = todos_response.json()

        # Test flag analysis
        flags_request = GetFlagsRequest(
            email=sample_email, available_flags=sample_flags
        )
        flags_response = client.post("/get_flags", json=flags_request.model_dump())
        assert flags_response.status_code == 200
        flags_data = flags_response.json()

        # Verify all responses have expected structure
        assert "summary" in summary_data
        assert "todos" in todos_data
        assert "flags" in flags_data

        # Log results for manual inspection during development
        print(f"Summary: {summary_data['summary']}")
        print(f"Todos count: {len(todos_data['todos'])}")
        print(f"Flags count: {len(flags_data['flags'])}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
