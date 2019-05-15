const mongoose = require('mongoose');

const usersSchema = new mongoose.Schema({
    firsName: 'string',
    lastName: 'string',
    email: 'string',
    password: 'string',
    role: {type: 'string', enum: ['Administrator', 'User']}
});

const UsersModel = mongoose.model('Users', usersSchema);

module.exports = UsersModel;