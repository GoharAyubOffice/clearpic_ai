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
        return output[0]
    except ValueError as e:
        raise ValueError(str(e))
    except Exception as e:
        raise Exception(f"Failed to generate background: {str(e)}")

def compose_subject_on_background(subject_image: bytes, background_image: bytes) -> bytes:
    try:
        # Decode subject with alpha
        subject_arr = np.frombuffer(subject_image, np.uint8)
        subject = cv2.imdecode(subject_arr, cv2.IMREAD_UNCHANGED)

        # Decode background (RGB)
        bg_arr = np.frombuffer(background_image, np.uint8)
        background = cv2.imdecode(bg_arr, cv2.IMREAD_COLOR)

        # Resize background
        background = cv2.resize(background, (subject.shape[1], subject.shape[0]))

        # Get alpha channel
        if subject.shape[2] == 4:
            alpha = subject[:, :, 3] / 255.0
        else:
            alpha = np.ones((subject.shape[0], subject.shape[1]))

        alpha = np.expand_dims(alpha, axis=-1)

        # Blend
        subject_rgb = subject[:, :, :3]
        composite = (1 - alpha) * background + alpha * subject_rgb
        composite = composite.astype(np.uint8)

        _, buffer = cv2.imencode('.png', composite)
        return buffer.tobytes()
    except Exception as e:
        raise Exception(f"Failed to compose image: {str(e)}")
