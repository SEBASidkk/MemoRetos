import os
import sys
import tempfile
import pytest

project_root = os.path.dirname(os.path.dirname(__file__))
sys.path.insert(0, project_root)
sys.path.insert(0, os.path.join(project_root, 'backend'))

from backend import create_app, db as _db


@pytest.fixture
def app():
    db_fd, db_path = tempfile.mkstemp()

    app = create_app()
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": f"sqlite:///{db_path}",
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
        "JWT_SECRET_KEY": "test-jwt-secret",
    })

    with app.app_context():
        
        from backend.app.models import User

        _db.create_all()

        from werkzeug.security import generate_password_hash

        user = User.query.filter_by(username="profe_test").first()

        if not user:
            new_user = User(
                name="Profe",
                lastname="Test",
                username="profe_test",
                email="profe@test.com",
                password_hash=generate_password_hash("password123"),
                rol="docente",
                total_score=0,
                tutorial_completed=1
            )
            _db.session.add(new_user)
            _db.session.commit()

    yield app

    with app.app_context():
        _db.session.remove()
        _db.drop_all()

    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture
def client(app):
    return app.test_client()


class AuthActions:
    def __init__(self, client):
        self._client = client

    def login(self, username="profe_test", password="password123"):
        return self._client.post(
            "/auth/login",
            json={"username": username, "password": password}
        )

    def logout(self):
        return self._client.post("/auth/logout")

    def get_token(self, username="profe_test", password="password123"):
        response = self.login(username, password)
        if response.status_code == 200:
            return response.json.get("token")
        return None

    def get_headers(self, username="profe_test", password="password123"):
        token = self.get_token(username, password)
        if token:
            return {"Authorization": f"Bearer {token}"}
        return {}


@pytest.fixture
def auth(client):
    return AuthActions(client)


@pytest.fixture
def auth_headers(auth):
    return auth.get_headers()