
# 💪 Gym Management System

A Gym Management System designed to help gym owners manage members, track subscriptions, generate bills, and maintain payment history—all in one place.

## 📌 Description

The **Gym Billing System** enables gym admins to add and manage members, assign membership packages, and track billing and subscription periods. It supports real-time role-based authentication and provides a dedicated dashboard for both admins and gym members.

## 🛠 Tech Stack

- **Frontend**: HTML, CSS, JavaScript  
- **Backend/Database**: Firebase (Authentication + Firestore)

## 🚀 Features

- ✅ Real-time Authentication (via Firebase)
- 🔐 Role-based Access (Admin and Member)
- 👥 Add and Manage Gym Members
- 📢 Monthly Notifications for Unpaid Members
- 📅 Membership Package Management with Auto End-Date Calculation
- 🧾 Bill Generation with Payment History
- 💳 Payment Options: UPI or Cash on Delivery (COD)
- 📈 Subscription Tracker with Days Remaining
- ⬆️ Package Upgrading (with carry-forward of remaining days)
- 📄 Admin Report Export and All Bill Viewing

## 📥 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/gym-billing-system.git
   cd gym-billing-system
   ```

2. **Set up Firebase**:
   - Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create three Firestore collections:
     - `users` – Stores basic user data and their roles.
     - `members` – Stores detailed member profiles.
     - `bills` – Stores billing records.
   - Add your Firebase configuration to `js/firebase-config.js`.

3. **Run the app**:
   Open `index.html` in your browser or host it using a static server.

## 🧑‍🏫 Usage Instructions

- **Admin Panel**:
  - Login using admin credentials.
  - Add new members with their details and assign a package.
  - View and manage members, track payments, and send reminders.
  - Generate bills for members and export reports.

- **Member Dashboard**:
  - Login using email and phone number as password.
  - View personal details, package, and subscription status.
  - Choose payment method if dues are pending.
  - Upgrade to a new package if desired.

> ⚠️ **Note:** Payment is simulated—no actual payment gateway is integrated. For UPI, the bill is generated instantly. For COD, admin approval is required to confirm payment and generate the bill.

## 📄 License

This project is open for educational and personal use. No specific license is attached yet.
