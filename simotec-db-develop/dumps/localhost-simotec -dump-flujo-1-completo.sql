-- MySQL dump 10.13  Distrib 8.0.19, for Win64 (x86_64)
--
-- Host: localhost    Database: simotec
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `answers`
--

DROP TABLE IF EXISTS `answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `answers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `test_result_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `selected_option_id` int(11) NOT NULL,
  `timestamp` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `test_result_id` (`test_result_id`),
  KEY `question_id` (`question_id`),
  KEY `selected_option_id` (`selected_option_id`),
  CONSTRAINT `answers_ibfk_1` FOREIGN KEY (`test_result_id`) REFERENCES `test_results` (`id`) ON DELETE CASCADE,
  CONSTRAINT `answers_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `answers_ibfk_3` FOREIGN KEY (`selected_option_id`) REFERENCES `options` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `answers`
--

LOCK TABLES `answers` WRITE;
/*!40000 ALTER TABLE `answers` DISABLE KEYS */;
INSERT INTO `answers` VALUES (1,1,1,3,'2024-10-04 12:27:05'),(2,1,2,6,'2024-10-04 12:27:05'),(3,1,3,9,'2024-10-04 12:27:05'),(4,1,4,12,'2024-10-04 12:27:05'),(5,1,5,16,'2024-10-04 12:27:05'),(6,1,6,19,'2024-10-04 12:27:05'),(7,1,7,22,'2024-10-04 12:27:05'),(8,1,8,26,'2024-10-04 12:27:05'),(9,1,9,30,'2024-10-04 12:27:05'),(10,1,10,33,'2024-10-04 12:27:05'),(11,2,11,36,'2024-10-04 12:27:05'),(12,2,12,39,'2024-10-04 12:27:05'),(13,2,13,42,'2024-10-04 12:27:05'),(14,2,14,45,'2024-10-04 12:27:05'),(15,2,15,49,'2024-10-04 12:27:05'),(16,2,16,52,'2024-10-04 12:27:05'),(17,2,17,55,'2024-10-04 12:27:05'),(18,2,18,59,'2024-10-04 12:27:05'),(19,2,19,63,'2024-10-04 12:27:05'),(20,2,20,66,'2024-10-04 12:27:05'),(21,3,21,69,'2024-10-04 12:27:05'),(22,3,22,72,'2024-10-04 12:27:05'),(23,3,23,75,'2024-10-04 12:27:05'),(24,3,24,78,'2024-10-04 12:27:05'),(25,3,25,82,'2024-10-04 12:27:05'),(26,3,26,85,'2024-10-04 12:27:05'),(27,3,27,88,'2024-10-04 12:27:05'),(28,3,28,92,'2024-10-04 12:27:05'),(29,3,29,96,'2024-10-04 12:27:05'),(30,3,30,99,'2024-10-04 12:27:05');
/*!40000 ALTER TABLE `answers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assigned_tests`
--

DROP TABLE IF EXISTS `assigned_tests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assigned_tests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `evaluation_round_id` int(11) NOT NULL,
  `test_id` int(11) NOT NULL,
  `assigned_by` int(11) NOT NULL,
  `passing_score` int(11) NOT NULL,
  `status` enum('pendiente','completado') NOT NULL DEFAULT 'pendiente',
  `start_time` datetime DEFAULT NULL,
  `duration_minutes` int(11) NOT NULL DEFAULT 30,
  PRIMARY KEY (`id`),
  KEY `evaluation_round_id` (`evaluation_round_id`),
  KEY `test_id` (`test_id`),
  KEY `assigned_by` (`assigned_by`),
  CONSTRAINT `assigned_tests_ibfk_1` FOREIGN KEY (`evaluation_round_id`) REFERENCES `evaluation_rounds` (`id`) ON DELETE CASCADE,
  CONSTRAINT `assigned_tests_ibfk_2` FOREIGN KEY (`test_id`) REFERENCES `tests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `assigned_tests_ibfk_3` FOREIGN KEY (`assigned_by`) REFERENCES `cadmins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assigned_tests`
--

LOCK TABLES `assigned_tests` WRITE;
/*!40000 ALTER TABLE `assigned_tests` DISABLE KEYS */;
INSERT INTO `assigned_tests` VALUES (1,1,1,1,7,'completado','2024-10-04 12:27:05',30),(2,1,2,1,5,'completado','2024-10-04 12:27:05',30),(3,1,3,1,8,'completado','2024-10-04 12:27:05',30);
/*!40000 ALTER TABLE `assigned_tests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cadmins`
--

DROP TABLE IF EXISTS `cadmins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cadmins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `token` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cadmins`
--

LOCK TABLES `cadmins` WRITE;
/*!40000 ALTER TABLE `cadmins` DISABLE KEYS */;
INSERT INTO `cadmins` VALUES (1,'Francisco Berwart','panchober27@gmail.com','$2a$12$98nmqkievY3zLPhf8E/08OAc3XeA/2vgYqFk3x9Y1Di4EfVXjxEj6',NULL,'2024-10-04 00:00:00'),(2,'Hernan Figueroa','hernangmail.com','$2a$10$lbC8okw0v2am7yz2mODeMeXTfMEDARD/qXN5rJqW/gGH9fDrMj6AG',NULL,'2024-10-04 00:00:00');
/*!40000 ALTER TABLE `cadmins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluation_cycles`
--

DROP TABLE IF EXISTS `evaluation_cycles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluation_cycles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `cadmin_id` int(11) NOT NULL,
  `start_date` datetime NOT NULL DEFAULT current_timestamp(),
  `end_date` datetime DEFAULT NULL,
  `status` enum('iniciado','completo') NOT NULL DEFAULT 'iniciado',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `cadmin_id` (`cadmin_id`),
  CONSTRAINT `evaluation_cycles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `evaluation_cycles_ibfk_2` FOREIGN KEY (`cadmin_id`) REFERENCES `cadmins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_cycles`
--

LOCK TABLES `evaluation_cycles` WRITE;
/*!40000 ALTER TABLE `evaluation_cycles` DISABLE KEYS */;
INSERT INTO `evaluation_cycles` VALUES (1,1,1,'2024-10-04 12:27:05',NULL,'iniciado');
/*!40000 ALTER TABLE `evaluation_cycles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluation_rounds`
--

DROP TABLE IF EXISTS `evaluation_rounds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluation_rounds` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `evaluation_cycle_id` int(11) NOT NULL,
  `round_number` int(11) NOT NULL,
  `start_date` datetime NOT NULL DEFAULT current_timestamp(),
  `end_date` datetime DEFAULT NULL,
  `status` enum('iniciada','completa') NOT NULL DEFAULT 'iniciada',
  PRIMARY KEY (`id`),
  KEY `evaluation_cycle_id` (`evaluation_cycle_id`),
  CONSTRAINT `evaluation_rounds_ibfk_1` FOREIGN KEY (`evaluation_cycle_id`) REFERENCES `evaluation_cycles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_rounds`
--

LOCK TABLES `evaluation_rounds` WRITE;
/*!40000 ALTER TABLE `evaluation_rounds` DISABLE KEYS */;
INSERT INTO `evaluation_rounds` VALUES (1,1,1,'2024-10-04 12:27:05','2024-10-04 12:27:05','completa');
/*!40000 ALTER TABLE `evaluation_rounds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `options`
--

DROP TABLE IF EXISTS `options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `options` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) NOT NULL,
  `option_text` text NOT NULL,
  `is_correct` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`),
  CONSTRAINT `options_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `options`
--

LOCK TABLES `options` WRITE;
/*!40000 ALTER TABLE `options` DISABLE KEYS */;
INSERT INTO `options` VALUES (1,1,'Ningún accidente con tiempo perdido y sin tiempo perdido.',0),(2,1,'Ningún accidente de trayecto.',0),(3,1,'Ningún tipo de accidente.',1),(4,2,'Condición insegura.',0),(5,2,'Irresponsabilidad.',0),(6,2,'Acción insegura.',1),(7,3,'Los más propensos a tener accidentes, son los trabajadores antiguos.',0),(8,3,'Los menos propensos a tener accidentes los trabajadores antiguos.',0),(9,3,'No tiene relación el accidente con la antigüedad del trabajador.',1),(10,4,'No utilizar audífonos ni celular en la faena operativa o desplazamiento.',0),(11,4,'Ubicarme fuera del alcance de los equipos de los equipos de transferencia.',0),(12,4,'A y B.',1),(13,5,'Interviene sólo si no hay riesgo para usted.',0),(14,5,'Reporta inmediatamente a supervisor.',0),(15,5,'Solicita ayuda médica, siempre y cuando disponga del medio.',0),(16,5,'Todas las anteriores.',1),(17,6,'Prevencionista de riesgo.',0),(18,6,'Gerente de operaciones.',0),(19,6,'Supervisor.',1),(20,7,'Revisión y uso de arnés de seguridad.',0),(21,7,'Conectarse a un punto de anclaje.',0),(22,7,'A y B.',1),(23,8,'Eliminar el oxígeno.',0),(24,8,'Eliminar la fuente de calor.',0),(25,8,'Eliminar la fuente combustible.',0),(26,8,'Todas las anteriores.',1),(27,9,'Carga suspendida.',0),(28,9,'Interacción persona y máquina.',0),(29,9,'Caída de persona al agua.',0),(30,9,'Todos los anteriores.',1),(31,10,'Pueden resultar en pérdida de tiempo de trabajo.',0),(32,10,'Reconocimiento para el trabajador al ahorrar tiempo.',0),(33,10,'Incapacidad permanente y en casos extremos provocar la muerte.',1),(34,11,'Ningún accidente con tiempo perdido y sin tiempo perdido.',0),(35,11,'Ningún accidente de trayecto.',0),(36,11,'Ningún tipo de accidente.',1),(37,12,'Condición insegura.',0),(38,12,'Irresponsabilidad.',0),(39,12,'Acción insegura.',1),(40,13,'Los más propensos a tener accidentes, son los trabajadores antiguos.',0),(41,13,'Los menos propensos a tener accidentes los trabajadores antiguos.',0),(42,13,'No tiene relación el accidente con la antigüedad del trabajador.',1),(43,14,'No utilizar audífonos ni celular en la faena operativa o desplazamiento.',0),(44,14,'Ubicarme fuera del alcance de los equipos de los equipos de transferencia.',0),(45,14,'A y B.',1),(46,15,'Interviene sólo si no hay riesgo para usted.',0),(47,15,'Reporta inmediatamente a supervisor.',0),(48,15,'Solicita ayuda médica, siempre y cuando disponga del medio.',0),(49,15,'Todas las anteriores.',1),(50,16,'Prevencionista de riesgo.',0),(51,16,'Gerente de operaciones.',0),(52,16,'Supervisor.',1),(53,17,'Revisión y uso de arnés de seguridad.',0),(54,17,'Conectarse a un punto de anclaje.',0),(55,17,'A y B.',1),(56,18,'Eliminar el oxígeno.',0),(57,18,'Eliminar la fuente de calor.',0),(58,18,'Eliminar la fuente combustible.',0),(59,18,'Todas las anteriores.',1),(60,19,'Carga suspendida.',0),(61,19,'Interacción persona y máquina.',0),(62,19,'Caída de persona al agua.',0),(63,19,'Todos los anteriores.',1),(64,20,'Pueden resultar en pérdida de tiempo de trabajo.',0),(65,20,'Reconocimiento para el trabajador al ahorrar tiempo.',0),(66,20,'Incapacidad permanente y en casos extremos provocar la muerte.',1),(67,21,'Ningún accidente con tiempo perdido y sin tiempo perdido.',0),(68,21,'Ningún accidente de trayecto.',0),(69,21,'Ningún tipo de accidente.',1),(70,22,'Condición insegura.',0),(71,22,'Irresponsabilidad.',0),(72,22,'Acción insegura.',1),(73,23,'Los más propensos a tener accidentes, son los trabajadores antiguos.',0),(74,23,'Los menos propensos a tener accidentes los trabajadores antiguos.',0),(75,23,'No tiene relación el accidente con la antigüedad del trabajador.',1),(76,24,'No utilizar audífonos ni celular en la faena operativa o desplazamiento.',0),(77,24,'Ubicarme fuera del alcance de los equipos de los equipos de transferencia.',0),(78,24,'A y B.',1),(79,25,'Interviene sólo si no hay riesgo para usted.',0),(80,25,'Reporta inmediatamente a supervisor.',0),(81,25,'Solicita ayuda médica, siempre y cuando disponga del medio.',0),(82,25,'Todas las anteriores.',1),(83,26,'Prevencionista de riesgo.',0),(84,26,'Gerente de operaciones.',0),(85,26,'Supervisor.',1),(86,27,'Revisión y uso de arnés de seguridad.',0),(87,27,'Conectarse a un punto de anclaje.',0),(88,27,'A y B.',1),(89,28,'Eliminar el oxígeno.',0),(90,28,'Eliminar la fuente de calor.',0),(91,28,'Eliminar la fuente combustible.',0),(92,28,'Todas las anteriores.',1),(93,29,'Carga suspendida.',0),(94,29,'Interacción persona y máquina.',0),(95,29,'Caída de persona al agua.',0),(96,29,'Todos los anteriores.',1),(97,30,'Pueden resultar en pérdida de tiempo de trabajo.',0),(98,30,'Reconocimiento para el trabajador al ahorrar tiempo.',0),(99,30,'Incapacidad permanente y en casos extremos provocar la muerte.',1);
/*!40000 ALTER TABLE `options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `questions`
--

DROP TABLE IF EXISTS `questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `test_id` int(11) NOT NULL,
  `question_text` text NOT NULL,
  `type` enum('simple','combinada') NOT NULL DEFAULT 'simple',
  PRIMARY KEY (`id`),
  KEY `test_id` (`test_id`),
  CONSTRAINT `questions_ibfk_1` FOREIGN KEY (`test_id`) REFERENCES `tests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `questions`
--

LOCK TABLES `questions` WRITE;
/*!40000 ALTER TABLE `questions` DISABLE KEYS */;
INSERT INTO `questions` VALUES (1,1,'Cero Accidente significa:','simple'),(2,1,'La NO utilización del casco, es considerado como:','simple'),(3,1,'Es posible señalar, que los accidentes en relación con la antigüedad del trabajador:','simple'),(4,1,'Es considerada una regla indispensable, lo siguiente:','simple'),(5,1,'Si Usted se encuentra ante una persona que ha sufrido un accidente por contacto eléctrico, ¿Cómo debe actuar?','simple'),(6,1,'Al momento visualizar una conducta o condición insegura ¿A quién se le debe informar de manera obligatoria?:','simple'),(7,1,'La(s) medida(s) para controlar el riesgo de caída de altura es o son:','simple'),(8,1,'Para la extinción del fuego es necesario:','simple'),(9,1,'¿A qué riesgos críticos me puedo exponer al momento de realizar mis labores y a los que debo estar siempre atento?','simple'),(10,1,'¿Qué tipos de consecuencias pueden presentar la NO aplicación del control crítico?','simple'),(11,2,'Cero Accidente significa:','simple'),(12,2,'La NO utilización del casco, es considerado como:','simple'),(13,2,'Es posible señalar, que los accidentes en relación con la antigüedad del trabajador:','simple'),(14,2,'Es considerada una regla indispensable, lo siguiente:','simple'),(15,2,'Si Usted se encuentra ante una persona que ha sufrido un accidente por contacto eléctrico, ¿Cómo debe actuar?','simple'),(16,2,'Al momento visualizar una conducta o condición insegura ¿A quién se le debe informar de manera obligatoria?:','simple'),(17,2,'La(s) medida(s) para controlar el riesgo de caída de altura es o son:','simple'),(18,2,'Para la extinción del fuego es necesario:','simple'),(19,2,'¿A qué riesgos críticos me puedo exponer al momento de realizar mis labores y a los que debo estar siempre atento?','simple'),(20,2,'¿Qué tipos de consecuencias pueden presentar la NO aplicación del control crítico?','simple'),(21,3,'Cero Accidente significa:','simple'),(22,3,'La NO utilización del casco, es considerado como:','simple'),(23,3,'Es posible señalar, que los accidentes en relación con la antigüedad del trabajador:','simple'),(24,3,'Es considerada una regla indispensable, lo siguiente:','simple'),(25,3,'Si Usted se encuentra ante una persona que ha sufrido un accidente por contacto eléctrico, ¿Cómo debe actuar?','simple'),(26,3,'Al momento visualizar una conducta o condición insegura ¿A quién se le debe informar de manera obligatoria?:','simple'),(27,3,'La(s) medida(s) para controlar el riesgo de caída de altura es o son:','simple'),(28,3,'Para la extinción del fuego es necesario:','simple'),(29,3,'¿A qué riesgos críticos me puedo exponer al momento de realizar mis labores y a los que debo estar siempre atento?','simple'),(30,3,'¿Qué tipos de consecuencias pueden presentar la NO aplicación del control crítico?','simple');
/*!40000 ALTER TABLE `questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `test_results`
--

DROP TABLE IF EXISTS `test_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_results` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assigned_test_id` int(11) NOT NULL,
  `score` decimal(5,2) NOT NULL,
  `passing_score` int(11) NOT NULL,
  `passed` tinyint(1) NOT NULL,
  `finished_by_timeout` tinyint(1) NOT NULL DEFAULT 0,
  `completion_date` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `assigned_test_id` (`assigned_test_id`),
  CONSTRAINT `test_results_ibfk_1` FOREIGN KEY (`assigned_test_id`) REFERENCES `assigned_tests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `test_results`
--

LOCK TABLES `test_results` WRITE;
/*!40000 ALTER TABLE `test_results` DISABLE KEYS */;
INSERT INTO `test_results` VALUES (1,1,10.00,7,1,0,'2024-10-04 12:27:05'),(2,2,6.00,5,1,0,'2024-10-04 12:27:05'),(3,3,9.00,8,1,0,'2024-10-04 12:27:05');
/*!40000 ALTER TABLE `test_results` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `test_sessions`
--

DROP TABLE IF EXISTS `test_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `test_result_id` int(11) NOT NULL,
  `session_start` datetime NOT NULL DEFAULT current_timestamp(),
  `session_end` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `test_result_id` (`test_result_id`),
  CONSTRAINT `test_sessions_ibfk_1` FOREIGN KEY (`test_result_id`) REFERENCES `test_results` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `test_sessions`
--

LOCK TABLES `test_sessions` WRITE;
/*!40000 ALTER TABLE `test_sessions` DISABLE KEYS */;
INSERT INTO `test_sessions` VALUES (1,1,'2024-10-04 12:27:05','2024-10-04 12:27:05'),(2,2,'2024-10-04 12:27:05','2024-10-04 12:27:05'),(3,3,'2024-10-04 12:27:05','2024-10-04 12:27:05');
/*!40000 ALTER TABLE `test_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tests`
--

DROP TABLE IF EXISTS `tests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `test_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `passing_score` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tests`
--

LOCK TABLES `tests` WRITE;
/*!40000 ALTER TABLE `tests` DISABLE KEYS */;
INSERT INTO `tests` VALUES (1,'Test Seguridad Operarios Puerto','Test de seguridad diseñado para operarios en el puerto',7),(2,'Test Demo 2','Test 2 simulado para testing',5),(3,'Test Demo 3','Test de demo (3) para testing',8);
/*!40000 ALTER TABLE `tests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `token` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `cadmin_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `cadmin_id` (`cadmin_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`cadmin_id`) REFERENCES `cadmins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Son Goku','$2a$10$Tk4uAQqbLMNE8aej2zqiKuICHHuhy0BB6V/Tj6K5vHn8WsLrQNj0C','songoku@gmail.com',NULL,'2024-10-04 11:59:05',1),(2,'Son Gohan','$2a$11$rcNB1pNBZzqY375nhoYE4.hrWzFl6P6B6ccv0ml0nM5kHSMPhSpCO','songohan@gmail.com',NULL,'2024-10-04 11:59:31',1),(3,'Vegeta IV','$2a$12$FsHeCfNu.IDMV5pgd9kZaejD2nN8NnidCRVQ9w0Bk/FBvC/bYt1ES','vegetaiv@gmail.com',NULL,'2024-10-04 11:59:44',1),(4,'Broly LSS','$2a$10$syuHrIfBJResVzqp63lZeO9GYK2E8Ah1l2I/1xgniyjHRWKbPZs..','brolylss@gmail.com',NULL,'2024-10-04 11:59:59',1);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'simotec'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-10-04 12:28:31
