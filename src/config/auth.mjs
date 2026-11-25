import { betterAuth } from 'better-auth';
import { mongodbAdapter } from '@better-auth/mongo-adapter';
import { getAuthTables } from 'better-auth/db';
import dbModule from './db.js';

export function createAuth({ provisioning = false } = {}) {
  const secret = process.env.BETTER_AUTH_SECRET;
  const baseURL = process.env.BETTER_AUTH_URL;
  const email = process.env.ADMIN_EMAIL;
  if (!secret || secret.length < 32 || !baseURL || !email) {
    throw new Error('Configure BETTER_AUTH_SECRET (mínimo 32 caracteres), BETTER_AUTH_URL e ADMIN_EMAIL. Execute npm run admin:create.');
  }
  const url = new URL(baseURL);
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
    throw new Error('BETTER_AUTH_URL precisa usar HTTPS em produção.');
  }
  return betterAuth({
    appName: 'Robany Bulls Poms',
    baseURL: url.origin,
    secret,
    // Sem transações para manter compatibilidade com MongoDB standalone local.
    database: mongodbAdapter(dbModule.mongoose.connection.db),
    emailAndPassword: {
      enabled: true,
      disableSignUp: !provisioning,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      autoSignIn: false,
    },
    session: { expiresIn: 60 * 60 * 8, updateAge: 60 * 60, cookieCache: { enabled: false } },
    rateLimit: {
      enabled: true,
      storage: 'database',
      window: 60,
      max: 60,
      customRules: { '/sign-in/email': { window: 60, max: 5 } },
    },
    advanced: {
      useSecureCookies: url.protocol === 'https:',
      ipAddress: { ipAddressHeaders: ['x-robany-client-ip'] },
    },
  });
}

// Aguarda os índices obrigatórios antes de servir requisições ou encerrar o CLI.
// O adaptador também cria índices em background; aqui falhas devem ser visíveis.
export async function ensureAuthIndexes(auth) {
  await auth.$context;
  const tables = getAuthTables(auth.options);
  await Promise.all(Object.values(tables).flatMap(table =>
    Object.entries(table.fields).filter(([, field]) => field.required !== false && (field.unique || field.index))
      .map(([name, field]) => {
        const column = field.fieldName || name;
        return dbModule.mongoose.connection.db.collection(table.modelName).createIndex(
          { [column]: 1 },
          { name: `${table.modelName}_${column}_${field.unique ? 'uidx' : 'idx'}`, unique: field.unique === true },
        );
      }),
  ));
}
