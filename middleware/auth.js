const jwt = require("jsonwebtoken");

function auth(req, res, next) {
	const token = req.header("Authorization");
	if (!token) return res.status(401).send("Access denied. No token provided.");

	try {
		const decoded = jwt.verify(token, "jwtPrivateKey"); // Replace "jwtPrivateKey" with your actual secret key or environment variable
		req.user = decoded.user;
		next();
	} catch (ex) {
		res.status(400).send("Invalid token.");
	}
}

module.exports = auth;
