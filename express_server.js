const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')

require("nodemon");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "fTX52r": {
    id: "fTX52r",
    email: "user@example.com",
    password: "password"
  }
}

function generateRandomString() {
  let result = "";
  for (let i = 0; i < 6; i += 1) {
    result += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890"[Math.floor(Math.random() * 62)];
  }
  return result;
}

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const templateVars = { username: req.cookies["username"], urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  while (Object.keys(urlDatabase).includes(shortURL)) {
    shortURL = generateRandomString();
  }
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`)
});

app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies["username"] }
  res.render("urls_new", templateVars);
});

app.post("/register", (req, res) => {
  const random_id = generateRandomString();
  users[random_id] = {
    id: random_id,
    email: res.body.email,
    password: res.body.password
  };
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const templateVars = { username: req.cookies["username"] }
  res.render("register", templateVars)
});

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username)
  res.redirect("/urls");
})

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
})

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = req.body.newUrl;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  const templateVars = { username: req.cookies["username"], shortURL: req.params.shortURL, longURL: longURL };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls")
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  longURL ? res.redirect(longURL) : res.send("Invalid URL!");
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
