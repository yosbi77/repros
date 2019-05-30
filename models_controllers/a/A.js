const mongoose = require('mongoose');
const Float = require('mongoose-float').loadType(mongoose, 2);
// mongoose.set('debug', true);

const ASchema = new mongoose.Schema({
	// x: {
	// 	type: Float,
	// 	default: 0
	// }
	x: {
		type: mongoose.Decimal128,
		// get: v => new mongoose.Types.Decimal128((+v.toString()).toFixed(2)),
		set: v => new mongoose.Types.Decimal128(v.toFixed(2)),
		default: 0
	}
});
mongoose.model('as', ASchema);

module.exports = mongoose.model('as');