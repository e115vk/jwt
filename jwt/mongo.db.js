const mongoose = require('mongoose');

/**
 * Mongodb storage class
 */

const mongoUrl = 'mongodb://127.0.0.1:27019/jwt';
const UsersModel = require('./models/users.model');

class MongoDatabase {

    async connect() {

        try {
            await mongoose.connect(mongoUrl, {
                useNewUrlParser: true,
                useCreateIndex: true
            });

            mongoose.set('useCreateIndex', true);
            console.log('MongoDB successfully connected');
        } catch (err) {
            console.log('Unable to connect to database', err);
        }
    }

    async run() {
        try {
            await new UsersModel({
                firsName: 'adminName',
                lastName: 'adminLastName',
                email: 'admin@admin.com',
                password: 'string',
                role: 'Administrator'
            }).save();
        } catch (err) {
            console.log(JSON.stringify(err));
        } finally {
            console.log('Administrator successfully loaded to database')
        }
    }

    async clearDatabase() {
        await UsersModel.deleteMany({});
    }

    async disconnect() {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
}

module.exports = MongoDatabase;