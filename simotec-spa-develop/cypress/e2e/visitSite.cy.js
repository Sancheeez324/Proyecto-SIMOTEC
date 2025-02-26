describe('Admin Home', () => {
  it('should create a new user', () => {
    // 1. Visitar la página principal
    cy.visit('http://localhost:5173');

    // 2. Buscar y hacer clic en el link que dice "Admin Home"
    cy.contains('a', 'Admin Home').click();

    // 3. Llenar el formulario con datos de ejemplo
    cy.get('input[name="name"]').type('John Doe');
    cy.get('input[name="email"]').type('johndoe@example.com');
    cy.get('input[name="password"]').type('Password123');

    // 4. Hacer clic en el botón de "Create User"
    cy.get('button[type="submit"]').click();

    // 5. Validar que el usuario se haya creado correctamente
    // Aquí asumimos que el nombre del usuario se muestra en la tabla después de ser creado.
    cy.contains('td', 'John Doe').should('exist');
    cy.contains('td', 'johndoe@example.com').should('exist');
  });
});
