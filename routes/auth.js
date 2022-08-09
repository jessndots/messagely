const express = require("express");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR, SECRET_KEY } = require("../config");
const client = require("../db");
const ExpressError = require("../expressError");
const router = new express.Router();
const User = require("../models/user.js");
const jwt = require("jsonwebtoken");


/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post("/login", async function(req, res, next) {
    try{
        const {username, password} = req.body;
        const authenticated = await User.authenticate(username, password)
        
        if (authenticated === true) {
            User.updateLoginTimestamp(username);
            const _token = jwt.sign({username}, SECRET_KEY);
            console.log(`Logged in as ${username}`)
            return res.json({_token});
        };

        throw new ExpressError("Invalid password", 400);
    }
    catch(err) {
        return next(err);
    }
})


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post("/register", async function(req, res, next) {
    try {
        const {username, password, first_name, last_name, phone} = req.body;

        if(!username || !password || !first_name || !last_name || !phone) {
            throw new ExpressError("Required fields: username, password, first_name, last_name, phone", 400);
        }

        const user = await User.register({username, password, first_name, last_name, phone});
        console.log(`User created: ${user.username}`)

        const authenticated = await User.authenticate(username, password)

        if (authenticated === true) {
            User.updateLoginTimestamp(username);
            let _token = jwt.sign({username}, SECRET_KEY);
            return res.json({_token});
        };
    }
    catch(err) {
        if (err.code === '23505') {
            return next(new ExpressError("Username taken. Please pick another.", 400))
        }
        return next(err);
    }
})

module.exports = router;