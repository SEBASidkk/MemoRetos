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
        from backend.app.models import User, Memoreto

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
            _db.session.flush()

            # Crear memoreto de prueba
            memoreto = Memoreto(
                id=1,
                title="Tres Circulos Entrelazados",
                descripcion="Coloca los numeros del 1 al 6 en los nodos. Cada circulo debe sumar 14.",
                nivel=1,
                fase=1,
                dificultad="easy",
                figuras_json='{"shapes": [{"id": 1, "type": "circulo", "color": "#3366E6", "operacion": "suma", "target": 14}, {"id": 2, "type": "circulo", "color": "#3366E6", "operacion": "suma", "target": 14}, {"id": 3, "type": "circulo", "color": "#3366E6", "operacion": "suma", "target": 14}]}',
                number_set='[1, 2, 3, 4, 5, 6]',
                solution_json='{"Nodo_1_2_0": 6, "Nodo_1_2_1": 1, "Nodo_1_3_0": 3, "Nodo_1_3_1": 4, "Nodo_2_3_0": 2, "Nodo_2_3_1": 5}',
                is_validated=True,
                is_published=True,
                created_by=new_user.id
            )
            _db.session.add(memoreto)
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


@pytest.fixture
def auth_headers(app):
    """Crear token JWT directamente sin usar el endpoint /auth/login"""
    from flask_jwt_extended import create_access_token
    with app.app_context():
        from backend.app.models import User
        user = User.query.filter_by(username="profe_test").first()
        user_id = str(user.id) if user else "1"
        token = create_access_token(identity=user_id)
        return {"Authorization": f"Bearer {token}"}