
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyCClSP-COEmszLs-H7GPc7d8Vt8MLyKGWo",
  authDomain: "chat-cb347.firebaseapp.com",
  projectId: "chat-cb347",
  storageBucket: "chat-cb347.appspot.com",
  messagingSenderId: "853844121431",
  appId: "1:853844121431:web:506d8e1f5bb2ff88eb5012"
};


export const app = initializeApp(firebaseConfig);
export const auth=getAuth()
export const storage=getStorage();
export const db =getFirestore()

