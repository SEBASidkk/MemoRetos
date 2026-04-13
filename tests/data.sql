-- Limpiar tablas (orden por FK)
DELETE FROM player_answers;
DELETE FROM game_sessions;
DELETE FROM memoretos;

-- =========================
-- MEMORETO
-- =========================

INSERT INTO memoretos (
    id, title, descripcion, nivel, fase, dificultad,
    figuras_json, number_set, solution_json,
    is_validated, is_published, created_by
)
VALUES (
    1,
    'Tres Circulos Entrelazados',
    'Coloca los numeros del 1 al 6 en los nodos. Cada circulo debe sumar 14.',
    1, 1, 'easy',
    '{"shapes": [{"id": 1, "type": "circulo", "color": "#3366E6", "operacion": "suma", "target": 14}, {"id": 2, "type": "circulo", "color": "#3366E6", "operacion": "suma", "target": 14}, {"id": 3, "type": "circulo", "color": "#3366E6", "operacion": "suma", "target": 14}]}',
    '[1, 2, 3, 4, 5, 6]',
    '{"Nodo_1_2_0": 6, "Nodo_1_2_1": 1, "Nodo_1_3_0": 3, "Nodo_1_3_1": 4, "Nodo_2_3_0": 2, "Nodo_2_3_1": 5}',
    1, 1, 1
);
