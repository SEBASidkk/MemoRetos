from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from backend import db
from app.models.user import User

auth_bp = Blueprint("auth", __name__)

_blocklist = set()


@auth_bp.post("/login")
def login():
    data = request.get_json()

    if not data or not all(k in data for k in ("username", "password")):
        return jsonify({"error": True, "message": "Faltan username o password", "code": 400}), 400

    user = User.query.filter_by(username=data["username"]).first()
    if not user or not user.check_password(data["password"]):
        return jsonify({"error": True, "message": "Credenciales incorrectas", "code": 401}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 200


@auth_bp.post("/register")
def register():
    data = request.get_json()
    campos = ("name", "lastname", "username", "email", "password", "rol")

    if not data or not all(k in data for k in campos):
        return jsonify({"error": True, "message": "Faltan campos obligatorios", "code": 400}), 400

    if User.query.filter(
        (User.username == data["username"]) | (User.email == data["email"])
    ).first():
        return jsonify({"error": True, "message": "Username o email ya registrado", "code": 409}), 409

    user = User(
        name     = data["name"],
        lastname = data["lastname"],
        username = data["username"],
        email    = data["email"],
        rol      = data["rol"],
        group    = data.get("group"),
    )
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 201


@auth_bp.post("/logout")
@jwt_required()
def logout():
    _blocklist.add(get_jwt()["jti"])
    return jsonify({"ok": True, "message": "Sesión cerrada"}), 200


@auth_bp.get("/me")
@jwt_required()
def me():
    user = User.query.get(int(get_jwt_identity()))
    if not user:
        return jsonify({"error": True, "message": "Usuario no encontrado", "code": 404}), 404
    return jsonify(user.to_dict()), 200


def is_token_revoked(jwt_header, jwt_payload):
    return jwt_payload["jti"] in _blocklist
