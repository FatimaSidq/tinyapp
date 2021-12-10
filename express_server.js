const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const { getUserByEmail } = require("./helpers");

require("nodemon");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ["U*KLZufHFp54@$6xTYBwjn&B8g9-TD2Dh7wFpUztPBc34Fy4zLZMv8u$9yR^7aep"],

  maxAge: 24 * 60 * 60 * 1000
}))

const urlDatabase = {};

const users = {};

const urlsForUser = function (id) {
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

app.get("/users.json", (req, res) => {
  res.send(users)
})

app.get("/", (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) {
    res.redirect("/login")
  }
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) {
    return res.redirect("/login")
  }
  const templateVars = { user_id: user_id, email: req.session.email, urls: urlsForUser(user_id) };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) {
    res.statusCode = 405;
    return res.redirect("/error/Please log in to shorten a URL");
  }
  let shortURL = generateRandomString();
  while (Object.keys(urlDatabase).includes(shortURL)) {
    shortURL = generateRandomString();
  }
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: user_id };
  res.redirect(`/urls/${shortURL}`)
});

app.get("/urls/new", (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) {
    res.statusCode = 405;
    return res.redirect("/error/Please log in to shorten a URL");
  }
  const templateVars = { email: req.session.email, user_id: user_id }
  res.render("urls_new", templateVars);
});

app.post("/register", (req, res) => {
  const random_id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    res.statusCode = 400;
    return res.redirect("/error/Missing a required field!")
  } else if (getUserByEmail(email, users)) {
    return res.redirect("/error/Email already registered!")
  };

  users[random_id] = {
    id: random_id,
    email: email,
    password: bcrypt.hashSync(password, 10)
  };

  req.session.user_id = random_id;
  req.session.email = email;
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  res.render("register", { user_id: null });
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  res.render("login", { user_id: null });
})

app.post("/login", (req, res) => {
  const user = getUserByEmail(req.body.email, users);
  if (!user || !bcrypt.compareSync(req.body.password, user.password)) {
    res.statusCode = 403;
    return res.redirect("/error/Email or password invalid!");
  };
  req.session.user_id = user.id;
  req.session.email = req.body.email;
  res.redirect("/urls");
})

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
})

app.post("/urls/:shortURL", (req, res) => {
  const user_id = req.session.user_id;
  const shortURL = req.params.shortURL;
  if (!user_id || user_id !== urlDatabase[shortURL].userID) {
    res.statusCode = 405;
    return res.redirect("/error/You do not have permission to complete that action!");
  }
  urlDatabase[shortURL].longURL = req.body.newUrl;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:shortURL", (req, res) => {
  const url = urlDatabase[req.params.shortURL];
  if (!url) {
    res.statusCode = 404;
    return res.redirect("/error/Shortened URL not found!");
  }
  const templateVars = { user_id: req.session.user_id, email: req.session.email, shortURL: req.params.shortURL, url: url };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id || user_id !== urlDatabase[req.params.shortURL].userID) {
    res.statusCode = 405;
    return res.redirect("/error/You do not have permission to complete that action!");
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls")
});

app.get("/u/:shortURL", (req, res) => {
  const url = urlDatabase[req.params.shortURL];
  url ? res.redirect(url.longURL) : res.redirect("/error/Invalid URL!");
})

app.get("/error/:errorMessage", (req, res) => {
  const templateVars = { user_id: req.session.user_id, email: req.session.email, error: req.params.errorMessage};
  res.render("error", templateVars)
})

app.get("/:_", (req, res) => {
  res.statusCode = 404;
  res.redirect("/error/404 Not Found")
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
