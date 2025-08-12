// app.js
import { db, auth } from "./firebase.js";
import {
collection, doc, setDoc, updateDoc, getDoc, onSnapshot, serverTimestamp, deleteDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
onAuthStateChanged, signInAnonymously
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

let gameId = "default"; // Simple single room; could be extended to multiple rooms.
let playerId = null;
let isHost = false;

// Sign in anonymously
onAuthStateChanged(auth, async (user) => {
if (!user) {
await signInAnonymously(auth);
} else {
playerId = user.uid;
joinGame();
}
});

async function joinGame() {
const gameRef = doc(db, "games", gameId);
const gameSnap = await getDoc(gameRef);

if (!gameSnap.exists()) {
// Create new game as host
isHost = true;
await setDoc(gameRef, {
players: [playerId],
potatoHolder: playerId,
lastPassTime: serverTimestamp(),
});
} else {
const data = gameSnap.data();
const players = data.players || [];
if (!players.includes(playerId)) {
players.push(playerId);
await updateDoc(gameRef, { players });
}
}

listenToGame();
}

function listenToGame() {
const gameRef = doc(db, "games", gameId);
onSnapshot(gameRef, (snapshot) => {
if (!snapshot.exists()) return;
const game = snapshot.data();
updateUI(game);
});
}

function updateUI(game) {
document.getElementById("players").innerHTML = "Players: " + game.players.join(", ");
document.getElementById("holder").innerHTML =
"Potato Holder: " + game.potatoHolder;

if (game.potatoHolder === playerId) {
document.getElementById("passBtn").disabled = false;
} else {
document.getElementById("passBtn").disabled = true;
}
}

// Pass potato to next player
async function passPotato() {
const gameRef = doc(db, "games", gameId);
const gameSnap = await getDoc(gameRef);
if (!gameSnap.exists()) return;
const game = gameSnap.data();

if (game.potatoHolder !== playerId) return; // Not your turn

const players = game.players;
const currentIndex = players.indexOf(playerId);
const nextIndex = (currentIndex + 1) % players.length;
const nextHolder = players[nextIndex];

await updateDoc(gameRef, {
potatoHolder: nextHolder,
lastPassTime: serverTimestamp(),
});
}

document.getElementById("passBtn").addEventListener("click", passPotato);
