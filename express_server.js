const { response } = require('express');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser  = require('cookie-parser');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser());


const urlDatabase = {
  "b2xVn2" : "http://www.lighthouselabs.ca",
  "9sm5xK" : "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user1@email",
    password: "uniquepass1"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user1@email",
    password: "uniquepass2"
  }
};

app.get("/", (request, response) => {
  response.send('Hello!');
});

app.get("/register", (request, response) => {
  // response.cookie('username', request.body.username);
  const templateVars = {user: users[request.cookies["user_id"]]};
  response.render('register', templateVars);
});

app.get("/urls", (request, response) => {
  const templateVars = {
    user: users[request.cookies["user_id"]],
    urls : urlDatabase};
  response.render("urls_index", templateVars);
});

app.get("/urls/new", (request, response) => {
  const templateVars = {user: users[request.cookies["user_id"]]};
  response.render('urls_new', templateVars);
});

app.get("/urls/:shortURL", (request, response) => {
  const templateVars = {
    shortURL: request.params.shortURL,
    longURL: urlDatabase[request.params.shortURL],
    user: users[request.cookies["user_id"]]
  };
  response.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (request, response) => {
  const longURL = urlDatabase[request.params.shortURL];
  response.redirect(longURL);
});

app.post("/login", (request, response) => {
  response.cookie('username', request.body.username);
  response.redirect('/urls');
});

app.post("/register", (request, response) => {
  const userID = generateRandomString();
  users[userID] = {
    id: userID,
    email: request.body.email,
    password: request.body.password
  };
  response.cookie('user_id', userID);
  console.log(users);
  response.redirect('/urls');
});

app.post("/urls/:shortURL", (request, response) => {
  // need logic here if fail...
  urlDatabase[request.params.shortURL] = request.body.longURL;
  response.redirect('/urls');
});

app.post("/urls/:shortURL/delete", (request, response) => {
  // need logic here if fail...
  delete urlDatabase[request.params.shortURL];
  response.redirect('/urls');
});

app.post("/urls", (request, response) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = request.body.longURL;
  response.redirect(`/urls/${shortURL}`);
});

app.post("/logout", (request, response) => {
  response.clearCookie("user_id");
  response.redirect(`/urls`);
});

app.listen(PORT, () => {
  console.log(`Express Server listening on port ${PORT}!`);
});

const generateRandomString = function() {
  //ASCI chars: 97(a) --> 122(z)
  //math.random() * (max - min) + min --> max excld, min incld
  let randomString = '';
  while (randomString.length < 6) {
    randomString += String.fromCharCode(Math.floor(Math.random() * (123 - 97) + 97));
  }
  return randomString;
};
