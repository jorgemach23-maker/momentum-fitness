
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {onCall} = require("firebase-functions/v2/https");
const {VertexAI} = require("@google-cloud/vertexai");

admin.initializeApp();

exports.callGeminiAPI = onCall({region: "us-central1"}, async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated.",
    );
  }

  const {userQuery, systemPrompt, schema, responseKey} = request.data;

  if (!userQuery || !systemPrompt || !schema) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with 'userQuery', 'systemPrompt', and 'schema'.",
    );
  }

  const vertexAI = new VertexAI({
    project: process.env.GCLOUD_PROJECT,
    location: "us-central1",
  });

  const generativeModel = vertexAI.getGenerativeModel({
    model: "gemini-1.5-flash-002",
  });

  const payload = {
    contents: [{role: "user", parts: [{text: userQuery}]}],
    systemInstruction: {parts: [{text: systemPrompt}]},
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.7,
    },
  };

  try {
    const result = await generativeModel.generateContent(payload);
    const response = result.response;
    const rawText = response.candidates[0].content.parts[0].text;

    const parsedData = JSON.parse(rawText);

    const finalData = responseKey ? parsedData[responseKey] : parsedData;
    return finalData;
  } catch (error) {
    console.error("Error calling Gemini API via Vertex SDK:", error);
    throw new functions.https.HttpsError(
        "internal",
        "Failed to call Gemini API.",
        error.message,
    );
  }
});
