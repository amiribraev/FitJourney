
import type { ServiceAccount } from 'firebase-admin/app';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function getServiceAccount(): ServiceAccount {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    try {
      return JSON.parse(serviceAccountJson);
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON не является корректным JSON');
    }
  }

  const localPath = join(process.cwd(), 'serviceAccountKey.json');
  if (existsSync(localPath)) {
    try {
      const raw = readFileSync(localPath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      throw new Error('Не удалось прочитать serviceAccountKey.json');
    }
  }

  throw new Error(
    'Не настроен FIREBASE_SERVICE_ACCOUNT_JSON в .env и отсутствует serviceAccountKey.json в корне проекта'
  );
}

export const SERVICE_ACCOUNT = getServiceAccount();
