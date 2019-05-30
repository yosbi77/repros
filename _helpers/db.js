const config = require('../config.json');
const mongoose = require('mongoose');

mongoose.connect(config.connectionString);
mongoose.connection.on('connected', () => {
	console.log('Connected to Database');
});
mongoose.connection.on('error', (err) => {
	console.log('Database Error: ' + err);
});
mongoose.Promise = global.Promise;

module.exports = {
	A: require('../models_controllers/a/A')
};