// Lambda handler adapter for Express app
// Ensures MongoDB connection is established and reused across invocations.
const connectDB = require('./src/config/db');
const app = require('./server');

let cachedHandler = null;
let dbConnected = false;

exports.handler = async (event, context) => {
	// CRITICAL: Allow Lambda to freeze the process immediately after response
	// This prevents timeout issues with open connections (MongoDB, etc.)
	context.callbackWaitsForEmptyEventLoop = false;
	
	// Log request info for debugging
	console.log('📥 Lambda request:', {
		method: event.requestContext?.http?.method || event.httpMethod,
		path: event.requestContext?.http?.path || event.path,
		origin: event.headers?.origin
	});
	
	// Ensure DB connection is ready (connectDB caches the connection)
	if (!dbConnected) {
		try {
			await connectDB();
			dbConnected = true;
			console.log('✅ DB connected in handler');
		} catch (err) {
			console.error('❌ Error connecting to DB in handler:', err.message);
			// Continue anyway - some endpoints might not need DB
		}
	}

	// Initialize serverless-express handler (cached after first invocation)
	if (!cachedHandler) {
		const serverlessExpress = require('@vendia/serverless-express');
		cachedHandler = serverlessExpress({ app });
		console.log('✅ Serverless Express handler initialized');
	}

	try {
		const response = await cachedHandler(event, context);
		console.log('✅ Response sent:', response.statusCode);
		return response;
	} catch (err) {
		console.error('❌ Handler error:', err);
		// Return error without CORS headers - AWS Lambda Function URL handles CORS
		return {
			statusCode: 500,
			headers: {
				'Content-Type': 'application/json'
				// ❌ NO CORS headers - AWS handles this
			},
			body: JSON.stringify({ 
				message: 'Internal server error',
				error: err.message 
			})
		};
	}
};

// Export app for local testing if needed
exports.app = app;
