import { collection } from 'firebase/firestore';
import { db } from './config';

export const usersCollection = collection(db, 'users');
export const gamesCollection = collection(db, 'games');
