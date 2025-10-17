import logging
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Notification

logger = logging.getLogger(__name__)

def register_notification_routes(app):

    @app.route('/api/notifications', methods=['GET'])
    @jwt_required()
    def get_notifications():
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({"error": "Пользователь не найден"}), 404
        
        notifications = user.notifications.order_by(Notification.is_read.asc(), Notification.created_at.desc()).all()
        
        return jsonify([n.to_dict() for n in notifications]), 200

    @app.route('/api/notifications/<int:notification_id>/mark-as-read', methods=['POST'])
    @jwt_required()
    def mark_single_notification_as_read(notification_id):
        current_user_id = get_jwt_identity()
        notification = Notification.query.get(notification_id)

        if not notification:
            return jsonify({"error": "Уведомление не найдено"}), 404

        if notification.user_id != int(current_user_id):
            return jsonify({"error": "Доступ запрещен"}), 403

        try:
            if not notification.is_read:
                notification.is_read = True
                db.session.commit()
                logger.info(f"Marked notification {notification_id} as read for user {current_user_id}")
            return jsonify(notification.to_dict()), 200
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error marking notification {notification_id} as read: {e}", exc_info=True)
            return jsonify({"error": "Ошибка сервера"}), 500

    @app.route('/api/notifications/mark-as-read', methods=['POST'])
    @jwt_required()
    def mark_notifications_as_read():
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({"error": "Пользователь не найден"}), 404
            
        try:
            unread_notifications = user.notifications.filter_by(is_read=False).all()
            for notification in unread_notifications:
                notification.is_read = True
            
            db.session.commit()
            logger.info(f"Marked {len(unread_notifications)} notifications as read for user {user.id}")
            return jsonify({"message": "Все уведомления помечены как прочитанные"}), 200
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error marking notifications as read for user {user.id}: {e}", exc_info=True)
            return jsonify({"error": "Ошибка сервера"}), 500