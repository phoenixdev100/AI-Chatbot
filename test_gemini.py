import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load environment variables
load_dotenv()

# Get API key
api_key = os.getenv("GEMINI_API_KEY")

print("=== Gemini API Test (New API) ===")
print(f"API Key found: {'Yes' if api_key else 'No'}")

if not api_key:
    print("\n❌ No API key found!")
    print("Please:")
    print("1. Create a .env file in this directory")
    print("2. Add: GEMINI_API_KEY=your_actual_api_key")
    print("3. Get your API key from: https://aistudio.google.com/app/apikey")
    exit(1)

print(f"API Key length: {len(api_key)} characters")

try:
    # Create client
    print("\n1. Creating Gemini client...")
    client = genai.Client(api_key=api_key)
    print("   ✅ Client created successfully")
    
    # Test generation
    print("\n2. Testing API with models/gemini-2.5-flash...")
    response = client.models.generate_content(
        model='models/gemini-2.5-flash',
        contents='Say "Hello World" and confirm the API is working!',
        config=types.GenerateContentConfig(
            temperature=0.7,
            max_output_tokens=100,
        )
    )
    
    print("   ✅ Success!")
    print(f"   Response: {response.text}")
    
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
