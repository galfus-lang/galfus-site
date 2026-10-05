const targets = ['local', 'development', 'production'] as const;
type Target = (typeof targets)[number];

const [targetName, ...argumentsForSurrealKit] = process.argv.slice(2);

if (!targets.includes(targetName as Target)) {
  throw new Error(
    `Informe um target: ${targets.join(', ')}. Exemplo: bun run schema:local:check`,
  );
}

const target = targetName as Target;
const environment = { ...process.env };
const targetPrefix = `SURREALDB_${target.toUpperCase()}`;
const requiredCloudSettings = ['HOST', 'NAMESPACE', 'NAME', 'USER', 'PASSWORD'] as const;

function targetValue(setting: string, fallback?: string): string | undefined {
  return environment[`${targetPrefix}_${setting}`] ?? fallback;
}

if (target === 'local') {
  environment.SURREALDB_HOST = targetValue('HOST', 'ws://127.0.0.1:8000/rpc');
  environment.SURREALDB_NAMESPACE = targetValue('NAMESPACE', 'development');
  environment.SURREALDB_NAME = targetValue('NAME', 'main');
  environment.SURREALDB_USER = targetValue('USER', 'root');
  environment.SURREALDB_LOCAL_PASSWORD = targetValue('PASSWORD', 'root');
  environment.SURREALDB_PASSWORD = environment.SURREALDB_LOCAL_PASSWORD;
  environment.SURREALDB_AUTH_LEVEL = targetValue('AUTH_LEVEL', 'root');
} else {
  const missingSettings = requiredCloudSettings.filter((setting) => !targetValue(setting));

  if (missingSettings.length > 0) {
    throw new Error(
      `Faltam variáveis para o target ${target}: ${missingSettings
        .map((setting) => `${targetPrefix}_${setting}`)
        .join(', ')}.`,
    );
  }

  environment.SURREALDB_HOST = targetValue('HOST');
  environment.SURREALDB_NAMESPACE = targetValue('NAMESPACE');
  environment.SURREALDB_NAME = targetValue('NAME');
  environment.SURREALDB_USER = targetValue('USER');
  environment.SURREALDB_PASSWORD = targetValue('PASSWORD');
  environment[`${targetPrefix}_PASSWORD`] = environment.SURREALDB_PASSWORD;
  environment.SURREALDB_AUTH_LEVEL = targetValue('AUTH_LEVEL', 'root');
}

const executable = process.env.SURREALKIT_BIN || Bun.which('surrealkit');

if (!executable) {
  throw new Error(
    'SurrealKit 1.0.0-beta.1 não está instalado. Execute `cargo binstall surrealkit --version 1.0.0-beta.1` ou `cargo install surrealkit --version 1.0.0-beta.1`. Se o binário não estiver no PATH, informe SURREALKIT_BIN.',
  );
}

const processResult = Bun.spawn(
  [
    executable,
    ...(argumentsForSurrealKit[0] === 'typegen' ? [] : ['--target', target]),
    ...argumentsForSurrealKit,
  ],
  {
    cwd: import.meta.dir + '/..',
    env: environment,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  },
);

process.exit(await processResult.exited);
