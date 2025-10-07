/**
 * Simple integration test: creates a user via POST /api/usuarios and verifies the legajo exists.
 * Requirements:
 * - Backend running locally on http://localhost:3001
 * - A superadmin user exists with DNI 88888888 and password admin123 (see create-admin.js)
 * Usage (PowerShell):
 *   node scripts/test-create-user-and-legajo.js
 */

const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const API_BASE = process.env.API_BASE || 'http://localhost:3001';

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function login(dni, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dni, password })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Login failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function createUser(token, payload) {
  const res = await fetch(`${API_BASE}/api/usuarios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  if (!res.ok) {
    throw new Error(`Create user failed (${res.status}): ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  }
  return body;
}

async function getMiLegajoFromUsuarios(token) {
  const res = await fetch(`${API_BASE}/api/usuarios/mi-legajo`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  if (!res.ok) {
    throw new Error(`usuarios/mi-legajo failed (${res.status}): ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  }
  return body;
}

async function getMiLegajoFromLegajos(token) {
  const res = await fetch(`${API_BASE}/api/legajos/mi-legajo`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  if (!res.ok) {
    throw new Error(`legajos/mi-legajo failed (${res.status}): ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  }
  return body;
}

(async () => {
  try {
    // Build a superadmin token using JWT secret to avoid dependency on a specific admin account
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET no definido en .env del backend');
    const adminToken = jwt.sign(
      {
        id: 999999,
        rol: 'superadmin',
        dni: '00000000',
        nombre: 'Test',
        apellido: 'Admin'
      },
      secret,
      { expiresIn: '1h' }
    );
    console.log('✅ Token de superadmin generado');

    const unique = Date.now() % 1000000;
    const payload = {
      legajo: `T${unique}`,
      dni: `${rand(30000000, 49999999)}`,
      nombre: 'Test',
      apellido: `User${unique}`,
      correo: `test.user.${unique}@example.com`,
      password: 'Password123',
      rol: 'empleado',
      cuil: `${rand(20,27)}${rand(10000000, 49999999)}${rand(0,9)}`
    };

    console.log('👤 Creating user:', { legajo: payload.legajo, dni: payload.dni, correo: payload.correo });
    const createResp = await createUser(adminToken, payload);
    console.log('✅ Create response:', createResp);

    // Login as the created user to call mi-legajo in that context
    console.log('🔐 Logging in as the created user...');
    const userLogin = await login(payload.dni, 'Password123');
    const userToken = userLogin.token;
    if (!userToken) throw new Error('No token from user login');
    console.log('✅ User login OK');

    console.log('📄 Fetching mi-legajo (via /api/legajos/mi-legajo)...');
    let legajo;
    try {
      legajo = await getMiLegajoFromLegajos(userToken);
    } catch (e) {
      console.warn('⚠️ Fallback to /api/usuarios/mi-legajo:', e.message);
      legajo = await getMiLegajoFromUsuarios(userToken);
    }
    console.log('✅ mi-legajo:', legajo);

    // Basic assertions
    if (!legajo || !legajo.numero_legajo) {
      throw new Error('Legajo inválido en la respuesta');
    }
    if (String(legajo.numero_legajo) !== String(payload.legajo)) {
      throw new Error(`numero_legajo no coincide. Esperado=${payload.legajo}, Recibido=${legajo.numero_legajo}`);
    }
    if (String(legajo.nro_documento) !== String(payload.dni)) {
      throw new Error(`nro_documento no coincide. Esperado=${payload.dni}, Recibido=${legajo.nro_documento}`);
    }

    console.log('🎉 Test OK: Usuario creado y legajo devuelto correctamente');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
})();
