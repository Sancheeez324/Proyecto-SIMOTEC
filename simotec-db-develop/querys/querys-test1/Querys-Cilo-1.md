# Querys Flujo de Ciclo de Evaluación

### **1. Obtener Todos los Tests Asignados a un Usuario en un Ciclo**
```sql
-- Obtener todos los tests asignados a un usuario en un ciclo de evaluación específico
SELECT 
    ec.id AS ciclo_id,
    er.id AS ronda_id,
    at.id AS test_asignado_id,
    t.test_name AS nombre_test,
    at.passing_score AS puntaje_aprobacion,
    at.status AS estado_test,
    er.round_number AS ronda,
    er.status AS estado_ronda,
    er.start_date AS inicio_ronda,
    er.end_date AS fin_ronda
FROM 
    evaluation_cycles ec
JOIN 
    evaluation_rounds er ON ec.id = er.evaluation_cycle_id
JOIN 
    assigned_tests at ON er.id = at.evaluation_round_id
JOIN 
    tests t ON at.test_id = t.id
WHERE 
    ec.user_id = [user_id] AND ec.id = [ciclo_id];
```

### **2. Obtener el Detalle de un Test Realizado por un Usuario**

```sql
-- Obtener el detalle de un test realizado por un usuario, incluyendo las preguntas y respuestas
SELECT 
    tr.id AS test_result_id,
    t.test_name AS nombre_test,
    q.question_text AS pregunta,
    o.option_text AS respuesta_seleccionada,
    o.is_correct AS es_correcta,
    tr.score AS puntaje_obtenido,
    tr.passing_score AS puntaje_aprobacion,
    tr.passed AS aprobado,
    tr.completion_date AS fecha_completado
FROM 
    test_results tr
JOIN 
    assigned_tests at ON tr.assigned_test_id = at.id
JOIN 
    tests t ON at.test_id = t.id
JOIN 
    answers a ON tr.id = a.test_result_id
JOIN 
    questions q ON a.question_id = q.id
JOIN 
    options o ON a.selected_option_id = o.id
WHERE 
    tr.id = [test_result_id];
```

### **3. Obtener el Estado de las Rondas de un Ciclo de Evaluación**

```sql
-- Obtener el estado y detalles de todas las rondas de un ciclo de evaluación específico
SELECT 
    er.id AS ronda_id,
    er.round_number AS numero_ronda,
    er.status AS estado_ronda,
    er.start_date AS inicio_ronda,
    er.end_date AS fin_ronda,
    COUNT(at.id) AS total_tests,
    SUM(CASE WHEN at.status = 'completado' THEN 1 ELSE 0 END) AS tests_completados
FROM 
    evaluation_rounds er
LEFT JOIN 
    assigned_tests at ON er.id = at.evaluation_round_id
WHERE 
    er.evaluation_cycle_id = [ciclo_id]
GROUP BY 
    er.id;
```

### **4. Obtener Todos los Resultados de un Usuario en un Ciclo de Evaluación**

```sql
-- Obtener los resultados de todos los tests realizados por un usuario en un ciclo de evaluación
SELECT 
    u.username AS usuario,
    t.test_name AS nombre_test,
    tr.score AS puntaje_obtenido,
    tr.passing_score AS puntaje_aprobacion,
    tr.passed AS aprobado,
    tr.completion_date AS fecha_completado
FROM 
    test_results tr
JOIN 
    assigned_tests at ON tr.assigned_test_id = at.id
JOIN 
    evaluation_rounds er ON at.evaluation_round_id = er.id
JOIN 
    evaluation_cycles ec ON er.evaluation_cycle_id = ec.id
JOIN 
    users u ON ec.user_id = u.id
JOIN 
    tests t ON at.test_id = t.id
WHERE 
    ec.user_id = [user_id] AND ec.id = [ciclo_id];
```

### **5. Obtener el Progreso de un Ciclo de Evaluación**

```sql
-- Obtener el progreso general de un ciclo de evaluación para un usuario
SELECT 
    ec.id AS ciclo_id,
    u.username AS usuario,
    ec.status AS estado_ciclo,
    COUNT(er.id) AS total_rondas,
    SUM(CASE WHEN er.status = 'completa' THEN 1 ELSE 0 END) AS rondas_completadas,
    COUNT(at.id) AS total_tests,
    SUM(CASE WHEN at.status = 'completado' THEN 1 ELSE 0 END) AS tests_completados,
    ec.start_date AS inicio_ciclo,
    ec.end_date AS fin_ciclo
FROM 
    evaluation_cycles ec
JOIN 
    users u ON ec.user_id = u.id
LEFT JOIN 
    evaluation_rounds er ON ec.id = er.evaluation_cycle_id
LEFT JOIN 
    assigned_tests at ON er.id = at.evaluation_round_id
WHERE 
    ec.user_id = [user_id] AND ec.id = [ciclo_id]
GROUP BY 
    ec.id;
```

### **6. Obtener Todas las Respuestas de un Usuario en un Test Específico**

```sql
-- Obtener todas las respuestas de un usuario en un test específico en una ronda específica
SELECT 
    q.question_text AS pregunta,
    o.option_text AS respuesta_seleccionada,
    o.is_correct AS es_correcta,
    a.timestamp AS fecha_respuesta
FROM 
    answers a
JOIN 
    test_results tr ON a.test_result_id = tr.id
JOIN 
    questions q ON a.question_id = q.id
JOIN 
    options o ON a.selected_option_id = o.id
JOIN 
    assigned_tests at ON tr.assigned_test_id = at.id
WHERE 
    at.id = [assigned_test_id];
```

### **7. Obtener Todos los Ciclos de Evaluación de un Usuario**

```sql
-- Obtener todos los ciclos de evaluación para un usuario
SELECT 
    ec.id AS ciclo_id,
    ec.status AS estado,
    ec.start_date AS inicio,
    ec.end_date AS fin
FROM 
    evaluation_cycles ec
WHERE 
    ec.user_id = [user_id];
```

### **Resumen de las Consultas**

- **Consultas de Asignación y Estado**: Te permiten revisar qué tests han sido asignados a un usuario, su estado, y el progreso dentro de un ciclo de evaluación.
- **Consultas de Resultados y Detalles de Tests**: Proporcionan los detalles de los resultados obtenidos por el usuario en cada test, incluyendo las preguntas y respuestas seleccionadas.
- **Consultas de Progreso**: Ayudan a monitorear el progreso general de un ciclo de evaluación, tanto a nivel de rondas como de tests completados.

Estas consultas deberían cubrir la mayoría de los casos para revisar y monitorear la información almacenada en la base de datos relacionada con los ciclos de evaluación, tests, y resultados. Si hay alguna otra consulta que necesites, o si quieres ajustar alguna de estas, estaré encantado de ayudarte.