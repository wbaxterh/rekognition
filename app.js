// Import the RekognitionClient and commands
const {
	RekognitionClient,
	DetectLabelsCommand,
} = require("@aws-sdk/client-rekognition");
const {
	BedrockRuntimeClient,
	InvokeModelCommand,
} = require("@aws-sdk/client-bedrock-runtime");

const cors = require("cors");
const multer = require("multer");
const express = require("express");
// Enable CORS for all requests
// CORS options
const corsOptions = {
	origin: "*", // Allow only this origin to access
	methods: "GET,POST,PUT,DELETE,OPTIONS", // Allowable methods
	allowedHeaders: "Content-Type,Authorization", // Headers that are allowed
	credentials: true, // Allow cookies to be sent
	optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};
app.use(cors(corsOptions));
require("dotenv").config(); // Ensure dotenv is setup to load environment variables
const { connectDB } = require("./config/db");
const userRoutes = require("./routes/userRoutes");

const app = express();
const port = 3000;

connectDB();

app.use(express.json({ limit: "100mb" })); // Increase JSON body size limit
app.use(express.urlencoded({ limit: "100mb", extended: true })); // Increase URL-encoded body size limit
app.use("/users", userRoutes);

// Configure the AWS Rekognition client
const rekognitionClient = new RekognitionClient({
	region: process.env.AWS_REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	},
});
// Create a Bedrock Runtime client
// const client = new BedrockRuntimeClient({
// 	region: process.env.AWS_REGION,
// 	credentials: {
// 		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
// 		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
// 	},
// });
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

const generateInstagramCaption = async (tags) => {
	// Create a new Bedrock Runtime client instance.
	const client = new BedrockRuntimeClient({ region: "us-east-1" });

	// Construct a prompt from the image tags.
	const prompt =
		`Generate a creative Instagram caption for a photo. Strictly adhere to these instructions: Only list 3 ideas for captions labeled starting with "1:" in order. Add hashtags and emojis after the caption. Do not add anything else except for the numbers and captions. Do not add a confidence score at the end. Only put emojis after the caption text and right before the hashtags. Limit to 3 emojis. Limit captions to 75 words. Use the following characteristics from computer vision on an image: ` +
		tags
			.map((tag) => `${tag.Name} (${tag.Confidence.toFixed(1)}% confidence)`)
			.join(", ") +
		".";

	// Prepare the payload.
	const payload = {
		prompt: prompt,
		max_tokens: 200, // Adjust the token limit as needed for your caption's typical length.
		temperature: 0.7, // Slightly higher temperature for more creative outputs.
	};

	// Invoke the model with the payload and wait for the response.
	const command = new InvokeModelCommand({
		contentType: "application/json",
		body: JSON.stringify(payload),
		modelId: "mistral.mistral-7b-instruct-v0:2", // Or any other suitable model you might want to use.
	});

	const apiResponse = await client.send(command);

	// Decode and return the response.
	const decodedResponseBody = new TextDecoder().decode(apiResponse.body);
	const responseBody = JSON.parse(decodedResponseBody);
	return responseBody.outputs[0].text; // Return the generated caption.
};

// Example usage with tags from AWS Rekognition.
// const tags = [
// 	{ Name: "Food", Confidence: 100 },
// 	{ Name: "Lunch", Confidence: 100 },
// 	{ Name: "Meal", Confidence: 100 },
// 	{ Name: "Sandwich", Confidence: 99.815 },
// 	{ Name: "Bread", Confidence: 89.861 },
// 	{ Name: "Burger", Confidence: 85.126 },
// 	{ Name: "Food Presentation", Confidence: 76.024 },
// ];

// generateInstagramCaption(tags)
// 	.then((caption) => {
// 		console.log("Generated Caption:", caption);
// 	})
// 	.catch((err) => {
// 		console.error("Error generating caption:", err);
// 	});

app.post("/analyze-image", upload.single("image"), async (req, res) => {
	if (!req.file) {
		return res.status(400).send("No file uploaded.");
	}

	const params = {
		Image: {
			Bytes: req.file.buffer,
		},
		MaxLabels: 10,
		MinConfidence: 75,
	};

	try {
		const { Labels } = await rekognitionClient.send(
			new DetectLabelsCommand(params)
		);
		const formattedTags = Labels.map((label) => ({
			Name: label.Name,
			Confidence: label.Confidence,
		}));
		const caption = await generateInstagramCaption(formattedTags);
		console.log("Full Caption:", caption); // Log the full caption to verify its length and content
		res.json({ labels: formattedTags, caption });
	} catch (err) {
		console.error("Error processing image: ", err);
		res.status(500).send(err.toString());
	}
});

app.listen(port, () => {
	console.log(`Server listening at http://localhost:${port}`);
});
