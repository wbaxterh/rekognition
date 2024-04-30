// Import the RekognitionClient and commands
const {
	RekognitionClient,
	DetectLabelsCommand,
} = require("@aws-sdk/client-rekognition");
const multer = require("multer");
const express = require("express");

require("dotenv").config(); // Ensure dotenv is setup to load environment variables

const app = express();
const port = 3000;

// Configure the AWS Rekognition client
const rekognitionClient = new RekognitionClient({
	region: process.env.AWS_REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	},
});
console.log("Aws region == ", process.env.AWS_REGION);
// Setup multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Endpoint to upload and analyze image
app.post("/analyze-image", upload.single("image"), async (req, res) => {
	const params = {
		Image: {
			Bytes: req.file.buffer,
		},
		MaxLabels: 10, // Optional
		MinConfidence: 75, // Optional
	};

	const command = new DetectLabelsCommand(params);

	try {
		const data = await rekognitionClient.send(command);
		console.log("Labels detected: ", data.Labels);
		res.send(data);
	} catch (err) {
		console.error("Error calling DetectLabels: ", err);
		res.status(500).send(err);
	}
});

app.listen(port, () => {
	console.log(`Server listening at http://localhost:${port}`);
});
