from backend import db
from datetime import datetime
import random
import string

group_memberships = db.Table(
    "group_memberships",
    db.Column("group_id", db.Integer, db.ForeignKey("groups.id"), primary_key=True),
    db.Column("user_id",  db.Integer, db.ForeignKey("users.id"),  primary_key=True),
)

group_memoretos = db.Table(
    "group_memoretos",
    db.Column("group_id",    db.Integer, db.ForeignKey("groups.id"),    primary_key=True),
    db.Column("memoreto_id", db.Integer, db.ForeignKey("memoretos.id"), primary_key=True),
    db.Column("assigned_at", db.DateTime, default=datetime.utcnow),
)


class Group(db.Model):
    __tablename__ = "groups"

    id         = db.Column(db.Integer,     primary_key=True)
    name       = db.Column(db.String(128), nullable=False)
    code       = db.Column(db.String(8),   unique=True, nullable=False)
    teacher_id = db.Column(db.Integer,     db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime,    default=datetime.utcnow)

    teacher   = db.relationship("User", foreign_keys=[teacher_id], backref="taught_groups")
    students  = db.relationship("User", secondary=group_memberships, backref="enrolled_groups")
    memoretos = db.relationship("Memoreto", secondary=group_memoretos, backref="assigned_groups")

    @staticmethod
    def generate_code():
        return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))

    def to_dict(self):
        return {
            "id":             self.id,
            "name":           self.name,
            "code":           self.code,
            "teacher":        self.teacher.to_dict() if self.teacher else None,
            "student_count":  len(self.students),
            "memoreto_count": len(self.memoretos),
            "created_at":     self.created_at.isoformat(),
        }
