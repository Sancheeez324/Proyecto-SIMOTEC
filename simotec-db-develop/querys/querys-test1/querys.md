¡Genial! Aquí tienes un script con las consultas esenciales para revisar la información en la base de datos:

### **1. Consultar Ciclos de Evaluación Activos o Completos**

```sql
-- Consultar todos los ciclos de evaluación
SELECT ec.id AS ciclo_id, u.username AS usuario, c.name AS cadmin, ec.status AS estado, ec.start_date AS inicio, ec.end_date AS fin
FROM evaluation_cycles ec
JOIN users u ON ec.user_id = u.id
JOIN cadmins c ON ec.cadmin_id = c.id;

-- Consultar ciclos de evaluación activos
SELECT ec.id AS ciclo_id, u.username AS usuario, c.name AS cadmin, ec.status AS estado, ec.start_date AS inicio
FROM evaluation_cycles ec
JOIN users u ON ec.user_id = u.id
JOIN cadmins c ON ec.cadmin_id = c.id
WHERE ec.status = 'iniciado';

-- Consultar ciclos de evaluación completados
SELECT ec.id AS ciclo_id, u.username AS usuario, c.name AS cadmin, ec.status AS estado, ec.start_date AS inicio, ec.end_date AS fin
FROM evaluation_cycles ec
JOIN users u ON ec.user_id = u.id
JOIN cadmins c ON ec.cadmin_id = c.id
WHERE ec.status = 'completo';
```

### **2. Consultar Detalles de una Ronda en un Ciclo de Evaluación**

```sql
-- Consultar todas las rondas de un ciclo de evaluación específico
SELECT er.id AS ronda_id, er.round_number AS ronda, er.status AS estado, er.start_date AS inicio, er.end_date AS fin
FROM evaluation_rounds er
WHERE er.evaluation_cycle_id = [ciclo_id];

-- Consultar el estado y progreso de las rondas de un ciclo de evaluación específico
SELECT er.id AS ronda_id, er.round_number AS ronda, er.status AS estado, er.start_date AS inicio, er.end_date AS fin, COUNT(at.id) AS total_tests, SUM(CASE WHEN at.status = 'completado' THEN 1 ELSE 0 END) AS tests_completados
FROM evaluation_rounds er
LEFT JOIN assigned_tests at ON er.id = at.evaluation_round_id
WHERE er.evaluation_cycle_id = [ciclo_id]
GROUP BY er.id;
```

### **3. Consultar Resultados de Tests para un Usuario**

```sql
-- Consultar los resultados de tests de un usuario en un ciclo de evaluación
SELECT u.username AS usuario, t.test_name AS test, tr.score AS puntaje_obtenido, tr.passing_score AS puntaje_aprobacion, tr.passed AS aprobado, tr.completion_date AS fecha_completado
FROM test_results tr
JOIN assigned_tests at ON tr.assigned_test_id = at.id
JOIN evaluation_rounds er ON at.evaluation_round_id = er.id
JOIN evaluation_cycles ec ON er.evaluation_cycle_id = ec.id
JOIN users u ON ec.user_id = u.id
JOIN tests t ON at.test_id = t.id
WHERE ec.user_id = [user_id];

-- Consultar los resultados de tests en una ronda específica
SELECT t.test_name AS test, tr.score AS puntaje_obtenido, tr.passing_score AS puntaje_aprobacion, tr.passed AS aprobado, tr.completion_date AS fecha_completado
FROM test_results tr
JOIN assigned_tests at ON tr.assigned_test_id = at.id
JOIN evaluation_rounds er ON at.evaluation_round_id = er.id
JOIN tests t ON at.test_id = t.id
WHERE er.id = [ronda_id];
```

### **4. Consultar Respuestas de un Test Específico**

```sql
-- Consultar todas las respuestas de un test realizado por un usuario
SELECT q.question_text AS pregunta, o.option_text AS opcion_seleccionada, o.is_correct AS es_correcta
FROM answers a
JOIN test_results tr ON a.test_result_id = tr.id
JOIN questions q ON a.question_id = q.id
JOIN options o ON a.selected_option_id = o.id
WHERE tr.assigned_test_id = [assigned_test_id];

-- Consultar respuestas para todas las preguntas de un test específico en una ronda
SELECT q.question_text AS pregunta, o.option_text AS opcion_seleccionada, o.is_correct AS es_correcta
FROM answers a
JOIN test_results tr ON a.test_result_id = tr.id
JOIN assigned_tests at ON tr.assigned_test_id = at.id
JOIN questions q ON a.question_id = q.id
JOIN options o ON a.selected_option_id = o.id
WHERE at.evaluation_round_id = [ronda_id] AND at.test_id = [test_id];
```

### **5. Consultar Tests Asignados a un Usuario**

```sql
-- Consultar todos los tests asignados a un usuario en un ciclo de evaluación
SELECT t.test_name AS test, at.passing_score AS puntaje_aprobacion, at.status AS estado
FROM assigned_tests at
JOIN evaluation_rounds er ON at.evaluation_round_id = er.id
JOIN evaluation_cycles ec ON er.evaluation_cycle_id = ec.id
JOIN tests t ON at.test_id = t.id
WHERE ec.user_id = [user_id];

-- Consultar todos los tests asignados y su estado en una ronda específica
SELECT t.test_name AS test, at.passing_score AS puntaje_aprobacion, at.status AS estado
FROM assigned_tests at
JOIN tests t ON at.test_id = t.id
WHERE at.evaluation_round_id = [ronda_id];
```
```sql
-- Consultar si tengo tests pendientes de realizar (usuario)
SELECT t.test_name AS test, at.passing_score AS puntaje_aprobacion, at.status AS estado
FROM assigned_tests at
JOIN tests t ON at.test_id = t.id
JOIN evaluation_rounds er ON at.evaluation_round_id = er.id
JOIN evaluation_cycles ec ON er.evaluation_cycle_id = ec.id
WHERE ec.user_id = [user_id] AND at.status = 'pendiente';
```

### **Resumen de Consultas**

- **Ciclos de Evaluación**: Consultas para revisar el estado general de los ciclos de evaluación, ya sea en curso o completados.
- **Rondas de Evaluación**: Consultas para obtener el detalle y el estado de las rondas dentro de un ciclo específico.
- **Resultados de Tests**: Consultas para revisar los resultados de los tests realizados por los usuarios.
- **Respuestas a Preguntas**: Consultas para revisar las respuestas específicas dadas por los usuarios en un test.
- **Tests Asignados**: Consultas para verificar los tests asignados a los usuarios en diferentes rondas y su estado.

Estas consultas te proporcionarán una visión clara del estado de los ciclos de evaluación, los resultados de los tests, y las respuestas dadas por los usuarios. Puedes ejecutar estas consultas según necesites para monitorear y revisar la información almacenada en la base de datos. ¿Hay algún detalle adicional que quieras explorar o alguna otra consulta que te gustaría agregar?