var mongoose = require('mongoose');
Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var bikeSchema = new Schema ({
	gId		:	{type : String, required : true},
	model		:	{type : String, required : true},
	brand		:	{type : String, required : true},
	year		:	Number,
	type	        :   	{type : String, required : true},
	lastUpdated	:	Date,
	img		:	String,
	maintRecs	:	[{
		recId		:	ObjectId,
		comment		:	String,
		lastUpdated	:	Date
	}]
});

module.exports = mongoose.model('Bike', bikeSchema);
