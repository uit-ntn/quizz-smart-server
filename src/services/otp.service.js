// In-memory OTP storage (more secure than database)
// In production, consider using Redis for scalability

class OTPService {
    constructor() {
        // Map to store OTP data: email -> { otp, expires, type }
        this.otpStorage = new Map();
        
        // Clean expired OTPs every minute
        this.cleanupInterval = setInterval(() => {
            this.cleanExpiredOTPs();
        }, 60 * 1000);
    }

    // Generate 6-digit OTP
    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Store OTP for email with expiry (10 minutes)
    storeOTP(email, type = 'registration') {
        const otp = this.generateOTP();
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        this.otpStorage.set(email, {
            otp,
            expires,
            type,
            attempts: 0
        });

        console.log(`🔐 OTP generated for ${email}: ${otp} (expires: ${expires.toISOString()})`);
        return otp;
    }

    // Verify OTP for email
    verifyOTP(email, providedOTP) {
        const otpData = this.otpStorage.get(email);

        if (!otpData) {
            console.log(`❌ OTP verification failed for ${email}: No OTP found`);
            return { success: false, error: 'No OTP found' };
        }

        if (otpData.expires < new Date()) {
            console.log(`❌ OTP verification failed for ${email}: Expired`);
            this.otpStorage.delete(email);
            return { success: false, error: 'OTP expired' };
        }

        if (otpData.attempts >= 3) {
            console.log(`❌ OTP verification failed for ${email}: Too many attempts`);
            this.otpStorage.delete(email);
            return { success: false, error: 'Too many attempts' };
        }

        if (otpData.otp !== providedOTP) {
            otpData.attempts += 1;
            console.log(`❌ OTP verification failed for ${email}: Wrong code (attempt ${otpData.attempts}/3)`);
            return { success: false, error: 'Invalid OTP' };
        }

        // Success - remove OTP
        this.otpStorage.delete(email);
        console.log(`✅ OTP verified successfully for ${email}`);
        return { success: true };
    }

    // Check if OTP exists and is valid for email
    hasValidOTP(email) {
        const otpData = this.otpStorage.get(email);
        return otpData && otpData.expires > new Date();
    }

    // Remove OTP for email
    clearOTP(email) {
        const deleted = this.otpStorage.delete(email);
        if (deleted) {
            console.log(`🗑️ OTP cleared for ${email}`);
        }
        return deleted;
    }

    // Get remaining time for OTP
    getRemainingTime(email) {
        const otpData = this.otpStorage.get(email);
        if (!otpData) return 0;

        const remaining = otpData.expires.getTime() - Date.now();
        return Math.max(0, Math.floor(remaining / 1000)); // seconds
    }

    // Clean expired OTPs
    cleanExpiredOTPs() {
        const now = new Date();
        let cleaned = 0;

        for (const [email, otpData] of this.otpStorage.entries()) {
            if (otpData.expires < now) {
                this.otpStorage.delete(email);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            console.log(`🧹 Cleaned ${cleaned} expired OTPs`);
        }
    }

    // Get statistics (for debugging)
    getStats() {
        const now = new Date();
        let active = 0;
        let expired = 0;

        for (const [email, otpData] of this.otpStorage.entries()) {
            if (otpData.expires > now) {
                active++;
            } else {
                expired++;
            }
        }

        return {
            total: this.otpStorage.size,
            active,
            expired
        };
    }

    // Cleanup on app shutdown
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.otpStorage.clear();
        console.log('🚮 OTP service destroyed');
    }
}

// Create singleton instance
const otpService = new OTPService();

// Graceful shutdown
process.on('SIGINT', () => {
    otpService.destroy();
});

process.on('SIGTERM', () => {
    otpService.destroy();
});

module.exports = otpService;
