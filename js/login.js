import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = e.target.email.value.trim();
  const password = e.target.password.value.trim(); // For members, this is the phone

  const loginMsg = document.getElementById("loginMsg");
  loginMsg.innerText = "⏳ Logging in...";

  try {
    // Try to sign in as admin
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;

    const userDoc = await getDoc(doc(db, "users", uid));
    if (!userDoc.exists()) throw new Error("User role not found.");

    const role = userDoc.data().role;
    if (role === "admin") {
      window.location.href = "admin.html";
    } else {
      throw new Error("Only admins can sign in via Firebase Auth.");
    }
  } catch (err) {
    // If Firebase login fails, check if it's a member
    try {
      const q = query(collection(db, "members"), where("email", "==", email));
      const snapshot = await getDocs(q);

      if (snapshot.empty) throw new Error("Member not found.");

      const memberData = snapshot.docs[0].data();
      if (memberData.phone !== password) throw new Error("Incorrect phone.");

      // Success
      localStorage.setItem("memberEmail", email);
      window.location.href = "member.html";
    } catch (innerErr) {
      loginMsg.innerText = `❌ ${innerErr.message}`;
    }
  }
});
