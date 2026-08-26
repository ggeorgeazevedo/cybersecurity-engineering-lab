const request = require('supertest');
const app = require('../app/server');

describe('GET /health', () => {
  it('responde ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /users/secure', () => {
  it('encontra um usuário pelo username', async () => {
    const res = await request(app).get('/users/secure').query({ username: 'alice' });
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('alice');
  });

  // TESTE DE REGRESSÃO DE SEGURANÇA:
  // se alguém tornar este endpoint vulnerável a SQLi, este teste QUEBRA.
  it('não é vulnerável a SQL injection', async () => {
    const res = await request(app)
      .get('/users/secure')
      .query({ username: "x' OR '1'='1" });
    expect(res.body).toEqual({}); // payload não pode vazar usuários
  });
});