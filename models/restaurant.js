const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RestaurantScehma = new Schema({
    title: String,
    price: String,
    description: String,
    cuisines: String,
    location: String,
    startTime: Date,
    endTime: Date 
});

module.exports = mongoose.model('Restaurant', RestaurantScehma);
