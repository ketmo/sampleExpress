var { PASSWORD_SALT, PASSWORD_STRETCH } = require("../../config/app.config.js").security;
var crypto = require("crypto");

var digest = function (text) {
  var hash;
  //ソルト足し込み
  text += PASSWORD_SALT;

  //ストレッチング
  for (var i = PASSWORD_STRETCH; i--;) {
    hash = crypto.createHash("sha256");
    hash.update(text);
    text = hash.digest("hex");
  }

  return text;
};

module.exports = {
  digest
};