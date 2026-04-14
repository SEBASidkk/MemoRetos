import json
import pytest
from backend import db
from app.models.game_session import GameSession, SessionEvent
from app.models.memoreto import Memoreto
from app.models.user import User


def test_start_session_success(client, student_auth_headers, app): 
    """Test iniciar una sesión de juego exitosamente"""
    with app.app_context():
        memoreto = Memoreto.query.filter_by(is_published=True).first()
        assert memoreto is not None
        memoreto_id = memoreto.id

    response = client.post(
        "/sessions/start",
        json={"memoreto_id": memoreto_id},
        headers=student_auth_headers  
    )
    
    assert response.status_code == 201
    data = response.get_json()
    
    assert "session_id" in data
    assert "timestamp_start" in data
    assert "user" in data
    assert "memoreto" in data
    assert data["user"]["id"] == 2 


def test_start_session_missing_memoreto_id(client, student_auth_headers):
    """Test iniciar sesión sin enviar memoreto_id"""
    response = client.post(
        "/sessions/start",
        json={},
        headers=student_auth_headers 
    )
    
    assert response.status_code == 400
    data = response.get_json()
    assert data["error"] is True
    assert "Falta memoreto_id" in data["message"]


def test_start_session_memoreto_not_found(client, student_auth_headers):  
    """Test iniciar sesión con memoreto_id que no existe"""
    response = client.post(
        "/sessions/start",
        json={"memoreto_id": 99999},
        headers=student_auth_headers 
    )
    
    assert response.status_code == 404
    data = response.get_json()
    assert data is not None
    assert data["error"] is True
    assert "Memoreto no encontrado" in data["message"]


def test_start_session_memoreto_not_published(client, student_auth_headers, app):
    """Test iniciar sesión con memoreto no publicado"""
    with app.app_context():
        memoreto = Memoreto(
            id=999,
            title="Test No Publicado",
            descripcion="Descripción de prueba",
            nivel=1, 
            fase=1, 
            dificultad="easy",  
            figuras_json="{}", 
            number_set="[]",    
            solution_json="{}", 
            is_validated=0,   
            is_published=0,    
            created_by=1       
        )
        db.session.add(memoreto)
        db.session.commit()
        memoreto_id = memoreto.id
    
    response = client.post(
        "/sessions/start",
        json={"memoreto_id": memoreto_id},
        headers=student_auth_headers
    )
    
    assert response.status_code == 404
    data = response.get_json()
    assert data["error"] is True


def test_start_session_unauthorized(client):
    """Test iniciar sesión sin token JWT"""
    response = client.post(
        "/sessions/start",
        json={"memoreto_id": 1}
    )
    
    assert response.status_code == 401


