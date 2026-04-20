
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend import db
from app.models.user import User
from app.models.memoreto import Memoreto
from app.models.game_session import GameSession, SessionEvent
from app.models.player_answer import PlayerAnswer
from datetime import datetime
import math
import random
import json as _json

# Configuración de puntajes por intento de manera decreciente
ATTEMPT_CONFIG = {
    1: {"max_score": 5000, "time_limit": 60, "min_score": 500},
    2: {"max_score": 4000, "time_limit": 55, "min_score": 400},
    3: {"max_score": 3000, "time_limit": 50, "min_score": 300},
    4: {"max_score": 2000, "time_limit": 45, "min_score": 200},
    5: {"max_score": 1000, "time_limit": 40, "min_score": 100},
    6: {"max_score": 800,  "time_limit": 35, "min_score": 80},
    7: {"max_score": 600,  "time_limit": 30, "min_score": 60},
    8: {"max_score": 400,  "time_limit": 25, "min_score": 40},
    9: {"max_score": 200,  "time_limit": 20, "min_score": 20},
    10: {"max_score": 100, "time_limit": 15, "min_score": 10}
}

# Intentos mayores a 10
DEFAULT_CONFIG = {"max_score": 50, "time_limit": 10, "min_score": 5}

# Soluciones de memoretos
MEMORETO_SOLUTIONS = {
}

answers_bp = Blueprint("answers", __name__) 


