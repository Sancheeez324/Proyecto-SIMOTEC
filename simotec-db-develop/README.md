# **SIMOTEC Database Scripts**

Este repositorio contiene los scripts SQL necesarios para la creación, gestión y mantenimiento de la base de datos utilizada en el proyecto **SIMOTEC**. El proyecto SIMOTEC gestiona un sistema de evaluación que incluye la realización de múltiples tests, el seguimiento del progreso de los usuarios, y la generación de informes sobre el desempeño en diversas rondas de evaluación.

## **Contenido del Repositorio**

- **DDL Scripts**: Scripts para la creación de tablas, relaciones, y estructuras básicas de la base de datos.
- **DML Scripts**: Scripts para la inserción de datos iniciales, como tests, preguntas, opciones y usuarios.
- **Queries Esenciales**: Consultas SQL para la obtención de información crítica desde la base de datos, como resultados de tests, estado de evaluaciones, etc.
- **Flujos de Evaluación**: Scripts que simulan el flujo completo de una evaluación, desde la asignación de tests hasta la finalización del ciclo de evaluación.

## **Estructura de la Base de Datos**

La base de datos del proyecto SIMOTEC está estructurada para manejar los siguientes conceptos clave:

- **Usuarios y Cadmins**: Representan a los participantes de las evaluaciones y a los administradores que asignan los tests.
- **Tests y Preguntas**: Los tests están compuestos por un conjunto de preguntas, cada una con varias opciones posibles.
- **Ciclos y Rondas de Evaluación**: Un ciclo de evaluación incluye dos rondas en las que los usuarios deben completar los tests asignados.
- **Resultados**: Los resultados de los tests se almacenan para permitir la evaluación y comparación de desempeño a lo largo de las rondas.

## **Requisitos**

Antes de ejecutar los scripts, asegúrate de cumplir con los siguientes requisitos:

- **Base de Datos MySQL**: Los scripts están diseñados para MySQL, por lo que necesitarás un servidor MySQL configurado.
- **Acceso a un Usuario con Permisos**: Necesitarás un usuario con permisos suficientes para crear bases de datos y tablas, así como para insertar datos.

## **Cómo Usar los Scripts**

1. **Crear la Base de Datos**:

   - Ejecuta el script de creación de la base de datos (`create_database.sql`) para inicializar la base de datos del proyecto.

2. **Crear las Tablas**:

   - Ejecuta el script de definición de tablas (`create_tables.sql`) para configurar todas las tablas necesarias.

3. **Insertar Datos Iniciales**:

   - Utiliza el script de inserción de datos (`insert_initial_data.sql`) para poblar la base de datos con los datos iniciales como tests, preguntas, opciones y usuarios.

4. **Ejecutar Consultas Esenciales**:

   - Ejecuta las consultas esenciales (`essential_queries.sql`) para revisar el estado de los datos y obtener información clave.

5. **Simular Flujos de Evaluación**:
   - Los scripts de simulación de flujos (`evaluation_flows.sql`) permiten replicar el proceso completo de asignación de tests, realización de tests, y finalización de ciclos de evaluación.
