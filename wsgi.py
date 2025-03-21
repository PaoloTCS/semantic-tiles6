import os
import sys
# Add the backend folder to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))
from app import create_app

# Create the Flask app instance
app = create_app(os.getenv('FLASK_ENV', 'production'))
