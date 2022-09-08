const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

//middleware
app.set("view engine", "ejs");
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));//body-parser


//user databaseish
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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


// program to generate random strings

// declare all characters


const generateRandomString = function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = ' ';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};



app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"]; // userId = abc123
  //const user = abc123:{ userId: abc123, email:abc@gmail.com, passwrod: hshdo}
  const templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]] };
  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render('urls_new', templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies["user_id"]] };
  res.render('urls_show', templateVars);
});

//Add a new URL
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

//redirects using shortURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

//update
app.post("/urls/:shortURL", (req, res) => {
  const longURL = req.body.longURL;
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect("/urls");
});

//Delete URL
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");


});


//Login
app.post('/login', function(req, res) {
  const user = findUserinDatabase(req.body.email);
console.log(user)
  //Email not found
  if (user === null) {
    return res.status(403).send("Invalid request. Email not found.");
  }

  // Password doesn't match
  if (user.password !== req.body.password) {
    return res.status(403).send("Invalid request. Wrong password.");
  }

  res.cookie("user_id", user.id);
  res.redirect("/urls");


});

//New login
app.get('/login', (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render('urls_login', templateVars);


});

//Logout
app.post('/logout', function(req, res) {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

//Register
app.get('/register', function(req, res) {
  const templateVars = { user: users[req.cookies["user_id"]] };

  res.render('urls_register', templateVars);
});

//Register - POST - handles the registration form data
app.post('/register', function(req, res) {
  const newUserId = generateRandomString();
  users[newUserId] = { id: newUserId, email: req.body.email, password: req.body.password };
  const user = users[newUserId];
  if (!user.email || !user.password) {
    res.status(400).send("Invalid request. Please add your information. ");
  }
  if (checkEmail(user.email)) {
    res.status(400).send("Invalid request. You're already registered.");
  }

  res.cookie("user_id", newUserId);
  res.redirect('/urls');
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