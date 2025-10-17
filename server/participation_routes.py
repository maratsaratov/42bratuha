from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError
from sqlalchemy import and_, or_
from datetime import datetime, timezone
import logging

from models import db, User, Event, Participation, Role, ParticipantRoleEnum, Notification

logger = logging.getLogger(__name__)

def get_user_or_404(user_id):
    user = User.query.get(user_id)
    if not user:
        logger.warning(f"User with ID {user_id} not found.")
    return user

def register_participation_routes(app):

    @app.route('/api/events/<int:event_id>/participate', methods=['POST'])
    @jwt_required()
    def participate_in_event(event_id):
        current_user_id = get_jwt_identity()
        user = get_user_or_404(current_user_id)
        if not user:
            return jsonify({"error": "Пользователь не найден"}), 404

        event = Event.query.get(event_id)
        if not event:
            return jsonify({"error": "Мероприятие не найдено"}), 404
        
        participant_role = Role.query.filter_by(name=ParticipantRoleEnum.PARTICIPANT).first()
        if not participant_role:
            logger.error("Participant role not found in database. Please run 'flask init-db'.")
            return jsonify({"error": "Не удалось определить роль участника. Обратитесь к администратору."}), 500

        try:
            existing_participation = Participation.query.filter_by(user_id=current_user_id, event_id=event_id).first()
            if existing_participation:
                return jsonify({"message": "Вы уже записаны на это мероприятие."}), 200 

            new_participation = Participation(
                user_id=current_user_id,
                event_id=event_id,
                role_id=participant_role.id,
                is_registered=True,
                attended=False, 
                registered_at=datetime.now(timezone.utc),
                reminder_sent_at=None
            )
            db.session.add(new_participation)
            db.session.commit()
            logger.info(f"User {current_user_id} successfully registered for event {event_id}.")
            return jsonify({"message": "Вы успешно записались на мероприятие!"}), 201
        except IntegrityError:
            db.session.rollback()
            return jsonify({"error": "Вы уже записаны на это мероприятие."}), 409
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error registering user {current_user_id} for event {event_id}: {e}", exc_info=True)
            return jsonify({"error": "Ошибка при записи на мероприятие."}), 500

    @app.route('/api/events/<int:event_id>/participate', methods=['DELETE'])
    @jwt_required()
    def unparticipate_in_event(event_id):
        current_user_id = get_jwt_identity()
        user = get_user_or_404(current_user_id)
        if not user:
            return jsonify({"error": "Пользователь не найден"}), 404

        participation = Participation.query.filter_by(user_id=current_user_id, event_id=event_id).first()
        if not participation:
            return jsonify({"error": "Вы не были записаны на это мероприятие."}), 404

        try:
            db.session.delete(participation)
            db.session.commit()
            logger.info(f"User {current_user_id} successfully unregistered from event {event_id}.")
            return jsonify({"message": "Вы отменили запись на мероприятие."}), 200
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error unregistering user {current_user_id} from event {event_id}: {e}", exc_info=True)
            return jsonify({"error": "Ошибка при отмене записи."}), 500

    @app.route('/api/me/participations', methods=['GET'])
    @jwt_required()
    def get_user_participations():
        current_user_id = get_jwt_identity()
        user = get_user_or_404(current_user_id)
        if not user:
            return jsonify({"error": "Пользователь не найден"}), 404
        
        now_utc = datetime.now(timezone.utc)
        
        status_param = request.args.get('status', 'all') 

        query = user.participations.join(Event) 
        
        if status_param == 'upcoming':
            query = query.filter(Event.start_datetime >= now_utc)
        elif status_param == 'past':
            query = query.filter(
                or_(
                    and_(Event.end_datetime.is_(None), Event.start_datetime < now_utc),
                    Event.end_datetime < now_utc
                )
            )
        
        query = query.filter(Participation.is_registered == True)

        if status_param == 'past':
            query = query.order_by(Event.start_datetime.desc())
        else:
            query = query.order_by(Event.start_datetime.asc())


        participations = query.all()

        participations_data = [p.to_dict() for p in participations]
        return jsonify(participations_data), 200

    @app.route('/api/me/participations/count', methods=['GET'])
    @jwt_required()
    def get_user_participations_count():
        current_user_id = get_jwt_identity()
        user = get_user_or_404(current_user_id)
        if not user:
            return jsonify({"error": "Пользователь не найден"}), 404
        
        now_utc = datetime.now(timezone.utc)
        
        total_registered = user.participations.filter_by(is_registered=True).count()

        attended_events_count = user.participations.join(Event).filter(
            Participation.is_registered == True,
            or_(
                and_(Event.end_datetime.is_(None), Event.start_datetime < now_utc),
                Event.end_datetime < now_utc
            )
        ).count()


        return jsonify({
            "total_participated": total_registered,
            "attended_events": attended_events_count
        }), 200