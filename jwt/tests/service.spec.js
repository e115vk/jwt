//Internal Dependencies
const Application = require('../service');
const UsersModel = require('../models/users.model');
const RefreshTokensModel = require('../models/refreshToken.model');
//External Dependencies
const should = require('should');
const JsonWebToken = require('jsonwebtoken');
const request = require('supertest-promised');


const app = new Application();

const secret = 'secret';

describe('authentication service tests', () => {
    before(async () => {
        await app.init();
        await UsersModel.deleteMany({});
        await RefreshTokensModel.deleteMany({});

        const testUser = {
            firstName: 'fName',
            lastName: 'lName',
            email: 'email@email.com',
            password: '567041aba553f8512d1fe3e95b78671c2b912f7c85e51610030d3f2e951518d8',
            role: 'Administrator'
        };

        await new UsersModel(testUser).save();
    });

    after(async () => {
        await UsersModel.deleteMany({});
        await RefreshTokensModel.deleteMany({});
        await app.stop();
    });

    describe('POST /api/auth', async () => {
        it('should get tokens by sign in', async () => {
            const body = await request(app.server)
                .post('/api/auth')
                .send({email: 'email@email.com', password: 'password'})
                .expect(200)
                .end()
                .get('body');

            body.should.not.be.empty();
            body.should.be.Object();
            body.should.have.properties('access', 'refresh');
            body.access.should.not.be.empty();
            body.refresh.should.not.be.empty();
        });


        it('should not get sign in with incorrect email', async () => {
            await request(app.server)
                .post('/api/auth')
                .send({email: 'incorrect@email.com', password: 'password'})
                .expect(422)
                .end()
                .get('body');
        });

        it('should not get sign in with incorrect password', async () => {
            await request(app.server)
                .post('/api/auth')
                .send({email: 'incorrect@email.com', password: 'incorrect'})
                .expect(422)
                .end()
                .get('body');
        });

        const validationErrorData = [
            {
                input: {
                    email: 123
                },
                details: {
                    message: 'should be defined',
                    path: '.password'
                }
            },
            {
                input: {},
                details: {
                    message: 'should be defined',
                    path: '.email'
                }
            }
        ];

        validationErrorData.forEach(data => {
            it(`should return 422 ${JSON.stringify(data.details)}`, async () => {
                const body = await request(app.server)
                    .post(`/api/auth`)
                    .send(data.input)
                    .expect(422)
                    .end()
                    .get('body');

                body.error.message.should.be.eql('Validation error');
                body.error.details.should.be.instanceOf(Array);

                body.error.details[0].message.should.be.eql(data.details.message);
                body.error.details[0].dataPath.should.be.eql(data.details.path);
            });
        });
    });

    describe('DELETE /api/auth', () => {
        it('should be able to sign out', async () => {
            const testUser = await UsersModel.findOne({email: 'email@email.com'});
            if (testUser) {
                const refresh = JsonWebToken.sign({
                    userId: testUser._id,
                    role: testUser.role,
                    type: 'refresh'
                }, secret, {
                    expiresIn: '7d',
                    algorithm: 'HS256'
                });

                await new RefreshTokensModel({userId: testUser._id, refreshToken: refresh}).save();

                const body = await request(app.server)
                    .delete(`/api/auth`)
                    .set('Authorization', `Bearer ${refresh}`)
                    .expect(200)
                    .end()
                    .get('body');

                body.message.should.be.eql('Revoked');
            }
        });

        it('should not be able to sign out without token', async () => {
            const testUser = await UsersModel.findOne({email: 'email@email.com'});
            if (testUser) {
                const refresh = JsonWebToken.sign({
                    userId: testUser._id,
                    role: testUser.role,
                    type: 'refresh'
                }, secret, {
                    expiresIn: '0s',
                    algorithm: 'HS256'
                });

                await new RefreshTokensModel({userId: testUser._id, refreshToken: refresh}).save();

                await request(app.server)
                    .delete(`/api/auth`)
                    .set('Authorization', `Bearer ${refresh}`)
                    .expect(401)
                    .end()
                    .get('body');
            }
        });
    });

    describe('PUT /api/auth', async () => {
        beforeEach(async () => {
            await UsersModel.deleteMany({});
            await new UsersModel({
                role: 'Administrator',
                email: 'email@email.com',
                firstName: 'fName',
                lastName: 'lName',
                password: '567041aba553f8512d1fe3e95b78671c2b912f7c85e51610030d3f2e951518d8'
            }).save();
        });

        afterEach(async () => {
            await UsersModel.deleteMany({});
        });

        it('should refresh tokens', async () => {
            const testUser = await UsersModel.findOne({email: 'email@email.com'});
            if (testUser) {
                const access = JsonWebToken.sign({userId: testUser._id, role: testUser.role, type: 'refresh'}, secret, {
                    expiresIn: '1h',
                    algorithm: 'HS256'
                });
                const refresh = JsonWebToken.sign({
                    userId: testUser._id,
                    role: testUser.role,
                    type: 'refresh'
                }, secret, {
                    expiresIn: '6d',
                    algorithm: 'HS256'
                });

                await RefreshTokensModel.insertMany({userId: testUser._id, refreshToken: refresh});

                const body = await request(app.server)
                    .put(`/api/auth`)
                    .set('Authorization', `Bearer ${refresh}`)
                    .send({accessToken: access, refreshToken: refresh})
                    .expect(201)
                    .end()
                    .get('body');

                const newRefreshToken = JsonWebToken.decode(body.refresh);

                body.should.be.Object();
                body.should.have.properties('access', 'refresh');
                body.access.should.not.be.empty();
                body.refresh.should.not.be.empty();
                body.refresh.should.not.be.eql(refresh);
                newRefreshToken.type.should.be.eql('refresh');
                newRefreshToken.role.should.be.eql(testUser.role);
                newRefreshToken.userId.should.be.eql(testUser._id.toString());
            }
        });

        it('should not refresh tokens with incorrect refresh token', async () => {
            const testUser = await UsersModel.findOne({email: 'email@email.com'});
            if (testUser) {
                const refresh = JsonWebToken.sign({
                    userId: testUser._id,
                    role: testUser.role,
                    type: 'refresh'
                }, secret, {
                    expiresIn: '0s',
                    algorithm: 'HS256'
                });
                const access = refresh;

                await RefreshTokensModel.insertMany({userId: testUser._id, refreshToken: refresh});

                await request(app.server)
                    .put(`/api/auth`)
                    .set('Authorization', `Bearer ${refresh}`)
                    .send({access, refresh})
                    .expect(401)
                    .end()
                    .get('body');
            }
        });
    });
});
