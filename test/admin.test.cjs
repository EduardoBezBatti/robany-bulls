const test = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const net = require('node:net');
require('dotenv').config();
const { mongoose } = require('../src/config/db');

test('Login, autorização, gestão da vitrine, senha e logout', { timeout: 60000 }, async () => {
  const dbName = `robany_test_${randomBytes(8).toString('hex')}`;
  const listener = net.createServer();
  listener.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  const base = `http://localhost:${port}`;
  const email = 'admin@example.test';
  const password = randomBytes(20).toString('hex');
  const oldEnv = { ...process.env };
  let server;
  let logs = '';
  try {
    // Um nome aleatório isola os dados. Nunca reutiliza a base da aplicação.
    await mongoose.connect(process.env.MONGODB_URI, { dbName });
    Object.assign(process.env, {
      BETTER_AUTH_SECRET: randomBytes(32).toString('hex'), BETTER_AUTH_URL: base,
      ADMIN_EMAIL: email, NODE_ENV: 'test',
    });
    const { createAuth, ensureAuthIndexes } = await import('../src/config/auth.mjs');
    const auth = createAuth({ provisioning: true });
    await ensureAuthIndexes(auth);
    await auth.api.signUpEmail({ body: { email, password, name: 'Administrador de teste' } });
    await auth.api.signUpEmail({ body: { email: 'outro@example.test', password, name: 'Sem permissão' } });
    // Mantém host e opções de conexão e troca somente o nome da base para o servidor filho.
    const uri = process.env.MONGODB_URI.replace(/(mongodb(?:\+srv)?:\/\/[^/]+)(?:\/[^?]*)?(\?.*)?$/, `$1/${dbName}$2`);
    server = spawn(process.execPath, ['server.js'], {
      cwd: require('node:path').resolve(__dirname, '..'),
      env: { ...process.env, PORT: String(port), MONGODB_URI: uri },
      stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
    });
    server.stdout.on('data', chunk => { logs += chunk; });
    server.stderr.on('data', chunk => { logs += chunk; });
    let ready = false;
    for (let i = 0; i < 100; i++) {
      if (server.exitCode !== null) throw new Error(logs);
      try { ready = (await fetch(base + '/api/auth/ok')).ok; } catch {}
      if (ready) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.ok(ready, logs);
    const request = (path, { method = 'GET', body, cookie, origin = base, header = true } = {}) => fetch(base + path, {
      method, headers: {
        'Content-Type': 'application/json', Origin: origin,
        ...(header ? { 'X-Admin-Request': '1' } : {}), ...(cookie ? { Cookie: cookie } : {}),
      }, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const login = (loginEmail, loginPassword) => request('/api/auth/sign-in/email', { method: 'POST', body: { email: loginEmail, password: loginPassword } });
    assert.equal((await request('/admin/')).status, 200);
    assert.equal((await request('/api/admin/animais')).status, 401);
    assert.equal((await request('/api/admin/depoimentos', { method: 'POST', body: {} })).status, 401);
    assert.equal((await login(email, 'senha-incorreta')).status, 401);
    const signup = await request('/api/auth/sign-up/email', { method: 'POST', body: { email: 'invasor@example.test', password, name: 'Invasor' } });
    assert.ok(signup.status >= 400);
    const response = await login(email, password);
    assert.equal(response.status, 200);
    const setCookie = response.headers.get('set-cookie');
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=Lax/i);
    const cookie = response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
    assert.equal((await request('/api/admin/me', { cookie: 'better-auth.session_token=forjado' })).status, 401);
    assert.equal((await request('/api/admin/me', { cookie })).status, 200);
    const other = await login('outro@example.test', password);
    const otherCookie = other.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
    assert.equal((await request('/api/admin/me', { cookie: otherCookie })).status, 403);
    const animal = { nome: 'Teste', raca: 'Spitz', cor: 'creme', sexo: 'Fêmea', idadeMeses: 3, pesoKg: 2, preco: 4000, status: 'Disponível', imagem: '' };
    assert.equal((await request('/api/admin/animais', { method: 'POST', cookie, header: false, body: animal })).status, 403);
    assert.equal((await request('/api/admin/animais', { method: 'POST', cookie, origin: 'https://evil.example', body: animal })).status, 403);
    assert.equal((await request('/api/admin/animais', { method: 'POST', cookie, body: { ...animal, preco: { $gt: 0 } } })).status, 400);
    assert.equal((await request('/api/admin/animais', { method: 'POST', cookie, body: { ...animal, imagem: 'javascript:alert(1)' } })).status, 400);
    assert.equal((await request('/api/admin/animais', { method: 'POST', cookie, body: { ...animal, role: 'admin' } })).status, 400);
    const created = await request('/api/admin/animais', { method: 'POST', cookie, body: animal });
    assert.equal(created.status, 201);
    const { _id } = await created.json();
    assert.equal((await request(`/api/animais/${_id}`)).status, 200);
    assert.equal((await request(`/api/admin/animais/${_id}`, { method: 'PATCH', cookie, body: { status: 'Reservado' } })).status, 200);
    assert.equal((await request(`/api/animais/${_id}`)).status, 404);
    assert.equal((await request('/api/admin/animais/invalido', { method: 'PATCH', cookie, body: { status: 'Vendido' } })).status, 400);
    const dep = await request('/api/admin/depoimentos', { method: 'POST', cookie, body: { nome: 'Teste', texto: 'Depoimento de teste', estrelas: 5, autorizado: false } });
    assert.equal(dep.status, 201);
    const depId = (await dep.json())._id;
    assert.equal((await (await request('/api/depoimentos')).json()).length, 0);
    assert.equal((await request(`/api/admin/depoimentos/${depId}`, { method: 'PATCH', cookie, body: { autorizado: true } })).status, 200);
    assert.equal((await (await request('/api/depoimentos')).json()).length, 1);
    assert.equal((await request(`/api/admin/depoimentos/${depId}`, { method: 'PATCH', cookie, body: { estrelas: 2.5 } })).status, 400);
    assert.equal((await request(`/api/admin/animais/${_id}`, { method: 'DELETE', cookie })).status, 204);
    assert.equal((await request(`/api/admin/depoimentos/${depId}`, { method: 'DELETE', cookie })).status, 204);
    const second = await login(email, password);
    const secondCookie = second.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
    const newPassword = randomBytes(20).toString('hex');
    assert.equal((await request('/api/auth/change-password', { method: 'POST', cookie, body: { currentPassword: password, newPassword, revokeOtherSessions: true } })).status, 200);
    assert.equal((await request('/api/admin/me', { cookie: secondCookie })).status, 401);
    assert.equal((await request('/api/auth/sign-out', { method: 'POST', cookie, body: {} })).status, 200);
    assert.equal((await request('/api/admin/me', { cookie })).status, 401);
    // Reinicia o contador só na base isolada, para testar a nova senha sem esperar a janela.
    await mongoose.connection.db.collection('rateLimit').deleteMany({});
    assert.equal((await login(email, password)).status, 401);
    const refreshed = await login(email, newPassword);
    assert.equal(refreshed.status, 200);
    const refreshedCookie = refreshed.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
    await mongoose.connection.db.collection('session').updateMany({}, { $set: { expiresAt: new Date(0) } });
    assert.equal((await request('/api/admin/me', { cookie: refreshedCookie })).status, 401);
    for (let i = 0; i < 3; i++) assert.equal((await login(email, 'incorreta')).status, 401);
    assert.equal((await login(email, 'incorreta')).status, 429);
    const forgedIP = await fetch(base + '/api/auth/sign-in/email', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base, 'X-Robany-Client-IP': '203.0.113.1', 'X-Forwarded-For': '203.0.113.2' },
      body: JSON.stringify({ email, password: 'incorreta' }),
    });
    assert.equal(forgedIP.status, 429);
    assert.equal(await mongoose.connection.db.collection('user').countDocuments({ email: 'invasor@example.test' }), 0);
  } finally {
    if (server && server.exitCode === null) { const exited = once(server, 'exit'); server.kill(); await exited; }
    if (mongoose.connection.readyState === 1) {
      assert.match(mongoose.connection.name, /^robany_test_[a-f0-9]{16}$/);
      await mongoose.connection.dropDatabase();
    }
    await mongoose.disconnect();
    for (const key of ['BETTER_AUTH_SECRET', 'BETTER_AUTH_URL', 'ADMIN_EMAIL', 'NODE_ENV']) {
      if (oldEnv[key] === undefined) delete process.env[key]; else process.env[key] = oldEnv[key];
    }
  }
});
