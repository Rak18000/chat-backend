const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const chatService = require("../services/chat.service");

// Send Message
exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { senderId, content } = req.body;

    if (!chatId || !content || !senderId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    await prisma.message.create({
      data: {
        chatId,
        content,
        senderId,
      },
    });
    const result = await chatservice.sendMessage(chatId, senderId, content);

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};

// Get Messages
exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const limit = req.query.limit || 50;

    const messages = await chatService.getMessages(chatId, limit);

    return res.status(200).json({
      success: true,
      message: "Messages fetched successfully",
      data: messages,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
