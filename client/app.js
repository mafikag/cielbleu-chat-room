
const socketServerUrl = window.CHAT_SERVER_URL
  || (["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? "http://localhost:3000"
    : window.location.origin);

const socket = io(socketServerUrl, {
  path: window.CHAT_SOCKET_PATH || "/socket.io",
  transports: ["websocket", "polling"]
});

const joinBtn = document.getElementById("joinBtn");
const sendBtn = document.getElementById("sendBtn");

const usernameInput = document.getElementById("username");
const roomInput = document.getElementById("room");

const joinContainer = document.getElementById("join-container");
const chatContainer = document.getElementById("chat-container");

const messageInput = document.getElementById("messageInput");
const messagesDiv = document.getElementById("messages");

const onlineUsersDiv = document.getElementById("onlineUsers");

let username = "";
let room = "";

joinBtn.addEventListener("click", () => {

  username = usernameInput.value.trim();
  room = roomInput.value.trim();

  if(!username || !room){
    alert("Please fill all fields");
    return;
  }

  socket.emit("joinRoom", {
    username,
    room
  });

  joinContainer.classList.add("hidden");
  chatContainer.classList.remove("hidden");

  generateQRCode();
});

function generateQRCode(){

  const roomUrl = window.location.href + "?room=" + room;

  document.getElementById("qrcode").innerHTML = "";

  new QRCode(document.getElementById("qrcode"), {
    text: roomUrl,
    width: 180,
    height: 180
  });
}

sendBtn.addEventListener("click", sendMessage);

messageInput.addEventListener("keypress", (e)=>{
  if(e.key === "Enter"){
    sendMessage();
  }
});

function sendMessage(){

  const message = messageInput.value.trim();

  if(!message) return;

  socket.emit("chatMessage", {
    username,
    room,
    message
  });

  messageInput.value = "";
}

socket.on("message", addMessage);
socket.on("systemMessage", addMessage);

socket.on("connect_error", () => {
  addMessage({
    username: "System",
    message: "Connection to chat server failed. Please check the server URL."
  });
});

socket.on("loadMessages", (messages)=>{
  messages.forEach(addMessage);
});

socket.on("onlineUsers", (users)=>{

  onlineUsersDiv.innerHTML = "";

  users.forEach(user=>{

    const div = document.createElement("div");

    div.classList.add("user-item");

    div.innerHTML = `
      <div class="status online"></div>
      <span>${user.username}</span>
    `;

    onlineUsersDiv.appendChild(div);
  });
});

socket.on("offlineUser", (user)=>{

  const div = document.createElement("div");

  div.classList.add("user-item");

  div.innerHTML = `
    <div class="status offline"></div>
    <span>${user.username}</span>
  `;

  onlineUsersDiv.appendChild(div);
});

function addMessage(data){

  const div = document.createElement("div");

  div.classList.add("message");

  div.innerHTML = `
    <strong>${data.username}</strong>
    <p>${data.message}</p>
  `;

  messagesDiv.appendChild(div);

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
