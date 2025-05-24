from smolagents import LiteLLMModel
import os
from dotenv import load_dotenv

load_dotenv()

openrouter_qwen = LiteLLMModel(
    model_id="openai/qwen/qwen3-32b",
    api_base="https://openrouter.ai/api/v1",
    provider={"only": ["Cerebras"]},
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

if __name__ == "__main__":
    from smolagents import CodeAgent

    agent = CodeAgent(tools=[], model=openrouter_qwen, add_base_tools=True)

agent.run(
    "What is the 432nd prime number?",
)
