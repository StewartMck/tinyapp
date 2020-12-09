const { response } = require('express');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser  = require('cookie-parser');
const morgan = require('morgan');

const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser());
app.use(morgan('dev'));


const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
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
  if (request.cookies["user_id"]) {
    response.redirect('/urls');
  } else {
    response.redirect('/login');
  }
});

app.get("/register", (request, response) => {
  response.render('register', {user: undefined, userExists: false, isEmptyFields: false });
});

app.get("/login", (request, response) => {
  const validUser = users[request.cookies["user_id"]];
  if (validUser) {
    return response.redirect("/urls");
  } else {
    response.render('login', { user: undefined, userNotFound: false });
  }
});

app.get("/urls", (request, response) => {
  const validUser = users[request.cookies["user_id"]];
  if (validUser) {
    const templateVars = {
      user: validUser,
      urls: getUrlsForUser(validUser.id) };
    response.render("urls_index", templateVars);
  } else {
    response.render("error_noLogin", {user: undefined});
  }
});

app.get("/urls/new", (request, response) => {
  const validUser = users[request.cookies["user_id"]];
  if (validUser) {
    const templateVars = { user: validUser };
    response.render('urls_new', templateVars);
  } else {
    response.redirect('/login');
  }
});

// After add new URL
app.get("/urls/:shortURL", (request, response) => {
  const validUser = users[request.cookies["user_id"]];
  const shortURL = request.params.shortURL;
  const isValidShortURL = urlDatabase[shortURL];
  
  if (validUser) {
    const templateVars = {
      shortURL: shortURL,
      longURL: (isValidShortURL ? (urlDatabase[request.params.shortURL]).longURL : undefined),
      user: validUser,
      ownsURL: (isValidShortURL ? ((urlDatabase[shortURL]).userID === validUser.id) : undefined)
    };
    console.log(templateVars);
    response.render("urls_show", templateVars);
  } else {
    response.render("error_noLogin", {user:undefined});
  }
});

app.get("/u/:shortURL", (request, response) => {
  if (urlDatabase[request.params.shortURL]) {
    const longURL = urlDatabase[request.params.shortURL].longURL;
    response.redirect(longURL);
  } else {
    response.render("error_URL", { shortURL: [request.params.shortURL], user: undefined });
  }
});

app.post("/login", (request, response) => {

  const providedEmail = request.body.email;
  const userFound = checkUser(providedEmail);
    
  if (userFound && userFound.password === request.body.password) {
    response.cookie('user_id', userFound.id);
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
    
  if (!checkUser(providedEmail)) {
    const userID = generateRandomString();
    users[userID] = {
      id: userID,
      email: providedEmail,
      password: request.body.password
    };
    response.cookie('user_id', userID);
    response.redirect('/urls');
  } else {
    response.status(400);
    response.render("register", {user: undefined, userExists: true, isEmptyFields: false });
    //send("User already registered!");
  }

});

// For Editing URLS
app.post("/urls/:shortURL", (request, response) => {
  // need logic here if fail...
  urlDatabase[request.params.shortURL] = {
    longURL : request.body.longURL,
    userID: request.cookies["user_id"]
  };
  response.redirect('/urls');
});

app.post("/urls/:shortURL/delete", (request, response) => {
  // need logic here if fail...
  delete urlDatabase[request.params.shortURL];
  response.redirect('/urls');
});

// for new URLS
app.post("/urls", (request, response) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: request.body.longURL,
    userID: request.cookies["user_id"]
  };
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

const checkUser = (userDetail) => {
  if (users[userDetail]) {
    return users[userDetail];
  } else {
    for (const user in users) {
      if (Object.values(users[user]).some((value) => value === userDetail)) {
        return users[user];
      }
    }
  }
  return undefined;
};

const getUrlsForUser = (userId) => {
  const userSpecificURLDatabase = {};
  for (const shortURL in urlDatabase) {
    if ((urlDatabase[shortURL]).userID === userId) {
      userSpecificURLDatabase[shortURL] = (urlDatabase[shortURL]).longURL;
    }
  }
  return userSpecificURLDatabase;
};