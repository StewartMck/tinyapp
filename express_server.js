const { response } = require('express');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.set(bodyParser.urlencoded({extended:true}));

const urlDatabase = {
  "b2xVn2" : "http://www.lighthouselabs.ca",
  "9sm5xK" : "http://www.google.com"
};

app.get("/", (request, response) => {
  response.send('Hello!');
});

app.get("/urls", (request, response) => {
  const templateVars = {urls : urlDatabase};
  response.render("urls_index", templateVars);
});

app.get("/urls/new", (request, response) => {
  response.render('urls_new');
});

app.get("/urls/:shortURL", (request, response) => {
  const templateVars = {shortURL: request.params.shortURL, longURL: urlDatabase[request.params.shortURL]};
  response.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});