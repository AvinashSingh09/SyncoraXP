const jwt = require('jsonwebtoken');

class JwtUtils {
    getSecret() {
        return process.env.JWT_SECRET || 'syncoraxp_jwt_secret_key_2026_default';
    }

    generateToken(payload) {
        return jwt.sign(payload, this.getSecret(), {
            expiresIn: process.env.JWT_EXPIRES_IN || '1d'
        });
    }

    verifyToken(token) {
        return jwt.verify(token, this.getSecret());
    }
}

module.exports = new JwtUtils();

