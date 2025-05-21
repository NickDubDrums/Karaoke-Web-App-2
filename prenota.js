
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAbiGcVbznmRf0m-xPlIAtIkAQqMaCVHDk",
  authDomain: "karaoke-live.firebaseapp.com",
  databaseURL: "https://karaoke-live-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "karaoke-live",
  storageBucket: "karaoke-live.firebasestorage.app",
  messagingSenderId: "268291410744",
  appId: "1:268291410744:web:4cb66c45d586510b440fcd"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const isEditor = window.location.href.includes("editor=true");

import { onValue } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-database.js";

const configRef = ref(db, "config");
const reservationsRef = ref(db, "reservations");

let maxPrenotazioni = 25;

onValue(configRef, (snapshot) => {
  if (snapshot.exists()) {
    const config = snapshot.val();
    maxPrenotazioni = config.maxPrenotazioni || 25;
  }
});

onValue(reservationsRef, (snapshot) => {
  const data = snapshot.exists() ? snapshot.val() : [];
  if (data.length >= maxPrenotazioni && !isEditor) {
    window.location.href = "max.html";
  }
});



const song = localStorage.getItem("selectedSong");

if (!song) {
  alert("Nessun brano selezionato. Torna alla pagina principale.");
  window.location.href = "index.html";
}


document.getElementById("songTitle").textContent = "Ti stai prenotando per " + song;

document.getElementById("bookingForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("userName").value.trim();
  if (!name) return;

  const resRef = ref(db, "reservations");
  const snapshot = await get(resRef);
  const reservations = snapshot.exists() ? snapshot.val() : [];

  if (reservations.find(r => r.name === name)) {
    alert("Hai già prenotato!");
    return;
  }

  reservations.push({ name, song });
  await set(resRef, reservations);
  localStorage.setItem("userName", name);
  window.location.href = "waiting.html";
});
