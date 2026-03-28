from backend import db
from datetime import datetime
import uuid

class GameSession(db.Model):
    __tablename__ = "game_sessions"

    id           = db.Column(db.Integer, primary_key=True)
    session_uuid = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    user_id      = db.Column(db.Integer, db.ForeignKey("users.id"),     nullable=False)
    memoreto_id  = db.Column(db.Integer, db.ForeignKey("memoretos.id"), nullable=False)
    started_at   = db.Column(db.DateTime, default=datetime.utcnow)
    ended_at     = db.Column(db.DateTime, nullable=True)
    completed    = db.Column(db.Boolean,  default=False)

    events = db.relationship("SessionEvent", backref="session", lazy=True)

class SessionEvent(db.Model):
    __tablename__ = "session_events"

    id         = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("game_sessions.id"), nullable=False)
    event_type = db.Column(db.String(64), nullable=False)
    data_json  = db.Column(db.Text, nullable=True)
    timestamp  = db.Column(db.DateTime, default=datetime.utcnow)