@answers_bp.route("/answers", methods=['POST'])
@jwt_required()
def enviar_respuesta():
    """
    Endpoint para enviar respuesta y crear puntaje del usuario
    Intentos ilimitados hasta resolver correctament
    Requiere: JWT Token
    """
    # 1. Obtener usuario actual del token
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({
            "error": True, 
            "message": "Usuario no encontrado", 
            "code": 404
        }), 404
    
    # 2. Obtener JSON de entrada
    data = request.get_json()
    
    # 3. Validar campos requeridos
    required_fields = ['id_memoreto', 'attempt_number', 'start_time', 'end_time', 'answers']
    
    if not data or not all(k in data for k in required_fields):
        return jsonify({
            "error": True, 
            "message": "Faltan campos requeridos", 
            "code": 400
        }), 400
    
    # 4. Extraer variables
    id_memoreto = str(data['id_memoreto'])
    attempt_number = data['attempt_number']
    start_time = data['start_time']
    end_time = data['end_time']
    answers_data = data['answers']
    
    # 5. Validar que el memoreto exista
    memoreto = Memoreto.query.filter_by(id=id_memoreto, is_published=True).first()
    if not memoreto:
        return jsonify({
            "error": True, 
            "message": "Memoreto no encontrado", 
            "code": 404
        }), 404
    
    # 6. Calcular tiempo transcurrido
    try:
        start = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        end = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
        time_taken = (end - start).seconds
        
        if time_taken < 0:
            return jsonify({
                "error": True, 
                "message": "end_time debe ser posterior a start_time", 
                "code": 400
            }), 400
            
    except Exception as e:
        return jsonify({
            "error": True, 
            "message": f"Error en formato de fechas: {str(e)}", 
            "code": 400
        }), 400

    
    # 7. Obtener configuración según el número de intento
    if attempt_number in ATTEMPT_CONFIG:
        config = ATTEMPT_CONFIG[attempt_number]
    else:
        config = DEFAULT_CONFIG
    
    # 8. Validar si la solución es correcta
    is_correct = validar_solucion(id_memoreto, answers_data)
    
    # 9. Si la solución es incorrecta
    if not is_correct:
        # Guardar intento fallido en historial
        pa_fail = PlayerAnswer(
            user_id        = current_user_id,
            memoreto_id    = int(id_memoreto),
            respuesta_json = _json.dumps(answers_data),
            resuelto       = False,
            score          = 0,
            time_seconds   = time_taken,
            intentos       = attempt_number,
        )
        db.session.add(pa_fail)
        db.session.commit()

        next_config = ATTEMPT_CONFIG.get(attempt_number + 1, DEFAULT_CONFIG)
        next_attempt_max = next_config["max_score"]

        return jsonify({
            "status": "success",
            "message": "Solución incorrecta, sigue intentando",
            "data_memoreto": {
                "score": 0,
                "attempt_number": attempt_number,
                "is_correct": False,
                "id_memoreto": id_memoreto,
                "user": {
                    "id_user": str(user.id),
                    "username": user.username,
                    "name": user.name,
                    "lastname": user.lastname
                },
                "ranking_position": 0,
                "next_attempt_max_score": next_attempt_max,
                "score_breakdown": {
                    "attempt_max_score": config["max_score"],
                    "time_penalty": 0,
                    "final_score": 0
                },
                "shipping_time": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S")
            }
        }), 200

    # 10. Calcular puntaje
    # Sin penalización los primeros 60 segundos; después -1 pt por segundo extra
    grace_period = 60
    time_penalty = max(0, time_taken - grace_period)
    final_score  = max(config["min_score"], config["max_score"] - time_penalty)

    # 11. Actualizar puntaje total del usuario
    user.total_score = (user.total_score or 0) + final_score

    # 11b. Guardar intento correcto en historial
    pa_ok = PlayerAnswer(
        user_id        = current_user_id,
        memoreto_id    = int(id_memoreto),
        respuesta_json = _json.dumps(answers_data),
        resuelto       = True,
        score          = final_score,
        time_seconds   = time_taken,
        intentos       = attempt_number,
    )
    db.session.add(pa_ok)
    db.session.commit()
    
    # 12. Generar posición de ranking 
    ranking_position = obtener_posicion_ranking(id_memoreto, final_score)
    
    # 13. Mensaje según el intento
    if attempt_number == 1:
        message = "¡Excelente! Lo resolviste al primer intento"
    elif attempt_number <= 3:
        message = "¡Bien! Lo lograste en pocos intentos"
    else:
        message = "¡Lo lograste! Sigue practicando para mejorar tu puntaje"
    
    # 14. Envio de respuesta exitosa
    response = {
        "status": "success",
        "message": message,
        "data_memoreto": {
            "score": final_score,
            "attempt_number": attempt_number,
            "is_correct": True,
            "id_memoreto": id_memoreto,
            "user": {
                "id_user": str(user.id),
                "username": user.username,
                "name": user.name,
                "lastname": user.lastname,
                "grupo": user.group,
                "total_score": user.total_score
            },
            "ranking_position": ranking_position,
            "score_breakdown": {
                "attempt_max_score": config["max_score"],
                "time_penalty": time_penalty,
                "final_score": final_score
            },
            "shipping_time": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S")
        }
    }
    
    return jsonify(response), 200


def parse_node_shapes(node_id):
    """
    Extrae los shape IDs de un node ID con formato "Nodo_1_2_0".
    El ultimo segmento es el indice, los del medio son shape IDs.
    Ej: "Nodo_1_2_0" -> [1, 2]
    """
    import json as _json
    parts = node_id.split("_")
    if len(parts) < 3:
        return []
    try:
        int(parts[-1])
        return [int(p) for p in parts[1:-1]]
    except ValueError:
        return []


