const {checkEmailinDatabase, generateRandomString, getUserByEmail, urlsForUser} = require('./helpers');
const express = require("express");
const bcrypt = require("bcryptjs");
const cookieSession = require('cookie-session');
const app = express();
const PORT = 8080; // default port 8080

//middleware
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));//body-parser
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}));


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


app.get("/", (req, res) => {
  const currentUser = users[req.session["user_id"]];
  if (!currentUser) {
    res.redirect('/login');
    return;
  }
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.get("/urls", (req, res) => {
  const currentUser = users[req.session["user_id"]];
  if (!currentUser) {
    return res.status(401).send("You need to login to access this feature. Click <a href='/login'>here</a> to login");
  }
  const urls = urlsForUser(currentUser.id, urlDatabase);
  const templateVars = { urls: urls, user: users[req.session["user_id"]] };
  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
  const currentUser = users[req.session["user_id"]];
  if (!currentUser) {
    res.redirect('/login');
    return;
  }

  const templateVars = { user: users[req.session["user_id"]] };
  res.render('urls_new', templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const currentUser = users[req.session["user_id"]];
  if (!currentUser) {
    return res.status(401).send("You need to login to access this feature.");
  }
  if (urlDatabase[req.params.shortURL].userID !== currentUser.id) {
    return res.status(403).send("You are not authorized to see this page.");
  }
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.session["user_id"]] };
  res.render('urls_show', templateVars);
});
//redirects using shortURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;

  if (!longURL) {
    return res.status(401).send("This URL doesn't exist.");
  }
  res.redirect(longURL);
});

//Adds a new URL
app.post("/urls", (req, res) => {
  const currentUser = users[req.session["user_id"]];
  if (!currentUser) {
    return res.status(401).send("You need to login to access this feature.");;
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.session["user_id"] };
  res.redirect(`/urls/${shortURL}`);
});

//Updates the URL
app.post("/urls/:shortURL", (req, res) => {
  const currentUser = users[req.session["user_id"]];
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL].userID !== currentUser) {
    return res.status(403).send("You are not authorized to see this page. Please Log In");
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  if (!longURL) {
    return res.status(401).send("This URL doesn't exist.");
  }

  urlDatabase[shortURL].longURL = req.body.longURL;
  res.redirect("/urls");
});

//Delete URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const currentUser = users[req.session["user_id"]];

  if (!currentUser) {
    return res.status(403).send("You are not authorized to delete this URL.");
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

//New login
app.get('/login', (req, res) => {
  const currentUser = users[req.session["user_id"]];
  if (currentUser) {
    res.redirect('/urls');
    return;
  }
  const templateVars = { user: currentUser };
  res.render('urls_login', templateVars);
});

//Register
app.get('/register', function(req, res) {
  const currentUser = users[req.session["user_id"]];
  if (currentUser) {
    res.redirect('/urls');
    return;
  }
  const templateVars = { user: users[req.session["user_id"]] };
  res.render('urls_register', templateVars);
});

//Login
app.post('/login', function(req, res) {
  const user = getUserByEmail(req.body.email, urlDatabase);
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
  req.session["user_id"] = user.id;
  res.redirect("/urls");
});

//Register - POST - handles the registration form data
app.post('/register', function(req, res) {
  const newUserId = generateRandomString();
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  users[newUserId] = { id: newUserId, email: req.body.email, password: hashedPassword };
  const user = users[newUserId];

  if (!user.email || !user.password) {
    res.status(400).send("Invalid request. Please add your information. ");
  }
  if (checkEmailinDatabase(user.email, urlDatabase)) {
    res.status(400).send("Invalid request. You're already registered.");
  }
  req.session["user_id"] = newUserId;
  res.redirect('/urls');
});

//Logout
app.post('/logout', function(req, res) {
  req.session = null;
  res.redirect("/urls");
});



app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}!`);
});