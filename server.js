require('dotenv').config(); // Load environment variables from .env file
const app = require('./app'); // Import the Express app from app.js
const prisma = require("./configs/database");
const { db } = require("./configs/firebase");


const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
      // Test PostgreSQL connection
      await prisma.$connect();

      console.log("PostgreSQL connected successfully");

      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    } catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1);
    }
}


startServer();