const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const cors = require('cors');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();

const db = require('./_helpers/db');
// const jwt = require('./_helpers/jwt');
// const errorHandler = require('./_helpers/error-handler');

const AController = require('./models_controllers/a/AController');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json({
	limit: '50mb'
}));
app.use(express.urlencoded({
	extended: false,
	limit: '50mb'
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

// app.use('/', indexRouter);
// app.use('/users', usersRouter);

app.use(cors());
// app.use(jwt());
app.use(bodyParser.json());
// app.use(errorHandler);

app.use('/a', AController);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

const port = 3000;
app.listen(port, () => {
	console.log('Express server listening on port ' + port);
});