import { credential, firestore, initializeApp } from 'firebase-admin';

import { CONFIG } from '../../config';

export const createDatabase = (): firestore.Firestore => {
  const { database: moreDBConfig } = CONFIG.more;

  const app = initializeApp({
    credential: credential.cert({
      privateKey: moreDBConfig.privateKey,
      clientEmail: moreDBConfig.clientEmail,
      projectId: moreDBConfig.projectId,
    }),
    databaseURL: moreDBConfig.databaseURL,
  });

  return app.firestore();
};
