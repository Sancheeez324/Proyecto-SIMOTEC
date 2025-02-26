Aquí tienes el flujo completo **incluyendo la gestión de las sesiones de los tests**, desde la asignación del ciclo hasta el registro de las sesiones y la finalización de los tests, con un límite de tiempo de 20 minutos. Este flujo es para **Son Goku** y abarca un ciclo de evaluación con los 3 tests.

### 1. Asignar un ciclo de evaluación y una ronda a Son Goku

```sql
-- Crear un ciclo de evaluación para Son Goku (user_id = 1) bajo el administrador Francisco (cadmin_id = 1)
INSERT INTO evaluation_cycles (user_id, cadmin_id) 
VALUES (1, 1);

-- Obtener el ID del ciclo de evaluación recién creado
SET @evaluation_cycle_id = LAST_INSERT_ID();

-- Crear la primera ronda de evaluación para este ciclo
INSERT INTO evaluation_rounds (evaluation_cycle_id, round_number) 
VALUES (@evaluation_cycle_id, 1);

-- Obtener el ID de la ronda recién creada
SET @evaluation_round_id = LAST_INSERT_ID();

-- Asignar los 3 tests a Son Goku
INSERT INTO assigned_tests (evaluation_round_id, test_id, assigned_by, passing_score) 
VALUES 
(@evaluation_round_id, 1, 1, 7),  -- Test Seguridad Operarios Puerto
(@evaluation_round_id, 2, 1, 5),  -- Test Demo 2
(@evaluation_round_id, 3, 1, 8);  -- Test Demo 3
```

### 2. Iniciar la sesión del **Test 1** para Son Goku

```sql
-- Crear el resultado para el Test 1 (se creará cuando inicie el test)
INSERT INTO test_results (assigned_test_id, score, passing_score, passed) 
VALUES (1, 0, 7, FALSE); -- Inicialmente, no tiene puntaje (score = 0)

-- Obtener el ID del resultado del test recién creado
SET @test_result_id = LAST_INSERT_ID();

-- Iniciar la sesión para el Test 1
INSERT INTO test_sessions (test_result_id, session_start) 
VALUES (@test_result_id, NOW());

-- Guardar el ID de la sesión para un eventual uso
SET @test_session_id = LAST_INSERT_ID();
```

### 3. Completar el **Test 1** (con inserción de respuestas)

```sql
-- Insertar las respuestas correctas para el Test 1 (pregunta 1 a 10)
INSERT INTO answers (test_result_id, question_id, selected_option_id) 
VALUES 
(@test_result_id, 1, 3),   -- Pregunta 1
(@test_result_id, 2, 6),   -- Pregunta 2
(@test_result_id, 3, 9),   -- Pregunta 3
(@test_result_id, 4, 12),  -- Pregunta 4
(@test_result_id, 5, 16),  -- Pregunta 5
(@test_result_id, 6, 19),  -- Pregunta 6
(@test_result_id, 7, 22),  -- Pregunta 7
(@test_result_id, 8, 26),  -- Pregunta 8
(@test_result_id, 9, 30),  -- Pregunta 9
(@test_result_id, 10, 33); -- Pregunta 10

-- Marcar el test como completado con puntaje de 10
UPDATE test_results 
SET score = 10, passed = TRUE, finished_by_timeout = FALSE, completion_date = NOW() 
WHERE id = @test_result_id;

-- Finalizar la sesión del Test 1
UPDATE test_sessions 
SET session_end = NOW() 
WHERE test_result_id = @test_result_id;

-- Marcar el test como completado en la tabla assigned_tests
UPDATE assigned_tests 
SET status = 'completado', start_time = NOW() 
WHERE id = 1;
```

### 4. Iniciar la sesión del **Test 2** para Son Goku

```sql
-- Crear el resultado para el Test 2
INSERT INTO test_results (assigned_test_id, score, passing_score, passed) 
VALUES (2, 0, 5, FALSE); -- Inicialmente, no tiene puntaje (score = 0)

-- Obtener el ID del resultado del test recién creado
SET @test_result_id = LAST_INSERT_ID();

-- Iniciar la sesión para el Test 2
INSERT INTO test_sessions (test_result_id, session_start) 
VALUES (@test_result_id, NOW());

-- Guardar el ID de la sesión
SET @test_session_id = LAST_INSERT_ID();
```

### 5. Completar el **Test 2** (con inserción de respuestas)

