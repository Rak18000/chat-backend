const express = require("express");

const router = express.Router();

const {
  createChat,
  markRead,
  updateLastSeen,
  getUserChats,
} = require("../controllers/chat.controller");

router.post("/chat/create", createChat);
router.post("/chat/:chatId/message/:messageId/read", markRead);
router.post("/chat/:chatId/lastseen", updateLastSeen);
router.get("/user/:userId/chats", getUserChats);

module.exports = router;