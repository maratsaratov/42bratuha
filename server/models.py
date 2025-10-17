from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from datetime import datetime, timezone
import enum

db = SQLAlchemy()
bcrypt = Bcrypt()

class EventLocation(enum.Enum):
    CENTRAL = "Центральный кампус"
    EAST = "Восточный кампус"
    KPITIP = "КПИТиП"
    LAW = "Юридический корпус"
    OTHER = "Другое"

class EventType(enum.Enum):
    SOCIAL = "Общественное"
    CULTURAL = "Культурно-творческое",
    SPORTS = "Спортивное"
    EDUCATIONAL = "Просветительское"
    OTHER = "Другое"

class ParticipantRoleEnum(enum.Enum):
    PARTICIPANT = "Участник"
    VOLUNTEER = "Волонтёр"
    ORGANIZER = "Организатор"

class Role(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.Enum(ParticipantRoleEnum), unique=True, nullable=False)

    def __repr__(self):
        return f'<Role {self.name.value}>'

event_roles = db.Table('event_roles',
    db.Column('event_id', db.Integer, db.ForeignKey('event.id'), primary_key=True),
    db.Column('role_id', db.Integer, db.ForeignKey('role.id'), primary_key=True)
)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    is_admin = db.Column(db.Boolean, default=False, nullable=False)
    notifications_enabled = db.Column(db.Boolean, default=True, nullable=False)
    authored_events = db.relationship('Event', backref='author', lazy=True, cascade="all, delete-orphan")
    avatar_url = db.Column(db.String(500), nullable=True)
    notifications = db.relationship('Notification', backref='user', lazy='dynamic', cascade="all, delete-orphan")
    participations = db.relationship('Participation', backref='user', lazy='dynamic', cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'is_admin': self.is_admin,
            'avatarUrl': self.avatar_url,
            'notifications_enabled': self.notifications_enabled
        }

    def __repr__(self):
        return f'<User {self.username}>'

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.String(500), nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    event_id = db.Column(db.Integer, db.ForeignKey('event.id', ondelete='CASCADE'), nullable=True)
    event = db.relationship('Event', backref=db.backref('notifications', lazy=True, cascade="all, delete-orphan"))

    def to_dict(self):
        return {
            'id': self.id,
            'message': self.message,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat(),
            'event_id': self.event_id,
            'event_title': self.event.title if self.event else None,
        }

    def __repr__(self):
        return f'<Notification {self.id} for User {self.user_id}>'

class Participation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=False) 
    is_registered = db.Column(db.Boolean, default=True, nullable=False) 
    attended = db.Column(db.Boolean, default=False, nullable=False) 
    registered_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    reminder_sent_at = db.Column(db.DateTime, nullable=True)

    event = db.relationship('Event', backref=db.backref('participations', lazy=True, cascade="all, delete-orphan"))
    role = db.relationship('Role')

    __table_args__ = (db.UniqueConstraint('user_id', 'event_id', name='_user_event_uc'),)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'event_id': self.event_id,
            'event_title': self.event.title,
            'role_name': self.role.name.value,
            'is_registered': self.is_registered,
            'attended': self.attended,
            'registered_at': self.registered_at.isoformat(),
            'event_start_datetime': self.event.start_datetime.isoformat(),
            'event_end_datetime': self.event.end_datetime.isoformat() if self.event.end_datetime else None,
            'event_image_url': self.event.image_url,
            'event_location': self.event.location.value,
            'reminder_sent_at': self.reminder_sent_at.isoformat() if self.reminder_sent_at else None,
        }

    def __repr__(self):
        return f'<Participation User:{self.user_id} Event:{self.event_id}>'

class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    start_datetime = db.Column(db.DateTime, nullable=False)
    end_datetime = db.Column(db.DateTime, nullable=True)
    location = db.Column(db.Enum(EventLocation), nullable=False)
    location_details = db.Column(db.String(200), nullable=True)
    event_type = db.Column(db.Enum(EventType), nullable=False)
    roles = db.relationship(
        'Role', 
        secondary=event_roles,
        lazy='subquery',
        backref=db.backref('events', lazy=True)
    )
    registration_link_participant = db.Column(db.String(500), nullable=True)
    registration_link_volunteer = db.Column(db.String(500), nullable=True)
    registration_link_organizer = db.Column(db.String(500), nullable=True)
    image_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    author_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    notification_sent_at = db.Column(db.DateTime, nullable=True)
    is_archived = db.Column(db.Boolean, default=False, nullable=False, server_default='false')
    archived_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'start_datetime': self.start_datetime.isoformat() if self.start_datetime else None,
            'end_datetime': self.end_datetime.isoformat() if self.end_datetime else None,
            'location': self.location.value if self.location else None,
            'location_details': self.location_details,
            'event_type': self.event_type.value if self.event_type else None,
            'roles_available': [role.name.value for role in self.roles],
            'registration_link_participant': self.registration_link_participant,
            'registration_link_volunteer': self.registration_link_volunteer,
            'registration_link_organizer': self.registration_link_organizer,
            'image_url': self.image_url,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'author_id': self.author_id,
            'author_username': self.author.username if self.author else None,
            'is_archived': self.is_archived,
            'archived_at': self.archived_at.isoformat() if self.archived_at else None
        }

    def __repr__(self):
        return f'<Event {self.title}>'