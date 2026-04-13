import json
from datetime import datetime, timedelta
from flask.testing import FlaskClient
import pytest


def test_enviar_respuesta_correcta_primer_intento(client: FlaskClient, auth):
    """Probar respuesta correcta en el primer intento"""
    headers = auth.get_headers()
    
    # Solución correcta del memoreto 1 (3 círculos)
    answers_data = [
        {"intersection_id": "Nodo_1_2_0", "value": 6},
        {"intersection_id": "Nodo_1_2_1", "value": 1},
        {"intersection_id": "Nodo_1_3_0", "value": 3},
        {"intersection_id": "Nodo_1_3_1", "value": 4},
        {"intersection_id": "Nodo_2_3_0", "value": 2},
        {"intersection_id": "Nodo_2_3_1", "value": 5},
    ]
    
    now = datetime.utcnow()
    payload = {
        "id_memoreto": "1",
        "attempt_number": 1,
        "start_time": (now - timedelta(seconds=30)).isoformat() + "Z",
        "end_time": now.isoformat() + "Z",
        "answers": answers_data
    }
    
    response = client.post("/answers", json=payload, headers=headers)
    
    assert response.status_code == 200
    data = response.get_json()
    
    assert data["status"] == "success"
    assert data["data_memoreto"]["is_correct"] == True
    assert data["data_memoreto"]["score"] > 0
    assert data["data_memoreto"]["attempt_number"] == 1
    assert data["message"] == "¡Excelente! Lo resolviste al primer intento"


def test_enviar_respuesta_correcta_segundo_intento(client: FlaskClient, auth):
    """Probar respuesta correcta en el segundo intento"""
    headers = auth.get_headers()
    
    answers_data = [
        {"intersection_id": "Nodo_1_2_0", "value": 6},
        {"intersection_id": "Nodo_1_2_1", "value": 1},
        {"intersection_id": "Nodo_1_3_0", "value": 3},
        {"intersection_id": "Nodo_1_3_1", "value": 4},
        {"intersection_id": "Nodo_2_3_0", "value": 2},
        {"intersection_id": "Nodo_2_3_1", "value": 5},
    ]
    
    now = datetime.utcnow()
    payload = {
        "id_memoreto": "1",
        "attempt_number": 2,
        "start_time": (now - timedelta(seconds=30)).isoformat() + "Z",
        "end_time": now.isoformat() + "Z",
        "answers": answers_data
    }
    
    response = client.post("/answers", json=payload, headers=headers)
    
    assert response.status_code == 200
    data = response.get_json()
    
    assert data["status"] == "success"
    assert data["data_memoreto"]["is_correct"] == True
    assert data["message"] == "¡Bien! Lo lograste en pocos intentos"


def test_enviar_respuesta_incorrecta(client: FlaskClient, auth):
    """Probar respuesta incorrecta da score 0 y mensaje de seguir intentando"""
    headers = auth.get_headers()
    
    # Respuesta incorrecta
    answers_data = [
        {"intersection_id": "Nodo_1_2_0", "value": 1},
        {"intersection_id": "Nodo_1_2_1", "value": 2},
        {"intersection_id": "Nodo_1_3_0", "value": 3},
        {"intersection_id": "Nodo_1_3_1", "value": 4},
        {"intersection_id": "Nodo_2_3_0", "value": 5},
        {"intersection_id": "Nodo_2_3_1", "value": 6},
    ]
    
    now = datetime.utcnow()
    payload = {
        "id_memoreto": "1",
        "attempt_number": 1,
        "start_time": (now - timedelta(seconds=30)).isoformat() + "Z",
        "end_time": now.isoformat() + "Z",
        "answers": answers_data
    }
    
    response = client.post("/answers", json=payload, headers=headers)
    
    assert response.status_code == 200
    data = response.get_json()
    
    assert data["status"] == "success"
    assert data["data_memoreto"]["is_correct"] == False
    assert data["data_memoreto"]["score"] == 0
    assert "Solución incorrecta, sigue intentando" in data["message"]


def test_enviar_respuesta_sin_auth(client: FlaskClient):
    """Probar que sin token JWT da error 401"""
    payload = {"id_memoreto": "1", "attempt_number": 1}
    response = client.post("/answers", json=payload)
    assert response.status_code == 401


