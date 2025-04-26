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
    CULTURAL = "Культурно-творческое"
    SPORTS = "Спортивное"
    EDUCATIONAL = "Просветительское"
    OTHER = "Другое"

class ParticipantRole(enum.Enum):
    PARTICIPANT = "Участник"
    VOLUNTEER = "Волонтёр"
    ORGANIZER = "Организатор"

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    is_admin = db.Column(db.Boolean, default=False, nullable=False)

    authored_events = db.relationship('Event', backref='author', lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'

class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    start_datetime = db.Column(db.DateTime, nullable=False)
    end_datetime = db.Column(db.DateTime, nullable=True)
    location = db.Column(db.Enum(EventLocation), nullable=False)
    location_details = db.Column(db.String(200), nullable=True)
    event_type = db.Column(db.Enum(EventType), nullable=False)
    roles_available = db.Column(db.String(150), nullable=False)

    registration_link_participant = db.Column(db.String(500), nullable=True)
    registration_link_volunteer = db.Column(db.String(500), nullable=True)
    registration_link_organizer = db.Column(db.String(500), nullable=True)

    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    author_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def get_roles_list(self):
        return self.roles_available.split(',') if self.roles_available else []

    def set_roles_list(self, roles):
        self.roles_available = ','.join(role.value for role in roles if isinstance(role, ParticipantRole))

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
            'roles_available': self.get_roles_list(),
            'registration_link_participant': self.registration_link_participant,
            'registration_link_volunteer': self.registration_link_volunteer,
            'registration_link_organizer': self.registration_link_organizer,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'author_id': self.author_id,
            'author_username': self.author.username if self.author else None
        }

    def __repr__(self):
        return f'<Event {self.title}>'