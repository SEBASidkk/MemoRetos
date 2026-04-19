DELETE FROM player_answers;
DELETE FROM game_sessions;
DELETE FROM groups;
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
    '{"shapes": [
        {"id": 1, "type": "circulo", "target": 14},
        {"id": 2, "type": "circulo", "target": 14},
        {"id": 3, "type": "circulo", "target": 14}
    ]}',
    '[1, 2, 3, 4, 5, 6]',
    '{"Nodo_1_2_0": 6, "Nodo_1_2_1": 1}',
    1, 1, 1
);

-- =========================
-- PLAYER ANSWERS
-- =========================
INSERT INTO player_answers (
    user_id,
    memoreto_id,
    respuesta_json,
    resuelto,
    score,
    time_seconds,
    intentos,
    submitted_at
)
VALUES
(1, 1, '{"Nodo_1_2_0": 6}', 1, 1000, 30, 1, CURRENT_TIMESTAMP),
(2, 1, '{"Nodo_1_2_0": 5}', 1, 500, 45, 2, CURRENT_TIMESTAMP);

-- =========================
-- GROUPS
-- =========================
INSERT INTO groups (id, name, code, teacher_id, created_at)
VALUES (1, 'Grupo Test', 'TC2005B', 1, CURRENT_TIMESTAMP);