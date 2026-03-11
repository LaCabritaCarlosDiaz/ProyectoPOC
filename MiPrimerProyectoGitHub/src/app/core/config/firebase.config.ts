import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDY5a5kFkK5kZpJg0XcQwPj8n2YjQh9kWA',
  authDomain: 'tic-tac-toe-ranking.firebaseapp.com',
  projectId: 'tic-tac-toe-ranking',
  storageBucket: 'tic-tac-toe-ranking.firebasestorage.app',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abcd1234efgh5678ijkl',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
