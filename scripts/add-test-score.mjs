import { initializeApp } from 'firebase/app';
import { getFirestore, doc, runTransaction } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDvTb-xbqatSQ2X-9yEksnE7IUBcFpjlW0',
  authDomain: 'jlincho.firebaseapp.com',
  projectId: 'jlincho',
  storageBucket: 'jlincho.firebasestorage.app',
  messagingSenderId: '572438101625',
  appId: '1:572438101625:web:6b66c47bc67d18118edea8',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const name = 'TestPlayer';
const score = Math.floor(Math.random() * 900) + 100;

const docRef = doc(db, 'MathniacScores', name);
await runTransaction(db, async tx => {
  const existing = await tx.get(docRef);
  if (!existing.exists() || existing.data().score < score) {
    tx.set(docRef, { name, score, time: new Date().toISOString() });
    console.log(`Set score: ${name} = ${score}`);
  } else {
    console.log(`Skipped: existing score ${existing.data().score} >= ${score}`);
  }
});
process.exit(0);
