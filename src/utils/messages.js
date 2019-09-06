const generateMessage = (username, text) => {
  const createdAt = new Date().getTime();
  return { username, text, createdAt };
};

const generateLocationMessage = (username, url) => {
  const createdAt = new Date().getTime();
  return { username, url, createdAt };
};

module.exports = { generateMessage, generateLocationMessage };
