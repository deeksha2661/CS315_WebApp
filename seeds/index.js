const mongoose = require('mongoose');
const cities = require('./cities');
const places = require('./seedHelpers')
const Restaurant = require('../models/restaurant');

mongoose.connect('mongodb://localhost:27017/dineout', {
    useUnifiedTopology: true,
    useNewUrlParser: true
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];

const seedDB = async () => {
    await Restaurant.deleteMany({});
    
    for(let i = 0; i < 200; i++){
        const randm = Math.floor(Math.random() * cities.length);
        const price = Math.floor(Math.random() * 1000) + 10
        const r = new Restaurant({
            author: '624c9050ea7b70ce9cf1628b',
            location: `${cities[randm].city}, ${cities[randm].admin_name}`,
            title: `${sample(places).Name}`,
            description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet dapibus odio. Etiam eu libero vitae neque semper mattis. Vivamus tincidunt, leo ut vehicula.',
            price,
            geometry: {
                type: "Point",
                coordinates: [cities[randm].lng, cities[randm].lat]
            },
            images: [
                {
                    url: 'https://res.cloudinary.com/duw4qslmx/image/upload/v1649197832/cld-sample.jpg',
                    filename: 'cld-sample.jpg'
                },
                {
                    url: 'https://res.cloudinary.com/duw4qslmx/image/upload/v1649197808/sample.jpg',
                    filename: 'sample.jpg'
                }
            ]
        })
        await r.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close()
})