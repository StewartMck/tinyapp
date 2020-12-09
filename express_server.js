const express = require('express');
const bodyParser = require('body-parser');
const cookieParser  = require('cookie-parser');
const morgan = require('morgan');
const {generateRandomString} = require('./helpers');

const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser());
app.use(morgan('dev'));


const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW", dateCreated: 0,  numberVisits: 0},
  getUrlsForUser : (userId) => {
    const userSpecificURLDatabase = {};
    for (const shortURL in urlDatabase) {
      if ((urlDatabase[shortURL]).userID === userId) {
        userSpecificURLDatabase[shortURL] = urlDatabase[shortURL];
      }
    }
    return userSpecificURLDatabase;
  }
};

const users = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "user1@email",
    password: "1234"
  },
  checkUser : (userDetail) => {
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
  }
};


// const getUrlsForUser = (userId) => {
//   const userSpecificURLDatabase = {};
//   for (const shortURL in urlDatabase) {
//     if ((urlDatabase[shortURL]).userID === userId) {
//       userSpecificURLDatabase[shortURL] = urlDatabase[shortURL];

//     }
//   }
//   return userSpecificURLDatabase;
// };


app.get("/", (request, response) => {
  const validUser = users.checkUser(request.cookies["user_id"]);
  if (validUser) {
    response.redirect('/urls');
  } else {
    response.redirect('/login');
  }
});

app.get("/register", (request, response) => {
  response.render('register', {user: undefined, userExists: false, isEmptyFields: false });
});

app.get("/login", (request, response) => {
  const validUser = users.checkUser(request.cookies["user_id"]);
  if (validUser) {
    return response.redirect("/urls");
  } else {
    response.render('login', { user: undefined, userNotFound: false });
  }
});

app.get("/urls", (request, response) => {
  const validUser = users.checkUser(request.cookies["user_id"]);
  if (validUser) {
    const templateVars = {
      user: validUser,
      urls: urlDatabase.getUrlsForUser(validUser.id) };
    response.render("urls_index", templateVars);
  } else {
    response.render("error_noLogin", {user: undefined});
  }
});

app.get("/urls/new", (request, response) => {
  const validUser = users.checkUser(request.cookies["user_id"]);
  if (validUser) {
    const templateVars = { user: validUser };
    response.render('urls_new', templateVars);
  } else {
    response.redirect('/login');
  }
});

// After add new URL
app.get("/urls/:shortURL", (request, response) => {
  const validUser = users.checkUser(request.cookies["user_id"]);
  const shortURL = request.params.shortURL;
  const isValidShortURL = urlDatabase[shortURL];
  
  if (validUser) {
    const templateVars = {
      shortURL: shortURL,
      longURL: (isValidShortURL ? (urlDatabase[request.params.shortURL]).longURL : undefined),
      user: validUser,
      ownsURL: (isValidShortURL ? ((urlDatabase[shortURL]).userID === validUser.id) : undefined)
    };
    response.render("urls_show", templateVars);
  } else {
    response.render("error_noLogin", {user:undefined});
  }
});

app.get("/u/:shortURL", (request, response) => {
  if (urlDatabase[request.params.shortURL]) {
    const longURL = urlDatabase[request.params.shortURL].longURL;
    urlDatabase[request.params.shortURL].numberVisits++;
    response.redirect(longURL);
  } else {
    
    response.render("error_URL", { shortURL: [request.params.shortURL], user: undefined });
    // response.send(404);
  }
});

app.post("/login", (request, response) => {

  const providedEmail = request.body.email;
  const userFound = users.checkUser(providedEmail);
    
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
    
  if (!users.checkUser(providedEmail)) {
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
  }

});

// For Editing URLS
app.post("/urls/:shortURL", (request, response) => {
  
  const validUser = users.checkUser(request.cookies["user_id"]);
  const shortURL = request.params.shortURL;
  const isValidShortURL = urlDatabase[shortURL];
  const ownsURL = (isValidShortURL ? ((urlDatabase[shortURL]).userID === validUser.id) : undefined);

  if (validUser && ownsURL) {
    urlDatabase[shortURL] = {
      longURL : request.body.longURL,
      userID: validUser.id
    };
    return response.redirect('/urls');

  } else {
    
    const templateVars = {
      shortURL: shortURL,
      longURL: (isValidShortURL ? (urlDatabase[request.params.shortURL]).longURL : undefined),
      user: validUser,
      ownsURL
    };
    response.render("urls_show", templateVars);
  }
});

app.post("/urls/:shortURL/delete", (request, response) => {

  const validUser = users.checkUser(request.cookies["user_id"]);
  const shortURL = request.params.shortURL;
  const isValidShortURL = urlDatabase[shortURL];
  const ownsURL = (isValidShortURL ? ((urlDatabase[shortURL]).userID === validUser.id) : undefined);

  if (validUser && ownsURL) {
    delete urlDatabase[request.params.shortURL];
    return response.redirect('/urls');
  } else {

    const templateVars = {
      shortURL: shortURL,
      longURL: (isValidShortURL ? (urlDatabase[request.params.shortURL]).longURL : undefined),
      user: validUser,
      ownsURL
    };
    response.render("urls_show", templateVars);
  }
 
});

// for new URLS
app.post("/urls", (request, response) => {
  const validUser = users.checkUser(request.cookies["user_id"]);
  if (validUser) {
    let shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: request.body.longURL,
      userID: validUser.id,
      dateCreated : new Date().toLocaleDateString("en-US"),
      numberVisits: 0
    };
    response.redirect(`/urls/${shortURL}`);
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
  response.clearCookie("user_id");
  response.redirect(`/urls`);
});

app.listen(PORT, () => {
  console.log(`Express Server listening on port ${PORT}!`);
});
