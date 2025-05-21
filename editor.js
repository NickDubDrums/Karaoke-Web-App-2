
// editor.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-database.js";
import Sortable from "https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/modular/sortable.core.esm.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAbiGcVbznmRf0m-xPlIAtIkAQqMaCVHDk",
  authDomain: "karaoke-live.firebaseapp.com",
  databaseURL: "https://karaoke-live-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "karaoke-live",
  storageBucket: "karaoke-live.appspot.com",
  messagingSenderId: "268291410744",
  appId: "1:268291410744:web:4cb66c45d586510b440fcd"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// DOM Elements
const editorPanel = document.getElementById("editorPanel");
const newSongInput = document.getElementById("newSongInput");
const addSongBtn = document.getElementById("addSongBtn");
const editableSongList = document.getElementById("editableSongList");
const resetBtn = document.getElementById("resetBtn");
const downloadCSVBtn = document.getElementById("downloadCSVBtn");
const currentSongInput = document.getElementById("currentSongInput");
const nextSongBtn = document.getElementById("nextSongBtn");
const prevSongBtn = document.getElementById("prevSongBtn");
const annullaLimiteInput = document.getElementById("annullaLimite");
const maxPrenotazioniInput = document.getElementById("maxPrenotazioniInput");
const editorTableBody = document.querySelector("#editorTable tbody");

// App state
let canzoni = [];
let prenotazioni = [];
let branoCorrente = 0;
let maxPrenotazioni = 25;

// Firebase refs
const songsRef = ref(db, "songs");
const reservationsRef = ref(db, "reservations");
const configRef = ref(db, "config");

// Init
onValue(songsRef, (snapshot) => {
  canzoni = snapshot.exists() ? snapshot.val() : [];
  renderEditorList();
});

onValue(reservationsRef, (snapshot) => {
  prenotazioni = snapshot.exists() ? snapshot.val() : [];
  renderEditorList();
});

onValue(configRef, (snapshot) => {
  const config = snapshot.val() || {};
  branoCorrente = config.branoCorrente || 0;
  maxPrenotazioni = config.maxPrenotazioni || 25;
  annullaLimiteInput.value = config.annullaLimite || 0;
  maxPrenotazioniInput.value = maxPrenotazioni;
  updateCurrentSongIndexDisplay();
});

// Save function
function save() {
  const annullaLimite = parseInt(annullaLimiteInput.value) || 0;
  maxPrenotazioni = parseInt(maxPrenotazioniInput.value) || 25;
  set(songsRef, canzoni);
  set(reservationsRef, prenotazioni);
  set(configRef, {
    maxPrenotazioni,
    branoCorrente,
    annullaLimite
  });
}

// Render functions
function renderEditorList() {
  editableSongList.innerHTML = "";
  const prenotate = prenotazioni.map(p => p.song);
  const nonPrenotate = canzoni.filter(song => !prenotate.includes(song));
  canzoni = prenotate.concat(nonPrenotate).filter((v, i, a) => a.indexOf(v) === i);
  canzoni.forEach((song, index) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${index + 1}.</strong> ${song}`;
    editableSongList.appendChild(li);
  });
  renderEditorTable();
  updateCurrentSongIndexDisplay();
}

function renderEditorTable() {
  editorTableBody.innerHTML = "";
  canzoni.forEach((song, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${song}</td>
      <td>${(prenotazioni.find(p => p.song === song) || {}).name || ""}</td>
      <td><button class="btn btn-secondary" style="padding:2px 8px" onclick="removeSong(${index})">X</button></td>
    `;
    editorTableBody.appendChild(row);
  });
}

// Remove song
window.removeSong = function(index) {
  if (confirm(`Rimuovere "${canzoni[index]}" dalla scaletta?`)) {
    canzoni.splice(index, 1);
    save();
    renderEditorList();
  }
};

// UI Handlers
addSongBtn.addEventListener("click", () => {
  const newSong = newSongInput.value.trim();
  if (newSong && !canzoni.includes(newSong)) {
    canzoni.push(newSong);
    save();
    newSongInput.value = "";
    renderEditorList();
  }
});

resetBtn.addEventListener("click", () => {
  if (confirm("Sei sicuro di voler resettare tutte le prenotazioni?")) {
    prenotazioni = [];
    branoCorrente = 0;
    save();
    renderEditorList();
    alert("Prenotazioni resettate.");
  }
});

downloadCSVBtn.addEventListener("click", () => {
  const rows = [["Nome", "Brano"]];
  prenotazioni.forEach(p => rows.push([p.name, p.song]));
  const csvContent = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "prenotazioni.csv";
  a.click();
  URL.revokeObjectURL(url);
});

new Sortable(editableSongList, {
  animation: 150,
  onEnd: () => {
    canzoni = Array.from(editableSongList.children).map(li =>
      li.textContent.trim().replace(/^\d+\.\s*/, "")
    );
    renderEditorList();
  }
});

nextSongBtn.addEventListener("click", () => {
  branoCorrente++;
  save();
  renderEditorList();
});

prevSongBtn.addEventListener("click", () => {
  if (branoCorrente > 0) branoCorrente--;
  save();
  renderEditorList();
});

currentSongInput.addEventListener("change", () => {
  const val = parseInt(currentSongInput.value);
  if (!isNaN(val) && val >= 0) {
    branoCorrente = val;
    save();
    renderEditorList();
  }
});

annullaLimiteInput.addEventListener("change", save);
maxPrenotazioniInput.addEventListener("change", save);

function updateCurrentSongIndexDisplay() {
  currentSongInput.value = branoCorrente;
}
