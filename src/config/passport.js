const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Configure Google OAuth Strategy
console.log('🔧 Configuring Google OAuth Strategy...');
console.log('📋 GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Using default');
console.log('📋 GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Using default');
console.log('📋 GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL || "http://localhost:8000/api/auth/google/callback");

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:8000/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    console.log('🚀 Google OAuth Strategy Callback Triggered!');
    console.log('👤 Profile received:', {
        id: profile.id,
        displayName: profile.displayName,
        email: profile.emails?.[0]?.value,
        photo: profile.photos?.[0]?.value
    });
    try {
        console.log('🔍 Google OAuth - Processing user:', profile.displayName, profile.emails[0].value);
        
        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });
        
        if (user) {
            console.log('✅ Google OAuth - Existing user found:', user.email);
            return done(null, user);
        }

        // Check if user exists with this email (from local registration)
        user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
            // Link Google account to existing user
            console.log('🔗 Google OAuth - Linking Google account to existing user:', user.email);
            user.googleId = profile.id;
            user.authProvider = 'google';
            user.avatar_url = profile.photos[0]?.value || user.avatar_url;
            user.email_verified = true; // Google accounts are verified
            
            // Đảm bảo lưu vào database
            const savedUser = await user.save();
            console.log('💾 Google OAuth - User linked and saved to database:', savedUser.email);
            return done(null, savedUser);
        }

        // Create new user
        console.log('👤 Google OAuth - Creating new user:', profile.emails[0].value);
        user = new User({
            googleId: profile.id,
            email: profile.emails[0].value,
            full_name: profile.displayName,
            authProvider: 'google',
            avatar_url: profile.photos[0]?.value,
            email_verified: true // Google accounts are already verified
        });

        // Đảm bảo lưu user mới vào database
        const newUser = await user.save();
        console.log('💾 Google OAuth - New user created and saved to database:', newUser.email, 'ID:', newUser._id);
        return done(null, newUser);
    } catch (error) {
        console.error('❌ Google OAuth - Error saving user to database:', error);
        return done(error, null);
    }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
    console.log('💾 Serializing user for session:', user._id, user.email);
    done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        console.log('🔓 Deserializing user from session ID:', id);
        const user = await User.findById(id);
        if (user) {
            console.log('✅ User deserialized successfully:', user.email);
        } else {
            console.log('❌ User not found during deserialization');
        }
        done(null, user);
    } catch (error) {
        console.error('❌ Error during user deserialization:', error);
        done(error, null);
    }
});

module.exports = passport;
