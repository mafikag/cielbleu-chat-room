window.CHAT_SERVER_URL = window.CHAT_SERVER_URL || "";
window.CHAT_SOCKET_PATH = window.CHAT_SOCKET_PATH
  || (window.location.pathname.startsWith("/client") ? "/client/socket.io" : "/socket.io");
