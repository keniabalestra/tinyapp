const checkEmailinDatabase = (email, urlDatabase) => {
  for (let shortURL in urlDatabase) {
    if (email === urlDatabase[shortURL].email) {
      return true;
    }
  }
  return undefined;
};
const generateRandomString = function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};
const getUserByEmail = (email, database) => {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return null;
};

const urlsForUser = function(id, urlDatabase) {
  let userURLs = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
};

module.exports = { checkEmailinDatabase, generateRandomString, getUserByEmail, urlsForUser };