def test_enviar_respuesta_campos_faltantes(client: FlaskClient, auth):
    """Probar que faltan campos requeridos"""
    headers = auth.get_headers()
    
    payload = {
        "id_memoreto": "1",
        "attempt_number": 1
    }
    
    response = client.post("/answers", json=payload, headers=headers)
    
    assert response.status_code == 400
    data = response.get_json()
    assert data["error"] == True
    assert "Faltan campos requeridos" in data["message"]


def test_enviar_respuesta_sin_json(client: FlaskClient, auth):
    """Probar que envía request sin JSON"""
    headers = auth.get_headers()
    
    response = client.post("/answers", headers=headers)
    
    assert response.status_code == 400
    data = response.get_json()
    assert data["error"] == True


def test_enviar_respuesta_memoreto_inexistente(client: FlaskClient, auth):
    """Probar que memoreto que no existe da error 404"""
    headers = auth.get_headers()
    
    now = datetime.utcnow()
    payload = {
        "id_memoreto": "99999",
        "attempt_number": 1,
        "start_time": (now - timedelta(seconds=30)).isoformat() + "Z",
        "end_time": now.isoformat() + "Z",
        "answers": []
    }
    
    response = client.post("/answers", json=payload, headers=headers)
    
    assert response.status_code == 404
    data = response.get_json()
    assert "Memoreto no encontrado" in data["message"]


def test_enviar_respuesta_fecha_invalida(client: FlaskClient, auth):
    """Probar que fecha inválida da error 400"""
    headers = auth.get_headers()
    
    payload = {
        "id_memoreto": "1",
        "attempt_number": 1,
        "start_time": "fecha-invalida",
        "end_time": datetime.utcnow().isoformat() + "Z",
        "answers": []
    }
    
    response = client.post("/answers", json=payload, headers=headers)
    assert response.status_code == 400


def test_enviar_respuesta_end_time_menor_que_start_time(client: FlaskClient, auth):
    """Probar que end_time debe ser posterior a start_time"""
    headers = auth.get_headers()
    
    now = datetime.utcnow()
    payload = {
        "id_memoreto": "1",
        "attempt_number": 1,
        "start_time": now.isoformat() + "Z",
        "end_time": (now - timedelta(seconds=10)).isoformat() + "Z",
        "answers": []
    }
    
    response = client.post("/answers", json=payload, headers=headers)
    
    assert response.status_code == 400
    data = response.get_json()
    assert "end_time debe ser posterior" in data["message"]


def test_puntaje_segun_tiempo(client: FlaskClient, auth):
    """Probar que a menor tiempo, mayor puntaje"""
    headers = auth.get_headers()
    
    answers_data = [
        {"intersection_id": "Nodo_1_2_0", "value": 6},
        {"intersection_id": "Nodo_1_2_1", "value": 1},
        {"intersection_id": "Nodo_1_3_0", "value": 3},
        {"intersection_id": "Nodo_1_3_1", "value": 4},
        {"intersection_id": "Nodo_2_3_0", "value": 2},
        {"intersection_id": "Nodo_2_3_1", "value": 5},
    ]
    
    now = datetime.utcnow()
    
    payload_rapido = {
        "id_memoreto": "1",
        "attempt_number": 1,
        "start_time": (now - timedelta(seconds=10)).isoformat() + "Z",
        "end_time": now.isoformat() + "Z",
        "answers": answers_data
    }
    
    payload_lento = {
        "id_memoreto": "1",
        "attempt_number": 1,
        "start_time": (now - timedelta(seconds=50)).isoformat() + "Z",
        "end_time": now.isoformat() + "Z",
        "answers": answers_data
    }
    
    # Crear usuario nuevo
    response_rapido = client.post("/answers", json=payload_rapido, headers=headers)
    score_rapido = response_rapido.get_json()["data_memoreto"]["score"]
    
    response_lento = client.post("/answers", json=payload_lento, headers=headers)
    score_lento = response_lento.get_json()["data_memoreto"]["score"]
    
    assert score_rapido > score_lento