const { assert } = require('chai');
const {users, urlDatabase} = require('../data');

const { generateRandomString } = require('../helpers.js');

describe('generateRandomString', function() {
  it('should return a string with a length of 6', function() {
    const randomString = generateRandomString();
    assert.strictEqual(randomString.length, 6);
  });
});

describe('checkUsers', function() {
  it('should return a user object when id matches', function() {
    assert.isObject(users.checkUser("rzltr"), users["rzltr"]);
   
  });

  it('should return undefined when id does not matches', function() {
    const userID = "rzltree";
    assert.isUndefined(users.checkUser(""));
  });

});