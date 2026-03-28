from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend import db
from app.models.group import Group
from app.models.user import User
from app.models.memoreto import Memoreto

groups_bp = Blueprint("groups", __name__)


def _links_group(group_id):
    return {
        "self":      {"href": f"/groups/{group_id}",            "method": "GET"},
        "collection":{"href": "/groups",                        "method": "GET"},
        "students":  {"href": f"/groups/{group_id}/students",   "method": "GET"},
        "memoretos": {"href": f"/groups/{group_id}/memoretos",  "method": "GET"},
        "members":   {"href": f"/groups/<code>/members",        "method": "POST"},
    }


def _links_collection():
    return {
        "self":   {"href": "/groups",      "method": "GET"},
        "create": {"href": "/groups",      "method": "POST"},
        "mine":   {"href": "/groups/mine", "method": "GET"},
    }


# ── POST /groups ──────────────────────────────────────────────────────────────
@groups_bp.post("/")
@jwt_required()
def create_group():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if user.rol != "docente":
        return jsonify({"error": True, "message": "Solo docentes pueden crear grupos", "code": 403}), 403

    data = request.get_json()
    if not data or not data.get("name", "").strip():
        return jsonify({"error": True, "message": "El campo 'name' es obligatorio", "code": 400}), 400

    name = data["name"].strip()
    code = Group.generate_code()
    while Group.query.filter_by(code=code).first():
        code = Group.generate_code()

    group = Group(name=name, code=code, teacher_id=user_id)
    db.session.add(group)
    db.session.commit()
    return jsonify({
        "group":   group.to_dict(),
        "_links":  _links_group(group.id),
    }), 201


# ── GET /groups/mine ──────────────────────────────────────────────────────────
@groups_bp.get("/mine")
@jwt_required()
def get_my_groups():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if user.rol == "docente":
        groups = Group.query.filter_by(teacher_id=user_id).all()
    else:
        groups = user.enrolled_groups

    return jsonify({
        "groups":  [g.to_dict() for g in groups],
        "count":   len(groups),
        "_links":  _links_collection(),
    }), 200


# ── GET /groups/{id} ──────────────────────────────────────────────────────────
@groups_bp.get("/<int:group_id>")
@jwt_required()
def get_group(group_id):
    group = Group.query.get(group_id)
    if not group:
        return jsonify({"error": True, "message": "Grupo no encontrado", "code": 404}), 404
    return jsonify({
        "group":  group.to_dict(),
        "_links": _links_group(group_id),
    }), 200


# ── POST /groups/<code>/members  (unirse con código) ─────────────────────────
@groups_bp.post("/<string:code>/members")
@jwt_required()
def join_group(code):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    group = Group.query.filter_by(code=code.upper()).first()
    if not group:
        return jsonify({"error": True, "message": "Código inválido", "code": 404}), 404

    if user in group.students:
        return jsonify({"error": True, "message": "Ya estás en este grupo", "code": 400}), 400

    group.students.append(user)
    db.session.commit()
    return jsonify({
        "group":  group.to_dict(),
        "_links": _links_group(group.id),
    }), 201


# ── GET /groups/{id}/students ─────────────────────────────────────────────────
@groups_bp.get("/<int:group_id>/students")
@jwt_required()
def get_students(group_id):
    group = Group.query.get(group_id)
    if not group:
        return jsonify({"error": True, "message": "Grupo no encontrado", "code": 404}), 404
    students = group.students
    return jsonify({
        "students": [s.to_dict() for s in students],
        "count":    len(students),
        "_links": {
            "self":  {"href": f"/groups/{group_id}/students", "method": "GET"},
            "group": {"href": f"/groups/{group_id}",          "method": "GET"},
        },
    }), 200


# ── GET /groups/{id}/memoretos ────────────────────────────────────────────────
@groups_bp.get("/<int:group_id>/memoretos")
@jwt_required()
def get_group_memoretos(group_id):
    group = Group.query.get(group_id)
    if not group:
        return jsonify({"error": True, "message": "Grupo no encontrado", "code": 404}), 404
    memos = group.memoretos
    return jsonify({
        "memoretos": [m.to_dict() for m in memos],
        "count":     len(memos),
        "_links": {
            "self":   {"href": f"/groups/{group_id}/memoretos", "method": "GET"},
            "assign": {"href": f"/groups/{group_id}/memoretos", "method": "POST"},
            "group":  {"href": f"/groups/{group_id}",           "method": "GET"},
        },
    }), 200


# ── POST /groups/{id}/memoretos  (asignar memoreto) ──────────────────────────
@groups_bp.post("/<int:group_id>/memoretos")
@jwt_required()
def assign_memoreto(group_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if user.rol != "docente":
        return jsonify({"error": True, "message": "Solo docentes pueden asignar memoretos", "code": 403}), 403

    group = Group.query.get(group_id)
    if not group:
        return jsonify({"error": True, "message": "Grupo no encontrado", "code": 404}), 404
    if group.teacher_id != user_id:
        return jsonify({"error": True, "message": "No eres el docente de este grupo", "code": 403}), 403

    data = request.get_json()
    if not data or not data.get("memoreto_id"):
        return jsonify({"error": True, "message": "El campo 'memoreto_id' es obligatorio", "code": 400}), 400

    memoreto = Memoreto.query.get(data["memoreto_id"])
    if not memoreto:
        return jsonify({"error": True, "message": "Memoreto no encontrado", "code": 404}), 404
    if memoreto in group.memoretos:
        return jsonify({"error": True, "message": "Memoreto ya asignado", "code": 400}), 400

    group.memoretos.append(memoreto)
    db.session.commit()
    return jsonify({
        "memoreto": memoreto.to_dict(),
        "_links": {
            "self":      {"href": f"/groups/{group_id}/memoretos", "method": "GET"},
            "group":     {"href": f"/groups/{group_id}",           "method": "GET"},
            "memoreto":  {"href": f"/memoretos/{memoreto.id}",     "method": "GET"},
        },
    }), 201


# ── DELETE /groups/{id}/memoretos/{memo_id} ───────────────────────────────────
@groups_bp.delete("/<int:group_id>/memoretos/<int:memoreto_id>")
@jwt_required()
def remove_memoreto(group_id, memoreto_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if user.rol != "docente":
        return jsonify({"error": True, "message": "Solo docentes pueden quitar memoretos", "code": 403}), 403

    group = Group.query.get(group_id)
    if not group:
        return jsonify({"error": True, "message": "Grupo no encontrado", "code": 404}), 404
    if group.teacher_id != user_id:
        return jsonify({"error": True, "message": "No eres el docente de este grupo", "code": 403}), 403

    memoreto = Memoreto.query.get(memoreto_id)
    if not memoreto or memoreto not in group.memoretos:
        return jsonify({"error": True, "message": "Memoreto no asignado a este grupo", "code": 404}), 404

    group.memoretos.remove(memoreto)
    db.session.commit()
    return jsonify({
        "message": "Memoreto removido del grupo",
        "_links": {
            "collection": {"href": f"/groups/{group_id}/memoretos", "method": "GET"},
            "group":      {"href": f"/groups/{group_id}",           "method": "GET"},
        },
    }), 200
