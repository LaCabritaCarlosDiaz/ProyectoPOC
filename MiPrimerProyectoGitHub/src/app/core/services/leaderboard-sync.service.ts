import { Injectable, inject } from '@angular/core';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { Player } from '../models/player.types';

const COLLECTION_NAME = 'leaderboard';

interface FirebasePlayer extends Omit<Player, 'id'> {
  globalId: string;
  nameLower: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

@Injectable({ providedIn: 'root' })
export class LeaderboardSyncService {
  async getTopPlayers(limit_count: number = 30): Promise<Player[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('rating', 'desc'),
        limit(limit_count)
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data() as FirebasePlayer;
        return {
          id: data.globalId,
          name: data.name,
          winsX: data.winsX || 0,
          winsO: data.winsO || 0,
          draws: data.draws || 0,
          losses: data.losses || 0,
          totalGames: data.totalGames || 0,
          score: data.score || 0,
          rating: data.rating || 0,
        } as Player;
      });
    } catch (e) {
      console.error('Error fetching top players from Firestore', e);
      return [];
    }
  }

  async findPlayerByName(name: string): Promise<Player | null> {
    try {
      const normalizedTarget = name.trim().replace(/\s+/g, ' ');
      const q = query(
        collection(db, COLLECTION_NAME),
        where('nameLower', '==', normalizedTarget.toLowerCase())
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) return null;

      const docData = snapshot.docs[0].data() as FirebasePlayer;
      return {
        id: docData.globalId,
        name: docData.name,
        winsX: docData.winsX || 0,
        winsO: docData.winsO || 0,
        draws: docData.draws || 0,
        losses: docData.losses || 0,
        totalGames: docData.totalGames || 0,
        score: docData.score || 0,
        rating: docData.rating || 0,
      } as Player;
    } catch (e) {
      console.error('Error finding player by name in Firestore', e);
      return null;
    }
  }

  async saveOrUpdatePlayer(player: Player): Promise<void> {
    try {
      const normalizedName = player.name.trim().replace(/\s+/g, ' ');
      const docRef = doc(db, COLLECTION_NAME, player.id);
      
      const data: FirebasePlayer = {
        name: normalizedName,
        nameLower: normalizedName.toLowerCase(),
        winsX: player.winsX,
        winsO: player.winsO,
        draws: player.draws,
        losses: player.losses,
        totalGames: player.totalGames,
        score: player.score,
        rating: player.rating,
        globalId: player.id,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(docRef, data);
    } catch (e) {
      console.error('Error saving/updating player in Firestore', e);
    }
  }
}
