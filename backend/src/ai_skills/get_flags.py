import os
from typing import List

from litellm import completion

from ..models.models import EmailContent, Flag, GetFlagsResponse

PROMPT_TEMPLATE = """
You are a helpful assistant that flags emails based on the content.

The email is:
From: {email.sender}
To: {email.recipient}
Subject: {email.subject}
Body: {email.body}

The available flags are:
{available_flags}

Flag the email based on the content. Only return the flags that are relevant to the email.
If the email is not relevant to any of the flags, return an empty list.
"""


def get_flags_skill(email: EmailContent, available_flags: List[Flag]) -> list[str]:
    prompt = PROMPT_TEMPLATE.format(email=email, available_flags=available_flags)
    response = completion(
        model="cerebras/qwen-3-32b",
        api_key=os.getenv("CEREBRAS_API_KEY"),
        base_url="https://api.cerebras.ai/v1",
        messages=[{"role": "user", "content": prompt}],
        response_format=GetFlagsResponse,
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
    available_flags = [
        Flag(type="requires_response", description="Requires response"),
        Flag(type="urgent", description="Urgent"),
        Flag(type="meeting_request", description="Meeting request"),
    ]
    flags = get_flags_skill(email, available_flags)
    print(flags)
