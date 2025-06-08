import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBoA4DhHFqkzBBIHzxpWsN4HehBDp24T-0",
  authDomain: "combina-7b033.firebaseapp.com",
  projectId: "combina-7b033",
  storageBucket: "combina-7b033.appspot.com",
  messagingSenderId: "58339241217",
  appId: "1:58339241217:web:5bb6c34c4686c0c62dbf00"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth, app };