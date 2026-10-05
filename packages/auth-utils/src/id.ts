import { ulid } from 'ulid';

/** Generates a lexicographically sortable, globally unique public identifier. */
export function generateId(): string {
  return ulid();
}
