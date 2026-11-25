const prisma = require("../configs/database");
const { db } = require("../configs/firebase");
const { FieldValue } = require("firebase-admin/firestore");

const createOrGetChat = async (userAId, userBId) => {
  if (userAId === userBId) {
    throw new Error("Cannot create chat with yourself");
  }

  // Sort IDs to avoid duplicate chats
  const [firstUserId, secondUserId] = [userAId, userBId].sort();

  // Check users exist
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: [firstUserId, secondUserId],
      },
    },
  });

  if (users.length !== 2) {
    throw new Error("User not found");
  }

  // Create or get existing chat
  const chat = await prisma.chat.upsert({
    where: {
      userAId_userBId: {
        userAId: firstUserId,
        userBId: secondUserId,
      },
    },
    update: {},
    create: {
      userAId: firstUserId,
      userBId: secondUserId,
    },
  });

  return chat;
};

const sendMessage = async (chatId, senderId, text) => {
  // Check chat exists
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
  });

  if (!chat) {
    throw new Error("Chat not found");
  }

  // Check sender belongs to chat
  if (chat.userAId !== senderId && chat.userBId !== senderId) {
    throw new Error("Unauthorized user");
  }

  // Save message in Firestore
  const messageRef = await db
    .collection("chats")
    .doc(chatId)
    .collection("messages")
    .add({
      senderId,
      text: text.trim(),
      createdAt: FieldValue.serverTimestamp(),
      readBy: [senderId],
    });

  // Return saved message ID
  return {
    messageId: messageRef.id,
    chatId,
    senderId,
    text,
  };
};

const getMessages = async (chatId, limit = 50) => {
  // Check whether chat exists in PostgreSQL
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
  });

  if (!chat) {
    throw new Error("Chat not found");
  }

  // Fetch messages from Firestore
  const snapshot = await db
    .collection("chats")
    .doc(chatId)
    .collection("messages")
    .orderBy("createdAt", "desc")
    .limit(Number(limit))
    .get();

  // Convert Firestore documents into an array
  const messages = snapshot.docs.map((doc) => ({
    messageId: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate().toISOString() || null,
  }));

  // Return messages in chronological order
  return messages.reverse();
};

const markMessageRead = async (chatId, messageId, userId) => {
  // 1. Check chat exists and user belongs to chat
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
  });

  if (!chat) {
    throw new Error("Chat not found");
  }

  if (chat.userAId !== userId && chat.userBId !== userId) {
    throw new Error("User is not a chat member");
  }

  // 2. Get Firestore message reference
  const messageRef = db
    .collection("chats")
    .doc(chatId)
    .collection("messages")
    .doc(messageId);

  // 3. Get read receipt reference
  const receiptRef = db
    .collection("chats")
    .doc(chatId)
    .collection("readReceipts")
    .doc(userId);

  // 4. Update message and receipt atomically
  await db.runTransaction(async (transaction) => {
    const messageDoc = await transaction.get(messageRef);

    if (!messageDoc.exists) {
      throw new Error("Message not found");
    }

    const messageData = messageDoc.data();

    if (messageData.senderId === userId) {
      throw new Error("Sender cannot mark own message as read");
    }

    const readAt = FieldValue.serverTimestamp();

    // Add reader to message
    transaction.update(messageRef, {
      readBy: FieldValue.arrayUnion(userId),
    });

    // Store latest read receipt
    transaction.set(receiptRef, {
      userId,
      messageId,
      readAt,
    });
  });

  return {
    chatId,
    messageId,
    userId,
    status: "READ",
  };
};

const updateLastSeen = async (chatId, userId, messageId) => {
  // 1. Check chat exists
  const chat = await prisma.chat.findUnique({
    where: {
      id: chatId,
    },
  });

  if (!chat) {
    throw new Error("Chat not found");
  }

  // 2. Check user belongs to chat
  if (chat.userAId !== userId && chat.userBId !== userId) {
    throw new Error("User is not a chat member");
  }

  // 3. Check message exists
  const messageRef = db
    .collection("chats")
    .doc(chatId)
    .collection("messages")
    .doc(messageId);

  const messageDoc = await messageRef.get();

  if (!messageDoc.exists) {
    throw new Error("Message not found");
  }

  // 4. Update last seen
  const lastSeenRef = db
    .collection("chats")
    .doc(chatId)
    .collection("lastSeen")
    .doc(userId);

  await lastSeenRef.set(
    {
      userId,
      messageId,
      updatedAt: FieldValue.serverTimestamp(),
    },
    {
      merge: true,
    },
  );

  return {
    chatId,
    userId,
    messageId,
    status: "UPDATED",
  };
};


const getUserChats = async (userId) => {
  // Check whether user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Find chats where user is either userA or userB
  const chats = await prisma.chat.findMany({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      userAId: true,
      userBId: true,
      createdAt: true,
    },
  });

  return chats.map((chat) => ({
    chatId: chat.id,
    userAId: chat.userAId,
    userBId: chat.userBId,
    createdAt: chat.createdAt,
  }));
};

module.exports = {
  createOrGetChat,
  getMessages,
  markMessageRead,
  sendMessage,
  updateLastSeen,
  getUserChats,
};
