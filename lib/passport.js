const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
const encrypt = require('./encrypt.js')
const connection = require('../connection.js')


passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const users = await connection.$queryRaw`SELECT * FROM "user" WHERE username = ${username};`
      const user = users[0];
      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }
      const match = await encrypt.validPassword(password,user.password);
      if (!match) {
        return done(null, false, { message: "Incorrect password" })
      }
      return done(null, user);
    } catch(err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const users = await connection.$queryRaw`SELECT * FROM "user" WHERE id = ${id};`
    const user = users[0];

    done(null, user);
  } catch(err) {
    done(err);
  }
});

module.exports = passport