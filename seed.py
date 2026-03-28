"""
python seed.py
"""
import sys, os, json

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from backend import create_app, db
from app.models.user import User
from app.models.memoreto import Memoreto
from app.models.game_session import GameSession, SessionEvent
from app.models.player_answer import PlayerAnswer
from app.models.group import Group

app = create_app("development")

with app.app_context():
    # Borrar y recrear tablas
    db.drop_all()
    db.create_all()
    print("Tablas creadas.")

    docente = User(
        name="Profe", lastname="Test",
        username="profe_test", email="profe@tec.mx",
        rol="docente", group="441", total_score=0,
    )
    docente.set_password("password123")

    sebas = User(
        name="Sebas", lastname="Cruz",
        username="sebas_cruz", email="sebas@tec.mx",
        rol="estudiante", group="111", total_score=120,
        tutorial_completed=True,
    )
    sebas.set_password("password123")

    flor = User(
        name="Flor", lastname="Rodriguez",
        username="flor_rh", email="flor@tec.mx",
        rol="estudiante", group="111", total_score=4500,
    )
    flor.set_password("password123")

    santiago = User(
        name="Santiago", lastname="Leon",
        username="santi_lh", email="santi@tec.mx",
        rol="estudiante", group="111", total_score=3200,
    )
    santiago.set_password("password123")

    ximena = User(
        name="Ximena", lastname="Camacho",
        username="xime_cf", email="xime@tec.mx",
        rol="estudiante", group="111", total_score=2800,
    )
    ximena.set_password("password123")

    carlos = User(
        name="Carlos", lastname="Gomez",
        username="carlos_gm", email="carlos@tec.mx",
        rol="estudiante", group="111", total_score=9850,
    )
    carlos.set_password("password123")

    users = [docente, sebas, flor, santiago, ximena, carlos]
    db.session.add_all(users)
    db.session.commit()
    print(f"{len(users)} usuarios creados.")

    memo1 = Memoreto(
        title="Triangulo + Rectangulo Basico",
        nivel=1, fase=1, dificultad="easy",
        figuras_json=json.dumps([
            {
                "id": 1, "type": "triangulo", "color": "#4F46E5",
                "operacion": "suma", "target": 10, "nodos": [1, 2, 4]
            },
            {
                "id": 2, "type": "rectangulo", "color": "#10B981",
                "operacion": "suma", "target": 7, "nodos": [2, 3, 4]
            }
        ]),
        number_set=json.dumps([1, 2, 3, 4]),
        solution_json=json.dumps({"1": 4, "2": 3, "3": 1, "4": 3}),
        is_validated=True, is_published=True,
        created_by=docente.id,
    )

    memo2 = Memoreto(
        title="Doble Triangulo",
        nivel=1, fase=2, dificultad="medium",
        figuras_json=json.dumps([
            {
                "id": 1, "type": "triangulo", "color": "#EF4444",
                "operacion": "suma", "target": 12, "nodos": [1, 2, 3]
            },
            {
                "id": 2, "type": "triangulo", "color": "#F59E0B",
                "operacion": "suma", "target": 9, "nodos": [2, 3, 5]
            }
        ]),
        number_set=json.dumps([1, 2, 3, 4, 5]),
        solution_json=json.dumps({"1": 5, "2": 4, "3": 3, "5": 2}),
        is_validated=True, is_published=True,
        created_by=docente.id,
    )

    memo3 = Memoreto(
        title="Tres Figuras Complejo",
        nivel=2, fase=1, dificultad="hard",
        figuras_json=json.dumps([
            {
                "id": 1, "type": "triangulo", "color": "#8B5CF6",
                "operacion": "suma", "target": 15, "nodos": [1, 2, 3]
            },
            {
                "id": 2, "type": "rectangulo", "color": "#06B6D4",
                "operacion": "suma", "target": 10, "nodos": [2, 4, 5]
            },
            {
                "id": 3, "type": "circulo", "color": "#EC4899",
                "operacion": "suma", "target": 8, "nodos": [3, 5, 6]
            }
        ]),
        number_set=json.dumps([1, 2, 3, 4, 5, 6]),
        solution_json=json.dumps({}),
        is_validated=False, is_published=True,
        created_by=docente.id,
    )

    db.session.add_all([memo1, memo2, memo3])
    db.session.commit()
    print("3 memoretos creados.")

    group = Group(name="TC2005B Gpo 441", code="TC441A", teacher_id=docente.id)
    db.session.add(group)
    db.session.commit()

    group.students.extend([sebas, flor, santiago, ximena, carlos])
    group.memoretos.extend([memo1, memo2])
    db.session.commit()
    print("Grupo creado con 5 estudiantes y 2 memoretos asignados.")

    from datetime import date, timedelta
    estudiantes = [sebas, flor, santiago, ximena, carlos]
    memos = [memo1, memo2, memo3]
    import random
    random.seed(42)
    answers = []
    base_date = date(2025, 3, 1)
    for i, est in enumerate(estudiantes):
        for j, memo in enumerate(memos):
            for k in range(4):
                day_offset = i * 3 + j * 5 + k * 7
                score_map = {"easy": random.randint(800, 1000), "medium": random.randint(600, 800), "hard": random.randint(350, 600)}
                time_map  = {"easy": random.randint(30, 90),    "medium": random.randint(80, 150),  "hard": random.randint(130, 230)}
                answers.append(PlayerAnswer(
                    user_id=est.id,
                    memoreto_id=memo.id,
                    respuesta_json="{}",
                    resuelto=True,
                    score=score_map[memo.dificultad],
                    time_seconds=time_map[memo.dificultad],
                    intentos=random.randint(1, 3),
                    submitted_at=base_date + timedelta(days=day_offset % 30),
                ))
    db.session.add_all(answers)
    db.session.commit()
    print(f"{len(answers)} player_answers creados.")

    print("\n=== DATOS DE PRUEBA LISTOS ===")

    print("Usuarios (password: password123):")
    for u in users:
        print(f"  {u.rol:12s}  {u.username:16s}  score={u.total_score}")
    print(f"\nMemoretos publicados: {Memoreto.query.filter_by(is_published=True).count()}")
    print(f"Grupo: {group.name} (code={group.code})")
    print("\nEjecuta:  python run.py")
