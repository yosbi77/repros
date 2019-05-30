const expressJwt = require('express-jwt');
const config = require('../config.json');
const adminService = require('../models_controllers/user/AdminService');
const clientService = require('../models_controllers/user/ClientService');

module.exports = jwt;

function jwt() {
	const secret = config.secret;
	return expressJwt({ secret, isRevoked }).unless({
		path: [
			// public routes that don't require authentication
			'/admin/authenticate',
			'/admin/token',
			'/admin/token/reject',
			'/admin/verify',
			'/admin/resend',
			'/admin/resetPassword',
			'/admin/register',
			'/client/authenticate',
			'/client/token',
			'/client/token/reject',
			'/client/verify',
			'/client/resend',
			'/client/resetPassword',
			'/client/register',
			'/product/getAllStoreProducts'
		]
	});
}

async function isRevoked(req, payload, done) {
	const admin = await adminService.getById(payload.sub);
	const client = await clientService.getById(payload.sub);

	// revoke token if user no longer exists
	if (!admin && !client) {
		return done(null, true);
	}

	done();
};