describe('Application Routing and Authentication', () => {
  it('redirects unauthenticated users to the login page', () => {
    // Attempting to visit a protected route without auth data
    cy.visit('/dashboard', {
      onBeforeLoad(win) {
        win.localStorage.removeItem('token')
        win.localStorage.removeItem('user')
      }
    })
    
    // Should be redirected to /login
    cy.url().should('include', '/login')
  })

  // The application seems to have mock demo data setup in standard.
  it('displays the landing page when visiting root', () => {
    cy.visit('/')
    // We expect the root to load without errors
    cy.get('body').should('be.visible')
  })
})
