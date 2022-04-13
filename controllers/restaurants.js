const Restaurant = require('../models/restaurant');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
const {cloudinary} = require("../cloudinary");

let cuisines = require("../seeds/cuisines");

module.exports.index = async (req, res) => {
    let restaurants = [];
    let sortingOption = "";
    let searchText = "";
    let minPrice = "";
    let maxPrice = "";
    let place = "";
    //let cuisines = ['chinese', 'kerala', 'burger', 'pizza', 'fast food'];
    //restaurants = await Restaurant.find({});
    
    if(req.query.sortby=="priceLow"){
        restaurants=await Restaurant.find({})
        .sort({price: 1, avgRating: -1, totalReviews: -1, createdAt: -1})
        sortingOption = "priceLow";
    }
    else if(req.query.sortby=="priceHigh"){
        restaurants=await Restaurant.find({})
        .sort({price: -1, avgRating: -1, totalReviews: -1, createdAt: -1})
        sortingOption = "priceHigh";
    }
    else if(req.query.sortby=="highRated"){
        restaurants=await Restaurant.find({})
        .sort({avgRating: -1, totalReviews: -1, price: 1, createdAt: -1})
        sortingOption = "highRated";
    }
    else if(req.query.sortby=="mostRev"){
        restaurants=await Restaurant.find({})
        .sort({totalReviews: -1, avgRating: -1, price: 1, createdAt: -1})
        sortingOption = "mostRev";
    }
    else if(req.query.sortby=="newAdded"){
        restaurants=await Restaurant.find({})
        .sort({createdAt: -1})
        sortingOption = "newAdded";
    }
    else{
        restaurants=await Restaurant.find({});
    }

    if(req.query.search){     
        searchText = req.query.search;   
        restaurants = restaurants.filter(restaurant => {
            if(req.query.search === '') return 1;
            return restaurant.title.toLowerCase().includes(req.query.search.toLowerCase());
        })        
    }

    if(req.query.minprice){
        restaurants = restaurants.filter(restaurant => {
            if(req.query.minprice === '') return 1;
            return restaurant.price >= req.query.minprice;
        })
        minPrice = req.query.minprice;

    }
    if(req.query.maxprice){
        restaurants = restaurants.filter(restaurant => {
            if(req.query.maxprice === '') return 1;
            return restaurant.price <= req.query.maxprice;
        })
        maxPrice = req.query.maxprice;

    }

    if(req.query.place){
        place = req.query.place;
        restaurants = restaurants.filter(restaurant => {
            if(req.query.place === '') return 1;
            return restaurant.location.toLowerCase().includes(req.query.place.toLowerCase());
        })
        
    }

    if(req.query.cuisine){
        if(typeof(req.query.cuisine) === 'string'){
            restaurants = restaurants.filter(restaurant => {
                return restaurant.cuisine.toLowerCase().includes(req.query.cuisine.toLowerCase());
            })
        }
        else{
            restaurants = restaurants.filter(restaurant => {
                let flag = 0;
                for(let c of req.query.cuisine){
                    if(restaurant.cuisine.toLowerCase().includes(c.toLowerCase())){
                        flag = 1;
                        break;
                    }
                }
                return flag; 
            })
        }
    }
    
    //console.log(req.query.cuisine);
    res.render('restaurants/index', { restaurants , cuisines, sortingOption, searchText, minPrice, maxPrice, place});
}

module.exports.renderNewForm = (req, res) => {
    res.render('restaurants/new');
}

module.exports.createRestaurant = async (req, res, next) => {
    const geoData = await geocoder.forwardGeocode({
        query: req.body.restaurant.location,
        limit: 1
    }).send()
    const restaurant = new Restaurant(req.body.restaurant);
    restaurant.geometry = geoData.body.features[0].geometry;
    restaurant.images = req.files.map(f => ({url: f.path, filename: f.filename}));
    restaurant.author = req.user._id;
    await restaurant.save();
    console.log(restaurant);
    req.flash('success', 'Successfully made a new restaurant!');
    res.redirect(`restaurants/${restaurant._id}`)
}

module.exports.showRestaurant = async(req, res) => {
    const restaurant = await Restaurant.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if(!restaurant){
        req.flash('error', 'Cannot find that restaurant!');
        return res.redirect('/restaurants');
    }
    res.render('restaurants/show', { restaurant });
}

module.exports.renderEditForm = async(req, res) => {
    const {id} = req.params;
    const restaurant = await Restaurant.findById(id);
    if(!restaurant){
        req.flash('error', 'Cannot find that restaurant!');
        return res.redirect('/restaurants');
    }
    
    res.render('restaurants/edit', { restaurant });
}

module.exports.updateRestaurant = async (req, res) => {
    const { id } = req.params;
    const restaurant = await Restaurant.findByIdAndUpdate(id, { ...req.body.restaurant});
    const imgs = req.files.map(f => ({url: f.path, filename: f.filename}));
    restaurant.images.push(...imgs);
    await restaurant.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await Restaurant.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    }
    req.flash('success', 'Successfully updated restaurant!');
    res.redirect(`/restaurants/${restaurant._id}`);
}

module.exports.deleteRestaurant = async (req, res) => {
    const { id } = req.params;
    await Restaurant.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted restaurant')
    res.redirect('/restaurants');
}