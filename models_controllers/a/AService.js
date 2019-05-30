// const jwt = require('jsonwebtoken');

const db = require('../../_helpers/db');
const A = db.A;

const submit = async (id) => {
	const a = await A.findById(id);

	a.x = 9 / 11 * 100;

	await a.save();

	console.log(a.x);
};

const create = async (aParam) => {
	const a = new A(aParam);

	a.save();
};

const getAll = async () => await A.find();

module.exports = {
	submit,
	create,
	getAll
};