import logging
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager, get_jwt_identity, decode_token 
from jwt.exceptions import DecodeError, InvalidTokenError 
from flask_socketio import SocketIO, join_room 
from apscheduler.schedulers.background import BackgroundScheduler
import pytz 
from datetime import datetime, timedelta, timezone 

from config import Config
from auth_routes import register_auth_routes
from models import db, bcrypt, Event, Role, ParticipantRoleEnum, User, Participation, Notification 
from logging_config import setup_logging
from event_routes import register_event_routes
from notification_routes import register_notification_routes
from participation_routes import register_participation_routes 

setup_logging()
logger = logging.getLogger(__name__)

async_mode = 'eventlet'
app = Flask(__name__)
app.config.from_object(Config)

if not app.config.get('SECRET_KEY'):
    logger.error("FLASK_SECRET_KEY не установлен! SocketIO может работать некорректно.")

socketio = SocketIO(app, cors_allowed_origins=Config.CORS_ORIGINS, async_mode=async_mode)

CORS(app, resources={r"/api/*": {"origins": Config.CORS_ORIGINS}}, supports_credentials=True)
db.init_app(app)
bcrypt.init_app(app)
jwt = JWTManager(app)
migrate = Migrate(app, db)

register_auth_routes(app)
register_event_routes(app, socketio)
register_notification_routes(app)
register_participation_routes(app) 

@app.cli.command("init-db")
def init_db_command():
    db.create_all()
    for role_enum in ParticipantRoleEnum:
        if not Role.query.filter_by(name=role_enum).first():
            db.session.add(Role(name=role_enum))
            print(f"Role '{role_enum.value}' created.")
    db.session.commit()
    print("Database initialized and roles populated.")

@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(Config.UPLOAD_FOLDER, filename)

def to_krasnoyarsk_time(dt_utc: datetime) -> datetime:
    krasnoyarsk_tz = pytz.timezone('Asia/Krasnoyarsk')
    if dt_utc.tzinfo is None:
        dt_utc = dt_utc.replace(tzinfo=timezone.utc)
    return dt_utc.astimezone(krasnoyarsk_tz)

def check_upcoming_events():
    with app.app_context():
        now_utc = datetime.now(timezone.utc)
    
        reminder_start_window = now_utc + timedelta(hours=20)
        reminder_end_window = now_utc + timedelta(hours=28)
        
        upcoming_events_general_notify = Event.query.filter(
            Event.start_datetime >= reminder_start_window,
            Event.start_datetime <= reminder_end_window,
            Event.is_archived == False,
            Event.notification_sent_at.is_(None) 
        ).all()

        if upcoming_events_general_notify:
            logger.info(f"Найдены предстоящие события для общего уведомления: {[e.id for e in upcoming_events_general_notify]}")

        for event in upcoming_events_general_notify:
            try:
                local_start_time = to_krasnoyarsk_time(event.start_datetime).strftime('%d.%m.%Y в %H:%M')

                socketio.emit('upcoming_event', { 
                    'eventId': event.id,
                    'title': 'Скоро начнется!',
                    'message': f"Мероприятие '{event.title}' начнется {local_start_time}."
                })
                logger.info(f"Socket.IO 'upcoming_event' emitted for event {event.id}")

                users_for_db_notify = User.query.filter_by(is_admin=False, notifications_enabled=True).all()
                db_notifications = []
                notification_message = f"Напоминание: Мероприятие «{event.title}» начнется {local_start_time}."
                for user_to_notify in users_for_db_notify:
                    existing_general_notification = Notification.query.filter(
                        Notification.user_id == user_to_notify.id,
                        Notification.event_id == event.id,
                        Notification.message == notification_message,
                        Notification.created_at > (now_utc - timedelta(days=2))
                    ).first()

                    if not existing_general_notification:
                        db_notifications.append(Notification(
                            user_id=user_to_notify.id,
                            message=notification_message,
                            event_id=event.id
                        ))
                    else:
                        logger.debug(f"Skipping duplicate general DB notification for user {user_to_notify.id} for event {event.id}.")

                if db_notifications:
                    db.session.add_all(db_notifications)

                event.notification_sent_at = now_utc
                db.session.add(event) 
                db.session.commit() 
                logger.info(f"DB notifications created and event {event.id} marked as notified.")

            except Exception as e:
                 logger.error(f"Ошибка при обработке общего уведомления для события ID {event.id}: {e}", exc_info=True)
                 db.session.rollback() 
                 continue 

        upcoming_participations_to_notify = Participation.query.join(Event).join(User).filter(
            Event.start_datetime >= reminder_start_window,
            Event.start_datetime <= reminder_end_window,
            Event.is_archived == False,
            User.notifications_enabled == True,
            Participation.reminder_sent_at.is_(None)
        ).all()

        if upcoming_participations_to_notify:
            logger.info(f"Найдены предстоящие участия для уведомления: {[p.id for p in upcoming_participations_to_notify]}")

        for participation in upcoming_participations_to_notify:
            event = participation.event
            user_to_notify = participation.user
            
            try:
                local_start_time = to_krasnoyarsk_time(event.start_datetime).strftime('%d.%m.%Y в %H:%M')
                notification_message = f"Напоминание: Мероприятие «{event.title}» начнется {local_start_time}." 
                
                notification = Notification(
                    user_id=user_to_notify.id,
                    message=notification_message,
                    event_id=event.id
                )
                db.session.add(notification)

                participation.reminder_sent_at = now_utc
                db.session.add(participation)

                db.session.commit() 
                logger.info(f"Created DB notification for user {user_to_notify.id} for event {event.id} (participation reminder).")

                socketio.emit('upcoming_event_for_user', {
                    'eventId': event.id,
                    'title': 'Скоро начнется!',
                    'message': notification_message,
                }, room=str(user_to_notify.id)) 
                logger.info(f"Socket.IO 'upcoming_event_for_user' emitted to room {user_to_notify.id} for event {event.id}.")

            except Exception as e:
                db.session.rollback() 
                logger.error(f"Failed to send participation reminder for user {user_to_notify.id} event {event.id}: {e}", exc_info=True)

        logger.info("Checked for all upcoming events and participation notifications.")


