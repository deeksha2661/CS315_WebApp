if(process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const mongoose = require('mongoose');
const places = require('./seedHelpers')
const Restaurant = require('../models/restaurant');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

mongoose.connect('mongodb://localhost:27017/dineout', {
    useUnifiedTopology: true,
    useNewUrlParser: true
});

    const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});



const seedDB = async () => {
    await Restaurant.deleteMany({});
    const cuisines = new Set();
    for(let i = 0; i < 50; i++){
        let cuisineList = places[i].cuisine.split(",").map(item => item.trim());
        for(let c of cuisineList){
            cuisines.add(c);
        }
        let geoData = await geocoder.reverseGeocode({
            query: [places[i].longitude, places[i].latitude],
            limit: 1,
            types: ["place"]
          }).send()
        let loc = geoData.body.features[0].place_name.slice(0, -7);
        const r = new Restaurant({
            author: '624c9050ea7b70ce9cf1628b',
            location: `${loc}`,
            title: `${places[i].name}`,
            description: `${places[i].address}`,
            price: `${places[i].cost_for_two}`,
            cuisine: `${places[i].cuisine}`,
            telephone: `${places[i].telephone}`,
            geometry: {
                type: "Point",
                coordinates: [places[i].longitude, places[i].latitude]
            },
            images: [
                {
                    url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/DineOut/DineoutImage${i}-1.jpg`,
                },
                {
                    url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/DineOut/DineoutImage${i}-2.jpg`,
                }
            ]
            // images: [
            //     {
            //         url: `https://source.unsplash.com/collection/69817121/1600x900?sig=${i}1`,
            //     },
            //     {
            //         url: `https://source.unsplash.com/collection/69817121/1600x900?sig=${i}2`,
            //     }
            // ]
        })
        await r.save();
        // cloudinary.uploader.upload("https://source.unsplash.com/collection/69817121/1600x900?sig=${i}1", {
        //     resource_type: "image",
        //     folder: "DineOut",
        //     public_id: `DineOutImage${i}-1`,
        //     use_filename: true,
        //     unique_filename: false

        // });
        // cloudinary.uploader.upload("https://source.unsplash.com/collection/69817121/1600x900?sig=${i}1", {
        //     resource_type: "image",
        //     resource_type: "image",
        //     folder: "DineOut",
        //     public_id: `DineOutImage${i}-2`,
        //     use_filename: true,
        //     unique_filename: false
        // });
    }
}

seedDB().then(() => {
    mongoose.connection.close()
})