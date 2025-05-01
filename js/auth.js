import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const loginForm = document.getElementById("login-form");
const errorMsg = document.getElementById("error-message");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Get user role from Firestore
    const userDoc = await getDoc(doc(db, "users", uid));
    if (!userDoc.exists()) {
      errorMsg.textContent = "No role assigned. Contact admin.";
      return;
    }

    const role = userDoc.data().role;

    // Redirect based on role
    if (role === "admin") {
      window.location.href = "admin-dashboard.html";
    } else if (role === "member") {
      window.location.href = "member-dashboard.html";
    } else if (role === "user") {
      window.location.href = "user-dashboard.html";
    } else {
      errorMsg.textContent = "Invalid role. Contact support.";
    }

  } catch (error) {
    console.error("Login error:", error);
    errorMsg.textContent = "Invalid credentials or network error.";
  }
});
