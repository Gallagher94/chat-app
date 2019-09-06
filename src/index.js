const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
  updateIsTyping
} = require("./utils/users");

const {
  generateMessage,
  generateLocationMessage
} = require("./utils/messages");

const app = express();
const server = http.createServer(app);
/* 
  Instead of express creating the server implicitly, we are creating it explicitly
  So we can pass it into the SocketIO configuration
*/

const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");
/* __dirname provides path to the directory you are currently in */

app.use(express.static(publicDirectoryPath));

io.on("connection", socket => {
  console.log("Connection established from WebSocket");

  socket.on("join", (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);
    socket.emit("message", generateMessage("Chat Bot", "Welcome"));
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessage(user.username, `${user.username} has join ${user.room}`)
      );
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room)
    });
    callback(); // nothing in arguments so in chat we know there is no error
  });

  socket.on("sendMessage", (messageData, callback) => {
    const filter = new Filter();
    const user = getUser(socket.id);

    if (!user) {
      return callback("Could not find user to send message to");
    }

    io.to(user.room).emit(
      "message",
      generateMessage(user.username, messageData)
    ); //send back to the connected user
    if (filter.isProfane(messageData)) {
      return callback(
        `Profanity is not allowed in your message: ${messageData}`
      );
    }
    callback();
  });

  socket.on("typing", (isTyping, callback) => {
    const user = getUser(socket.id);

    if (!user) {
      return callback("Could not find user who is typing");
    }

    updateIsTyping(user.id, isTyping);
    const usersInRoomThatAreTyping = getUsersInRoom(user.room).filter(
      user => user.isTyping
    );
    const sanitisedUsersArray = usersInRoomThatAreTyping.map(
      user => user.username
    );

    io.to(user.room).emit("typing", sanitisedUsersArray);

    callback();
  });

  socket.on("sendLocation", (locationData, callback) => {
    const user = getUser(socket.id);

    if (!user) {
      callback("Could not find user to send message to");
    }

    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${locationData.latitude},${
          locationData.longitude
        }`
      )
    ); //send back to the connected user
    callback(); // Acknowledgments
  });

  socket.on("disconnect", () => {
    const removingUser = getUser(socket.id);
    updateIsTyping(removingUser.id, false);
    const usersInRoomThatAreTyping = getUsersInRoom(removingUser.room).filter(
      removingUser => removingUser.isTyping
    );
    const sanitisedUsersArray = usersInRoomThatAreTyping.map(
      removingUser => removingUser.username
    );

    io.to(removingUser.room).emit("typing", sanitisedUsersArray);

    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage("Chat Bot", `${user.username} left.`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Listening on port: ${port}`);
});

module.exports = app;
