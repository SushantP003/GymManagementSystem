import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const logoutBtn = document.getElementById("logoutBtn");
const memberInfoDiv = document.getElementById("memberInfo");
const subscriptionStatusDiv = document.getElementById("subscriptionStatus");
const paymentOptions = document.getElementById("paymentOptions");
const billingTableBody = document.querySelector("#billingTable tbody");
const upgradeBtn = document.getElementById("upgradeBtn");
const upgradePackage = document.getElementById("upgradePackage");

const packageDurations = {
  starter: 30,
  basic: 60,
  silver: 90,
  gold: 120,
};

let memberDocId = "";
let memberData = {};

onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const q = query(collection(db, "members"), where("email", "==", user.email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        memberInfoDiv.innerHTML = "<p>❌ Member data not found.</p>";
        return;
      }

      const docSnap = querySnapshot.docs[0];
      memberDocId = docSnap.id;
      memberData = docSnap.data();

      const { name, email, phone, address, package: pkg, subscriptionStart, subscriptionEnd, paymentStatus } = memberData;

      memberInfoDiv.innerHTML = `
        <h3>Your Profile</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Address:</strong> ${address}</p>
        <p><strong>Package:</strong> ${pkg}</p>
        <p><strong>Start:</strong> ${subscriptionStart}</p>
        <p><strong>End:</strong> ${subscriptionEnd}</p>
        <p><strong>Payment Status:</strong> ${paymentStatus}</p>
      `;

      const daysLeft = calculateDaysLeft(subscriptionEnd);
      const totalDays = packageDurations[pkg] || 0;
      subscriptionStatusDiv.innerHTML = `<strong>Subscription:</strong> ${paymentStatus === "paid" ? "✅ Subscribed" : "❌ Not Paid"}<br>
        <strong>Remaining:</strong> ${daysLeft} days left out of ${totalDays}`;

      if (paymentStatus !== "paid") {
        paymentOptions.style.display = "block";
      }

      loadBillingHistory(email);
    } catch (err) {
      memberInfoDiv.innerHTML = `<p>❌ Error: ${err.message}</p>`;
    }
  } else {
    window.location.href = "index.html";
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

function calculateDaysLeft(endDateStr) {
  const end = new Date(endDateStr);
  const today = new Date();
  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

async function loadBillingHistory(email) {
  const billsQuery = query(collection(db, "bills"), where("email", "==", email));
  const billsSnap = await getDocs(billsQuery);
  billingTableBody.innerHTML = "";

  billsSnap.forEach((doc) => {
    const bill = doc.data();
    const row = `<tr>
      <td>${bill.date || "-"}</td>
      <td>${bill.package}</td>
      <td>${bill.status}</td>
      <td>${bill.amount}</td>
    </tr>`;
    billingTableBody.innerHTML += row;
  });
}

document.getElementById("payUpi").addEventListener("click", async () => {
  const bill = {
    email: memberData.email,
    package: memberData.package,
    status: "paid",
    amount: getAmount(memberData.package),
    date: new Date().toLocaleDateString(),
    timestamp: serverTimestamp(),
  };

  await addDoc(collection(db, "bills"), bill);
  await updateDoc(doc(db, "members", memberDocId), {
    paymentStatus: "paid",
  });

  alert("✅ UPI Payment successful. Bill generated.");
  location.reload();
});

document.getElementById("payCod").addEventListener("click", async () => {
  const bill = {
    email: memberData.email,
    package: memberData.package,
    status: "unpaid",
    amount: getAmount(memberData.package),
    date: new Date().toLocaleDateString(),
    timestamp: serverTimestamp(),
  };

  await addDoc(collection(db, "bills"), bill);
  alert("🕒 COD request noted. Admin will verify and update status.");
  location.reload();
});

upgradeBtn.addEventListener("click", async () => {
  const selectedPackage = upgradePackage.value;
  if (!selectedPackage) return alert("Please select a package to upgrade.");

  const oldEnd = new Date(memberData.subscriptionEnd);
  const today = new Date();
  const remainingDays = calculateDaysLeft(memberData.subscriptionEnd);

  const addedDays = packageDurations[selectedPackage];
  const newEndDate = new Date(today.setDate(today.getDate() + addedDays + remainingDays));
  const formattedEndDate = newEndDate.toISOString().split("T")[0];

  await updateDoc(doc(db, "members", memberDocId), {
    package: selectedPackage,
    subscriptionEnd: formattedEndDate,
    paymentStatus: "unpaid", // New package unpaid
  });

  await addDoc(collection(db, "bills"), {
    email: memberData.email,
    package: selectedPackage,
    status: "unpaid",
    amount: getAmount(selectedPackage),
    date: new Date().toLocaleDateString(),
    timestamp: serverTimestamp(),
  });

  alert("✅ Package upgrade successful. Please complete payment.");
  location.reload();
});

function getAmount(packageName) {
  switch (packageName) {
    case "starter": return 500;
    case "basic": return 900;
    case "silver": return 1300;
    case "gold": return 1600;
    default: return 0;
  }
}
