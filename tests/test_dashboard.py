import pytest
from flask.testing import FlaskClient
from tests.conftest import AuthActions

# =========================
# RANKING GLOBAL
# =========================

def test_dashboard_ranking_global(client: FlaskClient):
    response = client.get("/dashboard/ranking?page=1&limit=10")

    assert response.status_code == 200
    data = response.get_json()

    assert "ranking" in data
    assert "pagination" in data
    assert "count" in data
    assert isinstance(data["ranking"], list)


def test_dashboard_ranking_structure(client: FlaskClient):
    response = client.get("/dashboard/ranking")

    assert response.status_code == 200
    data = response.get_json()

    if len(data["ranking"]) > 0:
        user = data["ranking"][0]
        assert "username" in user
        assert "rank" in user


# =========================
# RANKING POR USUARIO
# =========================

def test_dashboard_ranking_user(client: FlaskClient):
    response = client.get("/dashboard/ranking/user/1")

    assert response.status_code == 200
    data = response.get_json()

    assert "user" in data
    assert "rank" in data


def test_dashboard_ranking_user_not_found(client: FlaskClient):
    response = client.get("/dashboard/ranking/user/99999")

    assert response.status_code == 404
    data = response.get_json()

    assert "Usuario no encontrado" in data["message"]


# =========================
# RANKING ME 
# =========================

def test_dashboard_ranking_me(client: FlaskClient, auth: AuthActions):
    login_response = auth.login()
    token = login_response.get_json()["token"]

    response = client.get(
        "/dashboard/ranking/me",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.get_json()

    assert "user" in data
    assert "rank" in data


# =========================
# STATS De LOS SCATTER
# =========================

def test_stats_scatter(client: FlaskClient):
    response = client.get("/dashboard/stats/scatter")

    assert response.status_code == 200
    data = response.get_json()

    assert "data" in data
    assert isinstance(data["data"], list)


# =========================
# STATS DE PROGRESO
# =========================

def test_stats_progreso(client: FlaskClient):
    response = client.get("/dashboard/stats/progreso")

    assert response.status_code == 200
    data = response.get_json()

    assert "data" in data
    assert isinstance(data["data"], dict)