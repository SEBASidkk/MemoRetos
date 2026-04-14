from flask.testing import FlaskClient


def create_group(client, auth_headers):
    resp = client.post(
        "/groups/",
        json={"name": "Grupo Test"},
        headers=auth_headers
    )
    assert resp.status_code == 201
    return resp.get_json()["group"]


def test_get_my_groups(client: FlaskClient, auth_headers):
    create_group(client, auth_headers)

    response = client.get("/groups/mine", headers=auth_headers)
    assert response.status_code == 200

    data = response.get_json()
    assert "groups" in data
    assert len(data["groups"]) >= 1


def test_get_group_by_id(client: FlaskClient, auth_headers):
    group = create_group(client, auth_headers)

    response = client.get(f"/groups/{group['id']}", headers=auth_headers)

    assert response.status_code == 200
    data = response.get_json()

    assert "group" in data
    assert data["group"]["id"] == group["id"]
    assert "_links" in data


def test_join_group_invalid_code(client: FlaskClient, auth_headers):
    response = client.post(
        "/groups/INVALID/members",
        headers=auth_headers
    )

    assert response.status_code == 404
    data = response.get_json()

    # backend real tiene acento
    assert "Código inválido" in data["message"]


def test_assign_memoreto_missing_field(client: FlaskClient, auth_headers):
    group = create_group(client, auth_headers)

    response = client.post(
        f"/groups/{group['id']}/memoretos",
        json={},
        headers=auth_headers
    )

    assert response.status_code == 400
    data = response.get_json()
    assert "memoreto_id" in data["message"]