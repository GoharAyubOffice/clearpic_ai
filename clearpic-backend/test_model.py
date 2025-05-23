import sys
import os

# Add the current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

# Try importing the model
try:
    from model.u2net import U2NET
    print("✅ Successfully imported U2NET model")
except ImportError as e:
    print(f"❌ Failed to import U2NET model: {str(e)}")
    print("\nCurrent Python path:")
    for path in sys.path:
        print(f"- {path}")
    print("\nCurrent directory contents:")
    for item in os.listdir(current_dir):
        print(f"- {item}")
    if os.path.exists(os.path.join(current_dir, 'model')):
        print("\nModel directory contents:")
        for item in os.listdir(os.path.join(current_dir, 'model')):
            print(f"- {item}")
    sys.exit(1)

# Try loading the model
try:
    model = U2NET(3, 1)
    print("✅ Successfully created U2NET model instance")
except Exception as e:
    print(f"❌ Failed to create model instance: {str(e)}")
    sys.exit(1)

print("\n✅ All tests passed! The model is working correctly.") 