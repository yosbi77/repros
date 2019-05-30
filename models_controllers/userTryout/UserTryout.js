const mongoose = require('mongoose');
const Float = require('mongoose-float').loadType(mongoose, 2);
// mongoose.set('debug', true);
const IncorrectCounterSchema = new mongoose.Schema({
	topic: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'l_qna_topics',
		required: [true, 'IncorrectCounter.topic is required']
	},
	count: {
		type: Number,
		min: [0, 'must be an integer >= 0'],
		required: [true, 'IncorrectCounter.count is required']
	}
}, {versionKey: false, _id: false});
const BadTopicSchema = new mongoose.Schema({
	topic: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'l_qna_topics',
		required: [true, 'BadTopic.topic is required']
	}
}, {versionKey: false, _id: false});
const AnswerSchema = new mongoose.Schema({
	m_qnas_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'm_qnas',
		required: [true, 'Answer.m_qnas_id is required']
	},
	answer: {
		type: Number,
		min: [-1, 'must be an integer in [-1, 4]'],
		max: [4, 'must be an integer in [-1, 4]']
	},
	status: {type: String, enum: ['Uncertain', 'Certain']},
	result: {type: String, enum: ['Correct', 'Incorrect']}
}, {versionKey: false, _id: false});
const AnalysisSchema = new mongoose.Schema({
	finalScore: {
		type: Float,
		min: [0, 'must be a float in [0, 100]'],
		max: [100, 'must be a float in [0, 100]'],
		required: [true, 'Analysis.finalScore is required'],
		default: 0
	},
	// finalScore: {
	// 	type: mongoose.Decimal128,
	// 	get: v => new mongoose.Types.Decimal128((+v.toString()).toFixed(2)),
	// 	set: v => new mongoose.Types.Decimal128(v.toFixed(2)),
	// 	min: [0, 'must be a decimal in [0, 100]'],
	// 	max: [100, 'must be a decimal in [0, 100]'],
	// 	required: [true, 'Analysis.finalScore is required'],
	// 	default: 0
	// },
	incorrectCounters: [IncorrectCounterSchema],
	badTopics: [BadTopicSchema],
	emptyAnswerCounter: {
		type: Number,
		min: [0, 'must be an integer >= 0'],
		required: [true, 'Analysis.emptyAnswerCounter is required'],
		default: 0
	}
}, {versionKey: false, _id: false});
const UserTryoutSchema = new mongoose.Schema({
	created: {type: Date, required: [true, 'Created date is required']},
	updated: {type: Date, required: [true, 'Updated date is required']},
	createdBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'm_users',
		required: [true, 'CreatedBy is required']
	},
	updatedBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'm_users',
		required: [true, 'UpdatedBy is required']
	},
	m_users_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'm_users',
		required: [true, 'm_users_id is required']
	},
	m_tryouts_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'm_tryouts',
		required: [true, 'm_tryouts_id is required']
	},
	timeLeft: {
		type: Number,
		min: [0, 'must be an integer >= 0'],
		required: [true, 'TimeLeft is required']
	},
	answers: [AnswerSchema],
	analysis: AnalysisSchema,
	isDeleted: {type: Number, enum: [0, 1], required: [true, 'isDeleted is required']},
}, {versionKey: false});
mongoose.model('t_users_tryouts', UserTryoutSchema);

module.exports = mongoose.model('t_users_tryouts');