// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// 🔑 Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBb1XaiD-l8acI7A5L6l5vGlUk41B67Eaw",
  authDomain: "tienda-ropa-2026.firebaseapp.com",
  projectId: "tienda-ropa-2026",
  storageBucket: "tienda-ropa-2026.firebasestorage.app",
  messagingSenderId: "421605463530",
  appId: "1:421605463530:web:f07becde4b444b93298e93",
  measurementId: "G-TZBVH4S3S7"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar los servicios que usaremos
export const db = getFirestore(app);   // Base de datos
export const auth = getAuth(app);      // Autenticación