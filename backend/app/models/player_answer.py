from backend import db
from datetime import datetime

class PlayerAnswer(db.Model):
    __tablename__ = "player_answers"

    id             = db.Column(db.Integer, primary_key=True)
    user_id        = db.Column(db.Integer, db.ForeignKey("users.id"),         nullable=False)
    memoreto_id    = db.Column(db.Integer, db.ForeignKey("memoretos.id"),     nullable=False)
    session_id     = db.Column(db.Integer, db.ForeignKey("game_sessions.id"), nullable=True)
    respuesta_json = db.Column(db.Text, nullable=False)
    resuelto       = db.Column(db.Boolean, default=False)
    score          = db.Column(db.Integer, default=0)
    time_seconds   = db.Column(db.Integer, nullable=True)
    intentos       = db.Column(db.Integer, default=1)
    submitted_at   = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":           self.id,
            "user_id":      self.user_id,
            "memoreto_id":  self.memoreto_id,
            "resuelto":     self.resuelto,
            "score":        self.score,
            "time_seconds": self.time_seconds,
            "intentos":     self.intentos,
            "submitted_at": self.submitted_at.strftime("%Y-%m-%d") if self.submitted_at else None,
        }
