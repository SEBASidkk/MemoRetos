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

    # ── Memoretos en formato server.py: shapes + nodos con posiciones explícitas ─

    #memoretos nivel 1
    # Memoreto 1: 3 circulos entrelazados, 6 puntos de interseccion
    memo1aa = Memoreto(#jala perron M1
        title="Tres Circulos Entrelazados",
        descripcion="Coloca los numeros del 1 al 6 en los nodos de interseccion. Cada circulo debe sumar exactamente 14.",
        nivel=1, fase=1, dificultad="easy",
        figuras_json=json.dumps({
            "shapes": [
                {"id": 1, "type": "circulo", "color": "#3366E6", "operacion": "suma", "target": 14,
                 "center": [-1.0,  1.0, 0], "size": [2.5, 2.5, 1]},
                {"id": 2, "type": "circulo", "color": "#3366E6", "operacion": "suma", "target": 14,
                 "center": [ 1.0,  1.0, 0], "size": [2.5, 2.5, 1]},
                {"id": 3, "type": "circulo", "color": "#3366E6", "operacion": "suma", "target": 14,
                 "center": [ 0.0, -0.5, 0], "size": [2.5, 2.5, 1]},
            ],
        }),
        number_set=json.dumps([1, 2, 3, 4, 5, 6]),
        solution_json=json.dumps({
            "Nodo_1_2_0": 6, "Nodo_1_2_1": 1,
            "Nodo_1_3_0": 3, "Nodo_1_3_1": 4,
            "Nodo_2_3_0": 2, "Nodo_2_3_1": 5,
        }),
        is_validated=True, is_published=True,
        created_by=docente.id,
    )

    # Memoreto 2: 1 triangulo, 1 elipse, 1 rectangulo — 14 puntos de interseccion
    # T∩E=6, T∩R=4, E∩R=4. Suma 1..14=105. 3×target=2×105 → target=70
    # Solución: T∩E{1,2,3,4,11,14}=35, T∩R{5,7,10,13}=35, E∩R{6,8,9,12}=35
    memo1ab = Memoreto(#jala perron M4
        title="Triangulo Elipse y Rectangulo",
        descripcion="Coloca los numeros del 1 al 14 en los 14 nodos de interseccion. El triangulo, la elipse y el rectangulo deben sumar 70 cada uno.",
        nivel=1, fase=1, dificultad="easy",
        figuras_json=json.dumps({
            "shapes": [
                {"id": 1, "type": "triangulo",  "color": "#F59E0B", "operacion": "suma", "target": 70,
                 "center": [ 0.0,  0.0, 0], "size": [2.5, 3, 1]},
                {"id": 2, "type": "elipse",     "color": "#8B5CF6", "operacion": "suma", "target": 70,
                 "center": [ 0.0, -0.3, 0], "size": [1.6, 3.2, 1]},
                {"id": 3, "type": "rectangulo", "color": "#10B981", "operacion": "suma", "target": 70,
                 "center": [ 0.0, -0.4, 0], "size": [3, 1.5, 1]},
            ],
        }),
        number_set=json.dumps(list(range(1, 15))),
        solution_json=json.dumps({
            "Nodo_1_2_0":  1, "Nodo_1_2_1":  2, "Nodo_1_2_2":  3,
            "Nodo_1_2_3":  4, "Nodo_1_2_4": 11, "Nodo_1_2_5": 14,
            "Nodo_1_3_0":  5, "Nodo_1_3_1":  7, "Nodo_1_3_2": 10, "Nodo_1_3_3": 13,
            "Nodo_2_3_0":  6, "Nodo_2_3_1":  8, "Nodo_2_3_2":  9, "Nodo_2_3_3": 12,
        }),
        is_validated=True, is_published=True,
        created_by=docente.id,
    )

    memo1ba = Memoreto(#jala perron M3
        title="Tres Circulos y Triangulo",
        descripcion="Coloca los numeros del 1 al 12 en los 12 nodos de interseccion. Los tres circulos y el triangulo deben sumar 39 cada uno.",
        nivel=1, fase=2, dificultad="easy",
        figuras_json=json.dumps({
            "shapes": [
                {"id": 1, "type": "circulo",   "color": "#3B82F6", "operacion": "suma", "target": 39,
                 "center": [-0.5, -0.8, 0], "size": [2, 2, 1]},
                {"id": 2, "type": "circulo",   "color": "#A855F7", "operacion": "suma", "target": 39,
                 "center": [ 0.5, -0.8, 0], "size": [2, 2, 1]},
                {"id": 3, "type": "circulo",   "color": "#06B6D4", "operacion": "suma", "target": 39,
                 "center": [ 0.0,  0.5, 0], "size": [2, 2, 1]},
                {"id": 4, "type": "triangulo", "color": "#EF4444", "operacion": "suma", "target": 39,
                 "center": [ 0.0,  0.0, 0], "size": [2, 2, 1]},
            ],
        }),
        number_set=json.dumps(list(range(1, 13))),
        solution_json=json.dumps({
            "Nodo_1_2_0":  1, "Nodo_1_2_1": 12,
            "Nodo_1_3_0":  2, "Nodo_1_3_1": 11,
            "Nodo_1_4_0":  3, "Nodo_1_4_1": 10,
            "Nodo_2_3_0":  4, "Nodo_2_3_1":  9,
            "Nodo_2_4_0":  5, "Nodo_2_4_1":  8,
            "Nodo_3_4_0":  6, "Nodo_3_4_1":  7,
        }),
        is_validated=True, is_published=True,
        created_by=docente.id,
    )

    # Memoreto 4: 1 circulo, 2 rectangulos (cruz) — 12 puntos de interseccion
    # C∩R_v=4, C∩R_h=4, R_v∩R_h=4. Suma 1..12=78. 3×target=2×78 → target=52
    # Solución: cada par suma 26: C∩R_v{1,5,8,12}, C∩R_h{2,6,7,11}, R_v∩R_h{3,4,9,10}
    memo1bb = Memoreto(#jala perron M5
        title="Circulo y Cruz",
        descripcion="Coloca los numeros del 1 al 12 en los 12 nodos de interseccion. El circulo y los dos rectangulos deben sumar 52 cada uno.",
        nivel=1, fase=2, dificultad="easy",
        figuras_json=json.dumps({
            "shapes": [
                {"id": 1, "type": "circulo",    "color": "#3B82F6", "operacion": "suma", "target": 52,
                 "center": [0.0, 0.0, 0], "size": [3.5, 3.5, 1]},
                {"id": 2, "type": "rectangulo", "color": "#10B981", "operacion": "suma", "target": 52,
                 "center": [0.0, 0.0, 0], "size": [1.8, 3.1, 1]},
                {"id": 3, "type": "rectangulo", "color": "#EF4444", "operacion": "suma", "target": 52,
                 "center": [0.0, 0.0, 0], "size": [3.1, 1.8, 1]},
            ],
        }),
        number_set=json.dumps(list(range(1, 13))),
        solution_json=json.dumps({
            "Nodo_1_2_0":  1, "Nodo_1_2_1":  5, "Nodo_1_2_2":  8, "Nodo_1_2_3": 12,
            "Nodo_1_3_0":  2, "Nodo_1_3_1":  6, "Nodo_1_3_2":  7, "Nodo_1_3_3": 11,
            "Nodo_2_3_0":  3, "Nodo_2_3_1":  4, "Nodo_2_3_2":  9, "Nodo_2_3_3": 10,
        }),
        is_validated=True, is_published=True,
        created_by=docente.id,
    )

    # ── Memoretos extra para Nivel 1 (Bosque) ─────────────────────────────────

    # Memoreto 1B: circulo + 2 triangulos + rectangulo — 18 nodos
    memo2aa = Memoreto(#
        title="Circulo Dos Triangulos y Rectangulo",
        descripcion="Coloca los numeros del 1 al 18 en los 18 nodos de interseccion. El circulo, los dos triangulos y el rectangulo deben sumar 91 cada uno.",
        nivel=2, fase=1, dificultad="medium",
        figuras_json=json.dumps({
            "shapes": [
                {"id": 1, "type": "circulo", "color": "#22D3EE", "operacion": "suma", "target": 91,
                 "center": [0.0, 0.0, 0], "size": [2.6, 3.0, 1]},
                {"id": 2, "type": "triangulo", "color": "#3B82F6", "operacion": "suma", "target": 91,
                 "center": [0.5, -0.5, 0], "size": [1.2, 5, 1], "rotation": 108}, # ← rotado -45°
                {"id": 3, "type": "triangulo", "color": "#3B82F6", "operacion": "suma", "target": 91,
                 "center": [0.4, 0.7, 0], "size": [1.2, 5, 1], "rotation": 100}, # ← rotado -45°
                {"id": 4, "type": "rectangulo", "color": "#10B981", "operacion": "suma", "target": 91,
                 "center": [0.45, 0.0, 0], "size": [1.2, 3.8, 1], "rotation": 10}, # ← rotado 20°
            ],
        }),
        number_set=json.dumps([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18]),
        solution_json=json.dumps({
            # Circulo(1) ∩ Triangulo(2) — 4 nodos, suma=30
            "Nodo_1_2_0": 8, "Nodo_1_2_1": 7, "Nodo_1_2_2": 8, "Nodo_1_2_3": 7,
            # Circulo(1) ∩ Triangulo(3) — 4 nodos, suma=31
            "Nodo_1_3_0": 8, "Nodo_1_3_1": 7, "Nodo_1_3_2": 8, "Nodo_1_3_3": 8,
            # Circulo(1) ∩ Rectangulo(4) — 4 nodos, suma=30
            "Nodo_1_4_0": 6, "Nodo_1_4_1": 8, "Nodo_1_4_2": 8, "Nodo_1_4_3": 8,
            # Triangulo(2) ∩ Triangulo(3) — 2 nodos, suma=30
            "Nodo_2_3_0": 15, "Nodo_2_3_1": 15,
            # Triangulo(2) ∩ Rectangulo(4) — 2 nodos, suma=31
            "Nodo_2_4_0": 16, "Nodo_2_4_1": 15,
            # Triangulo(3) ∩ Rectangulo(4) — 2 nodos, suma=30
            "Nodo_3_4_0": 16, "Nodo_3_4_1": 14,
        }),
        is_validated=True, is_published=True,
        created_by=docente.id,
    )

    # Memoreto 2AB: Dos Circulos y Dos Rectangulos — 16 nodos
    memo2ab = Memoreto(
        title="Dos Circulos y Dos Rectangulos",
        descripcion="Coloca los numeros del 1 al 16 en los 16 nodos de interseccion. Los dos circulos y los dos rectangulos deben sumar 68 cada uno.",
        nivel=2, fase=1, dificultad="medium",
        figuras_json=json.dumps({
            "shapes": [
                {"id": 1, "type": "circulo",    "color": "#22D3EE", "operacion": "suma", "target": 68,
                 "center": [-1, 0.0, 0], "size": [3.5, 3.5, 1]},
                {"id": 2, "type": "circulo",    "color": "#22D3EE", "operacion": "suma", "target": 68,
                 "center": [1,  0.0, 0], "size": [3.5, 3.5, 1]},
                {"id": 3, "type": "rectangulo", "color": "#EF4444", "operacion": "suma", "target": 68,
                 "center": [-1, 0.0, 0], "size": [3,   2,   1]},
                {"id": 4, "type": "rectangulo", "color": "#EF4444", "operacion": "suma", "target": 68,
                 "center": [1,  0.0, 0], "size": [3.4, 1,   1]},
            ],
        }),
        number_set=json.dumps(list(range(1, 17))),
        solution_json=json.dumps({
            # Circulo1(1) ∩ Circulo2(2) — 2 nodos, suma=20
            "Nodo_1_2_0": 5,  "Nodo_1_2_1": 15,
            # Circulo1(1) ∩ Rect3(3)    — 4 nodos, suma=24
            "Nodo_1_3_0": 3,  "Nodo_1_3_1": 6,  "Nodo_1_3_2": 7,  "Nodo_1_3_3": 8,
            # Circulo1(1) ∩ Rect4(4)    — 2 nodos, suma=24
            "Nodo_1_4_0": 10, "Nodo_1_4_1": 14,
            # Circulo2(2) ∩ Rect3(3)    — 2 nodos, suma=24
            "Nodo_2_3_0": 11, "Nodo_2_3_1": 13,
            # Circulo2(2) ∩ Rect4(4)    — 4 nodos, suma=24
            "Nodo_2_4_0": 1,  "Nodo_2_4_1": 2,  "Nodo_2_4_2": 9,  "Nodo_2_4_3": 12,
            # Rect3(3)    ∩ Rect4(4)    — 2 nodos, suma=20
            "Nodo_3_4_0": 4,  "Nodo_3_4_1": 16,
        }),
        is_validated=True, is_published=True,
        created_by=docente.id,
    )

    # Memoreto 1D: Dos Rectangulos cruzados — 4 nodos, medio
    memo2ba = Memoreto(
        title="Triangulo y Dos Rectangulos",
        descripcion="Coloca los numeros del 1 al 14 en los 14 nodos de interseccion. El triangulo y los dos rectangulos deben sumar 70 cada uno.",
        nivel=2, fase=2, dificultad="medium",
        figuras_json=json.dumps({
            "shapes": [
                {"id": 1, "type": "triangulo",  "color": "#3B82F6", "operacion": "suma", "target": 70,
                 "center": [0.0, 0.5, 0], "size": [4, 3, 1]},
                {"id": 2, "type": "rectangulo", "color": "#34D399", "operacion": "suma", "target": 70,
                 "center": [0.0, -0.4, 0], "size": [3.0, 2.5, 1]},
                {"id": 3, "type": "rectangulo", "color": "#F87171", "operacion": "suma", "target": 70,
                 "center": [0.0, -0.4, 0], "size": [1, 3.5, 1]},
            ],
        }),
        number_set=json.dumps(list(range(1, 15))),
        solution_json=json.dumps({
            # Triangulo(1) ∩ Rect2(2) — 6 nodos, suma=35
            "Nodo_1_2_0":  1, "Nodo_1_2_1":  2, "Nodo_1_2_2":  3,
            "Nodo_1_2_3":  4, "Nodo_1_2_4": 11, "Nodo_1_2_5": 14,
            # Triangulo(1) ∩ Rect3(3) — 4 nodos, suma=35
            "Nodo_1_3_0":  5, "Nodo_1_3_1":  8, "Nodo_1_3_2":  9, "Nodo_1_3_3": 13,
            # Rect2(2)     ∩ Rect3(3) — 4 nodos, suma=35
            "Nodo_2_3_0":  6, "Nodo_2_3_1":  7, "Nodo_2_3_2": 10, "Nodo_2_3_3": 12,
        }),
        is_validated=True, is_published=True,
        created_by=docente.id,
    )

    # Memoreto 2BB: Triangulo, Rectangulo y Circulo — 9 nodos (3 por par)
    # 3 figuras, 3 intersecciones por par → 9 nodos. Suma 1..9=45. 3×30=90=2×45 ✓
    # Cada par suma 15: T∩R={1,5,9}, T∩C={2,6,7}, R∩C={3,4,8}
    memo2bb = Memoreto( #M18
        title="Triangulo Rectangulo y Circulo",
        descripcion="Coloca los numeros del 1 al 9 en los 9 nodos de interseccion. El triangulo, el rectangulo y el circulo deben sumar 30 cada uno.",
        nivel=2, fase=2, dificultad="medium",
        figuras_json=json.dumps({
            "shapes": [
                {"id": 1, "type": "triangulo",  "color": "#3B82F6", "operacion": "suma", "target": 30,
                 "center": [0.0, -0.25, 0], "size": [2.5, 2.5, 1]},
                {"id": 2, "type": "rectangulo", "color": "#34D399", "operacion": "suma", "target": 30,
                 "center": [-0.5, 0.67, 0], "size": [4.0, 1, 1], "rotation": -25},
                {"id": 3, "type": "circulo",    "color": "#F87171", "operacion": "suma", "target": 30,
                 "center": [0.0, 0.0, 0], "size": [3, 3, 1]},
            ],
        }),
        number_set=json.dumps(list(range(1, 10))),
        solution_json=json.dumps({
            "Nodo_1_2_0": 1, "Nodo_1_2_1": 5, "Nodo_1_2_2": 9,
            "Nodo_1_3_0": 2, "Nodo_1_3_1": 6, "Nodo_1_3_2": 7,
            "Nodo_2_3_0": 3, "Nodo_2_3_1": 4, "Nodo_2_3_2": 8,
        }),
        is_validated=True, is_published=True,
        created_by=docente.id,
    )

    # Memoreto 3AA: Triangulo y Dos Rectangulos — 9 nodos (3 por par)
    # 3 figuras, 3 intersecciones por par → 9 nodos. Suma 1..9=45. 3×30=90=2×45 ✓
    # Cada par suma 15: T∩R2={1,6,8}, T∩R3={2,4,9}, R2∩R3={3,5,7}
    memo3aa = Memoreto(#jala perron M19
        title="Triangulo con Dos Rectangulos",
        descripcion="Coloca los numeros del 1 al 9 en los 9 nodos de interseccion. El triangulo y los dos rectangulos deben sumar 30 cada uno.",
        nivel=3, fase=1, dificultad="easy",
        figuras_json=json.dumps({
            "shapes": [
                {"id": 1, "type": "triangulo",  "color": "#17651D", "operacion": "suma", "target": 30,
                 "center": [-1.5, 0.0, 0], "size": [2.5, 2.5, 1], "rotation": 90},
                {"id": 2, "type": "rectangulo", "color": "#17651D", "operacion": "suma", "target": 30,
                 "center": [-0.1, 0.4, 0], "size": [3.5, 0.5, 1], "rotation": -60},
                {"id": 3, "type": "rectangulo", "color": "#17651D", "operacion": "suma", "target": 30,
                 "center": [0.0, -0.98, 0], "size": [3.5, 0.5, 1]},
            ],
        }),
        number_set=json.dumps(list(range(1, 10))),
        solution_json=json.dumps({
            "Nodo_1_2_0": 1, "Nodo_1_2_1": 6, "Nodo_1_2_2": 8,
            "Nodo_1_3_0": 2, "Nodo_1_3_1": 4, "Nodo_1_3_2": 9,
            "Nodo_2_3_0": 3, "Nodo_2_3_1": 5, "Nodo_2_3_2": 7,
        }),
        is_validated=True, is_published=True,
        created_by=docente.id,
    )

    # Memoreto 3AB: Circulo, Rectangulo y Triangulo — 8 nodos (2+4+2 por par)
    # C∩R=2, C∩T=4, R∩T=2. Suma 1..8=36. 3×24=72=2×36 ✓
    # S_12=S_13=S_23=12: C∩R={4,8}, C∩T={1,2,3,6}, R∩T={5,7}
    memo3ab = Memoreto(#jala perron M20
        title="Circulo Rectangulo y Triangulo",
        descripcion="Coloca los numeros del 1 al 8 en los 8 nodos de interseccion. El circulo, el rectangulo y el triangulo deben sumar 24 cada uno.",
        nivel=3, fase=1, dificultad="easy",
        figuras_json=json.dumps({
            "shapes": [
                {"id": 1, "type": "circulo",    "color": "#3B82F6", "operacion": "suma", "target": 24,
                 "center": [0.0, 0.0, 0], "size": [4, 2.3, 1]},
                {"id": 2, "type": "rectangulo", "color": "#10B981", "operacion": "suma", "target": 24,
                 "center": [-1.5, 0.0, 0], "size": [3, 1, 1]},
                {"id": 3, "type": "triangulo",  "color": "#EF44C1", "operacion": "suma", "target": 24,
                 "center": [0.5, -0.7, 0], "size": [3.5, 3, 1], "rotation": -126},
            ],
        }),
        number_set=json.dumps(list(range(1, 9))),
        solution_json=json.dumps({
            "Nodo_1_2_0": 4, "Nodo_1_2_1": 8,
            "Nodo_1_3_0": 1, "Nodo_1_3_1": 2, "Nodo_1_3_2": 3, "Nodo_1_3_3": 6,
            "Nodo_2_3_0": 5, "Nodo_2_3_1": 7,
        }),
        is_validated=True, is_published=True,
        created_by=docente.id,
    )

    # ── Nivel 3 Tundra ────────────────────────────────────────────────────────
    memo3ba = Memoreto(#M9
        title="Circulo con Dos Triangulos Simetricos",
        descripcion="Coloca los numeros del 1 al 12 en los 12 nodos de interseccion. El circulo y los dos triangulos deben sumar 52 cada uno.",
        nivel=3, fase=2, dificultad="medium",
        figuras_json=json.dumps({
            "shapes": [
                {"id": 1, "type": "circulo",   "color": "#3B82F6", "operacion": "suma", "target": 52,
                 "center": [0.0, 0.2, 0], "size": [4, 3.5, 1]},
                {"id": 2, "type": "triangulo", "color": "#EF4444", "operacion": "suma", "target": 52,
                 "center": [0.0, 0.3, 0], "size": [1.4, 5.2, 1], "rotation": -60},
                {"id": 3, "type": "triangulo", "color": "#22D3EE", "operacion": "suma", "target": 52,
                 "center": [0.0, 0.3, 0], "size": [1.4, 5.2, 1], "rotation":  60},
            ],
        }),
        number_set=json.dumps(list(range(1, 13))),
        solution_json=json.dumps({
            # Circulo(1) ∩ Triangulo2(2) — 4 nodos, suma=26
            "Nodo_1_2_0":  1, "Nodo_1_2_1":  6, "Nodo_1_2_2":  8, "Nodo_1_2_3": 11,
            # Circulo(1) ∩ Triangulo3(3) — 4 nodos, suma=26
            "Nodo_1_3_0":  2, "Nodo_1_3_1":  5, "Nodo_1_3_2":  9, "Nodo_1_3_3": 10,
            # Triangulo2(2) ∩ Triangulo3(3) — 4 nodos, suma=26
            "Nodo_2_3_0":  3, "Nodo_2_3_1":  4, "Nodo_2_3_2":  7, "Nodo_2_3_3": 12,
        }),
        is_validated=True, is_published=True,
        created_by=docente.id,
    )

    # Memoreto 3BB: 2 Circulos + 2 Triangulos simetricos — 12 nodos
    # 4 figuras, cada par tiene 2 intersecciones → C(4,2)×2 = 6 pares × 2 = 12 nodos
    # Suma 1..12 = 78. 4×target = 2×78 → target = 39
    # Cada par suma 13 (78/6=13): complementarios (1,12),(2,11),(3,10),(4,9),(5,8),(6,7)
    # Shape1 toca pares 1_2+1_3+1_4 → 13+13+13=39 ✓
    # Shape2 toca pares 1_2+2_3+2_4 → 13+13+13=39 ✓
    # Shape3 toca pares 1_3+2_3+3_4 → 13+13+13=39 ✓
    # Shape4 toca pares 1_4+2_4+3_4 → 13+13+13=39 ✓
    memo3bb = Memoreto(#M10 
        title="Dos Circulos con Dos Triangulos Simetricos",
        descripcion="Coloca los numeros del 1 al 12 en los 12 nodos de interseccion. Los dos circulos y los dos triangulos deben sumar 39 cada uno.",
        nivel=3, fase=2, dificultad="hard",
        figuras_json=json.dumps({
            "shapes": [
                {"id": 1, "type": "circulo",   "color": "#3B82F6", "operacion": "suma", "target": 39,
                 "center": [-0.3, 0.0, 0], "size": [2.5, 2.5, 1]},
                {"id": 2, "type": "circulo",   "color": "#3B82F6", "operacion": "suma", "target": 39,
                 "center": [ 0.3, 0.0, 0], "size": [2.5, 2.5, 1]},
                {"id": 3, "type": "triangulo", "color": "#EF4444", "operacion": "suma", "target": 39,
                 "center": [-0.75, 0.0, 0], "size": [3, 3, 1], "rotation": -90},
                {"id": 4, "type": "triangulo", "color": "#22D3EE", "operacion": "suma", "target": 39,
                 "center": [ 0.75, 0.0, 0], "size": [3, 3, 1], "rotation":  90},
            ],
        }),
        number_set=json.dumps(list(range(1, 13))),
        solution_json=json.dumps({
            # Circulo1(1) ∩ Circulo2(2)  — 2 nodos, suma=13
            "Nodo_1_2_0":  1, "Nodo_1_2_1": 12,
            # Circulo1(1) ∩ Triangulo3(3) — 2 nodos, suma=13
            "Nodo_1_3_0":  2, "Nodo_1_3_1": 11,
            # Circulo1(1) ∩ Triangulo4(4) — 2 nodos, suma=13
            "Nodo_1_4_0":  3, "Nodo_1_4_1": 10,
            # Circulo2(2) ∩ Triangulo3(3) — 2 nodos, suma=13
            "Nodo_2_3_0":  4, "Nodo_2_3_1":  9,
            # Circulo2(2) ∩ Triangulo4(4) — 2 nodos, suma=13
            "Nodo_2_4_0":  5, "Nodo_2_4_1":  8,
            # Triangulo3(3) ∩ Triangulo4(4) — 2 nodos, suma=13
            "Nodo_3_4_0":  6, "Nodo_3_4_1":  7,
        }),
        is_validated=True, is_published=True,
        created_by=docente.id,
    )

    # ── Nivel 4 Agua ──────────────────────────────────────────────────────────
    # Memoreto 4AA: Circulo, Triangulo y Rectangulo — 6 nodos
    # 3 figuras, cada par tiene 2 intersecciones → C(3,2)×2 = 3 pares × 2 = 6 nodos
    # Suma 1..6 = 21. 3×target = 2×21 → target = 14
    # Cada par suma 7 (21/3=7): complementarios (1,6),(2,5),(3,4)
    # Shape1 toca pares 1_2+1_3 → 7+7=14 ✓
    # Shape2 toca pares 1_2+2_3 → 7+7=14 ✓
    # Shape3 toca pares 1_3+2_3 → 7+7=14 ✓
    memo4aa = Memoreto(# M11
        title="Circulo Triangulo y Rectangulo",
        descripcion="Coloca los numeros del 1 al 6 en los 6 nodos de interseccion. El circulo, el triangulo y el rectangulo deben sumar 14 cada uno.",
        nivel=4, fase=1, dificultad="medium",
        figuras_json=json.dumps({
            "shapes": [
                {"id": 1, "type": "circulo",    "color": "#3B82F6", "operacion": "suma", "target": 14,
                 "center": [-0.5,  0.0, 0], "size": [2.5, 3.0, 1]},
                {"id": 2, "type": "triangulo",  "color": "#EF4444", "operacion": "suma", "target": 14,
                 "center": [ 0.5, 0.5, 0], "size": [2.5, 2.5, 1]},
                {"id": 3, "type": "rectangulo", "color": "#22D3EE", "operacion": "suma", "target": 14,
                 "center": [ 0.0, -1, 0], "size": [4.0, 1.5, 1]},
            ],
        }),
        number_set=json.dumps(list(range(1, 7))),
        solution_json=json.dumps({
            # Circulo(1)    ∩ Triangulo(2)  — 2 nodos, suma=7
            "Nodo_1_2_0": 1, "Nodo_1_2_1": 6,
            # Circulo(1)    ∩ Rectangulo(3) — 2 nodos, suma=7
            "Nodo_1_3_0": 2, "Nodo_1_3_1": 5,
            # Triangulo(2)  ∩ Rectangulo(3) — 2 nodos, suma=7
            "Nodo_2_3_0": 3, "Nodo_2_3_1": 4,
        }),
        is_validated=True, is_published=True,
        created_by=docente.id,
    )

    memo4ab = Memoreto(#M12 PENDIENTE
        title="Cinco Rectangulos",
        descripcion="Coloca los multiplos de 5 del 5 al 60 en los 12 nodos de interseccion. Los cinco rectangulos deben sumar 156 cada uno.",
        nivel=4, fase=1, dificultad="medium",
        figuras_json=json.dumps({
            "shapes": [
                {"id": 1, "type": "rectangulo",    "color": "#3B82F6", "operacion": "suma", "target": 156,
                 "center": [0.0,  0.0, 0], "size": [1, 1, 1]},
                {"id": 2, "type": "rectangulo",    "color": "#3B82F6", "operacion": "suma", "target": 156,
                 "center": [1,  0.0, 0], "size": [1, 1, 1]},
                {"id": 3, "type": "rectangulo",    "color": "#3B82F6", "operacion": "suma", "target": 156,
                 "center": [-1,  0.0, 0], "size": [1, 1, 1]},
                {"id": 4, "type": "rectangulo",    "color": "#3B82F6", "operacion": "suma", "target": 156,
                 "center": [0.0,  -1, 0], "size": [1, 1, 1]},
                {"id": 5, "type": "rectangulo",    "color": "#3B82F6", "operacion": "suma", "target": 156,
                 "center": [0.0,  1, 0], "size": [1, 1, 1]}, 
            ],
        }),
        number_set=json.dumps([5,10,15,20,25,30,35,40,45,50,55,60]),
        solution_json=json.dumps({
            # Circulo(1)    ∩ Triangulo(2)  — 2 nodos, suma=7
            "Nodo_1_2_0": 1, "Nodo_1_2_1": 6,
            # Circulo(1)    ∩ Rectangulo(3) — 2 nodos, suma=7
            "Nodo_1_3_0": 2, "Nodo_1_3_1": 5,
            # Triangulo(2)  ∩ Rectangulo(3) — 2 nodos, suma=7
            "Nodo_2_3_0": 3, "Nodo_2_3_1": 4,
        }),
        is_validated=True, is_published=True,
        created_by=docente.id,
    )

    # Memoreto 4BA: 2 Circulos + 2 Triangulos — 12 nodos
    # 4 figuras, cada par tiene 2 intersecciones → C(4,2)×2 = 6 pares × 2 = 12 nodos
    # Suma 1..12 = 78. 4×target = 2×78 → target = 39
    # Cada par suma 13: complementarios (1,12),(2,11),(3,10),(4,9),(5,8),(6,7)
    memo4ba = Memoreto(#M13
        title="Dos Circulos y Dos Triangulos",
        descripcion="Coloca los numeros del 1 al 12 en los 12 nodos de interseccion. Los dos circulos y los dos triangulos deben sumar 39 cada uno.",
        nivel=4, fase=2, dificultad="hard",
        figuras_json=json.dumps({
            "shapes": [
                {"id": 1, "type": "circulo",    "color": "#3B82F6", "operacion": "suma", "target": 39,
                 "center": [0.0,  0.0, 0], "size": [2, 2.5, 1]},
                {"id": 2, "type": "circulo",    "color": "#EE9A0A", "operacion": "suma", "target": 39,
                 "center": [0.8,  -0.9, 0], "size": [1.7, 1.6, 1]},
                {"id": 3, "type": "triangulo",  "color": "#3BF6E3", "operacion": "suma", "target": 39,
                 "center": [0.9,  0.2, 0], "size": [2, 1.8, 1], "rotation": 50},
                {"id": 4, "type": "triangulo",  "color": "#F63B3B", "operacion": "suma", "target": 39,
                 "center": [-0.7, -0.5, 0], "size": [3, 3.8, 1], "rotation": 70},
            ],
        }),
        number_set=json.dumps(list(range(1, 13))),
        solution_json=json.dumps({
            # Circulo1(1)   ∩ Circulo2(2)   — 2 nodos, suma=13
            "Nodo_1_2_0":  1, "Nodo_1_2_1": 12,
            # Circulo1(1)   ∩ Triangulo3(3) — 2 nodos, suma=13
            "Nodo_1_3_0":  2, "Nodo_1_3_1": 11,
            # Circulo1(1)   ∩ Triangulo4(4) — 2 nodos, suma=13
            "Nodo_1_4_0":  3, "Nodo_1_4_1": 10,
            # Circulo2(2)   ∩ Triangulo3(3) — 2 nodos, suma=13
            "Nodo_2_3_0":  4, "Nodo_2_3_1":  9,
            # Circulo2(2)   ∩ Triangulo4(4) — 2 nodos, suma=13
            "Nodo_2_4_0":  5, "Nodo_2_4_1":  8,
            # Triangulo3(3) ∩ Triangulo4(4) — 2 nodos, suma=13
            "Nodo_3_4_0":  6, "Nodo_3_4_1":  7,
        }),
        is_validated=True, is_published=True,
        created_by=docente.id,
    )

    # Memoreto 4BB: Circulo + 3 Triangulos — 16 nodos
    # Distribución real (Unity): C∩T2=3, C∩T3=3, C∩T4=3, T2∩T3=2, T2∩T4=2, T3∩T4=3
    # Suma 1..16 = 136. 4×target = 2×136 → target = 68
    # Simetría: S_12=S_34=22, S_13=S_24=24, S_14=S_23=22
    # Pair(1,2)={2,5,15}=22, Pair(1,3)={1,9,14}=24, Pair(1,4)={4,8,10}=22
    # Pair(2,3)={6,16}=22,   Pair(2,4)={11,13}=24,  Pair(3,4)={3,7,12}=22
    memo4bb = Memoreto(#M14
        title="Circulo y Tres Triangulos",
        descripcion="Coloca los numeros del 1 al 16 en los 16 nodos de interseccion. El circulo y los tres triangulos deben sumar 68 cada uno.",
        nivel=4, fase=2, dificultad="hard",
        figuras_json=json.dumps({
            "shapes": [
                {"id": 1, "type": "circulo",   "color": "#3B82F6", "operacion": "suma", "target": 68,
                 "center": [0.0,  -0.2, 0], "size": [4.3, 2.3, 1]},
                {"id": 2, "type": "triangulo", "color": "#3BF6E3", "operacion": "suma", "target": 68,
                 "center": [0.0,   0.3, 0], "size": [2, 2.8, 1]},
                {"id": 3, "type": "triangulo", "color": "#F63B3B", "operacion": "suma", "target": 68,
                 "center": [1.0,  -0.4, 0], "size": [3, 1.8, 1], "rotation": -127},
                {"id": 4, "type": "triangulo", "color": "#5B4598", "operacion": "suma", "target": 68,
                 "center": [-1.0, -0.4, 0], "size": [3, 1.8, 1], "rotation": 127},
            ],
        }),
        number_set=json.dumps(list(range(1, 17))),
        solution_json=json.dumps({
            # Circulo(1)    ∩ Triangulo2(2) — 3 nodos, suma=22
            "Nodo_1_2_0":  2, "Nodo_1_2_1":  5, "Nodo_1_2_2": 15,
            # Circulo(1)    ∩ Triangulo3(3) — 3 nodos, suma=24
            "Nodo_1_3_0":  1, "Nodo_1_3_1":  9, "Nodo_1_3_2": 14,
            # Circulo(1)    ∩ Triangulo4(4) — 3 nodos, suma=22
            "Nodo_1_4_0":  4, "Nodo_1_4_1":  8, "Nodo_1_4_2": 10,
            # Triangulo2(2) ∩ Triangulo3(3) — 2 nodos, suma=22
            "Nodo_2_3_0":  6, "Nodo_2_3_1": 16,
            # Triangulo2(2) ∩ Triangulo4(4) — 2 nodos, suma=24
            "Nodo_2_4_0": 11, "Nodo_2_4_1": 13,
            # Triangulo3(3) ∩ Triangulo4(4) — 3 nodos, suma=22
            "Nodo_3_4_0":  3, "Nodo_3_4_1":  7, "Nodo_3_4_2": 12,
        }),
        is_validated=True, is_published=True,
        created_by=docente.id,
    )

    # Memoreto 5AA: Circulo + Triangulo + Rectangulo — 11 nodos
    # C∩T=3, C∩R=4, T∩R=4. Suma 1..11=66. 3×target=2×66 → target=44
    # S_12=S_13=S_23=22: Group_12={3,8,11}, Group_13={1,4,7,10}, Group_23={2,5,6,9}
    memo5aa = Memoreto(#M15
        title="Circulo Triangulo y Rectangulo",
        descripcion="Coloca los numeros del 1 al 11 en los 11 nodos de interseccion. El circulo, el triangulo y el rectangulo deben sumar 44 cada uno.",
        nivel=5, fase=1, dificultad="hard",
        figuras_json=json.dumps({
            "shapes": [
                {"id": 1, "type": "circulo",    "color": "#3B82F6", "operacion": "suma", "target": 44,
                 "center": [0.0,  0.0, 0], "size": [3.5, 2.5, 1]},
                {"id": 2, "type": "triangulo",  "color": "#3BF6E3", "operacion": "suma", "target": 44,
                 "center": [0.0,  0.1, 0], "size": [1.9, 2.3, 1]},
                {"id": 3, "type": "rectangulo", "color": "#3B82F6", "operacion": "suma", "target": 44,
                 "center": [0.0,  0.0, 0], "size": [4.5, 1, 1]},
            ],
        }),
        number_set=json.dumps(list(range(1, 12))),
        solution_json=json.dumps({
            # Circulo(1)    ∩ Triangulo(2)   — 3 nodos, suma=22
            "Nodo_1_2_0":  3, "Nodo_1_2_1":  8, "Nodo_1_2_2": 11,
            # Circulo(1)    ∩ Rectangulo(3)  — 4 nodos, suma=22
            "Nodo_1_3_0":  1, "Nodo_1_3_1":  4, "Nodo_1_3_2":  7, "Nodo_1_3_3": 10,
            # Triangulo(2)  ∩ Rectangulo(3)  — 4 nodos, suma=22
            "Nodo_2_3_0":  2, "Nodo_2_3_1":  5, "Nodo_2_3_2":  6, "Nodo_2_3_3":  9,
        }),
        is_validated=True, is_published=True,
        created_by=docente.id,
    )

    # Memoreto 5AB: 2 Circulos + Rectangulo — 6 nodos (1 triple + 1 par + 2 par + 2 par)
    # Triple(1,2,3)=1, Pair(1,2)=1, Pair(1,3)=2, Pair(2,3)=2. Suma 1..6=21.
    # v_triple=3-2P+15=3, S_12=6, S_13=S_23=6 → target=15 ✓
    memo5ab = Memoreto(#M16
        title="Dos Circulos y Rectangulo",
        descripcion="Coloca los numeros del 1 al 6 en los 6 nodos de interseccion. Los dos circulos y el rectangulo deben sumar 15 cada uno.",
        nivel=5, fase=1, dificultad="hard",
        figuras_json=json.dumps({
            "shapes": [
                {"id": 1, "type": "circulo",    "color": "#3B82F6", "operacion": "suma", "target": 15,
                 "center": [ 0.8,  0.0, 0], "size": [3, 3, 1]},
                {"id": 2, "type": "circulo",    "color": "#3BF6E3", "operacion": "suma", "target": 15,
                 "center": [-0.8,  0.0, 0], "size": [3, 3, 1]},
                {"id": 3, "type": "rectangulo", "color": "#BD4A2A", "operacion": "suma", "target": 15,
                 "center": [ 0.0, -0.5, 0], "size": [3.4, 3.5, 1]},
            ],
        }),
        number_set=json.dumps(list(range(1, 7))),
        solution_json=json.dumps({
            # Triple(1,2,3)              — 1 nodo, pertenece a las 3 figuras
            "Nodo_1_2_3_0": 3,
            # Circulo1(1) ∩ Circulo2(2) — 1 nodo, suma=6
            "Nodo_1_2_0":   6,
            # Circulo1(1) ∩ Rect(3)     — 2 nodos, suma=6
            "Nodo_1_3_0":   1, "Nodo_1_3_1": 5,
            # Circulo2(2) ∩ Rect(3)     — 2 nodos, suma=6
            "Nodo_2_3_0":   2, "Nodo_2_3_1": 4,
        }),
        is_validated=True, is_published=True,
        created_by=docente.id,
    )

    # Memoreto 5BA: Circulo + Triangulo + Rectangulo — 10 nodos
    # Triple(1,2,3)=2, Pair(1,2)=4, Pair(1,3)=2, Pair(2,3)=2. Suma 1..10=55.
    # S_123=4, S_12=S_13=S_23=17 → target=4+17+17=38 ✓
    # Triple:{1,3}, Pair12:{2,4,5,6}, Pair13:{7,10}, Pair23:{8,9}
    memo5ba = Memoreto(#M17
        title="Circulo Triangulo y Rectangulo",
        descripcion="Coloca los numeros del 1 al 10 en los 10 nodos de interseccion. El circulo, el triangulo y el rectangulo deben sumar 38 cada uno.",
        nivel=5, fase=2, dificultad="hard",
        figuras_json=json.dumps({
            "shapes": [
                {"id": 1, "type": "circulo",    "color": "#3B82F6", "operacion": "suma", "target": 38,
                 "center": [ 0.0, -0.4, 0], "size": [2.5, 2.8, 1]},
                {"id": 2, "type": "triangulo",  "color": "#F59E0B", "operacion": "suma", "target": 38,
                 "center": [ 0.0,  0.0, 0], "size": [3.2, 3.2, 1]},
                {"id": 3, "type": "rectangulo", "color": "#BD4A2A", "operacion": "suma", "target": 38,
                 "center": [ 0.0, -0.3, 0], "size": [4.5, 1,   1]},
            ],
        }),
        number_set=json.dumps(list(range(1, 11))),
        solution_json=json.dumps({
            # Triple(1,2,3)             — 2 nodos, suma=4
            "Nodo_1_2_3_0":  1, "Nodo_1_2_3_1":  3,
            # Circulo(1) ∩ Triangulo(2) — 4 nodos, suma=17
            "Nodo_1_2_0":    2, "Nodo_1_2_1":    4, "Nodo_1_2_2":  5, "Nodo_1_2_3":  6,
            # Circulo(1) ∩ Rect(3)      — 2 nodos, suma=17
            "Nodo_1_3_0":    7, "Nodo_1_3_1":   10,
            # Triangulo(2) ∩ Rect(3)    — 2 nodos, suma=17
            "Nodo_2_3_0":    8, "Nodo_2_3_1":    9,
        }),
        is_validated=True, is_published=True,
        created_by=docente.id,
    )

    memo5bb = Memoreto(#M
        title="Circulo Triangulo y Rectangulo",
        descripcion="Coloca los numeros del 1 al 10 en los 10 nodos de interseccion. El circulo, el triangulo y el rectangulo deben sumar 38 cada uno.",
        nivel=5, fase=2, dificultad="hard",
        figuras_json=json.dumps({
            "shapes": [
                {"id": 1, "type": "hexagono",    "color": "#3B82F6", "operacion": "suma", "target": 245,
                 "center": [ -0.4, 0.9, 0], "size": [2, 2, 1], "rotation": 90},
                {"id": 2, "type": "pentagono",    "color": "#3B82F6", "operacion": "suma", "target": 245,
                 "center": [ -0.3, -0.1, 0], "size": [4, 2.3, 1], "rotation": 180},
                {"id": 3, "type": "triangulo",    "color": "#3B82F6", "operacion": "suma", "target": 245,
                 "center": [ -1.5, 0.0, 0], "size": [3, 2, 1], "rotation": 126},
                {"id": 4, "type": "rectangulo",    "color": "#3B82F6", "operacion": "suma", "target": 245,
                 "center": [ 0.5, 0.0, 0], "size": [2, 2.5, 1]},
                
            ],
        }),
        number_set=json.dumps(list(range(7,77))),
        solution_json=json.dumps({
            # Triple(1,2,3)             — 2 nodos, suma=4
            "Nodo_1_2_3_0":  1, "Nodo_1_2_3_1":  3,
            # Circulo(1) ∩ Triangulo(2) — 4 nodos, suma=17
            "Nodo_1_2_0":    2, "Nodo_1_2_1":    4, "Nodo_1_2_2":  5, "Nodo_1_2_3":  6,
            # Circulo(1) ∩ Rect(3)      — 2 nodos, suma=17
            "Nodo_1_3_0":    7, "Nodo_1_3_1":   10,
            # Triangulo(2) ∩ Rect(3)    — 2 nodos, suma=17
            "Nodo_2_3_0":    8, "Nodo_2_3_1":    9,
        }),
        is_validated=True, is_published=True,
        created_by=docente.id,
    )

    # Memoreto 5BB: Hexagono + Pentagono + Triangulo + Rectangulo — 12 nodos (2 por par)
    # 4 figuras, C(4,2)=6 pares × 2 nodos = 12 nodos. Multiplos de 7: {7..84}, suma=546
    # 4×target = 2×546 → target=273. Cada par suma 546/6=91: complementarios (x, 91-x)
    memo5bb = Memoreto(
        title="Hexagono Pentagono Triangulo y Rectangulo",
        descripcion="Coloca los multiplos de 7 del 7 al 84 en los 12 nodos de interseccion. El hexagono, el pentagono, el triangulo y el rectangulo deben sumar 273 cada uno.",
        nivel=5, fase=2, dificultad="hard",
        figuras_json=json.dumps({
            "shapes": [
                {"id": 1, "type": "hexagono",   "color": "#3B82F6", "operacion": "suma", "target": 273,
                 "center": [0.0, 0.0, 0], "size": [3.0, 3.0, 1]},
                {"id": 2, "type": "pentagono",  "color": "#A855F7", "operacion": "suma", "target": 273,
                 "center": [0.0, 0.0, 0], "size": [2.5, 2.5, 1]},
                {"id": 3, "type": "triangulo",  "color": "#EF4444", "operacion": "suma", "target": 273,
                 "center": [0.0, 0.0, 0], "size": [3.0, 3.0, 1]},
                {"id": 4, "type": "rectangulo", "color": "#10B981", "operacion": "suma", "target": 273,
                 "center": [0.0, 0.0, 0], "size": [3.5, 2.5, 1]},
            ],
        }),
        number_set=json.dumps([7,14,21,28,35,42,49,56,63,70,77,84]),
        solution_json=json.dumps({
            "Nodo_1_2_0":  7, "Nodo_1_2_1": 84,
            "Nodo_1_3_0": 14, "Nodo_1_3_1": 77,
            "Nodo_1_4_0": 21, "Nodo_1_4_1": 70,
            "Nodo_2_3_0": 28, "Nodo_2_3_1": 63,
            "Nodo_2_4_0": 35, "Nodo_2_4_1": 56,
            "Nodo_3_4_0": 42, "Nodo_3_4_1": 49,
        }),
        is_validated=True, is_published=True,
        created_by=docente.id,
    )

    all_memos = [memo1aa, memo1ab, memo1ba, memo1bb, memo2aa, memo2ab, memo2ba, memo2bb, memo3aa, memo3ab, memo3ba, memo3bb, memo4aa,
                  memo4ab, memo4ba,memo4bb,memo5aa,memo5ab,memo5ba,memo5bb]
    db.session.add_all(all_memos)
    db.session.commit()
    print(f"{len(all_memos)} memoretos creados.")

    group = Group(name="TC2005B Gpo 441", code="TC441A", teacher_id=docente.id)
    db.session.add(group)
    db.session.commit()

    group.students.extend([sebas, flor, santiago, ximena, carlos])
    group.memoretos.extend(all_memos)
    db.session.commit()
    print("Grupo creado con 5 estudiantes y 10 memoretos asignados.")

    from datetime import date, timedelta
    estudiantes = [sebas, flor, santiago, ximena, carlos]
    memos = all_memos
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
    print(f"\nMemoretos publicados: {Memoreto.query.filter_by(is_published=True).count()} (6 en Bosque, 2 en Desierto/Tundra/Agua/Volcan)")
    print(f"Grupo: {group.name} (code={group.code})")
    print("\nEjecuta:  python run.py")
