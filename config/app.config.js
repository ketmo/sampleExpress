module.exports = {
  //csrf対策用トークン
  security: {
    SESSION_SECRET: "YOUR-SESSION-SECRET-STRING",
    PASSWORD_SALT: "YOUR-PASSWORD-SALT",
    PASSWORD_STRETCH: 3
  },
  //検索画面
  search: {
    MAX_ITEM_PER_PAGE: 5
  }
};