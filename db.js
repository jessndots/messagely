/** Database connection for messagely. */


const { Client } = require("pg");
const { DB_URI } = require("./config");
const password = require("./password");

const client = new Client(DB_URI);

client.connect();
client.password = password

module.exports = client;
