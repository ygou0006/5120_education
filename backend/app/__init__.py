import os

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from app.config import settings

db = SQLAlchemy()

def create_app():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    static_dir = os.path.join(base_dir, 'static')
    
    app = Flask(__name__)
    
    app.config['SECRET_KEY'] = settings.secret_key
    app.config['SQLALCHEMY_DATABASE_URI'] = settings.database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    @app.errorhandler(415)
    def unsupported_media_type(e):
        return jsonify({"detail": "Unsupported Media Type"}), 415
    
    db.init_app(app)
    
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
    
    from app.api import auth, courses, interests, careers, match, favorites, compare, explorations, admin
    
    app.register_blueprint(auth.bp, url_prefix='/api/auth')
    app.register_blueprint(courses.bp, url_prefix='/api/courses')
    app.register_blueprint(interests.bp, url_prefix='/api/interests')
    app.register_blueprint(careers.bp, url_prefix='/api/careers')
    app.register_blueprint(match.bp, url_prefix='/api/match')
    app.register_blueprint(favorites.bp, url_prefix='/api/favorites')
    app.register_blueprint(compare.bp, url_prefix='/api/compare')
    app.register_blueprint(explorations.bp, url_prefix='/api/explorations')
    app.register_blueprint(explorations.bp_session, url_prefix='/api/session')
    app.register_blueprint(admin.bp, url_prefix='/api/admin')
    
    @app.route('/')
    def index():
        return send_from_directory(static_dir, 'index.html')
    
    @app.route('/favicon.svg')
    def favicon():
        return send_from_directory(static_dir, 'favicon.svg')
    
    @app.route('/icons.svg')
    def icons():
        return send_from_directory(static_dir, 'icons.svg')
    
    @app.route('/health')
    def health_check():
        return {"status": "healthy"}

    @app.route('/<path:path>')
    def handle_spa(path):
        if path.startswith('api/'):
            return {"message": "Not Found"}, 404

        static_extensions = ['.js', '.css', '.svg', '.png', '.jpg', '.jpeg', '.ico', '.woff', '.woff2', '.ttf', '.eot']
        if path.startswith('static/'):
            file_path = path[7:]
        elif any(path.endswith(ext) for ext in static_extensions):
            file_path = path
        else:
            return send_from_directory(static_dir, 'index.html')
        
        try:
            return send_from_directory(static_dir, file_path)
        except:
            return send_from_directory(static_dir, 'index.html')

    return app
