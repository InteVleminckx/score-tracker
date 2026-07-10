import { addDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { Player } from '../models/Player';
import { usersCollection } from '../../firebase/firestore';

export interface UserRepository {
  list(): Promise<Player[]>;
  create(name: string): Promise<Player>;
}

export class FirestoreUserRepository implements UserRepository {
  async list(): Promise<Player[]> {
    const q = query(usersCollection, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => new Player(doc.id, doc.data().name as string));
  }

  async create(name: string): Promise<Player> {
    const docRef = await addDoc(usersCollection, { name, createdAt: Date.now() });
    return new Player(docRef.id, name);
  }
}
