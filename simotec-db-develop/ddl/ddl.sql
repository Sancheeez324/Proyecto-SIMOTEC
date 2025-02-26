-- Crear la base de datos
CREATE DATABASE simotec;

-- Seleccionar la base de datos
USE simotec;

-- Crear la tabla de Administradores (cadmins)
CREATE TABLE cadmins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    token VARCHAR(255),  -- Token de autenticación
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Crear la tabla de Usuarios
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255),  -- Opcional para la demo,
    token VARCHAR(255),  -- Token de autenticación
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    cadmin_id INT NOT NULL,  -- Referencia al cadmin que creó el usuario
    FOREIGN KEY (cadmin_id) REFERENCES cadmins(id) ON DELETE CASCADE,
    UNIQUE(email)  -- Índice único para mejorar rendimiento en búsquedas por email
);

-- Crear la tabla de Tests
CREATE TABLE tests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_name VARCHAR(255) NOT NULL,
    description TEXT,
    passing_score INT NOT NULL -- Puntaje mínimo de aprobación actual
);

-- Crear la tabla de Ciclos de Evaluación
CREATE TABLE evaluation_cycles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,  -- Referencia al participante
    cadmin_id INT NOT NULL,  -- Referencia al cadmin
    start_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_date DATETIME DEFAULT NULL, -- Fecha de finalización (cuando se completa el ciclo)
    status ENUM('iniciado', 'completo') NOT NULL DEFAULT 'iniciado',  -- Consistencia en los valores de estado
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (cadmin_id) REFERENCES cadmins(id) ON DELETE CASCADE
);

-- Crear la tabla de Partes de Evaluación
CREATE TABLE evaluation_rounds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evaluation_cycle_id INT NOT NULL,
    round_number INT NOT NULL, -- 1 para la primera ronda, 2 para la segunda ronda
    start_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_date DATETIME DEFAULT NULL, -- Fecha de finalización de esta parte
    status ENUM('iniciada', 'completa') NOT NULL DEFAULT 'iniciada',  -- Consistencia en los valores de estado
    FOREIGN KEY (evaluation_cycle_id) REFERENCES evaluation_cycles(id) ON DELETE CASCADE
);

-- Crear la tabla de Asignaciones de Tests
CREATE TABLE assigned_tests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evaluation_round_id INT NOT NULL, -- Referencia a la ronda de evaluación
    test_id INT NOT NULL,
    assigned_by INT NOT NULL, -- Referencia al cadmin que asignó el test
    passing_score INT NOT NULL, -- Puntaje mínimo de aprobación al momento de la asignación
    status ENUM('pendiente', 'completado') NOT NULL DEFAULT 'pendiente',
    start_time DATETIME DEFAULT NULL,  -- Registro del tiempo de inicio del test
    duration_minutes INT NOT NULL DEFAULT 30,  -- Duración del test en minutos
    FOREIGN KEY (evaluation_round_id) REFERENCES evaluation_rounds(id) ON DELETE CASCADE,
    FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES cadmins(id) ON DELETE CASCADE
);

-- Crear la tabla de Preguntas
CREATE TABLE questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_id INT NOT NULL,
    question_text TEXT NOT NULL,
    type ENUM('simple', 'combinada') NOT NULL DEFAULT 'simple',  -- Tipo de pregunta
    FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
);

-- Crear la tabla de Opciones
CREATE TABLE options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE, -- Indica si la opción es la correcta
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Crear la tabla de Resultados de Tests
CREATE TABLE test_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assigned_test_id INT NOT NULL, -- Referencia al test asignado
    score DECIMAL(5, 2) NOT NULL, -- Puntaje obtenido en el test (permite decimales para mayor flexibilidad)
    passing_score INT NOT NULL, -- Puntaje mínimo de aprobación utilizado en esta evaluación
    passed BOOLEAN NOT NULL, -- Indica si el usuario pasó o no el test
    finished_by_timeout BOOLEAN NOT NULL DEFAULT FALSE, -- Indica si el test terminó por límite de tiempo
    completion_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_test_id) REFERENCES assigned_tests(id) ON DELETE CASCADE
);

-- Crear la tabla de Respuestas
CREATE TABLE answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_result_id INT NOT NULL, -- Referencia al resultado del test
    question_id INT NOT NULL,
    selected_option_id INT NOT NULL,  -- No permitir NULL ya que todas las preguntas deben ser respondidas
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, -- Registro de la hora en que se guardó la respuesta
    FOREIGN KEY (test_result_id) REFERENCES test_results(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (selected_option_id) REFERENCES options(id) ON DELETE CASCADE
);

-- Crear la tabla de Sesiones de Test (opcional para mayor control de las sesiones)
CREATE TABLE test_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_result_id INT NOT NULL,  -- Referencia al resultado del test
    session_start DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- Inicio de la sesión
    session_end DATETIME DEFAULT NULL,  -- Fin de la sesión (si se registra un cierre)
    FOREIGN KEY (test_result_id) REFERENCES test_results(id) ON DELETE CASCADE
);
