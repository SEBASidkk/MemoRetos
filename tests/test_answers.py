import json
from datetime import datetime, timedelta
from flask.testing import FlaskClient
import pytest



def test_post_answers_correcta_primera_vez(client: FlaskClient, auth_headers):
    """Enviar respuesta correcta en el primer intento"""
    headers = auth_headers
    
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
    assert data["message"] == "¡Excelente! Lo resolviste al primer intento"


def test_post_answers_correcta_segunda_vez(client: FlaskClient, auth_headers):
    """Enviar respuesta correcta en el segundo intento"""
    headers = auth_headers
    
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
    assert data["data_memoreto"]["is_correct"] == True
    assert data["message"] == "¡Bien! Lo lograste en pocos intentos"


def test_post_answers_incorrecta(client: FlaskClient, auth_headers):
    """Enviar respuesta incorrecta da score 0"""
    headers = auth_headers
    
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
    assert data["data_memoreto"]["is_correct"] == False
    assert data["data_memoreto"]["score"] == 0


def test_post_answers_sin_token(client: FlaskClient):
    """Enviar respuesta sin token JWT"""
    response = client.post("/answers", json={})
    assert response.status_code == 401


def test_post_answers_faltan_campos(client: FlaskClient, auth_headers):
    """Enviar respuesta con campos obligatorios faltantes"""
    headers = auth_headers
    payload = {"id_memoreto": "1", "attempt_number": 1}
    
    response = client.post("/answers", json=payload, headers=headers)
    
    assert response.status_code == 400
    data = response.get_json()
    assert "Faltan campos requeridos" in data["message"]


def test_post_answers_memoreto_no_existe(client: FlaskClient, auth_headers):
    """Enviar respuesta para un memoreto que no existe"""
    headers = auth_headers
    
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


def test_post_answers_fecha_invalida(client: FlaskClient, auth_headers):
    """Enviar respuesta con fecha mal formateada"""
    headers = auth_headers
    
    payload = {
        "id_memoreto": "1",
        "attempt_number": 1,
        "start_time": "fecha-invalida",
        "end_time": datetime.utcnow().isoformat() + "Z",
        "answers": []
    }
    
    response = client.post("/answers", json=payload, headers=headers)
    assert response.status_code == 400


#def test_post_answers_end_time_menor(client: FlaskClient, auth_headers):
#    """Enviar respuesta donde end_time es menor a start_time"""
#    headers = auth_headers
    
#    now = datetime.utcnow()
#    payload = {
#        "id_memoreto": "1",
#        "attempt_number": 1,
#        "start_time": (now - timedelta(seconds=10)).isoformat() + "Z",
#        "end_time": (now - timedelta(seconds=30)).isoformat() + "Z",  # end < start
#        "answers": []
#    }
    
#    response = client.post("/answers", json=payload, headers=headers)
    
    # Debe dar error 400 porque end_time es menor que start_time
#    assert response.status_code == 400
#    data = response.get_json()
#    assert "end_time debe ser posterior" in data["message"]


def test_post_answers_tiempo_afecta_puntaje(client: FlaskClient, auth_headers):
    """A menor tiempo de respuesta, mayor puntaje"""
    headers = auth_headers
    
    answers_data = [
        {"intersection_id": "Nodo_1_2_0", "value": 6},
        {"intersection_id": "Nodo_1_2_1", "value": 1},
        {"intersection_id": "Nodo_1_3_0", "value": 3},
        {"intersection_id": "Nodo_1_3_1", "value": 4},
        {"intersection_id": "Nodo_2_3_0", "value": 2},
        {"intersection_id": "Nodo_2_3_1", "value": 5},
    ]
    
    now = datetime.utcnow()
    
    # Respuesta 1 - rápida
    payload_rapido = {
        "id_memoreto": "1",
        "attempt_number": 1,
        "start_time": (now - timedelta(seconds=10)).isoformat() + "Z",
        "end_time": now.isoformat() + "Z",
        "answers": answers_data
    }
    
    # Respuesta 2 - lenta
    payload_lento = {
        "id_memoreto": "1",
        "attempt_number": 1,
        "start_time": (now - timedelta(seconds=50)).isoformat() + "Z",
        "end_time": now.isoformat() + "Z",
        "answers": answers_data
    }
    
    response_rapido = client.post("/answers", json=payload_rapido, headers=headers)
    response_lento = client.post("/answers", json=payload_lento, headers=headers)
    
    score_rapido = response_rapido.get_json()["data_memoreto"]["score"]
    score_lento = response_lento.get_json()["data_memoreto"]["score"]
    
    assert score_rapido > score_lento


# PRUEBAS GET /ranking/

def test_get_ranking_por_memoreto(client: FlaskClient, auth_headers):
    """Obtener ranking de un memoreto específico"""
    headers = auth_headers
    
    response = client.get("/ranking/1", headers=headers)
    
    assert response.status_code == 200
    data = response.get_json()
    assert data["memoreto_id"] == "1"
    assert "ranking" in data
    assert "total_players" in data


def test_get_ranking_memoreto_no_existe(client: FlaskClient, auth_headers):
    """Obtener ranking de memoreto inexistente"""
    headers = auth_headers
    
    response = client.get("/ranking/99999", headers=headers)
    
    assert response.status_code == 404
    data = response.get_json()
    assert "Memoreto no encontrado" in data["message"]


def test_get_ranking_sin_token(client: FlaskClient):
    """Obtener ranking sin autenticación"""
    response = client.get("/ranking/1")
    assert response.status_code == 401


def test_get_ranking_formato_valido(client: FlaskClient, auth_headers):
    """Verificar que el ranking tiene el formato correcto"""
    headers = auth_headers
    
    response = client.get("/ranking/1", headers=headers)
    
    assert response.status_code == 200
    data = response.get_json()
    
    if len(data["ranking"]) > 0:
        primer_puesto = data["ranking"][0]
        assert "position" in primer_puesto
        assert "username" in primer_puesto
        assert "score" in primer_puesto