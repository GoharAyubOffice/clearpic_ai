#!/bin/bash

# Create output directory
mkdir -p output

# Install dependencies
pip install -r requirements.txt

# Copy necessary files to output
cp -r main.py output/
cp -r routes output/
cp -r services output/
cp -r U-2-Net output/
cp -r utils output/
cp -r models output/
cp -r middleware output/
cp -r database output/

# Create __init__.py files if they don't exist
touch output/__init__.py
touch output/routes/__init__.py
touch output/services/__init__.py
touch output/utils/__init__.py
touch output/models/__init__.py
touch output/middleware/__init__.py
touch output/database/__init__.py 