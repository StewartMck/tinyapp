const {generateRandomString} = require('./helpers');

const users = {
  "rzltr": {id: "rzltr", email: 'user@email', password: '1234' },
  
  checkUser : function(userDetail) {
    if (this[userDetail]) {
      return this[userDetail];
    } else {
      for (const user in this) {
        if (Object.values(this[user]).some((value) => value === userDetail)) {
          return this[user];
        }
      }
    }
    return undefined;
  },
};

const urlDatabase = {
  "shortURL": { longURL: null, userID: null, dateCreated: 0, numberVisits: 0 },

  getUrlsForUser: function(userId) {
    const userSpecificURLDatabase = {};
    for (const shortURL in this) {
      if ((this[shortURL]).userID === userId) {
        userSpecificURLDatabase[shortURL] = this[shortURL];
      }
    }
    return userSpecificURLDatabase;
  },
  createURL: function(userID, longURL) {
    this[generateRandomString()] = {
      longURL: longURL,
      userID: userID,
      dateCreated: new Date().toLocaleDateString("en-US"),
      numberVisits: 0
    };
  },
  updateURL: function(userID, shortURL, longURL,) {
    this[shortURL] = {
      longURL: longURL,
      userID: userID,
      // new date and numberVisits reset here because shortURL is now referencing a different longURL.
      dateCreated: new Date().toLocaleDateString("en-US"),
      numberVisits: 0
    };
  }
};

module.exports = {users, urlDatabase};