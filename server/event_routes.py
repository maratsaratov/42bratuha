from typing import Optional
from flask import request, jsonify
from models import db, Event, User, EventLocation, EventType, Role, ParticipantRoleEnum, Notification, Participation 
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_, and_ 
from datetime import datetime, timedelta, timezone
import logging
import os
import uuid
from werkzeug.utils import secure_filename
from config import Config

logger = logging.getLogger(__name__)

def _delete_image_file(image_url: Optional[str]):
    if not image_url: return
    try:
        filename = os.path.basename(image_url)
        filepath = os.path.join(Config.UPLOAD_FOLDER, filename)
        if os.path.exists(filepath):
            os.remove(filepath)
            logger.info(f"Deleted image file: {filepath}")
        else:
            logger.warning(f"Attempted to delete non-existent file: {filepath}")
    except Exception as e:
        logger.error(f"Error deleting image file for url {image_url}: {e}", exc_info=True)

def parse_datetime(date_string: Optional[str]) -> Optional[datetime]:
    if not date_string: return None
    try:
        return datetime.fromisoformat(date_string.replace('Z', '+00:00'))
    except (ValueError, TypeError) as e:
        logger.warning(f"Could not parse datetime string: '{date_string}'. Error: {e}")
        return None

def get_user_or_404(user_id):
    user = User.query.get(user_id)
    if not user:
        logger.warning(f"User with ID {user_id} not found.")
    return user

def check_admin_role(user_id):
    user = get_user_or_404(user_id)
    if not user or not user.is_admin:
        return False
    return True

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

