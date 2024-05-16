const { findUserByEmail, createUser } = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.registerUser = async (req, res) => {
	const { email, password } = req.body;

	try {
		const existingUser = await findUserByEmail({ email: email });
		if (existingUser) {
			return res.status(400).json({ msg: "User already exists" });
		}

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		const newUser = await createUser({
			email,
			password: hashedPassword,
		});

		// User creation was successful, create a JWT token for the new user
		const payload = {
			user: {
				id: newUser.insertedId.toString(), // Make sure the ID is in the correct format
			},
		};

		jwt.sign(payload, "jwtPrivateKey", (err, token) => {
			if (err) {
				throw err;
			}
			res.status(201).json({
				msg: "User created",
				token: token, // Send the token to the client
				email: email,
				userId: newUser.insertedId,
			});
		});
	} catch (err) {
		console.error(err.message);
		res.status(500).send({ msg: "Server error" });
	}
};

exports.loginUser = async (req, res) => {
	const { email, password } = req.body;

	try {
		// Assuming you have a User model set up and it can find a user by email
		const user = await findUserByEmail({ email: email });
		console.log("result from user == ", user);
		if (!user) {
			return res.status(404).send({ msg: "User not found" });
		}

		// Compare password with hashed password in database
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(400).send({ msg: "Invalid credentials" });
		}

		// User matched, create JWT payload
		const payload = {
			user: {
				id: user.id,
				name: user.name,
			},
		};

		// Sign the token with a secret key
		jwt.sign(
			payload,
			"jwtPrivateKey", // Ensure you have a JWT_SECRET in your .env file
			(err, token) => {
				if (err) throw err;
				console.log("token == ", token);
				res.json({ token });
			}
		);
	} catch (err) {
		console.error(err.message);
		res.status(500).send({ msg: "Server error" });
	}
};

exports.getUserProfile = async (req, res) => {
	// Implementation for fetching user profile
};
