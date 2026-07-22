import init, { Playground } from './galfus-bg/galfus_playground';
import wasmUrl from './galfus-bg/galfus_playground_bg.wasm?url';

export type { Playground } from './galfus-bg/galfus_playground';

let playground: Playground;
let initPromise: Promise<unknown> | null = null;

export async function getPlayground(): Promise<Playground> {
  if (playground) {
    return playground;
  }

  if (!initPromise) {
    initPromise = init({ module_or_path: wasmUrl });
  }

  await initPromise;
  playground = new Playground();
  return playground;
}
