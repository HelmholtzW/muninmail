import os

from litellm import completion

from ..models.models import EmailContent, ExtractTodosResponse

PROMPT_TEMPLATE = """
You are a helpful assistant that extracts todo items from an email.

The email is:
From: {email.sender}
To: {email.recipient}
Subject: {email.subject}
Body: {email.body}

Extract all the todos for the recipient from the email.

Return the todos in a list of dictionaries with the following keys:
- task: str
- priority: str
- due_date: str

Example:
[
    {{
        "task": "Review the project proposal",
        "priority": "high",
        "due_date": "2025-05-25"
    }}
]

Return the list in the language of the email.
"""


def extract_todos_skill(email: EmailContent) -> list[str]:
    prompt = PROMPT_TEMPLATE.format(email=email)
    response = completion(
        model="cerebras/qwen-3-32b",
        api_key=os.getenv("CEREBRAS_API_KEY"),
        base_url="https://api.cerebras.ai/v1",
        messages=[{"role": "user", "content": prompt}],
        response_format=ExtractTodosResponse,
    )
    return response.choices[0].message.content


if __name__ == "__main__":
    from src.main import EmailContent

    email = EmailContent(
        subject="Meeting with John",
        body="We need to discuss the project proposal. Please review the proposal and let me know your thoughts.",
        sender="John Doe",
        recipient="Jane Doe",
    )
    todos = extract_todos_skill(email)
    print(todos)
