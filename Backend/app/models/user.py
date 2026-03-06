from backend import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

class User(db.Model):
    __tablename__ = "users"

    id            = db.Column(db.Integer, primary_key=True)
    name          = db.Column(db.String(64),  nullable=False)
    lastname      = db.Column(db.String(64),  nullable=False)
    username      = db.Column(db.String(64),  unique=True, nullable=False)
    email         = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    rol           = db.Column(db.String(16), nullable=False, default="estudiante")
    group         = db.Column(db.String(16),  nullable=True)
    total_score   = db.Column(db.Integer,     default=0)
    tutorial_completed = db.Column(db.Boolean, default=False)
    created_at    = db.Column(db.DateTime,    default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id":                  self.id,
            "name":                self.name,
            "lastname":            self.lastname,
            "username":            self.username,
            "email":               self.email,
            "rol":                 self.rol,
            "group":               self.group,
            "total_score":         self.total_score or 0,
            "tutorial_completed": self.tutorial_completed,
        }
