import { randomUUID } from 'expo-crypto';

/** Stable random string ID for worksites, workers, and attendance rows. */
export function newId(): string {
  return randomUUID();
}
