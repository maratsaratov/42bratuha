from flask import request, jsonify
from models import db, User
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import logging
import os
import uuid
from werkzeug.utils import secure_filename
from config import Config
from event_routes import _delete_image_file, allowed_file

logger = logging.getLogger(__name__)

def register_auth_routes(app):

    @app.route('/api/register', methods=['POST'])
    def register():
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        confirm_password = data.get('confirm_password')

        if not username or not email or not password or not confirm_password:
            return jsonify({"error": "Все поля обязательны"}), 400

        if password != confirm_password:
            return jsonify({"error": "Пароли не совпадают"}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Email уже используется"}), 409

        if User.query.filter_by(username=username).first():
            return jsonify({"error": "Имя пользователя уже используется"}), 409

        try:
            new_user = User(username=username, email=email)
            new_user.set_password(password)
            db.session.add(new_user)
            db.session.commit()
            logger.info(f"User registered: {username} ({email})")
            return jsonify({"message": "Пользователь успешно зарегистрирован"}), 201
        except Exception as e:
            db.session.rollback()
            logger.error(f"Ошибка регистрации пользователя {username}: {e}", exc_info=True)
            return jsonify({"error": "Ошибка регистрации"}), 500


    @app.route('/api/login', methods=['POST'])
    def login():
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({"error": "Email и пароль обязательны"}), 400

        user = User.query.filter_by(email=email).first()

        if user and user.check_password(password):
            access_token = create_access_token(identity=str(user.id))
            logger.info(f"User logged in: {user.username} ({email})")
            return jsonify(
                access_token=access_token,
                user=user.to_dict()
            ), 200
        else:
            logger.warning(f"Failed login attempt for email: {email}")
            return jsonify({"error": "Неверный email или пароль"}), 401

    @app.route('/api/me', methods=['GET', 'PUT'])
    @jwt_required()
    def handle_me():
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
             logger.warning(f"/api/me called with invalid identity: {current_user_id}")
             return jsonify({"error": "Пользователь не найден"}), 404

        if request.method == 'GET':
            return jsonify(user=user.to_dict()), 200
        
        if request.method == 'PUT':
            data = request.get_json()
            if not data:
                return jsonify({"error": "Нет данных для обновления"}), 400

            try:
                if 'username' in data and data['username'] != user.username:
                    existing_user = User.query.filter(User.username == data['username'], User.id != user.id).first()
                    if existing_user:
                        return jsonify({"error": "Имя пользователя уже занято"}), 409
                    user.username = data['username']

                if 'email' in data and data['email'] != user.email:
                    existing_user = User.query.filter(User.email == data['email'], User.id != user.id).first()
                    if existing_user:
                        return jsonify({"error": "Этот email уже используется"}), 409
                    user.email = data['email']
                
                db.session.commit()
                logger.info(f"User profile updated for user ID: {user.id}")
                return jsonify(user=user.to_dict()), 200

            except Exception as e:
                db.session.rollback()
                logger.error(f"Error updating profile for user {user.id}: {e}", exc_info=True)
                return jsonify({"error": "Ошибка сервера при обновлении профиля"}), 500
    
    @app.route('/api/me/avatar', methods=['POST'])
    @jwt_required()
    def upload_avatar():
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({"error": "Пользователь не найден"}), 404
        
        if 'avatar' not in request.files:
            return jsonify({"error": "Файл аватара не найден в запросе"}), 400
        
        file = request.files['avatar']

        if file.filename == '':
            return jsonify({"error": "Файл не выбран"}), 400

        if file and allowed_file(file.filename):
            try:
                old_avatar_url = user.avatar_url
                
                if not os.path.exists(Config.UPLOAD_FOLDER):
                    os.makedirs(Config.UPLOAD_FOLDER)
                
                filename = secure_filename(file.filename)
                ext = filename.rsplit('.', 1)[1].lower()
                unique_filename = f"avatar-{user.id}-{uuid.uuid4().hex}.{ext}"
                filepath = os.path.join(Config.UPLOAD_FOLDER, unique_filename)
                
                file.save(filepath)
                
                user.avatar_url = f"/uploads/{unique_filename}"
                db.session.commit()
                
                _delete_image_file(old_avatar_url)
                
                logger.info(f"Avatar uploaded for user {user.id}. New path: {user.avatar_url}")
                return jsonify(user=user.to_dict()), 200

            except Exception as e:
                db.session.rollback()
                logger.error(f"Error uploading avatar for user {user.id}: {e}", exc_info=True)
                return jsonify({"error": "Ошибка при сохранении файла"}), 500
        else:
            return jsonify({"error": "Недопустимый тип файла"}), 400

    @app.route('/api/me/change-password', methods=['POST'])
    @jwt_required()
    def change_password():
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({"error": "Пользователь не найден"}), 404

        data = request.get_json()
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({"error": "Необходимо указать текущий и новый пароли"}), 400
            
        if not user.check_password(current_password):
            return jsonify({"error": "Неверный текущий пароль"}), 403

        if len(new_password) < 6:
            return jsonify({"error": "Новый пароль должен содержать не менее 6 символов"}), 400

        try:
            user.set_password(new_password)
            db.session.commit()
            logger.info(f"Password changed successfully for user ID: {user.id}")
            return jsonify({"message": "Пароль успешно изменен"}), 200
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error changing password for user {user.id}: {e}", exc_info=True)
            return jsonify({"error": "Ошибка сервера при смене пароля"}), 500

    @app.route('/api/me/settings', methods=['PUT'])
    @jwt_required()
    def update_user_settings():
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({"error": "Пользователь не найден"}), 404

        data = request.get_json()
        if not data:
            return jsonify({"error": "Нет данных для обновления"}), 400
        
        try:
            if 'notifications_enabled' in data and isinstance(data['notifications_enabled'], bool):
                user.notifications_enabled = data['notifications_enabled']

            db.session.commit()
            logger.info(f"User settings updated for user ID: {user.id}. Notifications enabled: {user.notifications_enabled}")
            return jsonify(user=user.to_dict()), 200

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error updating settings for user {user.id}: {e}", exc_info=True)
            return jsonify({"error": "Ошибка сервера при обновлении настроек"}), 500