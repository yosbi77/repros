const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());

const aService = require('./AService');

const submit = (req, res, next) => {
	aService.submit(req.params.id)
		.then(userTryout => userTryout ? res.json(userTryout) : res.json({
			success: true,
			msg: 'A submitted'
		}))
		.catch(err => next(err));
};

const create = (req, res, next) => {
	aService.create(req.body)
		.then(a => a ? res.json(a) : res.json({
			success: true,
			msg: 'A created'
		}))
		.catch(err => next(err));
};

const getAll = (req, res, next) => {
	aService.getAll()
		.then(as => res.json(as))
		.catch(err => next(err));
};

//routes
router.get('/submit/:id', submit);
router.post('/', create);
router.get('/', getAll);

module.exports = router;