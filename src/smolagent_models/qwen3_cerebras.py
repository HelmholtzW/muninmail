from smolagents import LiteLLMModel
import os
from dotenv import load_dotenv

load_dotenv()

cerebras_qwen = LiteLLMModel(
    model_id="cerebras/qwen-3-32b",
    api_base="https://api.cerebras.ai/v1/",
    api_key=os.getenv("CEREBRAS_API_KEY"),
)

if __name__ == "__main__":
    from smolagents import ToolCallingAgent

    agent = ToolCallingAgent(tools=[], model=cerebras_qwen, add_base_tools=True)

    agent.run("What is the 432nd prime number?")
