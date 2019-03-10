var { SESSION_SECRET } = require("./config/app.config.js").security;
var accesslogger = require("./lib/log/accesslogger.js");
// var logger = require("./lib/log/logger.js").application;
var systemlogger = require("./lib/log/systemlogger.js");
var accountcontrol = require("./lib/security/accountcontrol.js");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var session = require("express-session");
var flash = require("connect-flash");
var express = require("express");
var app = express();

app.set("view engine", "ejs");
app.disable("x-powered-by");

app.use("/public", express.static(__dirname + "/public/" + (process.env.NODE_ENV === "development" ? "development" : "production")));

//アクセスログ。静的ファイルのログは出力しない。
app.use(accesslogger());

//cokkie session
app.use(cookieParser());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  name: "sid"
}));
//body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(flash());
//...でaccountcontrol.initialize()配列を分割代入。app.useは配列で渡せないので。
app.use(...accountcontrol.initialize());


//ルーティング api
app.use("/api", (() => {
  var router = express.Router();
  router.use("/posts", require("./api/posts.js"));
  return router;
})());
//ルーティング web
app.use("/", (() => {
  var router = express.Router();
  router.use((req, res, next) => {
    //クリックジャッキング対策でレスポンスヘッダにX-Frame-Options設定
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    next();
  });
  router.use("/posts/", require("./routes/posts.js"));
  router.use("/search/", require("./routes/search.js"));
  router.use("/account/", require("./routes/account.js"));
  router.use("/", require("./routes/index.js"));
  return router;
})());


//システムログ
app.use(systemlogger());
// logger.error("test", "message");

//404エラーページ表示
app.use((req, res, next) => {
  var data = {
    method: req.method,
    protocol: req.protocol,
    version: req.httpVersion,
    url: req.url
  };
  res.status(404);
  if (req.xhr) {
    res.json(data);
  } else {
    res.render("./404.ejs", { data });
  }
});
//500エラーページ表示
app.use((err, req, res, next) => {
  var data = {
    method: req.method,
    protocol: req.protocol,
    version: req.httpVersion,
    url: req.url,
    error: (process.env.NODE_ENV === "development") ? {
      name: err.name,
      message: err.message,
      stack: err.stack
    } : undefined
  };
  res.status(500);
  if (req.xhr) {
    res.json(data);
  } else {
    res.render("./500.ejs", { data });
  }
});

app.listen(3000);