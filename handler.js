// Lambda handler adapter for Express app
// Ensures MongoDB connection is established and reused across invocations.
const connectDB = require('./src/config/db');
const app = require('./server');

let cachedHandler = null;

exports.handler = async (event, context) => {
	// Allow Lambda to freeze the process while DB connections are kept in global scope
	// so we can reuse the cached mongoose connection across invocations.
	// This prevents Lambda from waiting for the event loop to be empty.
	context.callbackWaitsForEmptyEventLoop = false;
	// Ensure DB connection is ready (connectDB caches the connection)
	try {
		await connectDB();
	} catch (err) {
		console.error('Error connecting to DB in handler:', err);
		// Allow request to continue — downstream may fail but this surfaces the error
	}

	if (!cachedHandler) {
		const serverlessExpress = require('@vendia/serverless-express');
		cachedHandler = serverlessExpress({ app });
	}

	return cachedHandler(event, context);
};

// Export app for local testing if needed
exports.app = app;
