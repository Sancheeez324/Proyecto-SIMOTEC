-- Insertar el Test
INSERT INTO tests (test_name, description, passing_score) 
VALUES ('Test Seguridad Operarios Puerto', 'Test de seguridad diseñado para operarios en el puerto', 7);
SET @test_id = LAST_INSERT_ID();

-- Insertar las Preguntas y Opciones

-- Pregunta 1
INSERT INTO questions (test_id, question_text, type) 
VALUES (@test_id, 'Cero Accidente significa:', 'simple');
SET @question_id = LAST_INSERT_ID();
INSERT INTO options (question_id, option_text, is_correct) 
VALUES 
(@question_id, 'Ningún accidente con tiempo perdido y sin tiempo perdido.', FALSE),
(@question_id, 'Ningún accidente de trayecto.', FALSE),
(@question_id, 'Ningún tipo de accidente.', TRUE);

-- Pregunta 2
INSERT INTO questions (test_id, question_text, type) 
VALUES (@test_id, 'La NO utilización del casco, es considerado como:', 'simple');
SET @question_id = LAST_INSERT_ID();
INSERT INTO options (question_id, option_text, is_correct) 
VALUES 
(@question_id, 'Condición insegura.', FALSE),
(@question_id, 'Irresponsabilidad.', FALSE),
(@question_id, 'Acción insegura.', TRUE);

-- Pregunta 3
INSERT INTO questions (test_id, question_text, type) 
VALUES (@test_id, 'Es posible señalar, que los accidentes en relación con la antigüedad del trabajador:', 'simple');
SET @question_id = LAST_INSERT_ID();
INSERT INTO options (question_id, option_text, is_correct) 
VALUES 
(@question_id, 'Los más propensos a tener accidentes, son los trabajadores antiguos.', FALSE),
(@question_id, 'Los menos propensos a tener accidentes los trabajadores antiguos.', FALSE),
(@question_id, 'No tiene relación el accidente con la antigüedad del trabajador.', TRUE);

-- Pregunta 4
INSERT INTO questions (test_id, question_text, type) 
VALUES (@test_id, 'Es considerada una regla indispensable, lo siguiente:', 'simple');
SET @question_id = LAST_INSERT_ID();
INSERT INTO options (question_id, option_text, is_correct) 
VALUES 
(@question_id, 'No utilizar audífonos ni celular en la faena operativa o desplazamiento.', FALSE),
(@question_id, 'Ubicarme fuera del alcance de los equipos de los equipos de transferencia.', FALSE),
(@question_id, 'A y B.', TRUE);

-- Pregunta 5
INSERT INTO questions (test_id, question_text, type) 
VALUES (@test_id, 'Si Usted se encuentra ante una persona que ha sufrido un accidente por contacto eléctrico, ¿Cómo debe actuar?', 'simple');
SET @question_id = LAST_INSERT_ID();
INSERT INTO options (question_id, option_text, is_correct) 
VALUES 
(@question_id, 'Interviene sólo si no hay riesgo para usted.', FALSE),
(@question_id, 'Reporta inmediatamente a supervisor.', FALSE),
(@question_id, 'Solicita ayuda médica, siempre y cuando disponga del medio.', FALSE),
(@question_id, 'Todas las anteriores.', TRUE);

-- Pregunta 6
INSERT INTO questions (test_id, question_text, type) 
VALUES (@test_id, 'Al momento visualizar una conducta o condición insegura ¿A quién se le debe informar de manera obligatoria?:', 'simple');
SET @question_id = LAST_INSERT_ID();
INSERT INTO options (question_id, option_text, is_correct) 
VALUES 
(@question_id, 'Prevencionista de riesgo.', FALSE),
(@question_id, 'Gerente de operaciones.', FALSE),
(@question_id, 'Supervisor.', TRUE);

-- Pregunta 7
INSERT INTO questions (test_id, question_text, type) 
VALUES (@test_id, 'La(s) medida(s) para controlar el riesgo de caída de altura es o son:', 'simple');
SET @question_id = LAST_INSERT_ID();
INSERT INTO options (question_id, option_text, is_correct) 
VALUES 
(@question_id, 'Revisión y uso de arnés de seguridad.', FALSE),
(@question_id, 'Conectarse a un punto de anclaje.', FALSE),
(@question_id, 'A y B.', TRUE);

-- Pregunta 8
INSERT INTO questions (test_id, question_text, type) 
VALUES (@test_id, 'Para la extinción del fuego es necesario:', 'simple');
SET @question_id = LAST_INSERT_ID();
INSERT INTO options (question_id, option_text, is_correct) 
VALUES 
(@question_id, 'Eliminar el oxígeno.', FALSE),
(@question_id, 'Eliminar la fuente de calor.', FALSE),
(@question_id, 'Eliminar la fuente combustible.', FALSE),
(@question_id, 'Todas las anteriores.', TRUE);

-- Pregunta 9
INSERT INTO questions (test_id, question_text, type) 
VALUES (@test_id, '¿A qué riesgos críticos me puedo exponer al momento de realizar mis labores y a los que debo estar siempre atento?', 'simple');
SET @question_id = LAST_INSERT_ID();
INSERT INTO options (question_id, option_text, is_correct) 
VALUES 
(@question_id, 'Carga suspendida.', FALSE),
(@question_id, 'Interacción persona y máquina.', FALSE),
(@question_id, 'Caída de persona al agua.', FALSE),
(@question_id, 'Todos los anteriores.', TRUE);

-- Pregunta 10
INSERT INTO questions (test_id, question_text, type) 
VALUES (@test_id, '¿Qué tipos de consecuencias pueden presentar la NO aplicación del control crítico?', 'simple');
SET @question_id = LAST_INSERT_ID();
INSERT INTO options (question_id, option_text, is_correct) 
VALUES 
(@question_id, 'Pueden resultar en pérdida de tiempo de trabajo.', FALSE),
(@question_id, 'Reconocimiento para el trabajador al ahorrar tiempo.', FALSE),
(@question_id, 'Incapacidad permanente y en casos extremos provocar la muerte.', TRUE);



-- TODO: Insertar las preguntas y opciones restantes (total 53)