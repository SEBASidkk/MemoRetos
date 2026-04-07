import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend import db
from app.models.game_session import GameSession
from app.models.memoreto import Memoreto
from app.models.user import User
from datetime import datetime

game_bp = Blueprint("game", __name__)


@game_bp.post("/session/start")
@jwt_required()
def start_session():
    data    = request.get_json()
    user_id = int(get_jwt_identity())

    if not data or "memoreto_id" not in data:
        return jsonify({"error": True, "message": "Falta memoreto_id", "code": 400}), 400

    memoreto = Memoreto.query.filter_by(
        id           = data["memoreto_id"],
        is_published = True
    ).first()
    if not memoreto:
        return jsonify({"error": True, "message": "Memoreto no encontrado", "code": 404}), 404

    session = GameSession(
        user_id     = user_id,
        memoreto_id = memoreto.id,
    )
    db.session.add(session)
    db.session.commit()

    user = User.query.get(user_id)
    return jsonify({
        "session_id":      session.session_uuid,
        "timestamp_start": session.started_at.isoformat(),
        "user": {
            "id":          user.id,
            "name":        user.name,
            "lastname":    user.lastname,
            "grupo":       user.group,
            "total_score": user.total_score,
    },
        "memoreto": memoreto.to_dict(full=True),
    }), 201


@game_bp.post("/game/session/event")  # PDF endpoint 7
@jwt_required()
def log_event():
    data = request.get_json()

    session = GameSession.query.filter_by(
        session_uuid = data.get("session_id")
    ).first()
    if not session:
        return jsonify({"error": True, "message": "Sesión no encontrada", "code": 404}), 404

    from app.models.game_session import SessionEvent
    event = SessionEvent(
        session_id  = session.id,
        event_type  = data.get("event_type"),
        data_json   = json.dumps(data.get("data", {})),
    )
    db.session.add(event)
    db.session.commit()
    return jsonify({
        "event_id": str(event.id),
        "state": "ok",
        "message": "evento registrado correctamente"
    }), 200


@game_bp.post("/session/end")
@jwt_required()
def end_session():
    data = request.get_json()

    session = GameSession.query.filter_by(
        session_uuid = data.get("session_id")
    ).first()
    if not session:
        return jsonify({"error": True, "message": "Sesión no encontrada", "code": 404}), 404

    session.ended_at  = datetime.utcnow()
    session.completed = data.get("completed", False)
    db.session.commit()

    return jsonify({
        "session_id":  session.session_uuid,
        "completed":   session.completed,
        "ended_at":    session.ended_at.isoformat(),
        "_links": {
            "start": {"href": "/session/start", "method": "POST"},
        },
    }), 200

