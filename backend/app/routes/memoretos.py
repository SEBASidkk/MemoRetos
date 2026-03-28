import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend import db
from app.models.memoreto import Memoreto
from app.models.user import User

memoretos_bp = Blueprint("memoretos", __name__)


def _links_memo(memo_id):
    """HATEOAS links para un memoreto individual."""
    return {
        "self":       {"href": f"/memoretos/{memo_id}", "method": "GET"},
        "collection": {"href": "/memoretos",            "method": "GET"},
        "update":     {"href": f"/memoretos/{memo_id}", "method": "PUT"},
        "delete":     {"href": f"/memoretos/{memo_id}", "method": "DELETE"},
    }


def _links_collection():
    return {
        "self":   {"href": "/memoretos",           "method": "GET"},
        "create": {"href": "/memoretos",           "method": "POST"},
        "mine":   {"href": "/memoretos?owner=me",  "method": "GET"},
    }


# ── GET /memoretos?published=true | owner=me ─────────────────────────────────
# Soporta ?published=true para publicados y ?owner=me para los del docente.
# También conserva las sub-rutas /published y /mine por compatibilidad con Unity.

@memoretos_bp.get("/published")
@jwt_required()
def get_published():
    memoretos = Memoreto.query.filter_by(is_published=True).all()
    return jsonify({
        "memoretos": [m.to_dict() for m in memoretos],
        "count": len(memoretos),
        "_links": _links_collection(),
    }), 200


@memoretos_bp.get("/mine")
@jwt_required()
def get_mine():
    user_id = int(get_jwt_identity())
    memoretos = Memoreto.query.filter_by(created_by=user_id).order_by(Memoreto.id.desc()).all()
    return jsonify({
        "memoretos": [m.to_dict(full=True) for m in memoretos],
        "count": len(memoretos),
        "_links": _links_collection(),
    }), 200


# ── GET /memoretos/{id} ───────────────────────────────────────────────────────
@memoretos_bp.get("/<int:memo_id>")
@jwt_required()
def get_one(memo_id):
    m = Memoreto.query.get(memo_id)
    if not m:
        return jsonify({"error": True, "message": "Memoreto no encontrado", "code": 404}), 404
    return jsonify({
        "memoreto": m.to_dict(full=True),
        "_links": _links_memo(m.id),
    }), 200


# ── POST /memoretos ───────────────────────────────────────────────────────────
@memoretos_bp.post("/")
@jwt_required()
def create_memoreto():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if user.rol != "docente":
        return jsonify({"error": True, "message": "Solo docentes pueden crear memoretos", "code": 403}), 403

    data = request.get_json()
    if not data or not data.get("title", "").strip():
        return jsonify({"error": True, "message": "El campo 'title' es obligatorio", "code": 400}), 400

    m = Memoreto(
        title        = data["title"].strip(),
        nivel        = data.get("nivel", 1),
        fase         = data.get("fase"),
        dificultad   = data.get("dificultad", "easy"),
        figuras_json = json.dumps(data.get("figuras", [])),
        number_set   = json.dumps(data.get("number_set", [])),
        solution_json= json.dumps(data.get("solution", {})),
        is_published = data.get("is_published", False),
        is_validated = False,
        created_by   = user_id,
    )
    db.session.add(m)
    db.session.commit()
    return jsonify({
        "memoreto": m.to_dict(full=True),
        "_links": _links_memo(m.id),
    }), 201


# ── PUT /memoretos/{id} ───────────────────────────────────────────────────────
@memoretos_bp.put("/<int:memo_id>")
@jwt_required()
def update_memoreto(memo_id):
    user_id = int(get_jwt_identity())
    m = Memoreto.query.get(memo_id)
    if not m:
        return jsonify({"error": True, "message": "Memoreto no encontrado", "code": 404}), 404
    if m.created_by != user_id:
        return jsonify({"error": True, "message": "No tienes permiso para modificar este memoreto", "code": 403}), 403

    data = request.get_json()
    if not data:
        return jsonify({"error": True, "message": "Body requerido", "code": 400}), 400

    if "title"        in data: m.title        = data["title"]
    if "nivel"        in data: m.nivel        = data["nivel"]
    if "fase"         in data: m.fase         = data["fase"]
    if "dificultad"   in data: m.dificultad   = data["dificultad"]
    if "figuras"      in data: m.figuras_json = json.dumps(data["figuras"])
    if "number_set"   in data: m.number_set   = json.dumps(data["number_set"])
    if "solution"     in data: m.solution_json= json.dumps(data["solution"])
    if "is_published" in data: m.is_published = data["is_published"]

    db.session.commit()
    return jsonify({
        "memoreto": m.to_dict(full=True),
        "_links": _links_memo(m.id),
    }), 200


# ── DELETE /memoretos/{id} ────────────────────────────────────────────────────
@memoretos_bp.delete("/<int:memo_id>")
@jwt_required()
def delete_memoreto(memo_id):
    user_id = int(get_jwt_identity())
    m = Memoreto.query.get(memo_id)
    if not m:
        return jsonify({"error": True, "message": "Memoreto no encontrado", "code": 404}), 404
    if m.created_by != user_id:
        return jsonify({"error": True, "message": "No tienes permiso para eliminar este memoreto", "code": 403}), 403

    db.session.delete(m)
    db.session.commit()
    return jsonify({
        "message": "Memoreto eliminado",
        "_links": {"collection": {"href": "/memoretos", "method": "GET"}},
    }), 200
