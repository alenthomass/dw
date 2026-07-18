# Firebase Cloud Backend Setup Guide

The Display World admin case registry and dynamic portfolio pages are fully equipped with a production-ready **Firebase Cloud Backend** integration (Firestore Database + Cloud Storage file uploads). 

Follow these steps to connect your personal Firebase cloud database in under 2 minutes:

---

## Step 1: Create a Firebase Project
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and give it a name (e.g., `display-world-portfolio`).
3. Click **Continue** (you can disable Google Analytics for this test project).
4. Wait for the project creation to finish and click **Continue**.

---

## Step 2: Enable Cloud Firestore (Database)
1. In the Firebase left sidebar, click **Build** > **Firestore Database**.
2. Click **Create Database**.
3. Choose a database location close to you and click **Next**.
4. Select **Start in test mode** (this allows immediate read/write access during setup) and click **Create**.
5. *Note: Firestore collections (`projects` and `settings`) will be automatically seeded by the website code on your first page load!*

---

## Step 3: Enable Firebase Storage (File Uploads)
1. In the left sidebar, click **Build** > **Storage**.
2. Click **Get Started**.
3. Select **Start in test mode** and click **Next**.
4. Choose a default location and click **Done**.
5. *Note: This folder will store files uploaded using the drag-and-drop selector in the Admin modal.*

---

## Step 4: Register a Web App & Copy Credentials
1. Go back to the **Project Overview** (click the gear icon ⚙️ > **Project Settings**).
2. Under **Your apps**, click the web icon (`</>`) to add a Web App.
3. Name your app (e.g., `dw-web`) and click **Register app**.
4. You will see a `firebaseConfig` block. Copy only the following key strings:
   - `apiKey`
   - `projectId`
   - `storageBucket`
   - `appId`

---

## Step 5: Connect and Activate
1. Open your Display World Admin Panel in the browser: `http://localhost:8080/admin.html` (passcode: `admin123`).
2. Click the pink **Configure Firebase** button in the header.
3. Paste the keys you copied in Step 4.
4. Click **Save & Connect**.
5. The page will reload and update the top banner to:  
   `Backend Connection Mode: Firebase Firestore & Storage (Cloud) [Active]`

---

## 💡 Fallback & Local Sandbox Mode
If you ever want to disconnect from the cloud database or work offline:
- Open the **Configure Firebase** modal in the admin panel.
- Click **Disconnect (Local Mode)**.
- The system will fall back to reading/writing locally from files served by the Node server or browser storage.
