const chatService = require("../services/chat.service");

const createChat = async (req, res) => {
  try {
    const { userAId, userBId } = req.body;

    if (!userAId || !userBId) {
      return res.status(400).json({
        success: false,
        message: "Both user IDs are required"
      });
    }

    const chat = await chatService.createOrGetChat(
      userAId,
      userBId
    );

    return res.status(200).json({
      success: true,
      message: "Chat created successfully",
      chatId: chat.id
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


const markRead = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const result = await chatService.markMessageRead(chatId, messageId, userId);

    return res.status(200).json({
      success: true,
      message: "Message marked as read",
      data: result,
    });
  } catch (error) {
    console.error("Read receipt error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateLastSeen = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId, messageId } = req.body;

    if (!userId || !messageId) {
      return res.status(400).json({
        success: false,
        message: "User ID and message ID are required",
      });
    }

    const result = await chatService.updateLastSeen(chatId, userId, messageId);

    return res.status(200).json({
      success: true,
      message: "Last seen updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Last Seen Error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getUserChats = async (req, res) => {
  try {
    const { userId } = req.params;

    const chats = await chatService.getUserChats(userId);

    return res.status(200).json({
      success: true,
      message: "User chats fetched successfully",
      data: chats,
    });
  } catch (error) {
    return res.status(error.message === "User not found" ? 404 : 500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createChat,
  markRead,
  updateLastSeen,
  getUserChats,
};