const express = require("express");
const { JsonWebTokenError } = require("jsonwebtoken");
const Message = require("../models/message");
const router = new express.Router();
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { ensureLoggedIn } = require("../middleware/auth");
const ExpressError = require("../expressError");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", ensureLoggedIn, async function(req, res, next){
    try {
        let message = await Message.get(req.params.id);
        if (req.user.username == message.from_user.username || req.user.username == message.to_user.username) {
            return res.json({"message": message})
        }
        throw new ExpressError("Unauthorized", 401)
    }
    catch(err) {
        return next(err);
    }
    
})

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", ensureLoggedIn, async function(req, res, next){
    try {
        const {to_username, body} = req.body;
        const user = req.user;
        const message = await Message.create(user.username, to_username, body);
        return res.json({"message": message});
    }
    catch(err) {
        return next(err);
    }
})

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post("/:id/read", ensureLoggedIn, async function(req, res, next){
    try {
        let message = await Message.get(req.params.id);
        if(req.user.username == message.to_user.username) {
            const read = await Message.markRead(req.params.id);
            return res.json({"message": read})
        }
        throw new ExpressError("Unauthorized", 401)
    }
    catch(err){
        return next(err);
    }
})

module.exports = router;