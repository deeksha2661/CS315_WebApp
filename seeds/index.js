const mongoose = require('mongoose');
const cities = require('./cities');
const places = require('./seedHelpers')
const Restaurant = require('../models/restaurant');

mongoose.connect('mongodb://localhost:27017/dineout', {
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];

const seedDB = async () => {
    await Restaurant.deleteMany({});
    
    // for(let i = 0; i < 50; i++){
    //     const randm = Math.floor(Math.random() * cities.length);
    //     const r = new Restaurant({
    //         location: `${cities[randm].city}, ${cities[randm].admin_name}`,
    //         title: `${sample(places).Name}`
    //     })
    //     await r.save();
    // }
}

seedDB().then(() => {
    mongoose.connection.close()
});