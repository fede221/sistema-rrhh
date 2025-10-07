// Configuración de testing con Jest y Supertest

// backend/tests/setup.js
const { pool } = require('../src/config/database');

// Setup global para tests
beforeAll(async () => {
  // Configurar base de datos de test
  process.env.NODE_ENV = 'test';
  process.env.DB_NAME = 'RRHH_TEST';
});

afterAll(async () => {
  // Cerrar conexiones
  await pool.end();
});

// backend/tests/auth.test.js
const request = require('supertest');
const app = require('../src/app');

describe('Autenticación', () => {
  test('POST /api/auth/login - Login exitoso', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        dni: '12345678',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
  });

  test('POST /api/auth/login - Credenciales inválidas', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        dni: '12345678',
        password: 'wrongpassword'
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });

  test('POST /api/auth/login - Rate limiting', async () => {
    // Hacer múltiples intentos para activar rate limiting
    const promises = Array(6).fill().map(() =>
      request(app)
        .post('/api/auth/login')
        .send({
          dni: '12345678',
          password: 'wrongpassword'
        })
    );

    const responses = await Promise.all(promises);
    const lastResponse = responses[responses.length - 1];
    
    expect(lastResponse.status).toBe(429);
  });
});

// backend/tests/usuarios.test.js
describe('Gestión de Usuarios', () => {
  let authToken;
  let testUserId;

  beforeAll(async () => {
    // Login como admin para obtener token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        dni: 'admin_dni',
        password: 'admin_password'
      });
    
    authToken = loginResponse.body.token;
  });

  test('GET /api/usuarios - Listar usuarios (requiere auth)', async () => {
    const response = await request(app)
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('POST /api/usuarios - Crear usuario', async () => {
    const newUser = {
      dni: '87654321',
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan.perez@empresa.com',
      rol: 'empleado',
      empresa_id: 1
    };

    const response = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${authToken}`)
      .send(newUser);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    testUserId = response.body.id;
  });

  test('PUT /api/usuarios/:id - Actualizar usuario', async () => {
    const updateData = {
      nombre: 'Juan Carlos'
    };

    const response = await request(app)
      .put(`/api/usuarios/${testUserId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.nombre).toBe('Juan Carlos');
  });
});

// package.json scripts para testing
const testScripts = {
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "jest --testPathPattern=tests/integration"
  },
  "jest": {
    "testEnvironment": "node",
    "coverageDirectory": "coverage",
    "collectCoverageFrom": [
      "src/**/*.js",
      "!src/tests/**"
    ]
  }
};

module.exports = {
  testScripts
};