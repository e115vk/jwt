//Internal Dependencies
const dataBase = require('./mongo.db');
const passportJwt = require('passport-jwt');
const UsersModel = require('./models/users.model');
const RefreshTokensModel = require('./models/refreshToken.model');
const customPassport = require('./authentification/passport.jwt');

//External Dependencies
const express = require('express');
const JsonWebToken = require('jsonwebtoken');
const bodyParser = require('body-parser');

class Application {
    constructor() {
        this.server = express();
    }

    async init() {
        const mongoModule = new dataBase();


        await mongoModule.connect();
        await mongoModule.run();

        this.server.use(bodyParser.urlencoded({extended: false, limit: '50mb'}));
        this.server.use(bodyParser.json({limit: '50mb'}));
        this.server.use(bodyParser.text({limit: '50mb'}));


        this.registerRoutes();

        this.http =
            await this.server.listen(3030);

    }

    async stop() {
        const mongoModule = new dataBase();
        await this.http.close();
        await mongoModule.disconnect();
        //process.exit();
    }

    registerRoutes() {

        this.server.post("/api/auth", async function (req, res, next) {
            try {
                const {email, password} = req.body;

                if (!email) {
                    res.status(422).send({
                        error: {
                            message: 'Validation error', details: [{
                                dataPath: '.email',
                                message: 'should be defined'
                            }]
                        }
                    });
                }

                if (!password) {
                    res.status(422).send({
                        error: {
                            message: 'Validation error', details: [{
                                dataPath: '.password',
                                message: 'should be defined'
                            }]
                        }
                    });
                }

                const userData = await UsersModel.findOne({email});

                if (!userData) {
                    return res.status(422).send();
                }

                const hashPassword = customPassport.generateHashPassword(password);
                if (hashPassword !== userData.password) {
                    return res.status(422).send();
                }

                const tokens = customPassport.generateTokens(userData._id, userData.role);

                await new RefreshTokensModel({userId: userData._id, refreshToken: tokens.refresh}).save();

                return res.json(tokens);
            } catch (err) {
                return next(err);
            }
        });

        this.server.delete("/api/auth", customPassport.authenticateMiddleware, async function (req, res, next) {
            try {
                const refreshToken = passportJwt.ExtractJwt.fromAuthHeaderAsBearerToken()(req);
                const tokenDecoded = JsonWebToken.decode(refreshToken);

                if (!tokenDecoded) {
                    return res.status(403).send();
                }

                const isSignOut = await RefreshTokensModel.findOneAndDelete({userId: tokenDecoded.userId});
                if (isSignOut) {
                    return res.status(200).send({message: 'Revoked'});
                } else {
                    return res.status(401).send();
                }
            } catch (err) {
                return next(err);
            }
        });

        this.server.put("/api/auth", customPassport.authenticateMiddleware, async function (req, res, next) {
            try {
                const encodedToken = req.body.refreshToken;
                const refreshToken = JsonWebToken.decode(encodedToken);

                if (!refreshToken) {
                    return res.status(401).send({code: 422, message: 'Token Broken'});
                }

                const isRefresh = await RefreshTokensModel.findOne({userId: refreshToken.userId});

                if (!isRefresh) {
                    return res.status(401).send();
                }

                const userData = await UsersModel.findById(refreshToken.userId);
                if (userData) {
                    const tokens = customPassport.generateTokens(userData._id, userData.role);

                    await RefreshTokensModel.findOneAndDelete({userId: userData._id});
                    await new RefreshTokensModel({userId: userData._id, refreshToken: tokens.refresh}).save();
                    return res.status(201).json(tokens);
                } else {
                    return res.status(401).send();
                }
            } catch (err) {
                if (err.message) {
                    return res.status(401).send(err);
                }

                return next(err);
            }
        });
    }
}

module.exports = Application;
