import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { firebaseConfig, firebaseConfigBBT } from "./config";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

const appBBT = initializeApp(firebaseConfigBBT, "BBT");
const dbBBT = getFirestore(appBBT);
const storageBBT = getStorage(appBBT);

// Export the services you'll use in your app
export { auth, db, storage, dbBBT, storageBBT };
