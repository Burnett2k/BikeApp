var mongoose = require('mongoose');
Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var maintRecSchema = new Schema({
	bike		:	{type : ObjectId, required : true},
	comment		:	String,
	lastUpdated	:	Date
});

module.exports = mongoose.model('MaintRec', maintRecSchema);
