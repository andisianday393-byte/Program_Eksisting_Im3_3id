import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";

import { getFirestore }
from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

import { getAuth }
from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDxqyPzPMeBYtbTuMKp_zlZs4c6-6bZ8ms",
  authDomain: "update-program-e7bcc.firebaseapp.com",
  projectId: "update-program-e7bcc",
  storageBucket: "update-program-e7bcc.firebasestorage.app",
  messagingSenderId: "799869438649",
  appId: "1:799869438649:web:b7dbf2fdc9273e04d42968"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const auth = getAuth(app);