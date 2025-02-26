### **Flujo Ajustado para Ingreso de Respuestas**

```sql
-- Iniciar un nuevo ciclo de evaluación para el usuario 1 asignado por el cadmin 1
INSERT INTO evaluation_cycles (user_id, cadmin_id, status) 
VALUES (1, 1, 'iniciado');
SET @evaluation_cycle_id = LAST_INSERT_ID();

-- Iniciar la primera ronda de evaluación
INSERT INTO evaluation_rounds (evaluation_cycle_id, round_number, status) 
VALUES (@evaluation_cycle_id, 1, 'iniciada');
SET @evaluation_round_id = LAST_INSERT_ID();

-- Asignar el test "Test Seguridad Operarios Puerto" al usuario en la primera ronda
INSERT INTO assigned_tests (evaluation_round_id, test_id, assigned_by, passing_score, status) 
VALUES (@evaluation_round_id, 1, 1, 7, 'pendiente');
SET @assigned_test_id = LAST_INSERT_ID();

-- Crear el registro inicial en test_results para obtener el test_result_id
INSERT INTO test_results (assigned_test_id, score, passing_score, passed, completion_date)
VALUES (@assigned_test_id, 0, 7, FALSE, CURRENT_TIMESTAMP); -- Inicialmente se coloca un puntaje de 0 y no aprobado
SET @test_result_id = LAST_INSERT_ID();

-- Insertar las respuestas del usuario para cada pregunta
INSERT INTO answers (test_result_id, question_id, selected_option_id) 
VALUES 
(@test_result_id, 1, 3), -- Pregunta 1, opción 3 es la correcta ✅
(@test_result_id, 2, 6), -- Pregunta 2, opción 6 es la correcta ✅
(@test_result_id, 3, 9), -- Pregunta 3, opción 9 es la correcta ✅
(@test_result_id, 4, 12), -- Pregunta 4, opción 12 es la correcta ✅
(@test_result_id, 5, 16), -- Pregunta 5, opción 16 es la correcta ✅
(@test_result_id, 6, 19), -- Pregunta 6, opción 19 es la correcta ✅
(@test_result_id, 7, 22), -- Pregunta 7, opción 22 es la correcta ✅
(@test_result_id, 8, 24), -- Pregunta 8, opción 26 es la correcta ❌
(@test_result_id, 9, 29), -- Pregunta 9, opción 30 es la correcta ❌
(@test_result_id, 10, 33); -- Pregunta 10, opción 33 es la correcta ✅

-- Calcular el puntaje total basado en las respuestas correctas
SET @score = (SELECT COUNT(*)
              FROM answers a
              JOIN options o ON a.selected_option_id = o.id
              WHERE a.test_result_id = @test_result_id AND o.is_correct = TRUE);

-- Determinar si el usuario pasó el test basado en el puntaje
SET @passed = @score >= 7;

-- Actualizar el registro en test_results con el puntaje y estado de aprobación
UPDATE test_results
SET score = @score, passing_score = 7, passed = @passed, completion_date = NOW()
WHERE id = @test_result_id;

-- Marcar el test asignado como completado
UPDATE assigned_tests
SET status = 'completado'
WHERE id = @assigned_test_id;


-- Marcar la primera ronda como completa si todos los tests asignados están completados
UPDATE evaluation_rounds
SET status = 'completa', end_date = NOW()
WHERE id = @evaluation_round_id
AND NOT EXISTS (
    SELECT 1 FROM assigned_tests WHERE evaluation_round_id = @evaluation_round_id AND status <> 'completado'
);

-- Iniciar la segunda ronda de evaluación
INSERT INTO evaluation_rounds (evaluation_cycle_id, round_number, status) 
VALUES (@evaluation_cycle_id, 2, 'iniciada');
SET @evaluation_round_id_2 = LAST_INSERT_ID();

-- Asignar el test "Test Seguridad Operarios Puerto" nuevamente al usuario en la segunda ronda
INSERT INTO assigned_tests (evaluation_round_id, test_id, assigned_by, passing_score, status) 
VALUES (@evaluation_round_id_2, 1, 1, 7, 'pendiente');
SET @assigned_test_id_2 = LAST_INSERT_ID();

-- Crear el registro inicial en test_results para la segunda ronda
INSERT INTO test_results (assigned_test_id, score, passing_score, passed, completion_date)
VALUES (@assigned_test_id_2, 0, 7, FALSE, CURRENT_TIMESTAMP); 
SET @test_result_id_2 = LAST_INSERT_ID();

-- Insertar las respuestas del usuario para cada pregunta en la segunda ronda
INSERT INTO answers (test_result_id, question_id, selected_option_id) 
VALUES 
(@test_result_id_2, 1, 3), -- Pregunta 1, opción 3 es la correcta ✅
(@test_result_id_2, 2, 6), -- Pregunta 2, opción 6 es la correcta ✅
(@test_result_id_2, 3, 9), -- Pregunta 3, opción 9 es la correcta ✅
(@test_result_id_2, 4, 12), -- Pregunta 4, opción 12 es la correcta ✅
(@test_result_id_2, 5, 16), -- Pregunta 5, opción 16 es la correcta ✅
(@test_result_id_2, 6, 19), -- Pregunta 6, opción 19 es la correcta ✅
(@test_result_id_2, 7, 22), -- Pregunta 7, opción 22 es la correcta ✅
(@test_result_id_2, 8, 26), -- Pregunta 8, opción 26 es la correcta ✅
(@test_result_id_2, 9, 30), -- Pregunta 9, opción 30 es la correcta ✅
(@test_result_id_2, 10, 33); -- Pregunta 10, opción 33 es la correcta ✅

-- Calcular el puntaje total basado en las respuestas correctas en la segunda ronda
SET @score_2 = (SELECT COUNT(*)
                FROM answers a
                JOIN options o ON a.selected_option_id = o.id
                WHERE a.test_result_id = @test_result_id_2 AND o.is_correct = TRUE);

-- Determinar si el usuario pasó el test basado en el puntaje en la segunda ronda
SET @passed_2 = @score_2 >= 7;

-- Actualizar el registro en test_results con el puntaje y estado de aprobación para la segunda ronda
UPDATE test_results
SET score = @score_2, passing_score = 7, passed = @passed_2, completion_date = NOW()
WHERE id = @test_result_id_2;

-- Marcar el test asignado como completado en la segunda ronda
UPDATE assigned_tests
SET status = 'completado'
WHERE id = @assigned_test_id_2;

-- Marcar la segunda ronda como completa si todos los tests asignados están completados
UPDATE evaluation_rounds
SET status = 'completa', end_date = NOW()
WHERE id = @evaluation_round_id_2
AND NOT EXISTS (
    SELECT 1 FROM assigned_tests WHERE evaluation_round_id = @evaluation_round_id_2 AND status <> 'completado'
);

-- Marcar el ciclo de evaluación como completo si ambas rondas están completadas
UPDATE evaluation_cycles
SET status = 'completo', end_date = NOW()
WHERE id = @evaluation_cycle_id
AND NOT EXISTS (
    SELECT 1 FROM evaluation_rounds WHERE evaluation_cycle_id = @evaluation_cycle_id AND status <> 'completa'
);
```

### **Explicación del Flujo Ajustado**

1. **Crear el Registro Inicial en `test_results`**:
   - Se crea un registro inicial en `test_results` con un puntaje de `0` y no aprobado (`FALSE`). Esto genera el `test_result_id` necesario para asociar las respuestas.

2. **Insertar Respuestas**:
   - Las respuestas del usuario se insertan en la tabla `answers` utilizando el `test_result_id` generado previamente.

3. **Calcular y Actualizar el Puntaje**:
   - Una vez insertadas todas las respuestas, se calcula el puntaje total y se determina si el usuario pasó o no el test. Luego, el registro en `test_results` se actualiza con esta información.

4. **Actualizar Estados**:
   - El estado del test asignado se actualiza a `'completado'` y se verifica si la ronda y el ciclo deben ser marcados como completos.

Este flujo asegura que los registros de respuestas siempre tienen un `test_result_id` válido y que los resultados se calculan y actualizan después de que todas las respuestas han sido procesadas. ¿Hay algo más que te gustaría revisar o ajustar?