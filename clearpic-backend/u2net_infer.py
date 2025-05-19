import sys
sys.path.append("./U-2-Net")
from model.u2net import U2NET
import os
import torch
import numpy as np
from PIL import Image
from torchvision import transforms
import cv2



def load_model(model_path='U-2-Net/saved_models/u2net/u2net.pth'):
    net = U2NET(3, 1)
    if torch.cuda.is_available():
        net.load_state_dict(torch.load(model_path))
        net.cuda()
    else:
        net.load_state_dict(torch.load(model_path, map_location='cpu'))
    net.eval()
    return net

def preprocess_image(image_path):
    image = Image.open(image_path).convert('RGB')
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

def apply_mask(image_path, mask, output_path):
    image = cv2.imread(image_path)
    mask = cv2.resize(mask, (image.shape[1], image.shape[0]))
    alpha = mask.astype(float) / 255
    b, g, r = cv2.split(image)
    rgba = [b, g, r, (alpha * 255).astype(np.uint8)]
    result = cv2.merge(rgba, 4)
    cv2.imwrite(output_path, result)

def remove_background(input_path, output_path):
    net = load_model()
    original_img, transformed = preprocess_image(input_path)
    if torch.cuda.is_available():
        inputs = transformed.unsqueeze(0).cuda()
    else:
        inputs = transformed.unsqueeze(0)

    with torch.no_grad():
        d1, *_ = net(inputs)
        mask = d1[:, 0, :, :]
        mask = postprocess_mask(mask)
        apply_mask(input_path, mask, output_path)

    # Optional cleanup
    os.remove(input_path)
