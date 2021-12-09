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
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "fTX52r"
  }
};

const users = {
  "fTX52r": {
    id: "fTX52r",
    email: "user@example.com",
    password: "password"
  }
}

const emailExists = function(email) {
  for (let user of Object.values(users)) {
    if (user.email === email) {
      return user;
    }
  }
};

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
  res.redirect("/login");
});

app.get("/urls", (req, res) => {
  const templateVars = { user: req.cookies["user"], urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const user = req.cookies["user"];
  if (!user) {
    res.statusCode = 405;
    return res.send("Please log in to shorten a URL.");
  }
  let shortURL = generateRandomString();
  while (Object.keys(urlDatabase).includes(shortURL)) {
    shortURL = generateRandomString();
  }
  urlDatabase[shortURL] = {longURL: req.body.longURL, userID: user.id};
  res.redirect(`/urls/${shortURL}`)
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: req.cookies["user"] }
  if (!user) {
    res.statusCode = 405;
    return res.send("Please log in to shorten a URL.");
  }
  res.render("urls_new", templateVars);
});

app.post("/register", (req, res) => {
  const random_id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  if (!email && password) {
    res.statusCode = 400;
    return res.send("Fields required!")
  } else if (emailExists(email)) {
    return res.send("Email already registered!")
  };

  users[random_id] = {
    id: random_id,
    email: email,
    password: password
  };

  res.cookie("user", users[random_id])
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  if (req.cookies["user"]) {
    return res.redirect("/urls");
  }
  res.render("register", {user: null});
});

app.get("/login", (req, res) => {
  if (req.cookies["user"]) {
    return res.redirect("/urls");
  }
  res.render("login", {user: null});
})

app.post("/login", (req, res) => {
  const user = emailExists(req.body.email);
  if (!user) {
    res.statusCode = 403;
    return res.send("User not found!");
  } else if (user.password !== req.body.password) {
    res.statusCode = 403;
    return res.send("Incorrect password!");
  };
  res.cookie("user", user)
  res.redirect("/urls");
})

app.post("/logout", (req, res) => {
  res.clearCookie("user");
  res.redirect("/urls");
})

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL].longURL = req.body.newUrl;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  const templateVars = { user: req.cookies["user"], shortURL: req.params.shortURL, longURL: longURL };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls")
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  longURL ? res.redirect(longURL) : res.send("Invalid URL!");
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
