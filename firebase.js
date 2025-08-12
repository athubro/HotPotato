import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getFirestore, doc, collection, setDoc, getDoc, getDocs, addDoc, updateDoc, onSnapshot, serverTimestamp, deleteDoc, runTransaction } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyB2_jo_IniRf7IYXmdziTN4yezDxjZxTD0",
  authDomain: "hotpotatoe-12db7.firebaseapp.com",
  projectId: "hotpotatoe-12db7",
  storageBucket: "hotpotatoe-12db7.firebasestorage.app",
  messagingSenderId: "495938423140",
  appId: "1:495938423140:web:ee57563ed78bbe5f41d271",
  measurementId: "G-TRN809H4JK"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Helper exports
export { auth, db, onAuthStateChanged, signInAnonymously, doc, collection, setDoc, getDoc, getDocs, addDoc, updateDoc, onSnapshot, serverTimestamp, deleteDoc, runTransaction };
