const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());

const userTryoutService = require('./UserTryoutService');

const submit = (req, res, next) => {
	userTryoutService.submit(req.params.id, req.headers.authorization)
		.then(userTryout => userTryout ? res.json(userTryout) : res.json({
			success: true,
			msg: 'UserTryout submitted'
		}))
		.catch(err => next(err));
};

const getExplanation = (req, res, next) => {
	userTryoutService.getExplanation(req.params.id, req.headers.authorization)
		.then(userTryout => userTryout ? res.json(userTryout) : res.sendStatus(404))
		.catch(err => next(err));
};

const create = (req, res, next) => {
	userTryoutService.create(req.body, req.headers.authorization)
		.then(userTryout => userTryout ? res.json(userTryout) : res.json({
			success: true,
			msg: 'UserTryout created'
		}))
		.catch(err => next(err));
};

const getAll = (req, res, next) => {
	userTryoutService.getAll(req.headers.authorization)
		.then(userTryouts => res.json(userTryouts))
		.catch(err => next(err));
};

const getAllDeleted = (req, res, next) => {
	userTryoutService.getAllDeleted(req.headers.authorization)
		.then(userTryouts => res.json(userTryouts))
		.catch(err => next(err));
};

const getByQuery = (req, res, next) => {
	userTryoutService.getByQuery(req.query, req.headers.authorization)
		.then(userTryouts => res.json(userTryouts))
		.catch(err => next(err));
};

const getById = (req, res, next) => {
	userTryoutService.getById(req.params.id, req.headers.authorization)
		.then(userTryout => userTryout ? res.json(userTryout) : res.sendStatus(404))
		.catch(err => next(err));
};

const update = (req, res, next) => {
	userTryoutService.update(req.params.id, req.body, req.headers.authorization)
		.then(userTryout => userTryout ? res.json(userTryout) : res.json({
			success: true,
			msg: 'UserTryout updated'
		}))
		.catch(err => next(err));
};

const patch = (req, res, next) => {
	userTryoutService.patch(req.params.id, req.body, req.headers.authorization)
		.then(userTryout => userTryout ? res.json(userTryout) : res.json({
			success: true,
			msg: 'UserTryout patched'
		}))
		.catch(err => next(err));
};

const _delete = (req, res, next) => {
	userTryoutService.delete(req.params.id, req.headers.authorization)
		.then(userTryout => userTryout ? res.json(userTryout) : res.json({
			success: true,
			msg: 'UserTryout deleted'
		}))
		.catch(err => next(err));
};

//routes
router.get('/submit/:id', submit);
router.get('/getExplanation/:id', getExplanation);
router.post('/', create);
router.get('/', getAll);
router.get('/d', getAllDeleted);
router.get('/q', getByQuery);
router.get('/:id', getById);
router.put('/:id', update);
router.patch('/:id', patch);
router.delete('/:id', _delete);

module.exports = router;