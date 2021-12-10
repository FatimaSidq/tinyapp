const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');

require("nodemon");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession());

const urlDatabase = {};

const users = {};

const findUserByEmail = function(email) {
  for (let user of Object.values(users)) {
    if (user.email === email) {
      return user;
    }
  }
};

const urlsForUser = function(id) {
  const urls = {};
  for (let shortURL of Object.keys(urlDatabase)) {
    if (urlDatabase[shortURL].userID === id) {
      urls[shortURL] = urlDatabase[shortURL];
    }
  }
  return urls;
}

function generateRandomString() {
  let result = "";
  for (let i = 0; i < 6; i += 1) {
    result += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890"[Math.floor(Math.random() * 62)];
  }
  return result;
}

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/urls", (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) {
    return res.redirect("/login")
  }
  const templateVars = { user_id: user_id, urls: urlsForUser(user_id) };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) {
    res.statusCode = 405;
    return res.send("Please log in to shorten a URL.");
  }
  let shortURL = generateRandomString();
  while (Object.keys(urlDatabase).includes(shortURL)) {
    shortURL = generateRandomString();
  }
  urlDatabase[shortURL] = {longURL: req.body.longURL, userID: user_id};
  res.redirect(`/urls/${shortURL}`)
});

app.get("/urls/new", (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) {
    res.statusCode = 405;
    return res.send("Please log in to shorten a URL.");
  }
  const templateVars = { user_id: user_id }
  res.render("urls_new", templateVars);
});

app.post("/register", (req, res) => {
  const random_id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  if (!email && password) {
    res.statusCode = 400;
    return res.send("Fields required!")
  } else if (findUserByEmail(email)) {
    return res.send("Email already registered!")
  };

  users[random_id] = {
    id: random_id,
    email: email,
    password: bcrypt.hashSync(password, 10)
  };

  req.session.user_id = random_id;
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  res.render("register", {user_id: null});
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  res.render("login", {user_id: null});
})

app.post("/login", (req, res) => {
  const user = findUserByEmail(req.body.email);
  if (!user || !bcrypt.compareSync(req.body.password, user.password)) {
    res.statusCode = 403;
    return res.send("Email or password invalid!");
  };
  req.session.user_id = user.id;
  res.redirect("/urls");
})

app.post("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/urls");
})

app.post("/urls/:shortURL", (req, res) => {
  const user_id = req.session.user_id;
  const shortURL = req.params.shortURL;
  if (!user_id || user_id !== urlDatabase[shortURL].userID) {
    res.statusCode = 405;
    return res.send("You do not have permission to complete that action!");
  }
  urlDatabase[shortURL].longURL = req.body.newUrl;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:shortURL", (req, res) => {
  const url = urlDatabase[req.params.shortURL];
  if (!url) {
    res.statusCode = 404;
    return res.send("Shortened URL not found!")
  }
  const templateVars = { user_id: req.session.user_id, shortURL: req.params.shortURL, url: url };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id || user_id !== urlDatabase[req.params.shortURL].userID) {
    res.statusCode = 405;
    return res.send("You do not have permission to complete that action!");
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls")
});

app.get("/u/:shortURL", (req, res) => {
  const url = urlDatabase[req.params.shortURL];
  url ? res.redirect(url.longURL) : res.send("Invalid URL!");
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
