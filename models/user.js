var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var userSchema = new Schema ({
        email                   :       String,
        lastLogin               :       Date,
        gId                     :{unique: true, type:String}
});

module.exports = mongoose.model('User', userSchema);
