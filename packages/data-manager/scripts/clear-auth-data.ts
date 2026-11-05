import { Surreal } from 'surrealdb';

const targets = ['local', 'development', 'production'] as const;
type Target = (typeof targets)[number];

const [targetName, ...argumentsList] = process.argv.slice(2);
if (!targets.includes(targetName as Target)) {
  throw new Error(`Provide a target: ${targets.join(', ')}.`);
}

const target = targetName as Target;
const environment = process.env;
const targetPrefix = `SURREALDB_${target.toUpperCase()}`;
const requiredCloudSettings = ['HOST', 'NAMESPACE', 'NAME', 'USER', 'PASSWORD'] as const;
const dryRun = argumentsList.includes('--dry-run');
const confirmation =
  argumentsList.find((argument) => argument.startsWith('--confirm='))?.slice('--confirm='.length) ??
  environment.CONFIRM_AUTH_DATA_CLEAR;

function targetValue(setting: string, fallback?: string): string | undefined {
  return environment[`${targetPrefix}_${setting}`] ?? fallback;
}

function getConnectionSettings() {
  if (target === 'local') {
    return {
      host: targetValue('HOST', 'ws://127.0.0.1:8000/rpc')!,
      namespace: targetValue('NAMESPACE', 'development')!,
      database: targetValue('NAME', 'main')!,
      username: targetValue('USER', 'root')!,
      password: targetValue('PASSWORD', 'root')!,
    };
  }

  const missingSettings = requiredCloudSettings.filter((setting) => !targetValue(setting));
  if (missingSettings.length > 0) {
    throw new Error(
      `Missing settings for ${target}: ${missingSettings
        .map((setting) => `${targetPrefix}_${setting}`)
        .join(', ')}.`,
    );
  }

  return {
    host: targetValue('HOST')!,
    namespace: targetValue('NAMESPACE')!,
    database: targetValue('NAME')!,
    username: targetValue('USER')!,
    password: targetValue('PASSWORD')!,
  };
}

const authenticationTables = [
  'auth_otp_challenge',
  'auth_transaction',
  'account_authenticator',
  'account_identity',
  'belongs_to',
  'account',
] as const;

async function countRecords(database: Surreal, table: (typeof authenticationTables)[number]) {
  const [rows] = await database
    .query<[Array<{ count: number }>]>(`SELECT count() AS count FROM ${table} GROUP ALL;`)
    .json();
  return Number(rows[0]?.count ?? 0);
}

const settings = getConnectionSettings();
const database = new Surreal();

try {
  await database.connect(settings.host);
  await database.signin({ username: settings.username, password: settings.password });
  await database.use({ namespace: settings.namespace, database: settings.database });

  const counts = await Promise.all(
    authenticationTables.map(
      async (table) => [table, await countRecords(database, table)] as const,
    ),
  );

  console.log(`Authentication data target: ${target} (${settings.namespace}/${settings.database})`);
  for (const [table, count] of counts) console.log(`${table}: ${count}`);

  if (dryRun) {
    console.log('Dry run complete. No records were deleted.');
  } else {
    if (confirmation !== target) {
      throw new Error(
        `Refusing to delete authentication data. Re-run with --confirm=${target} or CONFIRM_AUTH_DATA_CLEAR=${target}.`,
      );
    }

    await database
      .query(
        `
          BEGIN TRANSACTION;
          DELETE auth_otp_challenge;
          DELETE auth_transaction;
          DELETE account_authenticator;
          DELETE account_identity;
          DELETE belongs_to;
          DELETE account;
          COMMIT TRANSACTION;
        `,
      )
      .json();

    console.log(
      'Authentication data was deleted. Organizations, projects, and SSO connections were preserved.',
    );
  }
} finally {
  await database.close();
}