def test_log_event_success(client, student_auth_headers, app):
    """Test registrar un evento de juego exitosamente"""
    with app.app_context():
        memoreto = Memoreto.query.filter_by(is_published=True).first()
        memoreto_id = memoreto.id
    
    start_response = client.post(
        "/sessions/start",
        json={"memoreto_id": memoreto_id},
        headers=student_auth_headers 
    )
    session_id = start_response.get_json()["session_id"]
    
    event_data = {
        "session_id": session_id,
        "event_type": "card_flip",
        "data": {
            "card_id": 1,
            "timestamp": "2024-01-01T12:00:00"
        }
    }
    
    response = client.post(
        "/game/sessions/event",
        json=event_data,
        headers=student_auth_headers 
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert "event_id" in data
    assert data["state"] == "ok"

def test_log_event_session_not_found(client, student_auth_headers): 
    """Test registrar evento con session_id inválido"""
    response = client.post(
        "/game/sessions/event",
        json={
            "session_id": "invalid-uuid",
            "event_type": "test",
            "data": {}
        },
        headers=student_auth_headers
    )
    
    assert response.status_code == 404
    data = response.get_json()
    assert data["error"] is True
    assert "Sesión no encontrada" in data["message"]


def test_log_event_multiple_events(client, student_auth_headers, app): 
    """Test registrar múltiples eventos en la misma sesión"""
    with app.app_context():
        memoreto = Memoreto.query.filter_by(is_published=True).first()
        memoreto_id = memoreto.id
    
    start_response = client.post(
        "/sessions/start",
        json={"memoreto_id": memoreto_id},
        headers=student_auth_headers 
    )
    session_id = start_response.get_json()["session_id"]
    
    events = [
        {"event_type": "game_start", "data": {"level": 1}},
        {"event_type": "card_flip", "data": {"card_id": 1}},
        {"event_type": "match", "data": {"pair_id": 1}},
        {"event_type": "game_end", "data": {"score": 100}}
    ]
    
    for event in events:
        response = client.post(
            "/game/sessions/event",
            json={"session_id": session_id, **event},
            headers=student_auth_headers 
        )
        assert response.status_code == 200

def test_end_session_success(client, student_auth_headers, app): 
    """Test finalizar una sesión exitosamente"""
    with app.app_context():
        memoreto = Memoreto.query.filter_by(is_published=True).first()
        memoreto_id = memoreto.id
    
    start_response = client.post(
        "/sessions/start",
        json={"memoreto_id": memoreto_id},
        headers=student_auth_headers 
    )
    session_id = start_response.get_json()["session_id"]
    
    response = client.post(
        "/sessions/end",
        json={
            "session_id": session_id,
            "completed": True
        },
        headers=student_auth_headers 
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert data["session_id"] == session_id
    assert data["completed"] is True
    assert "ended_at" in data
    assert "_links" in data


def test_end_session_not_completed(client, student_auth_headers, app): 
    """Test finalizar sesión marcada como no completada"""
    with app.app_context():
        memoreto = Memoreto.query.filter_by(is_published=True).first()
        memoreto_id = memoreto.id
    
    start_response = client.post(
        "/sessions/start",
        json={"memoreto_id": memoreto_id},
        headers=student_auth_headers 
    )
    session_id = start_response.get_json()["session_id"]
    
    response = client.post(
        "/sessions/end",
        json={
            "session_id": session_id,
            "completed": False
        },
        headers=student_auth_headers 
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert data["completed"] is False

def test_end_session_not_found(client, student_auth_headers): 
    """Test finalizar sesión que no existe"""
    response = client.post(
        "/sessions/end",
        json={
            "session_id": "invalid-uuid",
            "completed": True
        },
        headers=student_auth_headers 
    )
    
    assert response.status_code == 404
    data = response.get_json()
    assert data is not None
    assert "Sesión no encontrada" in data["message"]

def test_complete_game_flow(client, student_auth_headers, app):
    """Test flujo completo del juego: inicio -> eventos -> fin"""
    with app.app_context():
        memoreto = Memoreto.query.filter_by(is_published=True).first()
        memoreto_id = memoreto.id
    
    start_response = client.post(
        "/sessions/start",
        json={"memoreto_id": memoreto_id},
        headers=student_auth_headers 
    )
    assert start_response.status_code == 201
    session_id = start_response.get_json()["session_id"]
    
    game_events = [
        ("game_start", {"level": 1}),
        ("card_flip", {"card_id": 1}),
        ("card_flip", {"card_id": 5}),
        ("match", {"pair_id": 1, "score": 10}),
    ]
    
    for event_type, event_data in game_events:
        event_response = client.post(
            "/game/sessions/event",
            json={
                "session_id": session_id,
                "event_type": event_type,
                "data": event_data
            },
            headers=student_auth_headers  
        )
        assert event_response.status_code == 200
    
    end_response = client.post(
        "/sessions/end",
        json={
            "session_id": session_id,
            "completed": True
        },
        headers=student_auth_headers 
    )
    assert end_response.status_code == 200


def test_multiple_sessions_for_same_user(client, student_auth_headers, app): 
    """Test múltiples sesiones para el mismo usuario"""
    with app.app_context():
        memoreto = Memoreto.query.filter_by(is_published=True).first()
        memoreto_id = memoreto.id
    
    session_ids = []
    
    for i in range(3):
        response = client.post(
            "/sessions/start",
            json={"memoreto_id": memoreto_id},
            headers=student_auth_headers 
        )
        assert response.status_code == 201
        session_ids.append(response.get_json()["session_id"])
    
    for session_id in session_ids[:2]:
        client.post(
            "/sessions/end",
            json={"session_id": session_id, "completed": True},
            headers=student_auth_headers  
        )

def test_end_session_without_start(client, student_auth_headers): 
    """Test finalizar una sesión que nunca fue iniciada"""
    response = client.post(
        "/sessions/end",
        json={
            "session_id": "nonexistent-session-uuid",
            "completed": True
        },
        headers=student_auth_headers  
    )
    
    assert response.status_code == 404
    data = response.get_json()
    assert data is not None
    assert "Sesión no encontrada" in data["message"]