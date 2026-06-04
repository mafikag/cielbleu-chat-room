
const { admin, db } = require("../config/firebase");

function getRoomMessages(room) {
  const roomId = encodeURIComponent(room);

  return db.collection("rooms").doc(roomId).collection("messages");
}

class Message {
  constructor({ username, room, message, createdAt }) {
    this.username = username;
    this.room = room;
    this.message = message;
    this.createdAt = createdAt || null;
  }

  async save() {
    const collection = getRoomMessages(this.room);
    const messageData = {
      username: this.username,
      room: this.room,
      message: this.message,
      createdAt: this.createdAt || admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await collection.add(messageData);

    return {
      id: docRef.id,
      ...messageData
    };
  }

  static async findByRoom(room, limit = 100) {
    const snapshot = await getRoomMessages(room)
      .orderBy("createdAt", "asc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        username: data.username,
        room: data.room,
        message: data.message,
        createdAt: data.createdAt?.toDate?.() || null
      };
    });
  }
}

module.exports = Message;
