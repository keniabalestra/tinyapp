const express = require("express");
const bcrypt = require("bcryptjs");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

//middleware
app.set("view engine", "ejs");
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));//body-parser


//user databaseish
// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };


const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  }

};


const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  }
};

//GET routes -organization
//POST routes -organization




//Generate random strings
const generateRandomString = function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};



app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.get("/urls", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  if (!currentUser) {
    return res.status(401).send("You need to login to access this feature. Click <a href='/login'>here</a> to login");
  }
  const urls = urlsForUser(currentUser.id, urlDatabase);
  const templateVars = { urls: urls, user: users[req.cookies["user_id"]] };
  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  if (!currentUser) {
    res.redirect('/login');
    return;
  }
  
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render('urls_new', templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  if (!currentUser) {
    return res.status(401).send("You need to login to access this feature.");
  }
  if (urlDatabase[req.params.shortURL].userID !== currentUser){
    return res.status(403).send("You are not authorized to see this page.");
  }
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies["user_id"]] };
  res.render('urls_show', templateVars);
});

//Adds a new URL
app.post("/urls", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  if (!currentUser) {
    return res.status(401).send("You need to login to access this feature.");;
    // const message = {message: "You need to login to access this feature." }
    // res.render('url_error', message);
    //return;
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.cookies["user_id"] };
  res.redirect(`/urls/${shortURL}`);
});

//redirects using shortURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  if (!longURL) {
    return res.status(401).send("This URL doesn't exist.");
  }
  res.redirect(longURL);
});

//Updates the URL
app.post("/urls/:shortURL", (req, res) => {
  const longURL = req.body.longURL;
  const currentUser = users[req.cookies["user_id"]];
  const shortURL =req.params.shortURL;
  if (urlDatabase[shortURL].userID !== currentUser) {
    return res.status(403).send("You are not authorized to see this page. Please Log In");
  }
  urlDatabase[shortURL].longURL = req.body.longURL;
  res.redirect("/urls");
});

//Delete URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  
  if(!currentUser){
    return res.status(403).send("You are not authorized to delete this URL.");
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});


//Login
app.post('/login', function(req, res) {
  const currentUser = users[req.cookies["user_id"]];
  const user = findUserinDatabase(currentUser, urlDatabase);
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  //Email not found
  if (user === null) {
    return res.status(403).send("Invalid request. Email not found.");
  }

  // Password doesn't match
  if (!bcrypt.compareSync(password, hashedPassword)) {
    return res.status(403).send("Invalid request. Wrong password.");
  }

  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

//New login
app.get('/login', (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  if (currentUser) {
    res.redirect('/urls');
    return;
  }
  const templateVars = { user: currentUser };
  res.render('urls_login', templateVars);
});



//Register
app.get('/register', function(req, res) {
  const currentUser = users[req.cookies["user_id"]];
  if (currentUser) {
    res.redirect('/urls');
    return;
  }
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render('urls_register', templateVars);
});

//Register - POST - handles the registration form data
app.post('/register', function(req, res) {
  const newUserId = generateRandomString();
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  users[newUserId] = { id: newUserId, email: req.body.email, password: hashedPassword};
  const user = users[newUserId];
  console.log(user)
  if (!user.email || !user.password) {
    res.status(400).send("Invalid request. Please add your information. ");
  }
  if (checkEmail(user.email)) {
    res.status(400).send("Invalid request. You're already registered.");
  }

  res.cookie("user_id", newUserId);
  res.redirect('/urls');
});

//Logout
app.post('/logout', function(req, res) {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}!`);
});

//check to see if email exist
const checkEmail = (email) => {
  if (users.email === email) {
    return true;
  }
  return false;
};

//find user email in database

const checkEmailinDatabase = (email, password) => {
  // Email doesn't exist
  if (users.email !== email) {
    res.status(403).send("Invalid request. Email not found.");
  }
  // Password doesn't match
  if (users.password !== password) {
    res.status(403).send("Invalid request. Wrong password.");
  }
};

const findUserinDatabase = (email) => {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
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

