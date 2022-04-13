const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    registeredOn: { 
        type: Date,
        default: Date.now 
    },
    restaurantOwned:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "restaurant"
    }]
});
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);