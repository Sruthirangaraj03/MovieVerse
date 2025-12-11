const express = require("express");
const { signupUser, loginUser } = require("../controllers/userControllers");

const router = express.Router();

// Signup
router.post("/signup", signupUser);

// Login
router.post("/login", loginUser);

module.exports = router;
