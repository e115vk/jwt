const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
    userId: 'string',
    refreshToken: 'string'
});

const RefreshTokenModel = mongoose.model('RefreshTokens', refreshTokenSchema);

module.exports = RefreshTokenModel;