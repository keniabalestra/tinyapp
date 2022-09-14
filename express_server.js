const { generateRandomString, getUserByEmail, urlsForUser } = require('./helpers');
const { urlDatabase, users } = require('./database');

const express = require("express");
const bcrypt = require("bcryptjs");
const cookieSession = require('cookie-session');
const app = express();
const PORT = 8080;

//middleware
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));//body-parser
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}));


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Redirects to login page if user not logged or to main page if user logged
app.get("/", (req, res) => {
  const currentUser = users[req.session["user_id"]];
  if (!currentUser) {
    res.redirect('/login');
    return;
  }
  res.redirect("/urls");
});


//main page
app.get("/urls", (req, res) => {
  const id = req.session["user_id"];
  const currentUser = users[id];
  if (!currentUser) {
    return res.status(401).send("You need to login to access this feature. Click <a href='/login'>here</a> to login.");
  }
  //URLs to a specific user
  const urls = urlsForUser(currentUser.id, urlDatabase);
  const templateVars = { urls, user: users[id] };
  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
  const id = req.session["user_id"];
  const currentUser = users[id];
  if (!currentUser) {
    res.redirect('/login');
    return;
  }
  const templateVars = { user: users[id] };
  res.render('urls_new', templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const currentUser = users[req.session["user_id"]];
  const shortURL = req.params.shortURL;

  if (!urlDatabase[shortURL]) {
    return res.status(401).send("This URL doesn't exist.");
  }

  const longURL = urlDatabase[shortURL].longURL;
  if (!currentUser) {
    return res.status(401).send("You need to login to access this feature.Click <a href='/login'>here</a> to login.");
  }
  
  if (urlDatabase[shortURL].userID !== currentUser.id) {
    return res.status(403).send("You are not authorized to see this page.");
  }

  const templateVars = { shortURL, longURL, user: users[req.session["user_id"]] };
  res.render('urls_show', templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = urlDatabase[req.params.shortURL];
  if(!shortURL) {
    return res.status(401).send("This URL doesn't exist.");
  }
  const longURL = shortURL.longURL;
  res.redirect(longURL);
});

//Adds a new URL to database
app.post("/urls", (req, res) => {
  const currentUser = users[req.session["user_id"]];
  if (!currentUser) {
    return res.status(401).send("You need to login to access this feature.Click <a href='/login'>here</a> to login.");
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.session["user_id"] };
  res.redirect(`/urls/${shortURL}`);
});

//Updates the URL
app.post("/urls/:shortURL", (req, res) => {
  const currentUser = users[req.session["user_id"]];
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;

  if (urlDatabase[shortURL].userID !== currentUser.id) {
    return res.status(403).send("You are not authorized to see this page. Please click <a href='/login'>here</a> to login.");
  }
  if (!longURL) {
    return res.status(401).send("This URL doesn't exist.");
  }
  urlDatabase[shortURL].longURL = req.body.longURL;
  res.redirect("/urls");
});

//Deletes URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const currentUser = users[req.session["user_id"]];
  if (!currentUser) {
    return res.status(403).send("You are not authorized to delete this URL. ");
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.get('/login', (req, res) => {
  const currentUser = users[req.session["user_id"]];
  if (currentUser) {
    res.redirect('/urls');
    return;
  }
  const templateVars = { user: currentUser };
  res.render('urls_login', templateVars);
});

//Register form
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
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users);

  //Email not found
  if (!user) {
    return res.status(403).send("Invalid request. Email not found! Please click <a href='/login'>here</a> to try again.");
  }

  // Password doesn't match
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("Invalid request. Wrong password! Please click <a href='/login'>here</a> to try again.");
  }
  req.session["user_id"] = user.id;
  res.redirect("/urls");
});

//Registes new user
app.post('/register', function(req, res) {
  const newUserId = generateRandomString();
  const password = req.body.password;
  const email = req.body.email;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (!email || !password) {
    return res.status(400).send("Invalid request. Missing information. Please click <a href='/login'>here</a> to try again. ");
  }
  if (getUserByEmail(email, users) !== null) {
    return res.status(400).send("Invalid request. You're already registered. Please click <a href='/login'>here</a> to login.");
  }
  users[newUserId] = { id: newUserId, email, password: hashedPassword };
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