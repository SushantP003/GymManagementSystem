// js/admin.js
import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
// import {
//    collection
// } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
// import { getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

import {
    addDoc,
    getDocs,
    collection,
    doc,
    updateDoc,
    deleteDoc
  } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
  

// Logout
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await auth.signOut();
  window.location.href = "index.html";
});

// Add Member Click Handler
document.getElementById("addMemberLink").addEventListener("click", () => {
  document.getElementById("content").innerHTML = `
    <h2>Add Member</h2>
    <form id="addMemberForm">
      <label>Name: <input type="text" name="name" required /></label><br><br>
      <label>Email: <input type="email" name="email" required /></label><br><br>
      <label>Phone: <input type="text" name="phone" required /></label><br><br>
      <label>Address: <input type="text" name="address" required /></label><br><br>
      <label>Package:
        <select name="package" required>
          <option value="">Select</option>
          <option value="starter">Starter (1 Month)</option>
          <option value="basic">Basic (3 Months)</option>
          <option value="silver">Silver (6 Months)</option>
          <option value="gold">Gold (12 Months)</option>
        </select>
      </label><br><br>
      <button type="submit">Add Member</button>
    </form>
    <p id="statusMsg"></p>
  `;

  document.getElementById("addMemberForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const address = form.address.value.trim();
    const selectedPackage = form.package.value;

    const durations = {
      starter: 1, basic: 3, silver: 6, gold: 12
    };

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + durations[selectedPackage]);

    try {
      // Create user
      const userCred = await createUserWithEmailAndPassword(auth, email, phone);

      // Save member data
      await addDoc(collection(db, "members"), {
        uid: userCred.user.uid,
        name, email, phone, address,
        package: selectedPackage,
        subscriptionStart: startDate.toISOString().split("T")[0],
        subscriptionEnd: endDate.toISOString().split("T")[0],
        paymentStatus: "unpaid",
        createdAt: new Date(),
      });

      // Save role
      await addDoc(collection(db, "users"), {
        role: "member",
        email,
      });

      document.getElementById("statusMsg").innerText = "✅ Member added successfully!";
      form.reset();
    } catch (error) {
      document.getElementById("statusMsg").innerText = `❌ ${error.message}`;
    }
  });
});

