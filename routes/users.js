const express = require("express");
const ExpressError = require("../expressError");
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");
const router = new express.Router();
const User = require("../models/user");

/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/
router.get("/", ensureLoggedIn, async function(req, res, next){
    try{
        return res.json({"users": await User.all()});
    }
    catch(err){
        return next(err);
    }
})

/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/
router.get("/:username", ensureCorrectUser, async function(req, res, next){
    try{
        const user = User.get(req.params.username);
        if (!user) {
            throw new ExpressError("Unauthorized", 401)
        }
        return res.json({"user": await user})
    }
    catch(err){
        return next(err);
    }
})

/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get("/:username/to", ensureCorrectUser, async function(req, res, next){
    try{
        const messages = await User.messagesTo(req.params.username);
        if(!messages){
            throw new ExpressError("Unauthorized", 401);
        }
        return res.json({"messages": messages});
    }
    catch(err){
        return next(err);
    }
})

/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get("/:username/from", ensureCorrectUser, async function(req, res, next){
    try{
        const messages = await User.messagesFrom(req.params.username);
        if(!messages){
            throw new ExpressError("Unauthorized", 401);
        }
        return res.json({"messages": messages});
    }
    catch(err){
        return next(err);
    }
})

module.exports = router;