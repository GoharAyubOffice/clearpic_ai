#!/bin/bash

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate

# Install requirements
pip install -r requirements.txt
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install -r U-2-Net/requirements.txt

# Set up model directory
mkdir -p model
cp -r U-2-Net/model/* model/
mkdir -p U-2-Net/saved_models/u2net
cp -r U-2-Net/saved_models/* U-2-Net/saved_models/u2net/
touch model/__init__.py

# Add current directory to PYTHONPATH
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Run the test
python test_model.py 