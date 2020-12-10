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

  it('should return a user object when matched against details inside the user object', function() {
    assert.isObject(users.checkUser("1234"), users["rzltr"]);
  });

  it('should return undefined when id does not matches', function() {
    assert.isUndefined(users.checkUser(""));
  });

});