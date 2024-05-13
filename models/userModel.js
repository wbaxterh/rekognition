const { getDb } = require("../config/db");

async function findUserByEmail(email) {
	const db = await getDb();
	return db.collection("users").findOne(email);
}

async function createUser(user) {
	const db = await getDb();
	return db.collection("users").insertOne(user);
}

module.exports = {
	findUserByEmail,
	createUser,
};
