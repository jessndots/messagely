/** User class for message.ly */
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR, DB_URI } = require("../config");
const client = require("../db");
const ExpressError = require("../expressError");


/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await client.query(`INSERT INTO users (username, password, first_name, last_name, phone) VALUES ($1, $2, $3, $4, $5) RETURNING username, password, first_name, last_name, phone`, [username, hashedPassword, first_name, last_name, phone]);

    return result.rows[0]
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await client.query(`SELECT password FROM users WHERE username = $1`, [username]);
    if (!result.rows[0]) {
      throw new ExpressError('User not found', 404)
    }
    const user = result.rows[0];

    if (user) {
      const compare = await bcrypt.compare(password, user.password);
      if (compare === true) {
        return true
      }
    }
    
    return false
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) { 
    const result = await client.query(`UPDATE users SET last_login_at=(NOW()) WHERE username=$1 RETURNING username, last_login_at`, [username]);
    if (!result.rows[0]){
      throw new ExpressError('User not found', 404)
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() { 
    const result = await client.query(`SELECT username, first_name, last_name, phone FROM users`);
    return result.rows
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) { 
    const result = await client.query(`SELECT username, first_name, last_name, phone, join_at, last_login_at FROM users WHERE username=$1`, [username]);
    return result.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) { 
    const result = await client.query(
      `SELECT m.id,
              m.to_username,
              t.first_name,
              t.last_name,
              t.phone,
              m.body,
              m.sent_at,
              m.read_at
        FROM messages AS m
          JOIN users AS f ON m.from_username = f.username
          JOIN users AS t ON m.to_username = t.username
        WHERE f.username = $1`,
      [username]);

      let m = result.rows[0];

      if (!m) {
        throw new ExpressError(`No messages from: ${username}`, 404);
      }

      const out = []
      for (let row of result.rows) {
        out.push({
          id: m.id,
          to_user: {
            username: m.to_username,
            first_name: m.first_name,
            last_name: m.last_name,
            phone: m.phone,
          },
          body: m.body,
          sent_at: m.sent_at,
          read_at: m.read_at,
        })
      }
      return out
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {const result = await client.query(
    `SELECT m.id,
            m.from_username,
            f.first_name,
            f.last_name,
            f.phone,
            m.body,
            m.sent_at,
            m.read_at
      FROM messages AS m
        JOIN users AS f ON m.from_username = f.username
        JOIN users AS t ON m.to_username = t.username
      WHERE t.username = $1`,
    [username]);

    let m = result.rows[0];

    if (!m) {
      throw new ExpressError(`No messages to: ${username}`, 404);
    }

    const out = []
    for (let row of result.rows) {
      out.push({
        id: m.id,
        from_user: {
          username: m.from_username,
          first_name: m.first_name,
          last_name: m.last_name,
          phone: m.phone,
        },
        body: m.body,
        sent_at: m.sent_at,
        read_at: m.read_at,
      })
    }
    return out }
}


module.exports = User;