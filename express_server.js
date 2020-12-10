const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');
const bcrypt = require('bcrypt');

const {generateRandomString} = require('./helpers');
const data = require('./data');

//dev dependency
const morgan = require('morgan');

const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');

app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({extended:true}));

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

//dev dependency
app.use(morgan('dev'));

//GETs followed by POSTS --> Make Use of TemplateVars to set properties that are used in the logic of the EJS Templates.
app.get("/", (request, response) => {
  const validUser = data.users.checkUser(request.session.user_id);
  if (validUser) {
    response.redirect('/urls');
  } else {
    response.redirect('/login');
  }
});

app.get("/register", (request, response) => {
  const validUser = data.users.checkUser(request.session.user_id);
  if (validUser) {
    response.redirect('/urls');
  } else {
    response.render('register', {user: undefined, userExists: false, isEmptyFields: false });
  }
});

app.get("/login", (request, response) => {
  const validUser = data.users.checkUser(request.session.user_id);
  if (validUser) {
    return response.redirect("/urls");
  } else {
    response.render('login', { user: undefined, userNotFound: false });
  }
});

app.get("/urls", (request, response) => {
  const validUser = data.users.checkUser(request.session.user_id);
  if (validUser) {
    const templateVars = {
      user: validUser,
      urls: data.urlDatabase.getUrlsForUser(validUser.id) };
    response.render("urls_index", templateVars);
  } else {
    response.status(401);
    response.render("error_noLogin", {user: undefined});
  }
});

app.get("/urls/new", (request, response) => {
  const validUser = data.users.checkUser(request.session.user_id);
  if (validUser) {
    const templateVars = { user: validUser };
    response.render('urls_new', templateVars);
  } else {
    response.render("error_noLogin", {user: undefined});
  }
});

// Edit URL view
app.get("/urls/:shortURL", (request, response) => {
  const validUser = data.users.checkUser(request.session.user_id);
  const shortURL = request.params.shortURL;
  const isValidShortURL = data.urlDatabase[shortURL];
  
  if (validUser) {
    const templateVars = {
      shortURL: shortURL,
      longURL: (isValidShortURL ? (data.urlDatabase[request.params.shortURL]).longURL : undefined),
      user: validUser,
      ownsURL: (isValidShortURL ? ((data.urlDatabase[shortURL]).userID === validUser.id) : undefined)
    };
    response.render("urls_show", templateVars);
  } else {
    response.status(404);
    response.render("error_noLogin", {user:undefined});
  }
});

app.get("/u/:shortURL", (request, response) => {
  if (data.urlDatabase[request.params.shortURL]) {
    const longURL = data.urlDatabase[request.params.shortURL].longURL;
    data.urlDatabase[request.params.shortURL].numberVisits++;
    response.redirect(longURL);
  } else {
    response.status(404);
    response.render("error_URL", { shortURL: [request.params.shortURL], user: undefined });
  }
});

app.post("/login", (request, response) => {
  const providedEmail = request.body.email;
  const userFound = data.users.checkUser(providedEmail);
    
  if (userFound && bcrypt.compareSync(request.body.password, userFound.password)) {
    request.session.user_id = userFound.id;
    return response.redirect('/urls');
  } else {
    response.status(403);
    return response.render("login", {user:undefined, userNotFound: true});
  }

});

app.post("/register", (request, response) => {

  if (Object.values(request.body).some((value) => value === "")) {
    response.status(400);
    return response.render("register", {user: undefined, userExists: false, isEmptyFields: true });
  }

  const providedEmail = request.body.email;
    
  if (!data.users.checkUser(providedEmail)) {
    const userID = generateRandomString();
    data.users[userID] = {
      id: userID,
      email: providedEmail,
      password: bcrypt.hashSync(request.body.password, 3)
    };
    request.session.user_id = userID;
    response.redirect('/urls');
  } else {
    response.status(409);
    response.render("register", {user: undefined, userExists: true, isEmptyFields: false });
  }
});

//Overriding POST for Editing URLS
app.put("/urls/:shortURL", (request, response) => {
  const validUser = data.users.checkUser(request.session.user_id);
  const shortURL = request.params.shortURL;
  const isValidShortURL = data.urlDatabase[shortURL];
  const ownsURL = (isValidShortURL ? ((data.urlDatabase[shortURL]).userID === validUser.id) : undefined);

  if (validUser && ownsURL) {
    data.urlDatabase.updateURL(validUser.id, shortURL, request.body.longURL);
    return response.redirect('/urls');
  } else {
    const templateVars = {
      shortURL: shortURL,
      longURL: (isValidShortURL ? (data.urlDatabase[request.params.shortURL]).longURL : undefined),
      user: validUser,
      ownsURL
    };
    response.status(404);
    response.render("urls_show", templateVars);
  }
});

//Overriding POST
app.delete("/urls/:shortURL", (request, response) => {
  const validUser = data.users.checkUser(request.session.user_id);
  const shortURL = request.params.shortURL;
  const isValidShortURL = data.urlDatabase[shortURL];
  const ownsURL = (isValidShortURL ? ((data.urlDatabase[shortURL]).userID === validUser.id) : undefined);

  if (validUser && ownsURL) {
    delete data.urlDatabase[shortURL];
    return response.redirect('/urls');
  } else {
    const templateVars = {
      shortURL: shortURL,
      longURL: (isValidShortURL ? (data.urlDatabase[request.params.shortURL]).longURL : undefined),
      user: validUser,
      ownsURL
    };
    console.log(data.urlDatabase);
    response.status(404);
    response.render("urls_show", templateVars);
  }
});

// POST for new URLS
app.post("/urls", (request, response) => {
  const validUser = data.users.checkUser(request.session.user_id);

  if (validUser) {
    data.urlDatabase.createURL(validUser.id, request.body.longURL);
    response.redirect('/urls/');
  } else {
    const templateVars = {
      shortURL: undefined,
      longURL: undefined,
      user: validUser,
      ownsURL: false
    };
    response.render("urls_show", templateVars);
  }
});

app.post("/logout", (request, response) => {
  request.session = null;
  response.redirect(`/`);
});

app.listen(PORT, () => {
  console.log(`Express Server listening on port ${PORT}!`);
});