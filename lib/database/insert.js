/*
* 本ファイル実行で必要情報をDBにinsert
*  
*/
var { CONNECTION_URL, DATABSE, OPTIONS } = require("../../config/mongodb.config");
var MongoClient = require("mongodb").MongoClient;

// posts, users, privileges
var insertPosts = function (db) {
  return Promise.all([
    db.collection("posts").insertMany([{
      url: "/node-test/hello-nodejs.html",
      published: new Date(2017, 4, 2),
      updated: new Date(2017, 4, 2),
      title: "Hello!! Node.js",
      content: "Node.js について",
      keywords: ["Node.js"],
      authors: ["Taro Test"]
    }, {
      url: "/2017/06/nodejs-basic.html",
      published: new Date(2017, 5, 12),
      updated: new Date(2017, 5, 12),
      title: "Node.js の 基本",
      content: "galpとは",
      keywords: ["Node.js"],
      authors: ["Taro Test"]
    }, {
      url: "/2017/07/advanced-nodejs.html",
      published: new Date(2017, 7, 8),
      updated: new Date(2017, 7, 8),
      title: "Node.js 応用",
      content: "VSCODEはNode.jsでできてる",
      keywords: ["Node.js"],
      authors: ["Taro Test"]
    }]),
    db.collection("posts")
      .createIndex({ url: 1 }, { unique: true, background: true })
  ]);
};

var insertUsers = function (db) {
  return Promise.all([
    db.collection("users").insertOne({
      email: "user-taro@sample.com",
      name: "testuser taro",
      password: "77d1fb804f4e1e6059377122046c95de5e567cb9fd374639cb96e7f5cc07dba1", //"qwerty", // "77d1fb804f4e1e6059377122046c95de5e567cb9fd374639cb96e7f5cc07dba1"
      role: "owner"
    }),
    db.collection("users")
      .createIndex({ email: 1 }, { unique: true, background: true })
  ]);
};

var insertPrivileges = function (db) {
  return Promise.all([
    db.collection("privileges").insertMany([
      { role: "default", permissions: ["read"] },
      { role: "owner", permissions: ["readWrite"] }
    ]),
    db.collection("privileges")
      .createIndex({ role: 1 }, { unique: true, background: true })
  ]);
};

MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
  var db = client.db(DATABSE);
  Promise.all([
    insertPosts(db),
    insertUsers(db),
    insertPrivileges(db)
  ]).catch((error) => {
    console.log(error);
  }).then(() => {
    client.close();
  });
}); 
