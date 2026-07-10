import { deleteDoc, doc, getDoc, getDocs, orderBy, query, setDoc } from 'firebase/firestore';
import type { GameSnapshot } from '../models/Game';
import { gamesCollection } from '../../firebase/firestore';

export interface GameRepository {
  list(): Promise<GameSnapshot[]>;
  get(id: string): Promise<GameSnapshot | null>;
  save(snapshot: GameSnapshot): Promise<void>;
  remove(id: string): Promise<void>;
}

export class FirestoreGameRepository implements GameRepository {
  async list(): Promise<GameSnapshot[]> {
    const q = query(gamesCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => this.toSnapshot(d.id, d.data()));
  }

  async get(id: string): Promise<GameSnapshot | null> {
    const docSnap = await getDoc(doc(gamesCollection, id));
    if (!docSnap.exists()) return null;
    return this.toSnapshot(docSnap.id, docSnap.data());
  }

  async save(snapshot: GameSnapshot): Promise<void> {
    const { id, ...data } = snapshot;
    await setDoc(doc(gamesCollection, id), data);
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(gamesCollection, id));
  }

  private toSnapshot(id: string, data: Record<string, unknown>): GameSnapshot {
    return {
      id,
      // Games created before multi-game-type support didn't store a
      // gameTypeId at all — they were all YIN, so default accordingly.
      gameTypeId: (data.gameTypeId as string | undefined) ?? 'yin',
      playerIds: data.playerIds as GameSnapshot['playerIds'],
      playerNames: (data.playerNames as GameSnapshot['playerNames']) ?? {},
      actions: data.actions as GameSnapshot['actions'],
      historyIndex: data.historyIndex as number,
      loserSignature: (data.loserSignature as string | null) ?? null,
      createdAt: data.createdAt as number,
      updatedAt: data.updatedAt as number,
    };
  }
}
