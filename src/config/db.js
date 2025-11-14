const mongoose = require('mongoose');

// Cached connection across Lambda invocations
// Uses a global variable to persist the connection in the Lambda execution context.
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn('MONGODB_URI is not set. Make sure to configure it in your environment variables.');
}

let cached = global.__mongoose;
if (!cached) {
  cached = global.__mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    // Already connected
    return cached.conn;
  }

  if (!cached.promise) {
    // Create promise and store it for subsequent invocations
    cached.promise = mongoose.connect(MONGODB_URI, {
      // useNewUrlParser/useUnifiedTopology not required in mongoose v6+
    }).then((m) => {
      cached.conn = m;
      console.log('✅ Connected to MongoDB (cached)');
      return cached.conn;
    }).catch(err => {
      // Reset promise on failure so next invocation can retry
      cached.promise = null;
      throw err;
    });
  }

  return cached.promise;
}

module.exports = connectDB;
