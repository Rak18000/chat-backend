const express = require("express");
const router = express.Router();

const {
  sendMessage,
  getMessages,
} = require("../controllers/message.controller");

router.post("/chat/:chatId/message/send", sendMessage);
router.get("/chat/:chatId/messages", getMessages);

module.exports = router;