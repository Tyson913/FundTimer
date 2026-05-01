import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";


const firebaseConfig = {
  apiKey: "AIzaSyAgqAjUC6jEtVxA--K8c1thlgcZHGfa2lY",
  authDomain: "webapp1-a981e.firebaseapp.com",
  databaseURL: "https://webapp1-a981e-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "webapp1-a981e",
  storageBucket: "webapp1-a981e.firebasestorage.app",
  messagingSenderId: "3757685486",
  appId: "1:3757685486:web:ec3a8fc70ad15ddff351ff"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };