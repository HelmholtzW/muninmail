from litellm import completion
from backend.src.models import SummarizeResponse, EmailContent
import os

PROMPT_TEMPLATE = """
You are a helpful assistant that summarizes emails into one or two sentences.

The email is:
From: {email.sender}
To: {email.recipient}
Subject: {email.subject}
Body: {email.body}

Summarize the email into one or two sentences.

Return the summary in the language of the email.
"""


def summarize(email: EmailContent) -> list[str]:
    prompt = PROMPT_TEMPLATE.format(email=email)
    response = completion(
        model="cerebras/qwen-3-32b",
        api_key=os.getenv("CEREBRAS_API_KEY"),
        base_url="https://api.cerebras.ai/v1",
        messages=[{"role": "user", "content": prompt}],
        response_format=SummarizeResponse,
    )
    return response.choices[0].message.content


if __name__ == "__main__":
    from backend.src.api import EmailContent

    email = EmailContent(
        subject="Meeting with John",
        body="We need to discuss the project proposal. Please review the proposal and let me know your thoughts.",
        sender="John Doe",
        recipient="Jane Doe",
    )
    todos = summarize(email)
    print(todos)
