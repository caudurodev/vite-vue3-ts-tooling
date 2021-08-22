// https://docs.cypress.io/api/introduction/api.html

describe('Navigation', () => {
  it('cy.visit() - visit a remote url', () => {
    cy.visit('https://en.wikipedia.org/wiki/Diabetes')
  })
})
