const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth"); // Adjust the path as necessary

const {
	registerUser,
	loginUser,
	getUserProfile,
} = require("../controllers/userController");

router.post("/register", registerUser);
router.post("/login", loginUser);
// Apply the 'auth' middleware to the profile route to ensure only authenticated users can access it
router.get("/profile", auth, getUserProfile);

module.exports = router;
