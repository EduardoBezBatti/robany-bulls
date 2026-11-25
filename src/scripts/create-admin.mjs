import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import readline from 'node:readline';
import { Writable } from 'node:stream';
import { createAuth, ensureAuthIndexes } from '../config/auth.mjs';
import dbModule from '../config/db.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
if (path.resolve(process.cwd()) !== path.resolve(root)) throw new Error('Execute este comando na raiz do projeto.');
const generated = process.argv.includes('--generate');
const reset = process.argv.includes('--reset');

async function askPassword() {
  if (!process.stdin.isTTY) throw new Error('Use um terminal interativo ou passe --generate.');
  process.stdout.write('Senha do administrador (mínimo 12 caracteres): ');
  const output = new Writable({ write(chunk, encoding, callback) { callback(); } });
  const input = readline.createInterface({ input: process.stdin, output, terminal: true });
  try { return await new Promise(resolve => input.question('', resolve)); }
  finally { input.close(); process.stdout.write('\n'); }
}

try {
  const defaults = {
    BETTER_AUTH_SECRET: randomBytes(32).toString('hex'),
    BETTER_AUTH_URL: `http://localhost:${process.env.PORT || 3000}`,
    ADMIN_EMAIL: 'admin@robany.local',
  };
  let env = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
  for (const [key, value] of Object.entries(defaults)) {
    if (!process.env[key]) {
      process.env[key] = value;
      env = env.replace(new RegExp(`^${key}=.*$`, 'gm'), '');
      env += `\n${key}=${value}\n`;
    }
  }
  fs.writeFileSync('.env', env, { mode: 0o600 });
  await dbModule.connectDB();
  const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
  const existing = await dbModule.mongoose.connection.db.collection('user').findOne({ email });
  if (existing && !reset) throw new Error('Administrador já existe. Para redefinir a senha, use npm run admin:create -- --reset.');
  const password = generated ? randomBytes(18).toString('base64url') : await askPassword();
  if (password.length < 12 || password.length > 128) throw new Error('A senha deve ter entre 12 e 128 caracteres.');
  const auth = createAuth({ provisioning: true });
  await ensureAuthIndexes(auth);
  if (existing) {
    const { hashPassword } = await import('better-auth/crypto');
    const db = dbModule.mongoose.connection.db;
    const ids = [existing._id, String(existing._id)];
    const updated = await db.collection('account').updateOne(
      { userId: { $in: ids }, providerId: 'credential' },
      { $set: { password: await hashPassword(password), updatedAt: new Date() } },
    );
    if (updated.matchedCount !== 1) throw new Error('Conta de senha não encontrada.');
    await db.collection('session').deleteMany({ userId: { $in: ids } });
  } else {
    await auth.api.signUpEmail({ body: { email, password, name: 'Administrador' } });
  }
  if (generated) {
    fs.writeFileSync('.admin-acesso.local.txt', `Acesso administrativo local\nURL: ${process.env.BETTER_AUTH_URL}/admin/\nE-mail: ${email}\nSenha: ${password}\n\nArquivo privado, ignorado pelo Git. Guarde a senha e apague este arquivo.\n`, { mode: 0o600 });
    console.log('Credenciais salvas em .admin-acesso.local.txt (ignorado pelo Git).');
  } else if (fs.existsSync('.admin-acesso.local.txt')) {
    fs.unlinkSync('.admin-acesso.local.txt');
  }
  console.log(`Administrador ${reset ? 'atualizado' : 'criado'}: ${email}. Reinicie a aplicação.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await dbModule.mongoose.disconnect();
}
