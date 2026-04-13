-- Limpiar tablas
DELETE FROM player_answer;
DELETE FROM game_session;
DELETE FROM memoreto;
DELETE FROM user;

-- Insertar usuario profe_test
INSERT INTO user (id, name, lastname, username, email, password_hash, rol, group_name, total_score, tutorial_completed)
VALUES (1, 'Profe', 'Test', 'profe_test', 'profe@tec.mx', 'scrypt:32768:8:1$wgK8Y0XpL3pF6qHk$6c6f4c4d8e9f2a1b3c5d7e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c', 'docente', '441', 0, 1);

-- Insertar estudiante de prueba
INSERT INTO user (id, name, lastname, username, email, password_hash, rol, group_name, total_score, tutorial_completed)
VALUES (2, 'Estudiante', 'Test', 'estudiante_test', 'estudiante@tec.mx', 'scrypt:32768:8:1$wgK8Y0XpL3pF6qHk$6c6f4c4d8e9f2a1b3c5d7e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c', 'estudiante', '111', 0, 1);

-- Insertar memoreto de prueba (3 círculos)
INSERT INTO memoreto (id, title, descripcion, nivel, fase, dificultad, figuras_json, number_set, solution_json, is_validated, is_published, created_by)
VALUES (1, 
       'Tres Circulos Entrelazados',
       'Coloca los numeros del 1 al 6 en los nodos. Cada circulo debe sumar 14.',
       1, 1, 'easy',
       '{"shapes": [{"id": 1, "type": "circulo", "color": "#3366E6", "operacion": "suma", "target": 14}, {"id": 2, "type": "circulo", "color": "#3366E6", "operacion": "suma", "target": 14}, {"id": 3, "type": "circulo", "color": "#3366E6", "operacion": "suma", "target": 14}]}',
       '[1, 2, 3, 4, 5, 6]',
       '{"Nodo_1_2_0": 6, "Nodo_1_2_1": 1, "Nodo_1_3_0": 3, "Nodo_1_3_1": 4, "Nodo_2_3_0": 2, "Nodo_2_3_1": 5}',
       1, 1, 1);