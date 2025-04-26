from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from config import Config
from auth_routes import register_auth_routes
from event_routes import register_event_routes
from models import db, bcrypt
from logging_config import setup_logging
import logging

app = Flask(__name__)
app.config.from_object(Config)

setup_logging()
logger = logging.getLogger(__name__)

logger.info(f"JWT Secret Key Loaded: {'YES' if app.config.get('JWT_SECRET_KEY') else 'NO --- PROBLEM!'}")
logger.info(f"Database URI: {app.config.get('SQLALCHEMY_DATABASE_URI')}")
logger.info(f"Debug Mode: {app.config.get('DEBUG')}")


CORS(app, resources={r"/api/*": {"origins": Config.CORS_ORIGINS}}, supports_credentials=True)
db.init_app(app)
bcrypt.init_app(app)
jwt = JWTManager(app)
migrate = Migrate(app, db)


register_auth_routes(app)
register_event_routes(app)

if __name__ == '__main__':
    logger.info("Starting Flask application...")
    app.run(debug=Config.DEBUG, host='0.0.0.0', port=5000)