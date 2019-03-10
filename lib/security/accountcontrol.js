var { CONNECTION_URL, OPTIONS, DATABSE } = require("../../config/mongodb.config");
var hash = require("./hash.js");
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var MongoClient = require("mongodb").MongoClient;
var initialize, authenticate, authorize;

//初期化
initialize = function () {
  return [
    passport.initialize(),
    passport.session(),
    function (req, res, next) {
      if (req.user) {
        res.locals.user = req.user;
      }
      next();
    }
  ];
};

//認証処理
authenticate = function () {
  return passport.authenticate(
    "local-strategy", {     //key
      successRedirect: "/account/",
      failureRedirect: "/account/login"
    }
  );
};

//認可処理 権限判定
authorize = function (privilege) {
  return function (req, res, next) {
    if (req.isAuthenticated() &&
      (req.user.permissions || []).indexOf(privilege) >= 0) {
      next();
    } else {
      res.redirect("/account/login");
    }
  };
};

//ログイン処理
//local-strategy=ユーザ名とパスワードを利用した認証
passport.use("local-strategy",
  new LocalStrategy({
    usernameField: "username",
    passwordField: "password",
    passReqToCallback: true
  }, (req, username, password, done) => {
    MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
      var db = client.db(DATABSE);
      db.collection("users").findOne({
        email: username,
        password: hash.digest(password)
      }).then((user) => {
        if (user) {
          //セッションはりなおす
          req.session.regenerate((error) => {
            if (error) {
              done(error);
            } else {
              done(null, user.email); //この時deserializeUserが実行される
            }
          });
        } else {
          done(null, false, req.flash("message", "ユーザー名 または パスワード が間違っています。"));
        }
      }).catch((error) => {
        done(error);
      }).then(() => {
        client.close();
      });
    });
  })
);

//シリアライズ
//シリアライズ化したデータをセッションに保持
passport.serializeUser((email, done) => {
  //特に加工せずに返却
  done(null, email);
});

//デシリアライズ 
//シリアライズ化したデータを解凍 その後mongodbより情報とりなおす
passport.deserializeUser((email, done) => {
  MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
    var db = client.db(DATABSE);
    db.collection("users")
      .findOne({ email })
      .then((user) => {
        return new Promise((resolve, reject) => {
          db.collection("privileges")
            .findOne({ role: user.role })
            .then((privilege) => {
              user.permissions = privilege.permissions;
              resolve(user);
            }).catch((error) => {
              reject(error);
            });
        });
      })
      .then((user) => {
        done(null, user);
      }).catch((error) => {
        done(error);
      }).then(() => {
        client.close();
      });
  });
});

module.exports = {
  initialize,   //初期化処理
  authenticate, //認証処理
  authorize     //認可処理
};