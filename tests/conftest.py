import os
import sys
import tempfile
import pytest

project_root = os.path.dirname(os.path.dirname(__file__))
sys.path.insert(0, project_root)
sys.path.insert(0, os.path.join(project_root, 'backend'))

from backend import create_app, db as _db
from app.models.user import User


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
        _db.create_all()

        # ================
        # USUARIOS BASE
        # ================
        user = User(
            id=1,
            name="Profe",
            lastname="Test",
            username="profe_test",
            email="profe@tec.mx",
            rol="docente"
        )
        user.set_password("password123")
        _db.session.add(user)

        user2 = User(
            id=2,
            name="Estudiante",
            lastname="Test",
            username="estudiante_test",
            email="estudiante@tec.mx",
            rol="estudiante"
        )
        user2.set_password("password123")
        _db.session.add(user2)

        _db.session.commit()

        # =========================
        # CARGA DE MEMORETOS
        # =========================
        connection = _db.engine.connect()

        sql_file_path = os.path.join(project_root, "tests", "data.sql")
        with open(sql_file_path, "r", encoding="utf-8") as f:
            sql_script = f.read()

        for statement in sql_script.split(";"):
            stmt = statement.strip()
            if stmt:
                connection.exec_driver_sql(stmt)

        connection.commit()
        connection.close()

    yield app

    with app.app_context():
        _db.session.remove()
        _db.drop_all()

    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def runner(app):
    return app.test_cli_runner()


# ===============
# AUTH HELPER 
# ===============
class AuthActions:
    def __init__(self, client):
        self._client = client

    def login(self, username="profe_test", password="password123"):
        return self._client.post(
            "/auth/login",
            json={"username": username, "password": password}
        )

    def logout(self, headers):
        return self._client.post("/auth/logout", headers=headers)

    def get_token(self, username="profe_test", password="password123"):
        response = self.login(username, password)
        data = response.get_json()
        return data.get("token") if data else None

    def get_headers(self, username="profe_test", password="password123"):
        token = self.get_token(username, password)
        return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth(client):
    return AuthActions(client)


@pytest.fixture
def auth_headers(auth):
    return auth.get_headers()

@pytest.fixture
def student_auth_headers(auth):
    """Headers de autenticación para estudiante (usuario id=2)"""
    return auth.get_headers(username="estudiante_test", password="password123")

@pytest.fixture
def student_auth_headers(auth):
    """Headers de autenticación para estudiante (usuario id=2)"""
    return auth.get_headers(username="estudiante_test", password="password123")