def validar_solucion(id_memoreto, answers):
    """
    Valida por restricciones:
    - La suma de los nodos de cada figura debe igualar su target.
    - Los valores usados deben corresponder exactamente al number_set.
    - El shape de cada nodo se extrae del node_id: "Nodo_1_2_0" -> shapes=[1,2].
    """
    import json as _json

    memoreto = Memoreto.query.filter_by(id=int(id_memoreto)).first()
    if not memoreto:
        return False

    try:
        figuras_data = _json.loads(memoreto.figuras_json) if isinstance(memoreto.figuras_json, str) else memoreto.figuras_json
    except Exception:
        return False

    shapes = figuras_data.get("shapes", [])
    if not shapes:
        return False

    try:
        number_set = _json.loads(memoreto.number_set) if isinstance(memoreto.number_set, str) else memoreto.number_set
    except Exception:
        number_set = []

    # Construir dict de respuestas {"Nodo_1_2_0": value, ...}
    answers_dict = {}
    for item in answers:
        if 'intersection_id' in item and 'value' in item:
            answers_dict[str(item['intersection_id'])] = int(item['value'])

    # Validar que los valores usados coincidan exactamente con el number_set
    if number_set and sorted(answers_dict.values()) != sorted(number_set):
        return False

    # Validar que cada figura sume su target
    for shape in shapes:
        shape_id = shape["id"]
        target   = shape.get("target", 0)
        total    = sum(
            value for node_id, value in answers_dict.items()
            if shape_id in parse_node_shapes(node_id)
        )
        if total != target:
            return False

    return True


def obtener_posicion_ranking(id_memoreto, score):
    better = (
        db.session.query(db.func.count(db.distinct(PlayerAnswer.user_id)))
        .filter(
            PlayerAnswer.memoreto_id == int(id_memoreto),
            PlayerAnswer.resuelto == True,
            PlayerAnswer.score > score,
        )
        .scalar() or 0
    )
    return better + 1


@answers_bp.route("/ranking/<memoreto_id>", methods=['GET']) 
@jwt_required()
def get_ranking(memoreto_id):
    """
    Obtener el ranking de un memoreto específico
    """
    # Verificar que el memoreto existe
    memoreto = Memoreto.query.filter_by(id=memoreto_id, is_published=True).first()
    if not memoreto:
        return jsonify({
            "error": True,
            "message": "Memoreto no encontrado",
            "code": 404
        }), 404
    
    rows = (
        db.session.query(User.username, db.func.max(PlayerAnswer.score).label("best_score"))
        .join(PlayerAnswer, PlayerAnswer.user_id == User.id)
        .filter(PlayerAnswer.memoreto_id == int(memoreto_id), PlayerAnswer.resuelto == True)
        .group_by(User.id)
        .order_by(db.desc("best_score"))
        .limit(10)
        .all()
    )
    ranking = [{"position": i + 1, "username": r.username, "score": r.best_score} for i, r in enumerate(rows)]

    return jsonify({
        "memoreto_id": memoreto_id,
        "memoreto_name": memoreto.title,
        "ranking": ranking,
        "total_players": len(ranking),
    }), 200


@answers_bp.route("/answers/history", methods=['GET'])  # PDF endpoint 5
@jwt_required()
def answer_history():
    """
    Endpoint 5 del PDF: Historial de puntajes
    GET /answer/history?user_id=1&memoreto_id=4&difficulty=easy
    """
    user_id     = request.args.get("user_id", type=int) or int(get_jwt_identity())
    memoreto_id = request.args.get("memoreto_id", type=int)
    difficulty  = request.args.get("difficulty")

    query = PlayerAnswer.query.filter_by(user_id=user_id)
    if memoreto_id:
        query = query.filter_by(memoreto_id=memoreto_id)

    answers = query.order_by(PlayerAnswer.submitted_at.desc()).all()

    user = User.query.get(user_id)
    results = []
    for a in answers:
        memo = Memoreto.query.get(a.memoreto_id)
        if difficulty and memo and memo.dificultad != difficulty:
            continue
        results.append({
            "score":          a.score,
            "total_score":    user.total_score if user else 0,
            "is_true":        "si" if a.resuelto else "no",
            "attempt":        a.intentos,
            "date_attempt":   a.submitted_at.strftime("%Y-%m-%dT%H:%M:%S") if a.submitted_at else None,
            "memoreto_id":    str(a.memoreto_id),
        })

    return jsonify({"success": True, "data": results}), 200