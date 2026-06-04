
# Advanced Luxury Chat Room

Features:
- Online / Offline User Indicator
- QR Code Invitation
- Professional Luxury Design
- Background Premium
- Realtime Messaging
- Firebase Firestore Database
- Multiple Device
- Unlimited Users

Firebase setup:
1. Create a Firebase project at https://console.firebase.google.com/
2. Open Firestore Database, then create a database.
3. Open Project Settings > Service accounts > Generate new private key.
4. Put the downloaded JSON file in `server/serviceAccountKey.json`.
5. Copy `server/.env.example` to `server/.env`.
6. Fill `FIREBASE_PROJECT_ID` with your Firebase project ID.

Run:
cd server
npm install
npm run dev

Open:
client/index.html
