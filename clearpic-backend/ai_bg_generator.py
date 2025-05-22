import replicate
import os
import requests
import numpy as np
import cv2
from dotenv import load_dotenv

# ✅ Load .env values
load_dotenv()

def get_replicate_token():
    token = os.getenv("REPLICATE_API_TOKEN")
    if not token:
        raise ValueError(
            "REPLICATE_API_TOKEN not found. Please set it in your .env file. "
            "You can get your token from https://replicate.com/account"
        )
    return token

def generate_ai_background(prompt: str) -> str:
    try:
        token = get_replicate_token()
        os.environ["REPLICATE_API_TOKEN"] = token
        
        # Run the model and wait for the result
        output = replicate.run(
            "stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4",
            input={
                "prompt": prompt,
                "width": 768,
                "height": 768,
                "num_outputs": 1,
                "scheduler": "K_EULER",
                "num_inference_steps": 50,
                "guidance_scale": 7.5,
                "prompt_strength": 0.8
            }
        )
        
        # The output is a list of URLs, we want the first one
        if isinstance(output, list) and len(output) > 0:
            return output[0]
        else:
            raise Exception("No image URL returned from Replicate API")
            
    except ValueError as e:
        raise ValueError(str(e))
    except Exception as e:
        raise Exception(f"Failed to generate background: {str(e)}")

def compose_subject_on_background(subject_path: str, background_path: str) -> str:
    try:
        # Read the images
        subject = cv2.imread(subject_path, cv2.IMREAD_UNCHANGED)
        background = cv2.imread(background_path, cv2.IMREAD_COLOR)

        if subject is None or background is None:
            raise Exception("Failed to read input images")

        # Resize background to match subject dimensions
        background = cv2.resize(background, (subject.shape[1], subject.shape[0]))

        # Get alpha channel
        if subject.shape[2] == 4:
            alpha = subject[:, :, 3] / 255.0
        else:
            # If no alpha channel, create one from the subject
            gray = cv2.cvtColor(subject, cv2.COLOR_BGR2GRAY)
            _, alpha = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY)
            alpha = alpha / 255.0

        # Expand alpha to 3 channels
        alpha = np.expand_dims(alpha, axis=-1)
        alpha = np.repeat(alpha, 3, axis=-1)

        # Blend
        subject_rgb = subject[:, :, :3]
        composite = (1 - alpha) * background + alpha * subject_rgb
        composite = composite.astype(np.uint8)

        # Save the result
        result_path = "result.png"
        cv2.imwrite(result_path, composite)
        return result_path
    except Exception as e:
        raise Exception(f"Failed to compose image: {str(e)}")