def register_event_routes(app, socketio):
    
    @app.route('/api/events', methods=['GET'])
    @jwt_required()
    def get_events():
        try:
            current_user_id = get_jwt_identity() 
            query = Event.query
            now_utc = datetime.now(timezone.utc)

            status_param = request.args.get('status', 'active') 
            
            if status_param == 'active':
                query = query.filter(
                    Event.is_archived == False,
                    or_(
                        and_(Event.end_datetime.is_(None), Event.start_datetime >= now_utc),
                        Event.end_datetime >= now_utc,
                        and_(Event.start_datetime <= now_utc, Event.end_datetime >= now_utc) 
                    )
                )
            elif status_param == 'archive':
                query = query.filter(
                    or_(
                        Event.is_archived == True,
                        and_(
                            Event.is_archived == False,
                            or_(
                                and_(Event.end_datetime.is_(None), Event.start_datetime < now_utc),
                                Event.end_datetime < now_utc
                            )
                        )
                    )
                )

            start_date_str = request.args.get('startDate')
            end_date_str = request.args.get('endDate')
            role_str = request.args.get('role')
            location_str = request.args.get('location')
            type_str = request.args.get('type')
            search_term = request.args.get('search')

            if search_term:
                search_pattern = f"%{search_term}%"
                query = query.filter(or_(Event.title.ilike(search_pattern), Event.description.ilike(search_pattern)))
            
            if start_date_str:
                start_date_utc = parse_datetime(start_date_str)
                if start_date_utc:
                    query = query.filter(Event.start_datetime >= start_date_utc)
            if end_date_str:
                end_date_utc = parse_datetime(end_date_str)
                if end_date_utc:
                   end_date_utc_eod = datetime(end_date_utc.year, end_date_utc.month, end_date_utc.day, 23, 59, 59, 999999, tzinfo=timezone.utc)
                   query = query.filter(Event.start_datetime <= end_date_utc_eod)
                   
            if role_str:
                try:
                    role_enum = ParticipantRoleEnum(role_str)
                    query = query.join(Event.roles).filter(Role.name == role_enum)
                except ValueError: 
                    logger.warning(f"Invalid role filter value: {role_str}")
            if location_str:
                try:
                    location_enum = EventLocation(location_str)
                    query = query.filter(Event.location == location_enum)
                except ValueError: 
                    logger.warning(f"Invalid location filter value: {location_str}")
            if type_str:
                try:
                    type_enum = EventType(type_str)
                    query = query.filter(Event.event_type == type_enum)
                except ValueError: 
                    logger.warning(f"Invalid type filter value: {type_str}")

            if status_param == 'archive':
                query = query.order_by(Event.start_datetime.desc())
            else:
                query = query.order_by(Event.start_datetime.asc())

            events = query.all()
            
            events_data = []
            for event in events:
                event_dict = event.to_dict()
                participation = Participation.query.filter_by(user_id=current_user_id, event_id=event.id).first()
                event_dict['is_participating'] = True if participation else False
                events_data.append(event_dict)

            return jsonify(events_data), 200
            
        except Exception as e:
            logger.error(f"Error fetching events: {e}", exc_info=True)
            return jsonify({"error": "Не удалось загрузить мероприятия"}), 500

    @app.route('/api/events/<int:event_id>', methods=['GET'])
    @jwt_required()
    def get_event(event_id):
        try:
            current_user_id = get_jwt_identity() 
            event = Event.query.get(event_id)
            if event: 
                event_dict = event.to_dict()
                participation = Participation.query.filter_by(user_id=current_user_id, event_id=event_id).first()
                event_dict['is_participating'] = True if participation else False
                return jsonify(event_dict), 200
            else: 
                return jsonify({"error": "Мероприятие не найдено"}), 404
        except Exception as e:
            logger.error(f"Error fetching event {event_id}: {e}", exc_info=True)
            return jsonify({"error": "Ошибка сервера"}), 500

    @app.route('/api/events', methods=['POST'])
    @jwt_required()
    def create_event():
        current_user_id = get_jwt_identity()
        user = get_user_or_404(current_user_id)
        if not user or not user.is_admin: return jsonify({"error": "Требуются права администратора"}), 403
        data = request.get_json()
        if not data: return jsonify({"error": "Нет данных"}), 400
        required_fields = ['title', 'description', 'start_datetime', 'location', 'event_type', 'roles_available']
        if not all(field in data and data[field] for field in required_fields):
            missing = [f for f in required_fields if f not in data or not data[f]]
            return jsonify({"error": f"Не все обязательные поля заполнены: {', '.join(missing)}"}), 400
        
        try:
            start_dt_utc = parse_datetime(data['start_datetime'])
            end_dt_utc = parse_datetime(data.get('end_datetime'))
            if not start_dt_utc: return jsonify({"error": "Неверный формат или отсутствует дата начала"}), 400
            if data.get('end_datetime') and not end_dt_utc: return jsonify({"error": "Неверный формат даты окончания"}), 400
            if end_dt_utc and start_dt_utc and end_dt_utc < start_dt_utc: return jsonify({"error": "Дата окончания не может быть раньше даты начала"}), 400
            
            role_objects = []
            if isinstance(data['roles_available'], list):
                role_enums = [ParticipantRoleEnum(val) for val in data['roles_available']]
                role_objects = Role.query.filter(Role.name.in_(role_enums)).all()
                if len(role_objects) != len(data['roles_available']):
                    return jsonify({"error": "Одна или несколько ролей не найдены в базе данных."}), 400
            else: 
                return jsonify({"error": "'roles_available' должно быть списком строк ролей"}), 400
            if not role_objects: 
                return jsonify({"error": "Необходимо указать хотя бы одну роль"}), 400

            new_event = Event(
                title=data['title'], description=data['description'], start_datetime=start_dt_utc,
                end_datetime=end_dt_utc, location=EventLocation(data['location']), 
                location_details=data.get('location_details'), event_type=EventType(data['event_type']),
                registration_link_participant=data.get('registration_link_participant'),
                registration_link_volunteer=data.get('registration_link_volunteer'),
                registration_link_organizer=data.get('registration_link_organizer'), author_id=current_user_id,
                is_archived=False, 
                archived_at=None 
            )
            new_event.roles = role_objects
            
            db.session.add(new_event)
            db.session.commit() 
            logger.info(f"Event '{new_event.title}' (ID: {new_event.id}) created by user {current_user_id}")

            try:
                socketio.emit('new_event_added', {
                    'eventId': new_event.id,
                    'eventTitle': new_event.title,
                })
                logger.info(f"Socket.IO 'new_event_added' emitted for event {new_event.id}")

                users_to_notify_in_db = User.query.filter_by(is_admin=False, notifications_enabled=True).all()
                logger.info(f"Found {len(users_to_notify_in_db)} non-admin users with notifications enabled for DB saving.")

                if users_to_notify_in_db:
                    notification_message = f"Добавлено новое мероприятие: «{new_event.title}»"
                    notifications_to_add = []
                    for user_to_notify in users_to_notify_in_db:
                        existing_notification = Notification.query.filter(
                            Notification.user_id == user_to_notify.id,
                            Notification.event_id == new_event.id,
                            Notification.message == notification_message,
                            Notification.created_at > (datetime.now(timezone.utc) - timedelta(minutes=5)) 
                        ).first()

                        if not existing_notification:
                            notification = Notification(
                                user_id=user_to_notify.id,
                                message=notification_message,
                                event_id=new_event.id
                            )
                            notifications_to_add.append(notification)
                        else:
                            logger.debug(f"Skipping duplicate DB notification for user {user_to_notify.id} for new event {new_event.id}.")
                    
                    if notifications_to_add:
                        db.session.add_all(notifications_to_add)
                        db.session.commit() 
                        logger.info(f"Created {len(notifications_to_add)} DB notifications for new event {new_event.id}")
                else:
                    logger.info("No non-admin users with notifications enabled to create DB notifications for.")

            except Exception as e:
                logger.error(f"Failed to process notifications for new event {new_event.id}: {e}", exc_info=True)
                db.session.rollback() 

            return jsonify(new_event.to_dict()), 201
            
        except (ValueError, TypeError) as e:
            db.session.rollback() 
            return jsonify({"error": f"Недопустимое значение или тип данных: {e}"}), 400
        except Exception as e:
            db.session.rollback() 
            logger.error(f"Error creating event: {e}", exc_info=True)
            return jsonify({"error": "Ошибка при создании мероприятия"}), 500

    @app.route('/api/events/<int:event_id>', methods=['PUT'])
    @jwt_required()
    def update_event(event_id):
        current_user_id = get_jwt_identity()
        user = get_user_or_404(current_user_id)
        if not user or not user.is_admin: return jsonify({"error": "Требуются права администратора"}), 403
        event = Event.query.get(event_id)
        if not event: return jsonify({"error": "Мероприятие не найдено"}), 404
        data = request.get_json()
        if not data: return jsonify({"error": "Нет данных для обновления"}), 400
        
        try:
            if 'title' in data: event.title = data['title']
            if 'description' in data: event.description = data['description']
            if 'start_datetime' in data:
                 start_dt_utc = parse_datetime(data['start_datetime'])
                 if not start_dt_utc: return jsonify({"error": "Неверный формат даты начала"}), 400
                 event.start_datetime = start_dt_utc
            if 'end_datetime' in data:
                 end_dt_utc = parse_datetime(data['end_datetime'])
                 if data['end_datetime'] and not end_dt_utc: return jsonify({"error": "Неверный формат даты окончания"}), 400
                 event.end_datetime = end_dt_utc
            if event.end_datetime and event.start_datetime and event.end_datetime < event.start_datetime: return jsonify({"error": "Дата окончания не может быть раньше даты начала"}), 400
            if 'location' in data: event.location = EventLocation(data['location'])
            if 'location_details' in data: event.location_details = data.get('location_details')
            if 'event_type' in data: event.event_type = EventType(data['event_type'])
            
            if 'roles_available' in data:
                if isinstance(data['roles_available'], list):
                    role_enums = [ParticipantRoleEnum(val) for val in data['roles_available']]
                    role_objects = Role.query.filter(Role.name.in_(role_enums)).all()
                    if len(role_objects) != len(data['roles_available']):
                        return jsonify({"error": "Одна или несколько ролей не найдены в базе данных."}), 400
                    if not role_objects: 
                        return jsonify({"error": "Необходимо указать хотя бы одну роль"}), 400
                    
                    event.roles = role_objects
                else: 
                    return jsonify({"error": "'roles_available' должно быть списком строк ролей"}), 400
            
            if 'registration_link_participant' in data: event.registration_link_participant = data.get('registration_link_participant')
            if 'registration_link_volunteer' in data: event.registration_link_volunteer = data.get('registration_link_volunteer')
            if 'registration_link_organizer' in data: event.registration_link_organizer = data.get('registration_link_organizer')
            
            if 'is_archived' in data and isinstance(data['is_archived'], bool):
                event.is_archived = data['is_archived']
                if event.is_archived and not event.archived_at:
                    event.archived_at = datetime.now(timezone.utc)
                elif not event.is_archived:
                    event.archived_at = None

            db.session.commit()
            logger.info(f"Event ID {event_id} updated by user {current_user_id}")
            
            return jsonify(event.to_dict()), 200
            
        except (ValueError, TypeError) as e:
            db.session.rollback()
            return jsonify({"error": f"Недопустимое значение или тип данных: {e}"}), 400
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error updating event {event_id}: {e}", exc_info=True)
            return jsonify({"error": "Ошибка при обновлении мероприятия"}), 500

    @app.route('/api/events/<int:event_id>', methods=['DELETE'])
    @jwt_required()
    def delete_event(event_id):
        current_user_id = get_jwt_identity()
        user = get_user_or_404(current_user_id)
        if not user or not user.is_admin: return jsonify({"error": "Требуются права администратора"}), 403
        event = Event.query.get(event_id)
        if not event: return jsonify({"error": "Мероприятие не найдено"}), 404
        try:
            image_to_delete = event.image_url
            db.session.delete(event)
            db.session.commit()
            _delete_image_file(image_to_delete)
            logger.info(f"Event ID {event_id} HARD DELETED by user {current_user_id}")
            return jsonify({"message": "Мероприятие успешно удалено навсегда"}), 200
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error hard deleting event {event_id}: {e}", exc_info=True)
            return jsonify({"error": "Ошибка при удалении мероприятия"}), 500

    @app.route('/api/events/<int:event_id>/archive', methods=['POST'])
    @jwt_required()
    def archive_event(event_id):
        current_user_id = get_jwt_identity()
        user = get_user_or_404(current_user_id)
        if not user or not user.is_admin: return jsonify({"error": "Требуются права администратора"}), 403
        
        event = Event.query.get(event_id)
        if not event: return jsonify({"error": "Мероприятие не найдено"}), 404
        
        if event.is_archived:
            return jsonify({"message": "Мероприятие уже в архиве"}), 200

        try:
            event.is_archived = True
            event.archived_at = datetime.now(timezone.utc)
            db.session.commit()
            logger.info(f"Event ID {event_id} archived by user {current_user_id}")
            return jsonify(event.to_dict()), 200
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error archiving event {event_id}: {e}", exc_info=True)
            return jsonify({"error": "Ошибка при архивировании мероприятия"}), 500

    @app.route('/api/events/<int:event_id>/restore', methods=['POST'])
    @jwt_required()
    def restore_event(event_id):
        current_user_id = get_jwt_identity()
        user = get_user_or_404(current_user_id)
        if not user or not user.is_admin: return jsonify({"error": "Требуются права администратора"}), 403
        
        event = Event.query.get(event_id)
        if not event: return jsonify({"error": "Мероприятие не найдено"}), 404
        
        if not event.is_archived and (event.end_datetime is None or event.end_datetime >= datetime.now(timezone.utc)):
             return jsonify({"message": "Мероприятие уже активно"}), 200
        
        try:
            event.is_archived = False
            event.archived_at = None
            db.session.commit()
            logger.info(f"Event ID {event_id} restored by user {current_user_id}")
            return jsonify(event.to_dict()), 200
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error restoring event {event_id}: {e}", exc_info=True)
            return jsonify({"error": "Ошибка при восстановлении мероприятия"}), 500

    @app.route('/api/events/<int:event_id>/upload_image', methods=['POST'])
    @jwt_required()
    def upload_event_image(event_id):
        current_user_id = get_jwt_identity()
        if not check_admin_role(current_user_id):
            return jsonify({"error": "Требуются права администратора"}), 403
        event = Event.query.get(event_id)
        if not event:
            return jsonify({"error": "Мероприятие не найдено"}), 404
        if 'image' not in request.files:
            return jsonify({"error": "Файл не найден в запросе"}), 400
        file = request.files['image']
        if file.filename == '':
            return jsonify({"error": "Файл не выбран"}), 400
        if file and allowed_file(file.filename):
            try:
                old_image_url = event.image_url
                if not os.path.exists(Config.UPLOAD_FOLDER):
                    os.makedirs(Config.UPLOAD_FOLDER)
                filename = secure_filename(file.filename)
                ext = filename.rsplit('.', 1)[1].lower()
                unique_filename = f"{uuid.uuid4().hex}.{ext}"
                filepath = os.path.join(Config.UPLOAD_FOLDER, unique_filename)
                file.save(filepath)
                event.image_url = f"/uploads/{unique_filename}"
                db.session.commit()
                _delete_image_file(old_image_url)
                logger.info(f"Image uploaded for event {event_id} by user {current_user_id}. Path: {event.image_url}")
                return jsonify(event.to_dict()), 200
            except Exception as e:
                db.session.rollback()
                logger.error(f"Error uploading image for event {event_id}: {e}", exc_info=True)
                return jsonify({"error": "Ошибка при сохранении файла"}), 500
        else:
            return jsonify({"error": "Недопустимый тип файла"}), 400

    @app.route('/api/events/<int:event_id>/image', methods=['DELETE'])
    @jwt_required()
    def delete_event_image(event_id):
        current_user_id = get_jwt_identity()
        if not check_admin_role(current_user_id):
            return jsonify({"error": "Требуются права администратора"}), 403
            
        event = Event.query.get(event_id)
        if not event:
            return jsonify({"error": "Мероприятие не найдено"}), 404

        if not event.image_url:
            return jsonify({"message": "У мероприятия нет изображения для удаления."}), 200
            
        try:
            image_to_delete = event.image_url
            event.image_url = None
            db.session.commit()
            _delete_image_file(image_to_delete)
            logger.info(f"Image deleted for event {event_id} by user {current_user_id}")
            return jsonify(event.to_dict()), 200
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error deleting image for event {event_id}: {e}", exc_info=True)
            return jsonify({"error": "Ошибка при удалении изображения"}), 500