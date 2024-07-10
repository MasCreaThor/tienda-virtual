// src/components/config/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyD7azOaRJQa4KVU0LCW6BVzu9CuXzMMT5A",
    authDomain: "rs-vip.firebaseapp.com",
    databaseURL: "https://rs-vip-default-rtdb.firebaseio.com",
    projectId: "rs-vip",
    storageBucket: "rs-vip.appspot.com",
    messagingSenderId: "372790316300",
    appId: "1:372790316300:web:d19fb86097af9732a3cd29",
    measurementId: "G-NELQY4LK8X"
  };

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const storage = getStorage(app);

export { app, db, auth, googleProvider,storage };