```sql
-- Insertar las respuestas correctas para el Test 2 (pregunta 1 a 10)
INSERT INTO answers (test_result_id, question_id, selected_option_id) 
VALUES 
(@test_result_id, 11, 36), -- Pregunta 1
(@test_result_id, 12, 39), -- Pregunta 2
(@test_result_id, 13, 42), -- Pregunta 3
(@test_result_id, 14, 45), -- Pregunta 4
(@test_result_id, 15, 49), -- Pregunta 5
(@test_result_id, 16, 52), -- Pregunta 6
(@test_result_id, 17, 55), -- Pregunta 7
(@test_result_id, 18, 59), -- Pregunta 8
(@test_result_id, 19, 63), -- Pregunta 9
(@test_result_id, 20, 66); -- Pregunta 10

-- Marcar el test como completado con puntaje de 6
UPDATE test_results 
SET score = 6, passed = TRUE, finished_by_timeout = FALSE, completion_date = NOW() 
WHERE id = @test_result_id;

-- Finalizar la sesión del Test 2
UPDATE test_sessions 
SET session_end = NOW() 
WHERE test_result_id = @test_result_id;

-- Marcar el test como completado en la tabla assigned_tests
UPDATE assigned_tests 
SET status = 'completado', start_time = NOW() 
WHERE id = 2;
```

### 6. Iniciar la sesión del **Test 3** para Son Goku

```sql
-- Crear el resultado para el Test 3
INSERT INTO test_results (assigned_test_id, score, passing_score, passed) 
VALUES (3, 0, 8, FALSE); -- Inicialmente, no tiene puntaje (score = 0)

-- Obtener el ID del resultado del test recién creado
SET @test_result_id = LAST_INSERT_ID();

-- Iniciar la sesión para el Test 3
INSERT INTO test_sessions (test_result_id, session_start) 
VALUES (@test_result_id, NOW());

-- Guardar el ID de la sesión
SET @test_session_id = LAST_INSERT_ID();
```

### 7. Completar el **Test 3** (con inserción de respuestas)

```sql
-- Insertar las respuestas correctas para el Test 3 (pregunta 1 a 10)
INSERT INTO answers (test_result_id, question_id, selected_option_id) 
VALUES 
(@test_result_id, 21, 69), -- Pregunta 1
(@test_result_id, 22, 72), -- Pregunta 2
(@test_result_id, 23, 75), -- Pregunta 3
(@test_result_id, 24, 78), -- Pregunta 4
(@test_result_id, 25, 82), -- Pregunta 5
(@test_result_id, 26, 85), -- Pregunta 6
(@test_result_id, 27, 88), -- Pregunta 7
(@test_result_id, 28, 92), -- Pregunta 8
(@test_result_id, 29, 96), -- Pregunta 9
(@test_result_id, 30, 99); -- Pregunta 10

-- Marcar el test como completado con puntaje de 9
UPDATE test_results 
SET score = 9, passed = TRUE, finished_by_timeout = FALSE, completion_date = NOW() 
WHERE id = @test_result_id;

-- Finalizar la sesión del Test 3
UPDATE test_sessions 
SET session_end = NOW() 
WHERE test_result_id = @test_result_id;

-- Marcar el test como completado en la tabla assigned_tests
UPDATE assigned_tests 
SET status = 'completado', start_time = NOW() 
WHERE id = 3;
```

### 8. Completar la primera ronda de evaluación

```sql
-- Completar la primera ronda de evaluación para Son Goku
UPDATE evaluation_rounds 
SET status = 'completa', end_date = NOW() 
WHERE id = @evaluation_round_id AND status = 'iniciada';
```

### 9. Iniciar la segunda ronda (si la primera ronda está completa)

```sql
-- Iniciar la segunda ronda de evaluación para Son Goku, ya que la primera ronda está completa
INSERT INTO evaluation_rounds (evaluation_cycle_id, round_number) 
VALUES (@evaluation_cycle_id, 2);

-- Obtener el ID de la nueva ronda
SET @new_evaluation_round_id = LAST_INSERT_ID();

-- Asignar los 3 tests de evaluación nuevamente a Son Goku para la segunda ronda
INSERT INTO assigned_tests (evaluation_round_id, test_id, assigned_by, passing_score) 
VALUES 
(@new_evaluation_round_id, 1, 1, 7),  -- Test Seguridad Oper

arios Puerto
(@new_evaluation_round_id, 2, 1, 5),  -- Test Demo 2
(@new_evaluation_round_id, 3, 1, 8);  -- Test Demo 3
```

