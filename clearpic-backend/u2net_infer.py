import sys
sys.path.append("./U-2-Net")
from model.u2net import U2NET
import torch
import numpy as np
from PIL import Image
from torchvision import transforms
import cv2
import io

def load_model(model_path='U-2-Net/saved_models/u2net/u2net.pth'):
    net = U2NET(3, 1)
    if torch.cuda.is_available():
        net.load_state_dict(torch.load(model_path))
        net.cuda()
    else:
        net.load_state_dict(torch.load(model_path, map_location='cpu'))
    net.eval()
    return net

def preprocess_image(image_data):
    # Convert bytes to PIL Image
    image = Image.open(io.BytesIO(image_data)).convert('RGB')
    transform = transforms.Compose([
        transforms.Resize((320, 320)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406],
                           [0.229, 0.224, 0.225])
    ])
    return image, transform(image)

def postprocess_mask(mask):
    mask = mask.squeeze().cpu().data.numpy()
    mask = (mask - mask.min()) / (mask.max() - mask.min() + 1e-8)
    mask = (mask * 255).astype(np.uint8)
    return mask

def apply_mask(image_data, mask):
    # Convert bytes to numpy array
    nparr = np.frombuffer(image_data, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    mask = cv2.resize(mask, (image.shape[1], image.shape[0]))
    alpha = mask.astype(float) / 255
    b, g, r = cv2.split(image)
    rgba = [b, g, r, (alpha * 255).astype(np.uint8)]
    result = cv2.merge(rgba, 4)
    
    # Convert result to bytes
    _, buffer = cv2.imencode('.png', result)
    return buffer.tobytes()

def remove_background(image_path: str) -> str:
    try:
        net = load_model()
        
        # Read the image
        image = cv2.imread(image_path)
        if image is None:
            raise Exception("Failed to read input image")
            
        # Preprocess the image
        transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Resize((320, 320)),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        # Convert BGR to RGB
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        image_tensor = transform(Image.fromarray(image_rgb))
        
        if torch.cuda.is_available():
            inputs = image_tensor.unsqueeze(0).cuda()
        else:
            inputs = image_tensor.unsqueeze(0)

        with torch.no_grad():
            d1, *_ = net(inputs)
            mask = d1[:, 0, :, :]
            mask = postprocess_mask(mask)
            
            # Resize mask to original image size
            mask = cv2.resize(mask, (image.shape[1], image.shape[0]))
            
            # Create alpha channel
            alpha = mask.astype(float) / 255
            b, g, r = cv2.split(image)
            rgba = [b, g, r, (alpha * 255).astype(np.uint8)]
            result = cv2.merge(rgba)
            
            # Save the result
            result_path = "result_removed_bg.png"
            cv2.imwrite(result_path, result)
            return result_path
            
    except Exception as e:
        raise Exception(f"Failed to remove background: {str(e)}")
