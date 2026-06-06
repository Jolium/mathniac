import { Injectable } from '@angular/core';
import { Observable, of, catchError, retry } from 'rxjs';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  runTransaction,
  Firestore,
} from 'firebase/firestore';
import { environment } from '../../../environments/environment';
import { LeaderboardEntry } from '../models/score.model';

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private readonly db: Firestore | null;

  constructor() {
    if (environment.firebase.apiKey !== 'YOUR_API_KEY') {
      const app = getApps().length === 0 ? initializeApp(environment.firebase) : getApp();
      this.db = getFirestore(app);
    } else {
      this.db = null;
    }
  }

  getTopScores(): Observable<LeaderboardEntry[]> {
    if (!this.db) return of([]);
    const db = this.db;
    return new Observable<LeaderboardEntry[]>(observer => {
      const q = query(collection(db, 'MathniacScores'), orderBy('score', 'desc'), limit(10));
      return onSnapshot(
        q,
        snap => observer.next(snap.docs.map(d => ({ id: d.id, ...d.data() } as LeaderboardEntry))),
        err  => observer.error(err),
      );
    }).pipe(
      // Recover from transient Firestore/network errors before giving up, so a
      // brief glitch doesn't permanently kill the live leaderboard stream.
      retry({ count: 3, delay: 2000 }),
      catchError(() => of([])),
    );
  }

  async submitScore(name: string, score: number): Promise<boolean> {
    if (!this.db) return false;
    try {
      const docRef = doc(this.db, 'MathniacScores', name);
      await runTransaction(this.db, async tx => {
        const existing = await tx.get(docRef);
        if (!existing.exists() || (existing.data()['score'] as number) < score) {
          tx.set(docRef, { name, score, time: new Date().toISOString() });
        }
      });
      return true;
    } catch {
      return false;
    }
  }

  async nicknameExists(name: string): Promise<boolean> {
    if (!this.db) return false;
    const snap = await getDoc(doc(this.db, 'MathniacScores', name));
    return snap.exists();
  }

  get isAvailable(): boolean {
    return !!this.db;
  }
}