scheduler = BackgroundScheduler(daemon=True)
scheduler.add_job(check_upcoming_events, 'interval', minutes=5)
scheduler.start()
logger.info("Планировщик уведомлений запущен.")

@app.context_processor
def inject_user_id():
    try:
        user_id = get_jwt_identity()
        return dict(current_user_id=user_id)
    except Exception:
        return dict(current_user_id=None)

@socketio.on('connect')
def handle_connect():
    logger.info(f'Клиент подключился: {request.sid}')

@socketio.on('disconnect')
def handle_disconnect():
    logger.info(f'Клиент отключился: {request.sid}')

@socketio.on('authenticate_user')
def authenticate_user(data):
    token = data.get('token')
    if not token:
        logger.warning(f"Authentication failed for SID {request.sid}: No token provided in event data.")
        socketio.emit('auth_failure', {'message': 'Authentication failed: No token'}, room=request.sid)
        return

    try:
        decoded_token = decode_token(token)
        user_id = decoded_token['sub'] 
        
        user = User.query.get(user_id)
        if user:
            join_room(str(user.id))
            logger.info(f"User {user.id} joined room {user.id} with SID {request.sid}")
            socketio.emit('auth_success', {'message': 'Authenticated', 'userId': user.id}, room=request.sid)
        else:
            logger.warning(f"Authentication failed for SID {request.sid}: User ID {user_id} not found in DB.")
            socketio.emit('auth_failure', {'message': 'Authentication failed: User not found'}, room=request.sid)
    except (DecodeError, InvalidTokenError) as e:
        logger.warning(f"Authentication failed for SID {request.sid}: Invalid token - {e}")
        socketio.emit('auth_failure', {'message': f'Authentication failed: Invalid token - {e}'}, room=request.sid)
    except Exception as e:
        logger.error(f"Unexpected error during Socket.IO authentication for SID {request.sid}: {e}", exc_info=True)
        socketio.emit('auth_failure', {'message': 'Authentication failed: Server error'}, room=request.sid)

if __name__ == '__main__':
    logger.info("Запуск Flask-SocketIO приложения...")
    socketio.run(app, debug=Config.DEBUG, host='0.0.0.0', port=5000, use_reloader=Config.DEBUG)