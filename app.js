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

app.use(express.json({ limit: "100mb" })); // Increase JSON body size limit
app.use(express.urlencoded({ limit: "100mb", extended: true })); // Increase URL-encoded body size limit

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

// Function to format the labels into a readable, comma-separated list
function formatLabels(labels) {
	// Sort labels by Confidence from highest to lowest
	const sortedLabels = labels.sort((a, b) => b.Confidence - a.Confidence);

	// Map over sorted labels to create a list of strings with `Name` and `Confidence`
	const labelStrings = sortedLabels.map(
		(label) => `${label.Name} (${label.Confidence.toFixed(2)}%)`
	);

	// Join the list into a comma-separated string
	return labelStrings.join(", ");
}

// Endpoint to upload and analyze image
app.post(
	"/analyze-image",
	upload.single("image"),
	(req, res, next) => {
		if (!req.file) {
			return res.status(400).send("No file uploaded.");
		}
		next();
	},
	async (req, res) => {
		const params = {
			Image: {
				Bytes: req.file.buffer,
			},
			MaxLabels: 10,
			MinConfidence: 75,
		};

		try {
			const data = await rekognitionClient.send(
				new DetectLabelsCommand(params)
			);
			//console.log("Labels detected: ", data.Labels);
			const formattedResponse = data.Labels.map((label) => ({
				Name: label.Name,
				Confidence: label.Confidence, // Round the confidence score for readability
			}));

			res.send(formattedResponse);
			// Use the function on the response object
			const formattedLabels = formatLabels(formattedResponse);
			console.log("Detected Labels:", formattedLabels);

			res.send(formattedLabels);
		} catch (err) {
			console.error("Error calling DetectLabels: ", err);
			res.status(500).send(err);
		}
	}
);

app.listen(port, () => {
	console.log(`Server listening at http://localhost:${port}`);
});
