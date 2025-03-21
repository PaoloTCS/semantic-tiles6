# /Users/paolopignatelli/VerbumTechnologies/Verbum7-Claude/backend/run.py
"""
run.py
Entry point for the Semantic Tiles application.
"""

import os
import sys
import logging
from app import create_app

# Configure basic logging with timestamp
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def get_port():
    """Get and validate port number from environment."""
    try:
        port = int(os.getenv('PORT', 5001))
        if not (1024 <= port <= 65535):
            logger.warning(f"Port {port} out of range, using default 5001")
            return 5001
        return port
    except ValueError:
        logger.error("Invalid PORT environment variable")
        return 5001

def get_environment():
    """Get and validate environment configuration."""
    env = os.getenv('FLASK_ENV', 'development')
    valid_environments = ['development', 'testing', 'production']
    if env not in valid_environments:
        logger.warning(f"Invalid environment '{env}' specified, defaulting to development")
        return 'development'
    return env

def check_prerequisites():
    """Check if all prerequisites are met to run the application."""
    if not os.getenv('OPENAI_API_KEY'):
        logger.warning("OPENAI_API_KEY not found in environment variables. "
                      "Some semantic features will not work.")

if __name__ == '__main__':
    try:
        check_prerequisites()
        env = get_environment()
        port = get_port()
        
        # Create and configure the application instance
        app = create_app(env)
        app.run(host='0.0.0.0', port=port, debug=(env == 'development'))
        
    except Exception as e:
        logger.error(f"Failed to start application: {str(e)}")
        sys.exit(1)