// View Members
document.getElementById("viewMembersLink").addEventListener("click", async () => {
    const contentDiv = document.getElementById("content");
    contentDiv.innerHTML = `<h2>All Members</h2><p>Loading...</p>`;
  
    const membersRef = collection(db, "members");
    const snapshot = await getDocs(membersRef);
  
    if (snapshot.empty) {
      contentDiv.innerHTML = `<h2>All Members</h2><p>No members found.</p>`;
      return;
    }
  
    let tableHTML = `
    <table border="1" cellpadding="8">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Package</th>
          <th>Start Date</th>
          <th>End Date</th>
          <th>Payment</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  
    snapshot.forEach(doc => {
      const data = doc.data();
      tableHTML += `
  <tr>
    <td>${data.name}</td>
    <td>${data.email}</td>
    <td>${data.phone}</td>
    <td>${data.package}</td>
    <td>${data.subscriptionStart}</td>
    <td>${data.subscriptionEnd}</td>
    <td>${data.paymentStatus}</td>
    <td>
      <button onclick="updateMember('${doc.id}')">✏️</button>
      <button onclick="deleteMember('${doc.id}')">🗑️</button>
    </td>
  </tr>
`;

    });
  
    tableHTML += `</tbody></table>`;
    contentDiv.innerHTML = `<h2>All Members</h2>${tableHTML}`;
  });
  
  window.updateMember = async (id) => {
    const newStatus = prompt("Enter new payment status (paid/unpaid):").toLowerCase();
    if (!["paid", "unpaid"].includes(newStatus)) return alert("Invalid status.");
  
    try {
      await updateDoc(doc(db, "members", id), { paymentStatus: newStatus });
      alert("✅ Payment status updated.");
      document.getElementById("viewMembersLink").click(); // reload table
    } catch (err) {
      console.error(err);
      alert("❌ Update failed.");
    }
  };
  
  window.deleteMember = async (id) => {
    const confirmDelete = confirm("Are you sure you want to delete this member?");
    if (!confirmDelete) return;
  
    try {
      await deleteDoc(doc(db, "members", id));
      alert("🗑️ Member deleted.");
      document.getElementById("viewMembersLink").click(); // reload table
    } catch (err) {
      console.error(err);
      alert("❌ Delete failed.");
    }
  };
  
  document.getElementById("createBill").addEventListener("click", async () => {
    const memberSnapshot = await getDocs(collection(db, "members"));
    const members = [];
    memberSnapshot.forEach((doc) => {
      members.push({ id: doc.id, ...doc.data() });
    });
  
    let formHTML = `
      <h2>Create Bill</h2>
      <form id="billForm">
        <label>Select Member:
          <select name="memberId" required>
            <option value="">-- Select --</option>`;
    members.forEach((m) => {
      formHTML += `<option value="${m.id}">${m.name} (${m.package})</option>`;
    });
    formHTML += `</select></label><br><br>
        <label>Amount: <input type="number" name="amount" required></label><br><br>
        <label>Notes (optional): <input type="text" name="notes"></label><br><br>
        <button type="submit">Generate Bill</button>
      </form>
      <p id="billStatus"></p>
    `;
  
    document.getElementById("content").innerHTML = formHTML;
  
    const billForm = document.getElementById("billForm");
    billForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      const selectedMember = members.find(m => m.id === form.memberId.value);
      const billData = {
        memberId: selectedMember.id,
        name: selectedMember.name,
        email: selectedMember.email,
        package: selectedMember.package,
        amount: parseFloat(form.amount.value),
        notes: form.notes.value.trim(),
        createdAt: new Date()
      };
  
      try {
        await addDoc(collection(db, "bills"), billData);
        document.getElementById("billStatus").innerText = "✅ Bill created successfully!";
        form.reset();
      } catch (err) {
        console.error(err);
        document.getElementById("billStatus").innerText = "❌ Error creating bill.";
      }
    });
  });

  document.getElementById("exportReport").addEventListener("click", async () => {
    const billsSnapshot = await getDocs(collection(db, "bills"));
    const bills = [];
  
    billsSnapshot.forEach(doc => {
      bills.push(doc.data());
    });
  
    if (bills.length === 0) {
      alert("No bills to export.");
      return;
    }
  
    // Convert JSON to CSV
    const headers = ["Name", "Email", "Package", "Amount", "Notes", "Date"];
    const csvRows = [headers.join(",")];
  
    bills.forEach(b => {
      const row = [
        `"${b.name}"`,
        `"${b.email}"`,
        `"${b.package}"`,
        `"${b.amount}"`,
        `"${b.notes || ''}"`,
        `"${new Date(b.createdAt.toDate()).toLocaleDateString()}"`
      ];
      csvRows.push(row.join(","));
    });
  
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
  
    const a = document.createElement("a");
    a.href = url;
    a.download = "gym-bills-report.csv";
    a.click();
  });

  document.getElementById("notifications").addEventListener("click", async () => {
    document.getElementById("content").innerHTML = `
      <h2>Unpaid Members</h2>
      <button id="sendAllBtn">📢 Send Notification to All</button>
      <table border="1" cellpadding="8" cellspacing="0" style="margin-top:10px; width:100%;">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Package</th>
            <th>Subscription End</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="notifTableBody"></tbody>
      </table>
      <p id="notifStatus"></p>
    `;
  
    const notifTable = document.getElementById("notifTableBody");
    const notifStatus = document.getElementById("notifStatus");
    let unpaidMembers = [];
  
    try {
      const snapshot = await getDocs(collection(db, "members"));
  
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.paymentStatus === "unpaid") {
          unpaidMembers.push({ id: doc.id, ...data });
  
          notifTable.innerHTML += `
            <tr>
              <td>${data.name}</td>
              <td>${data.email}</td>
              <td>${data.package.toUpperCase()}</td>
              <td>${data.subscriptionEnd}</td>
              <td><button onclick="sendNotification('${data.email}', '${data.name}')">Send</button></td>
            </tr>
          `;
        }
      });
  
      if (unpaidMembers.length === 0) {
        notifTable.innerHTML = `<tr><td colspan="5">🎉 All members have paid!</td></tr>`;
      }
    } catch (err) {
      console.error("Fetch error:", err);
      notifStatus.innerText = "❌ Could not fetch member list.";
    }
  
    document.getElementById("sendAllBtn").addEventListener("click", () => {
      const type = prompt("Type notification type: 'fees' for fees due or 'holiday' for holiday message:");
      if (!type || !['fees', 'holiday'].includes(type.trim().toLowerCase())) {
        alert("Invalid input.");
        return;
      }
  
      unpaidMembers.forEach(member => {
        sendNotification(member.email, member.name, type);
      });
    });
  });
  
  // Simulated notification function
  window.sendNotification = (email, name, type = "fees") => {
    let message = "";
  
    if (type === "fees") {
      message = `📢 Hello ${name}, your gym fee is pending. Please pay at the earliest.`;
    } else if (type === "holiday") {
      message = `🎉 Hello ${name}, the gym will remain closed tomorrow for maintenance/holiday.`;
    }
  
    // This is where you'd actually send the message (email, SMS, etc.)
    alert(`📤 Sent to ${email}:\n\n${message}`);
  };
  
  document.getElementById("viewBillsLink").addEventListener("click", async () => {
    const content = document.getElementById("content");
    content.innerHTML = `<h2>All Bills</h2>
      <table border="1" id="billsTable">
        <thead>
          <tr>
            <th>Email</th>
            <th>Package</th>
            <th>Status</th>
            <th>Amount</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>`;
  
    const billsSnapshot = await getDocs(collection(db, "bills"));
    const tbody = document.querySelector("#billsTable tbody");
  
    // Collect and sort by date (latest first)
    const bills = [];
    billsSnapshot.forEach(doc => {
      bills.push(doc.data());
    });
  
    bills.sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateB - dateA; // latest first
    });
  
    bills.forEach(data => {
      const dateStr = data.date
        ? new Date(data.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "-";
  
      const row = `
        <tr>
          <td>${data.email}</td>
          <td>${data.package}</td>
          <td>${data.status}</td>
          <td>${data.amount}</td>
          <td>${dateStr}</td>
        </tr>`;
      tbody.innerHTML += row;
    });
  });
  