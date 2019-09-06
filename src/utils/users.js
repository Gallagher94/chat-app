const users = [];

const addUser = ({ id, username, room }) => {
  const sanitisedUsername = username.trim().toLowerCase();
  const sanitisedRoom = room.trim().toLowerCase();

  if (!sanitisedUsername || !sanitisedRoom) {
    return { error: "Username and room are required" };
  }

  const existingUser = users.find(user => {
    return user.room === room && user.username === username;
  });

  if (existingUser) {
    return { error: "This user allready exists within this room" };
  }

  //store in one variable user
  const user = {
    id,
    username: sanitisedUsername,
    room: sanitisedRoom,
    isTyping: false
  };
  users.push(user);

  return { user };
};

const removeUser = id => {
  // findIndex is faster than filter as filter keeps runing whaen it finds a match
  const index = users.findIndex(user => {
    return user.id === id;
  });

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
};

const getUser = id => {
  return users.find(user => user.id === id);
};

const getUsersInRoom = room => {
  room = room.trim().toLowerCase();

  return users.filter(user => user.room === room);
};

const updateIsTyping = (id, isTyping) => {
  const user = getUser(id);
  user.isTyping = isTyping;
};

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
  updateIsTyping
};
