// Firebase Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  runTransaction,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Firebase Config
const firebaseConfig = {
   apiKey: "AIzaSyB2_jo_IniRf7IYXmdziTN4yezDxjZxTD0",
  authDomain: "hotpotatoe-12db7.firebaseapp.com",
  projectId: "hotpotatoe-12db7",
  storageBucket: "hotpotatoe-12db7.firebasestorage.app",
  messagingSenderId: "495938423140",
  appId: "1:495938423140:web:ee57563ed78bbe5f41d271",
  measurementId: "G-TRN809H4JK"
};

// Init
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// State
let currentUser = null;
let currentLobby = null;
let isHost = false;

// Auth
document.getElementById("loginBtn").addEventListener("click", () => {
  signInWithPopup(auth, provider);
});
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth);
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    document.getElementById("userName").textContent = user.displayName;
    document.getElementById("authSection").style.display = "none";
    document.getElementById("lobbySection").style.display = "block";
  } else {
    currentUser = null;
    document.getElementById("authSection").style.display = "block";
    document.getElementById("lobbySection").style.display = "none";
  }
});

// Lobby Functions
document.getElementById("createLobbyBtn").addEventListener("click", async () => {
  const lobbyId = Math.random().toString(36).substring(2, 8);
  await setDoc(doc(db, "lobbies", lobbyId), {
    host: currentUser.uid,
    players: [{ uid: currentUser.uid, name: currentUser.displayName, alive: true, ready: false }],
    potatoHolder: null,
    round: 0,
    gameStarted: false,
    createdAt: serverTimestamp(),
  });
  joinLobby(lobbyId, true);
});

document.getElementById("joinLobbyBtn").addEventListener("click", async () => {
  const lobbyId = document.getElementById("lobbyCode").value.trim();
  if (lobbyId) {
    joinLobby(lobbyId, false);
  }
});

async function joinLobby(lobbyId, host) {
  const ref = doc(db, "lobbies", lobbyId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return alert("Lobby does not exist!");
  currentLobby = lobbyId;
  isHost = host;

  await updateDoc(ref, {
    players: arrayUnion({ uid: currentUser.uid, name: currentUser.displayName, alive: true, ready: false }),
  });

  document.getElementById("lobbyCodeDisplay").textContent = lobbyId;
  document.getElementById("lobbySection").style.display = "none";
  document.getElementById("gameSection").style.display = "block";

  onSnapshot(ref, (docSnap) => {
    const data = docSnap.data();
    renderLobby(data);
    if (data.gameStarted) {
      renderGame(data);
    }
  });
}

function renderLobby(data) {
  const list = document.getElementById("playerList");
  list.innerHTML = "";
  data.players.forEach((p) => {
    const li = document.createElement("li");
    li.textContent = `${p.name} ${p.ready ? "(Ready)" : ""}`;
    list.appendChild(li);
  });
}

function renderGame(data) {
  document.getElementById("roundNumber").textContent = data.round;
  document.getElementById("potatoHolder").textContent = data.potatoHolder
    ? data.players.find((p) => p.uid === data.potatoHolder)?.name
    : "No one";
}

document.getElementById("readyBtn").addEventListener("click", async () => {
  const ref = doc(db, "lobbies", currentLobby);
  const snap = await getDoc(ref);
  const data = snap.data();
  const updatedPlayers = data.players.map((p) =>
    p.uid === currentUser.uid ? { ...p, ready: true } : p
  );
  await updateDoc(ref, { players: updatedPlayers });
});

document.getElementById("startBtn").addEventListener("click", async () => {
  if (!isHost) return;
  const ref = doc(db, "lobbies", currentLobby);
  await updateDoc(ref, {
    gameStarted: true,
    round: 1,
    potatoHolder: chooseRandomHolder(await getDoc(ref)),
  });
});

function chooseRandomHolder(snap) {
  const data = snap.data();
  const alive = data.players.filter((p) => p.alive);
  const randomPlayer = alive[Math.floor(Math.random() * alive.length)];
  return randomPlayer.uid;
}

// Pass Potato
document.getElementById("passBtn").addEventListener("click", async () => {
  const ref = doc(db, "lobbies", currentLobby);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    const data = snap.data();
    if (data.potatoHolder !== currentUser.uid) return;
    const alive = data.players.filter((p) => p.alive && p.uid !== currentUser.uid);
    const randomPlayer = alive[Math.floor(Math.random() * alive.length)];
    transaction.update(ref, { potatoHolder: randomPlayer.uid });
  });
});

// End Round
async function endRoundAndContinue() {
  const ref = doc(db, "lobbies", currentLobby);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    const data = snap.data();
    const alivePlayers = data.players.filter((p) => p.alive);
    if (alivePlayers.length <= 1) {
      transaction.update(ref, { gameEnded: true, winner: alivePlayers[0]?.uid || null });
    } else {
      const updatedPlayers = data.players.map((p) =>
        p.uid === data.potatoHolder ? { ...p, alive: false } : p
      );
      transaction.update(ref, {
        players: updatedPlayers,
        round: data.round + 1,
        potatoHolder: chooseRandomHolder({ data: () => ({ players: updatedPlayers }) }),
      });
    }
  });
}

// Cleanup
window.addEventListener("beforeunload", async () => {
  if (!currentUser || !currentLobby) return;
  const ref = doc(db, "lobbies", currentLobby);
  await updateDoc(ref, {
    players: arrayRemove({ uid: currentUser.uid, name: currentUser.displayName, alive: true, ready: false }),
  });
});
