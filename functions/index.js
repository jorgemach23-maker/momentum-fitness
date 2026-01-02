const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();

// Get your Gemini API key from the Firebase environment configuration
// firebase functions:config:set gemini.key="YOUR_API_KEY"
const geminiApiKey = functions.config().gemini.key;
const genAI = new GoogleGenerativeAI(geminiApiKey);

exports.getGeminiResponse = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated.
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const model = genAI.getGenerativeModel({ model: "gemini-pro"});
  const profile = data.profile;
  const prompt = `Create a personalized fitness plan based on this profile: ${JSON.stringify(profile)}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return { response: text };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Error calling Gemini API."
    );
  }
});
