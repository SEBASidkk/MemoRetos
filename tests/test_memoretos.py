import json
import pytest
from backend import db
from app.models.memoreto import Memoreto
from app.models.user import User


def test_get_published_memoretos_success(client, auth_headers):
    """Test obtener todos los memoretos publicados"""
    response = client.get(
        "/memoretos/published",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.get_json()
    
    assert "memoretos" in data
    assert "count" in data
    assert "_links" in data
    assert isinstance(data["memoretos"], list)
    
    for memoreto in data["memoretos"]:
        assert memoreto["is_published"] is True


def test_get_public_memoreto_without_auth(client, app):
    """Test endpoint público sin autenticación (para Unity)"""
    with app.app_context():
        memoreto = Memoreto.query.filter_by(is_published=True).first()
        assert memoreto is not None
        memoreto_id = memoreto.id
    
    response = client.get(f"/memoretos/public/{memoreto_id}")
    
    assert response.status_code == 200
    data = response.get_json()
    assert data["id"] == memoreto_id
    assert data["is_published"] is True


def test_get_public_memoreto_not_found(client):
    """Test endpoint público con memoreto no existente"""
    response = client.get("/memoretos/public/99999")
    
    assert response.status_code == 404
    data = response.get_json()
    assert "error" in data


def test_get_public_memoreto_not_published(client, app):
    """Test endpoint público con memoreto no publicado"""
    with app.app_context():
        memoreto = Memoreto(
            id=999,
            title="No Publicado",
            descripcion="Test",
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
    
    response = client.get(f"/memoretos/public/{memoreto_id}")
    
    assert response.status_code == 404
    data = response.get_json()
    assert "error" in data


def test_get_mine_memoretos(client, auth_headers):
    """Test obtener mis memoretos (del docente autenticado)"""
    response = client.get(
        "/memoretos/mine",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.get_json()
    
    assert "memoretos" in data
    assert "count" in data
    assert "_links" in data
    assert isinstance(data["memoretos"], list)


def test_get_one_memoreto_success(client, auth_headers, app):
    """Test obtener un memoreto específico"""
    with app.app_context():
        memoreto = Memoreto.query.first()
        assert memoreto is not None
        memoreto_id = memoreto.id
    
    response = client.get(
        f"/memoretos/{memoreto_id}",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.get_json()
    
    assert "memoreto" in data
    assert "_links" in data
    assert data["memoreto"]["id"] == memoreto_id


def test_get_one_memoreto_not_found(client, auth_headers):
    """Test obtener memoreto que no existe"""
    response = client.get(
        "/memoretos/99999",
        headers=auth_headers
    )
    
    assert response.status_code == 404
    data = response.get_json()
    assert data["error"] is True
    assert "Memoreto no encontrado" in data["message"]


def test_create_memoreto_success(client, auth_headers):
    """Test crear un memoreto exitosamente (docente)"""
    memoreto_data = {
        "title": "Nuevo Memoreto de Prueba",
        "nivel": 2,
        "fase": 1,
        "dificultad": "medium",
        "figuras": [
            {"id": 1, "type": "circle", "value": 5},
            {"id": 2, "type": "square", "value": 3}
        ],
        "number_set": [1, 2, 3, 4, 5],
        "solution": {"node_1": 1, "node_2": 2},
        "is_published": False
    }
    
    response = client.post(
        "/memoretos/",
        json=memoreto_data,
        headers=auth_headers
    )
    
    assert response.status_code == 201
    data = response.get_json()
    
    assert "memoreto" in data
    assert "_links" in data
    assert data["memoreto"]["title"] == "Nuevo Memoreto de Prueba"
    assert data["memoreto"]["nivel"] == 2
    assert data["memoreto"]["dificultad"] == "medium"
    assert data["memoreto"]["is_published"] is False


def test_create_memoreto_without_title(client, auth_headers):
    """Test crear memoreto sin título (debe fallar)"""
    response = client.post(
        "/memoretos/",
        json={"nivel": 1},
        headers=auth_headers
    )
    
    assert response.status_code == 400
    data = response.get_json()
    assert data["error"] is True
    assert "title" in data["message"].lower()


def test_create_memoreto_as_student(client, student_auth_headers):
    """Test crear memoreto como estudiante (debe fallar)"""
    memoreto_data = {
        "title": "Intento de Estudiante",
        "nivel": 1
    }
    
    response = client.post(
        "/memoretos/",
        json=memoreto_data,
        headers=student_auth_headers
    )
    
    assert response.status_code == 403
    data = response.get_json()
    assert data["error"] is True
    assert "Solo docentes" in data["message"]


def test_create_memoreto_with_minimal_fields(client, auth_headers):
    """Test crear memoreto solo con campos obligatorios"""
    memoreto_data = {
        "title": "Memoreto Mínimo"
    }
    
    response = client.post(
        "/memoretos/",
        json=memoreto_data,
        headers=auth_headers
    )
    
    assert response.status_code == 201
    data = response.get_json()
    assert data["memoreto"]["title"] == "Memoreto Mínimo"
    assert data["memoreto"]["nivel"] == 1 
    assert data["memoreto"]["dificultad"] == "easy" 


def test_update_memoreto_success(client, auth_headers, app):
    """Test actualizar un memoreto exitosamente"""
    with app.app_context():

        memoreto = Memoreto(
            id=998,
            title="Original Title",
            descripcion="Original Description",
            nivel=1,
            fase=1,
            dificultad="easy",
            figuras_json="[]",
            number_set="[]",
            solution_json="{}",
            is_validated=0,
            is_published=0,
            created_by=1
        )
        db.session.add(memoreto)
        db.session.commit()
        memoreto_id = memoreto.id
    
    update_data = {
        "title": "Título Actualizado",
        "nivel": 3,
        "dificultad": "hard",
        "is_published": True
    }
    
    response = client.put(
        f"/memoretos/{memoreto_id}",
        json=update_data,
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert data["memoreto"]["title"] == "Título Actualizado"
    assert data["memoreto"]["nivel"] == 3
    assert data["memoreto"]["dificultad"] == "hard"
    assert data["memoreto"]["is_published"] is True


def test_update_memoreto_not_owner(client, auth_headers, app):
    """Test actualizar memoreto de otro usuario (debe fallar)"""
    with app.app_context():

        memoreto = Memoreto(
            id=997,
            title="De Otro Usuario",
            descripcion="No debería poder editarlo",
            nivel=1,
            fase=1,
            dificultad="easy",
            figuras_json="[]",
            number_set="[]",
            solution_json="{}",
            is_validated=0,
            is_published=0,
            created_by=2 
        )
        db.session.add(memoreto)
        db.session.commit()
        memoreto_id = memoreto.id
    
    update_data = {"title": "Intento de Hack"}
    
    response = client.put(
        f"/memoretos/{memoreto_id}",
        json=update_data,
        headers=auth_headers 
    )
    
    assert response.status_code == 403
    data = response.get_json()
    assert "No tienes permiso" in data["message"]


def test_update_memoreto_not_found(client, auth_headers):
    """Test actualizar memoreto que no existe"""
    response = client.put(
        "/memoretos/99999",
        json={"title": "Nuevo Título"},
        headers=auth_headers
    )
    
    assert response.status_code == 404
    data = response.get_json()
    assert data["error"] is True
    assert "Memoreto no encontrado" in data["message"]


def test_get_memoreto_answers_success(client, auth_headers, app):
    """Test obtener respuestas de un memoreto (docente autor)"""
    with app.app_context():
        memoreto = Memoreto.query.filter_by(created_by=1).first()
        assert memoreto is not None
        memoreto_id = memoreto.id
    
    response = client.get(
        f"/memoretos/{memoreto_id}/answers",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.get_json()
    
    assert "memoreto_id" in data
    assert "memoreto_title" in data
    assert "total_attempts" in data
    assert "unique_solvers" in data
    assert "avg_score" in data
    assert "answers" in data


def test_get_memoreto_answers_not_author(client, student_auth_headers, app):
    """Test obtener respuestas de memoreto que no es del usuario"""
    with app.app_context():
        memoreto = Memoreto.query.filter_by(created_by=1).first()
        assert memoreto is not None
        memoreto_id = memoreto.id
    
    response = client.get(
        f"/memoretos/{memoreto_id}/answers",
        headers=student_auth_headers  
    )
    
    assert response.status_code == 403
    data = response.get_json()
    assert "Solo el autor" in data["message"]


def test_get_memoreto_answers_memoreto_not_found(client, auth_headers):
    """Test obtener respuestas de memoreto inexistente"""
    response = client.get(
        "/memoretos/99999/answers",
        headers=auth_headers
    )
    
    assert response.status_code == 404
    data = response.get_json()
    assert "Memoreto no encontrado" in data["message"]


def test_delete_memoreto_success(client, auth_headers, app):
    """Test eliminar un memoreto exitosamente"""
    with app.app_context():

        memoreto = Memoreto(
            id=996,
            title="A Eliminar",
            descripcion="Este memoreto será eliminado",
            nivel=1,
            fase=1,
            dificultad="easy",
            figuras_json="[]",
            number_set="[]",
            solution_json="{}",
            is_validated=0,
            is_published=0,
            created_by=1
        )
        db.session.add(memoreto)
        db.session.commit()
        memoreto_id = memoreto.id
    
    response = client.delete(
        f"/memoretos/{memoreto_id}",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert "message" in data
    assert "eliminado" in data["message"].lower()
    
    with app.app_context():
        deleted = Memoreto.query.get(memoreto_id)
        assert deleted is None


def test_delete_memoreto_not_owner(client, auth_headers, app):
    """Test eliminar memoreto de otro usuario (debe fallar)"""
    with app.app_context():
        memoreto = Memoreto(
            id=995,
            title="De Otro",
            descripcion="No debería poder eliminarlo",
            nivel=1,
            fase=1,
            dificultad="easy",
            figuras_json="[]",
            number_set="[]",
            solution_json="{}",
            is_validated=0,
            is_published=0,
            created_by=2
        )
        db.session.add(memoreto)
        db.session.commit()
        memoreto_id = memoreto.id
    
    response = client.delete(
        f"/memoretos/{memoreto_id}",
        headers=auth_headers
    )
    
    assert response.status_code == 403
    data = response.get_json()
    assert "No tienes permiso" in data["message"]


def test_delete_memoreto_not_found(client, auth_headers):
    """Test eliminar memoreto que no existe"""
    response = client.delete(
        "/memoretos/99999",
        headers=auth_headers
    )
    
    assert response.status_code == 404
    data = response.get_json()
    assert "Memoreto no encontrado" in data["message"]


def test_create_memoreto_with_full_data(client, auth_headers):
    """Test crear memoreto con todos los datos completos"""
    memoreto_data = {
        "title": "Memoreto Completo",
        "nivel": 5,
        "fase": 3,
        "dificultad": "expert",
        "figuras": [
            {"id": 1, "type": "triangle", "value": 10},
            {"id": 2, "type": "circle", "value": 20},
            {"id": 3, "type": "square", "value": 30}
        ],
        "number_set": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        "solution": {
            "node_1": 5,
            "node_2": 3,
            "node_3": 8,
            "node_4": 2
        },
        "is_published": True
    }
    
    response = client.post(
        "/memoretos/",
        json=memoreto_data,
        headers=auth_headers
    )
    
    assert response.status_code == 201
    data = response.get_json()
    
    assert data["memoreto"]["title"] == "Memoreto Completo"
    assert data["memoreto"]["nivel"] == 5
    assert data["memoreto"]["fase"] == 3
    assert data["memoreto"]["dificultad"] == "expert"
    assert data["memoreto"]["is_published"] is True


def test_update_memoreto_partial(client, auth_headers, app):
    """Test actualización parcial de un memoreto (solo algunos campos)"""
    with app.app_context():
    
        memoreto = Memoreto(
            id=994,
            title="Base Title",
            descripcion="Base Description",
            nivel=1,
            fase=1,
            dificultad="easy",
            figuras_json="[]",
            number_set="[]",
            solution_json="{}",
            is_validated=0,
            is_published=0,
            created_by=1
        )
        db.session.add(memoreto)
        db.session.commit()
        memoreto_id = memoreto.id
    
    response = client.put(
        f"/memoretos/{memoreto_id}",
        json={"title": "Nuevo Título", "dificultad": "hard"},
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert data["memoreto"]["title"] == "Nuevo Título"
    assert data["memoreto"]["dificultad"] == "hard"
    assert data["memoreto"]["nivel"] == 1  

def test_unauthorized_access_to_protected_endpoints(client):
    """Test acceso sin autenticación a endpoints protegidos"""
    endpoints = [
        ("/memoretos/published", "get"),
        ("/memoretos/mine", "get"),
        ("/memoretos/1", "get"),
        ("/memoretos/", "post"),
        ("/memoretos/1", "put"),
        ("/memoretos/1/answers", "get"),
        ("/memoretos/1", "delete"),
    ]
    
    for endpoint, method in endpoints:
        if method == "get":
            response = client.get(endpoint)
        elif method == "post":
            response = client.post(endpoint, json={})
        elif method == "put":
            response = client.put(endpoint, json={})
        elif method == "delete":
            response = client.delete(endpoint)
        
        assert response.status_code == 401, f"Endpoint {endpoint} debería requerir autenticación"