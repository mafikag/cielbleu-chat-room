import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseApp = initializeApp(window.FIREBASE_CONFIG);
const db = getFirestore(firebaseApp);

const joinBtn = document.getElementById("joinBtn");
const sendBtn = document.getElementById("sendBtn");

const usernameInput = document.getElementById("username");

const joinContainer = document.getElementById("join-container");
const chatContainer = document.getElementById("chat-container");

const roomTitle = document.getElementById("roomTitle");
const messageInput = document.getElementById("messageInput");
const messagesDiv = document.getElementById("messages");
const onlineUsersDiv = document.getElementById("onlineUsers");

let username = "";
let room = "";
let roomId = "";
let unsubscribeMessages = null;
let unsubscribePresence = null;
let heartbeatTimer = null;

const sessionId = sessionStorage.getItem("chatSessionId") || createSessionId();
sessionStorage.setItem("chatSessionId", sessionId);

joinBtn.addEventListener("click", joinRoom);
sendBtn.addEventListener("click", sendMessage);

messageInput.addEventListener("keypress", (event) => {
  if(event.key === "Enter"){
    sendMessage();
  }
});

window.addEventListener("beforeunload", () => {
  markOffline();
});

function createSessionId(){
  if(crypto.randomUUID){
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function joinRoom(){
  username = usernameInput.value.trim();
  room = window.DEFAULT_ROOM_NAME || "collegians-room";

  if(!username){
    alert("Please enter your guest name");
    return;
  }

  cleanupListeners();

  roomId = encodeURIComponent(room);

  joinContainer.classList.add("hidden");
  chatContainer.classList.remove("hidden");
  messagesDiv.innerHTML = "";
  roomTitle.textContent = room;

  generateQRCode();
  listenToMessages();
  listenToPresence();
  await markOnline();

  heartbeatTimer = setInterval(markOnline, 30000);
}

function getMessagesCollection() {
  return collection(db, "rooms", roomId, "messages");
}

function getPresenceCollection() {
  return collection(db, "rooms", roomId, "presence");
}

function getPresenceDoc() {
  return doc(db, "rooms", roomId, "presence", sessionId);
}

function listenToMessages(){
  const messagesQuery = query(
    getMessagesCollection(),
    orderBy("createdAt", "asc"),
    limit(100)
  );

  unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
    messagesDiv.innerHTML = "";

    snapshot.forEach((messageDoc) => {
      addMessage(messageDoc.data());
    });
  }, () => {
    addMessage({
      username: "System",
      message: "Unable to load messages from Firebase"
    });
  });
}

function listenToPresence(){
  unsubscribePresence = onSnapshot(getPresenceCollection(), (snapshot) => {
    onlineUsersDiv.innerHTML = "";

    snapshot.forEach((presenceDoc) => {
      const user = presenceDoc.data();

      if(user.online){
        addOnlineUser(user.username);
      }
    });
  });
}

async function markOnline(){
  if(!roomId || !username){
    return;
  }

  await setDoc(getPresenceDoc(), {
    username,
    room,
    online: true,
    updatedAt: serverTimestamp()
  });
}

async function markOffline(){
  if(!roomId){
    return;
  }

  try {
    await deleteDoc(getPresenceDoc());
  } catch (error) {
    // Browser shutdown can interrupt this request, so it is best-effort.
  }
}

function cleanupListeners(){
  if(unsubscribeMessages){
    unsubscribeMessages();
  }

  if(unsubscribePresence){
    unsubscribePresence();
  }

  if(heartbeatTimer){
    clearInterval(heartbeatTimer);
  }
}

function generateQRCode(){
  const roomUrl = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(room)}`;

  document.getElementById("qrcode").innerHTML = "";

  new QRCode(document.getElementById("qrcode"), {
    text: roomUrl,
    width: 180,
    height: 180
  });
}

async function sendMessage(){
  const message = messageInput.value.trim();

  if(!message || !username || !roomId){
    return;
  }

  messageInput.value = "";

  try {
    await addDoc(getMessagesCollection(), {
      username,
      room,
      message,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    addMessage({
      username: "System",
      message: "Unable to send message"
    });
  }
}

function addOnlineUser(name){
  const div = document.createElement("div");
  const status = document.createElement("div");
  const label = document.createElement("span");

  div.classList.add("user-item");
  status.classList.add("status", "online");
  label.textContent = name;

  div.append(status, label);
  onlineUsersDiv.appendChild(div);
}

function addMessage(data){
  const div = document.createElement("div");
  const name = document.createElement("strong");
  const text = document.createElement("p");

  div.classList.add("message");
  name.textContent = data.username || "Guest";
  text.textContent = data.message || "";

  div.append(name, text);
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
