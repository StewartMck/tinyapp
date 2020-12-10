const generateRandomString = function() {
  //Only generates letters, no numbers or special chars
  //ASCI chars: 97(a) --> 122(z)
  //math.random() * (max - min) + min --> max excld, min incld
  let randomString = '';
  while (randomString.length < 6) {
    randomString += String.fromCharCode(Math.floor(Math.random() * (123 - 97) + 97));
  }
  return randomString;
};

module.exports = {
  generateRandomString,
};
