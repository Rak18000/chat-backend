const express = require('express');
const app = express();
const cors = require('cors');
const chatRoutes = require("./routes/chat.routes");
const userRoutes = require("./routes/user.routes");
const messageRoutes = require("./routes/message.routes");


// Middleware to parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Sample route
app.get('/', (req, res) => {
    res.send('Hello, World!');
});


app.use("/", chatRoutes);
app.use("/", userRoutes);
app.use("/", messageRoutes);

module.exports = app;