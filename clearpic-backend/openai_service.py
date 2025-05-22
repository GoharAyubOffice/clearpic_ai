import os
from openai import OpenAI
from dotenv import load_dotenv
import base64
import logging
from typing import List, Dict

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Check if OpenAI API key is set
if not os.getenv('OPENAI_API_KEY'):
    logger.error("OPENAI_API_KEY not found in environment variables")
    raise ValueError("OPENAI_API_KEY not found in environment variables")

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Predefined prompt categories
PROMPT_CATEGORIES = {
    'nature': [
        'Serene mountain landscape with a lake',
        'Tropical beach paradise',
        'Misty forest with morning light',
        'Autumn forest with colorful leaves',
        'Snowy winter wonderland'
    ],
    'urban': [
        'Modern city skyline at sunset',
        'Cozy cafe interior',
        'Neon-lit city streets',
        'Historic European street',
        'Modern office space'
    ],
    'abstract': [
        'Geometric patterns with vibrant colors',
        'Abstract fluid art',
        'Minimalist design with negative space',
        'Futuristic digital art',
        'Abstract nature-inspired patterns'
    ],
    'fantasy': [
        'Magical forest with glowing elements',
        'Floating islands in the sky',
        'Crystal cave with magical light',
        'Enchanted garden with fairies',
        'Mystical portal in ancient ruins'
    ]
}

async def analyze_image(image_path: str) -> Dict:
    """Analyze the image using OpenAI's Vision API and return relevant information."""
    try:
        logger.info(f"Reading image file: {image_path}")
        with open(image_path, "rb") as image_file:
            base64_image = base64.b64encode(image_file.read()).decode('utf-8')

        logger.info("Sending request to OpenAI Vision API")
        response = client.chat.completions.create(
            model="gpt-4-vision-preview-1106",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Analyze this image and provide: 1) Main subject, 2) Setting/background, 3) Style/mood, 4) Key elements. Format as JSON."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=300
        )

        logger.info("Received response from OpenAI Vision API")
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Error analyzing image: {str(e)}")
        return None

async def get_suggested_prompts(image_analysis: Dict) -> List[str]:
    """Generate suggested prompts based on image analysis."""
    try:
        logger.info("Sending request to OpenAI for prompt generation")
        response = client.chat.completions.create(
            model="gpt-4-1106-preview",
            messages=[
                {
                    "role": "system",
                    "content": "You are a creative AI that suggests background prompts for images. Generate 5 unique, creative prompts based on the image analysis."
                },
                {
                    "role": "user",
                    "content": f"Based on this image analysis: {image_analysis}, suggest 5 creative background prompts that would work well with this image. Format as a JSON array of strings."
                }
            ],
            max_tokens=300
        )

        logger.info("Received response from OpenAI for prompt generation")
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Error generating prompts: {str(e)}")
        return None

def get_category_prompts(category: str) -> List[str]:
    """Get predefined prompts for a specific category."""
    try:
        logger.info(f"Getting prompts for category: {category}")
        prompts = PROMPT_CATEGORIES.get(category, [])
        logger.info(f"Found {len(prompts)} prompts for category {category}")
        return prompts
    except Exception as e:
        logger.error(f"Error getting category prompts: {str(e)}")
        return []

async def rewrite_prompt(prompt: str) -> str:
    """Rewrite or improve a user prompt for background replacement using OpenAI."""
    try:
        logger.info(f"Rewriting prompt: {prompt}")
        response = client.chat.completions.create(
            model="gpt-4-1106-preview",
            messages=[
                {
                    "role": "system",
                    "content": """You are an expert prompt engineer for ClearPic.AI, a background replacement tool. Your task is to optimize user prompts for background replacement across any theme or subject.

Key guidelines:
1. Adapt to any theme (nature, urban, fantasy, sci-fi, abstract, etc.) while maintaining the user's intent
2. Create a balanced background that complements any potential subject
3. Ensure the prompt is optimized for AI image generation
4. Keep the core elements the user wants but enhance them for better results
5. Consider depth and composition that works well with foreground subjects
6. Keep the response concise but descriptive
7. Remember this is for a background, not a complete scene

Example transformations:
User: "mountains and grass and lakes"
You: "A serene mountain landscape with snow-capped peaks, rolling green meadows, and crystal-clear alpine lakes reflecting the sky - perfect for a natural background that won't compete with the subject"

User: "cyberpunk city"
You: "A neon-lit cyberpunk cityscape with towering skyscrapers, holographic advertisements, and rain-slicked streets reflecting vibrant colors - ideal for a futuristic background with depth"

User: "magical forest"
You: "An enchanted forest with bioluminescent plants, floating magical particles, and ancient trees with glowing runes - perfect for a mystical background with ethereal atmosphere"

User: "minimalist office"
You: "A clean, modern office space with subtle geometric patterns, soft natural lighting, and minimalist furniture - ideal for a professional background with neutral tones"

Format your response as a single, concise sentence optimized for background replacement. Adapt the style and elements based on the theme while ensuring it works well as a background."""
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=150
        )
        improved_prompt = response.choices[0].message.content.strip()
        logger.info(f"Rewritten prompt: {improved_prompt}")
        return improved_prompt
    except Exception as e:
        logger.error(f"Error rewriting prompt: {str(e)}")
        return None 