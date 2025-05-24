# AI Configuration

## Environment Variables

Create a `.env.local` file in the frontend directory with the following variables:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Custom OpenAI base URL (leave empty for default api.openai.com)
# Examples:
# - Azure OpenAI: https://your-resource.openai.azure.com/
# - Local/Custom endpoint: http://localhost:8000/v1/
# - Other OpenAI-compatible APIs
OPENAI_BASE_URL=

# Optional: Model to use (defaults to gpt-4o-mini)
# Examples:
# - gpt-4o-mini (default, fast and cost-effective)
# - gpt-4o (more capable, higher cost)
# - gpt-3.5-turbo (cheaper alternative)
# - Custom model names for local/Azure deployments
OPENAI_MODEL=gpt-4o-mini
```

## Supported Endpoints

The `OPENAI_BASE_URL` environment variable allows you to use different OpenAI-compatible endpoints:

- **Default OpenAI**: Leave `OPENAI_BASE_URL` empty or unset
- **Azure OpenAI Service**: Set to your Azure OpenAI endpoint
- **Local deployments**: Set to your local API endpoint
- **Other providers**: Any OpenAI-compatible API endpoint

## Model Configuration

The `OPENAI_MODEL` environment variable allows you to configure which model to use:

- **gpt-4o-mini** (default): Fast, cost-effective, good for most tasks
- **gpt-4o**: More capable for complex reasoning, higher cost
- **gpt-3.5-turbo**: Cheaper alternative for simpler tasks
- **Custom models**: Use any model name available in your deployment

## Usage

All AI functions will automatically use the configured endpoint and model:

- Email sentiment analysis
- Phrase suggestions  
- Chat assistant

The client is configured in `src/ai/client.ts` and will use the environment variables automatically.

## Troubleshooting

### Configuration Validation

When the application starts, it will log the configuration status:
- ✅ OpenAI API key is configured
- 🔗 Base URL being used
- 🤖 Model being used

### Common Issues

**400 Bad Request Error:**
- Check that your `OPENAI_API_KEY` is valid and not expired
- Ensure the model name is correct and available
- For Azure OpenAI, make sure the base URL and model name match your deployment

**Function Calling Fallback:**
- If function calling fails, the system automatically falls back to JSON parsing
- You'll see "Function calling failed, trying fallback approach" in the console
- This is normal for some models or endpoints that don't support function calling

**Model Compatibility:**
- `gpt-4o-mini` and `gpt-4o` support function calling
- `gpt-3.5-turbo` has limited function calling support
- Local models may not support function calling (fallback will be used)

### Error Handling

The AI client includes robust error handling:
1. **Primary**: Uses OpenAI function calling for structured responses
2. **Fallback**: Uses regular chat completion with JSON parsing if function calling fails
3. **Graceful degradation**: Provides meaningful error messages if both approaches fail

### Testing Configuration

To test your configuration:
1. Check the browser console for configuration logs
2. Try the email sentiment analysis feature
3. Use the chat assistant to verify connectivity 