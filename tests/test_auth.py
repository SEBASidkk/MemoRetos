import pytest


def test_login_success(client, auth):
    """Login exitoso debe devolver token"""
    response = auth.login()
    assert response.status_code == 200
    assert "token" in response.json
    assert "user" in response.json
    assert response.json["user"]["username"] == "profe_test"


def test_login_invalid_password(client, auth):
    """Login con contraseña incorrecta"""
    response = auth.login(password="wrongpass")
    assert response.status_code == 401
    assert "Credenciales incorrectas" in response.json["message"]


def test_login_missing_fields(client):
    """Login con campos faltantes"""
    response = client.post("/auth/login", json={"username": "test"})
    assert response.status_code == 400
    assert "Faltan username o password" in response.json["message"]


def test_register_success(client):
    """Registro exitoso"""
    response = client.post("/auth/register", json={
        "name": "Nuevo",
        "lastname": "Usuario",
        "username": "nuevo123",
        "email": "nuevo@test.com",
        "password": "password123",
        "rol": "estudiante"
    })
    
    assert response.status_code == 201
    assert "token" in response.json
    assert "user" in response.json
    assert response.json["user"]["username"] == "nuevo123"


def test_register_missing_fields(client):
    """Registro con campos faltantes debe dar error"""
    response = client.post("/auth/register", json={
        "name": "Nuevo",
        "lastname": "Usuario",
        "username": "nuevo123"
    })
    assert response.status_code == 400
    assert "Faltan campos obligatorios" in response.json["message"]


def test_register_duplicate_user(client):
    """Registro con usuario duplicado"""
    # Primer registro
    client.post("/auth/register", json={
        "name": "Original",
        "lastname": "User",
        "username": "duplicado",
        "email": "duplicado1@test.com",
        "password": "pass123",
        "rol": "estudiante"
    })
    
    response = client.post("/auth/register", json={
        "name": "Duplicado",
        "lastname": "User",
        "username": "duplicado",
        "email": "duplicado2@test.com",
        "password": "pass123",
        "rol": "estudiante"
    })
    
    assert response.status_code == 409
    assert "Username o email ya registrado" in response.json["message"]


def test_me_authenticated(client, auth):
    """Obtener perfil con token válido"""
    login_response = auth.login()
    token = login_response.json["token"]
    
    response = client.get("/auth/me", headers={
        "Authorization": f"Bearer {token}"
    })
    assert response.status_code == 200
    assert response.json["username"] == "profe_test"


def test_me_unauthenticated(client):
    """Obtener perfil sin token debe dar error"""
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_logout_success(client, auth):
    """Logout exitoso"""
    login_response = auth.login()
    token = login_response.json["token"]
    
    response = client.post("/auth/logout", headers={
        "Authorization": f"Bearer {token}"
    })
    assert response.status_code == 200
    assert response.json["ok"] is True


def test_token_revoked_after_logout(client, auth):
    """Token no debe funcionar después de logout"""
    login_response = auth.login()
    token = login_response.json["token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    response1 = client.get("/auth/me", headers=headers)
    assert response1.status_code == 200
    
    client.post("/auth/logout", headers=headers)
    
    response2 = client.get("/auth/me", headers=headers)
    assert response2.status_code == 401


def test_login_and_register_flow(client, auth):
    """Flujo completo: registrar nuevo usuario y login"""

    register_response = client.post("/auth/register", json={
        "name": "Flow",
        "lastname": "Test",
        "username": "flowuser",
        "email": "flow@test.com",
        "password": "flow123",
        "rol": "estudiante"
    })
    assert register_response.status_code == 201
    
    login_response = auth.login("flowuser", "flow123")
    assert login_response.status_code == 200
    assert "token" in login_response.json