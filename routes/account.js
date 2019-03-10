var { CONNECTION_URL, OPTIONS, DATABASE } = require("../config/mongodb.config");
var { authenticate, authorize } = require("../lib/security/accountcontrol.js");
var router = require("express").Router();
var MongoClient = require("mongodb").MongoClient;
var tokens = new require("csrf")();

//ルーティング
router.get("/", authorize("readWrite"), (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/account/login");
  }
}, (req, res) => {
  res.render("./account/index.ejs");
});

router.get("/login", (req, res) => {
  res.render("./account/login.ejs", { message: req.flash("message") });
});

//routerへログイン処理組み込み
router.post("/login", authenticate());

router.post("/logout", (req, res) => {
  req.logout();
  res.redirect("/account/login");
});

router.get("/posts/regist", authorize("readWrite"), (req, res) => {
  //csrf対策用トークン発行
  tokens.secret((error, secret) => {
    var token = tokens.create(secret);
    //サーバにsecret、クライアントにtokenをわたす
    req.session._csrf = secret;
    res.cookie("_csrf", token);
    res.render("./account/posts/regist-form.ejs");
  });
});

router.post("/posts/regist/input", authorize("readWrite"), (req, res) => {
  var original = createRegistData(req.body);
  res.render("./account/posts/regist-form.ejs", { original });
});

router.post("/posts/regist/confirm", authorize("readWrite"), (req, res) => {
  var original = createRegistData(req.body);

  var errors = validateRegistData(req.body);
  if (errors) {
    res.render("./account/posts/regist-form.ejs", { errors, original });
    return;
  }
  res.render("./account/posts/regist-confirm.ejs", { original });
});

router.post("/posts/regist/execute", authorize("readWrite"), (req, res) => {
  //csrf用 サーバ側secret、クライアント側tokenをとりだす
  var secret = req.session._csrf;
  var token = req.cookies._csrf;
  //csrfトークン照合
  if (tokens.verify(secret, token) == false) {
    throw new Error("Invalid CSRF Token.");
    // res.status(400);
    // return;
  }

  var original = createRegistData(req.body);
  var errors = validateRegistData(req.body);
  if (errors) {
    res.render("./account/posts/regist-form.ejs", { errors, original });
    return;
  }

  MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
    var db = client.db(DATABASE);
    db.collection("posts")
      .insertOne(original)
      .then(() => {
        //登録済みなのでcsrf対策トークンをsession,cookieから削除
        delete req.session._csrf;
        res.clearCookie("_csrf");
        //完了画面へget（post再送信対策）
        res.redirect("/account/posts/regist/complete");
      }).catch((error) => {
        throw error;
      }).then(() => {
        client.close();
      });
  });
});

//post再送信対策で完了画面へのアクセスはgetで
router.get("/posts/regist/complete", (req, res) => {
  res.render("./account/posts/regist-complete.ejs");
});


//登録データ整形
var createRegistData = function (body) {
  var datetime = new Date();
  return {
    url: body.url,
    published: datetime,
    updated: datetime,
    title: body.title,
    content: body.content,
    keywords: (body.keywords || "").split(","),
    authors: (body.authors || "").split(","),
  };
};

//入力チェック
var validateRegistData = function (body) {
  var isValidated = true, errors = {};

  if (!body.url) {
    isValidated = false;
    errors.url = "URLが未入力です。URLを正しく入力してください。";
  }
  if (body.url && /^\//.test(body.url) === false) {
    isValidated = false;
    errors.url = "URLを正しく入力してください。";
  }
  if (!body.title) {
    isValidated = false;
    errors.title = "タイトルが未入力です。";
  }
  return isValidated ? undefined : errors;
};

module.exports = router;