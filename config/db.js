const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverApi: ServerApiVersion.v1,
});

let dbConnection;

const connectDB = async () => {
	try {
		await client.connect();
		dbConnection = client.db(process.env.DB_NAME); // e.g., DB_NAME="GramCrackerServerless"
		console.log("MongoDB connected...");
	} catch (err) {
		console.error(err.message);
		process.exit(1);
	}
};

const getDb = () => {
	if (!dbConnection) {
		throw new Error("No Database Found!");
	}
	return dbConnection;
};

module.exports = { connectDB, getDb };
