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

const getById = (req, res, next) => {
	aService.getById(req.params.id)
		.then(a => a ? res.json(a) : res.sendStatus(404))
		.catch(err => next(err));
};

//routes
router.get('/submit/:id', submit);
router.get('/:id', getById);

module.exports = router;