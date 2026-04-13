import os
import tempfile
import pytest

from backend import create_app
from backend.app.models import db as _db

# Leer el archivo SQL con datos de prueba
with open(os.path.join(os.path.dirname(__file__), "data.sql"), "rb") as f:
    _data_sql = f.read().decode("utf8")


@pytest.fixture
def app():
    """Create and configure a new app instance for each test."""
    # Crear archivo temporal para la base de datos
    db_fd, db_path = tempfile.mkstemp()
    
    # Crear la app con configuración de prueba
    app = create_app("testing")
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": f"sqlite:///{db_path}",
        "JWT_SECRET_KEY": "test-jwt-secret",
    })
    
    # Crear la base de datos y cargar datos de prueba
    with app.app_context():
        _db.create_all()  # Crear tablas desde tus modelos
        # Ejecutar el script SQL con datos de prueba
        connection = _db.engine.connect()
        connection.exec_driver_sql(_data_sql)
        connection.commit()
        connection.close()
    
    yield app
    
    # Cerrar y eliminar la base de datos temporal
    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """A test runner for the app's Click commands."""
    return app.test_cli_runner()


class AuthActions:
    def __init__(self, client):
        self._client = client

    def login(self, username="profe_test", password="password123"):
        """Login con el usuario de prueba"""
        return self._client.post(
            "/auth/login", 
            json={"username": username, "password": password}
        )

    def logout(self):
        return self._client.post("/auth/logout")
    
    def get_token(self, username="profe_test", password="password123"):
        """Obtener token JWT para pruebas autenticadas"""
        response = self.login(username, password)
        data = response.get_json()
        return data.get("access_token") if data else None
    
    def get_headers(self, username="profe_test", password="password123"):
        """Obtener headers con autenticación"""
        token = self.get_token(username, password)
        return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth(client):
    return AuthActions(client)


@pytest.fixture
def auth_headers(auth):
    """Fixture que da headers ya autenticados con profe_test"""
    return auth.get_headers()