import { config } from 'dotenv';

let loaded = false;

export function loadEnv(): NodeJS.ProcessEnv {
  if (!loaded) {
    config();
    loaded = true;
  }

  return process.env;
}
