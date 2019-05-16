const UsersModel = require('../models/users.model');

const passport = require('passport');
const passportJwt = require('passport-jwt');
const crypto = require('crypto');
const JsonWebToken = require('jsonwebtoken');

const secret = 'secret';

const opts = {
    jwtFromRequest: passportJwt.ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: secret
};

const SALT = 12;

passport.use('jwt', new passportJwt.Strategy(opts, async (jwtPayload, done) => {
        const user = await UsersModel.findById(jwtPayload.userId);

        if (user) {
            return done(null, user);
        } else {
            return done(null, null);
        }
    })
);

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

exports.administratorValidation = async function administratorValidation(req, res, next) {
    if (req.user.role === 'Administrator') {
        return next();
    }

    return res.status(401).send();
};

exports.authenticateMiddleware = function authenticateMiddleware(req, res, next) {
    passport.authenticate('jwt', opts, (err, user, info) => {
        if (err) {
            return res.status(401).send(error);
        }

        if (info) {
            return res.status(401).send(info);
        }

        return next();
    })(req, res, next);
};

exports.generateTokens = function generateTokens(userId, userRole) {
    const access = JsonWebToken.sign({userId: userId, role: userRole, type: 'access'}, secret, {
        expiresIn: '1h',
        algorithm: 'HS256',
        jwtid: userId.toString()
    });

    const refresh = JsonWebToken.sign({userId: userId, role: userRole, type: 'refresh'}, secret, {
        expiresIn: '7d',
        algorithm: 'HS256',
        jwtid: userId.toString()
    });
    return {access, refresh};
};

exports.generateHashPassword = function generateHashPassword(password) {
    return crypto
        .createHash('sha256')
        .update(SALT + password.toString())
        .digest('hex');
};

