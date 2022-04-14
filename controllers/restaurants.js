const Restaurant = require('../models/restaurant');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
const {cloudinary} = require("../cloudinary");

let cuisines = require("../seeds/cuisines");

module.exports.index = async (req, res) => {
    let restaurants = [];

    let sortingOption = req.query.sortby;
    let searchText = req.query.search;
    let place = req.query.place;
    let minPrice = req.query.minprice;
    let maxPrice = req.query.maxprice;
    let selectedCuisines = [];

    let cuisineList = []
    if(req.query.cuisine){
        if(typeof(req.query.cuisine) === 'string'){
            cuisineList.push(new RegExp(req.query.cuisine, 'i'));
            selectedCuisines = [req.query.cuisine];
        }
        else{
            for(let c of req.query.cuisine){
                cuisineList.push(new RegExp(c, 'i'));
            }
            selectedCuisines = req.query.cuisine;
        }
    }
    else{
         cuisineList.push(new RegExp('', 'i'));
    }

    if(!req.query.minprice || req.query.minprice==''){
        req.query.minprice = 0;
    }
    if(!req.query.maxprice || req.query.maxprice==''){
        req.query.maxprice = Infinity;
    }

    let sortingParameters = {}
    if(req.query.sortby=="priceLow"){
        sortingParameters = {"price" : 1, "avgRating" : -1, "totalReviews" : -1, "createdAt" : -1};
    }
    else if(req.query.sortby=="priceHigh"){
        sortingParameters = {"price" : -1, "avgRating" : -1, "totalReviews" : -1, "createdAt" : -1};
    }
    else if(req.query.sortby=="highRated"){
        sortingParameters = {"avgRating" : -1, "totalReviews" : -1, "price" : 1, "createdAt" : -1};
    }
    else if(req.query.sortby=="mostRev"){
        sortingParameters = {"totalReviews" : -1, "avgRating" : -1, "price" : 1, "createdAt" : -1};
    }
    else if(req.query.sortby=="newAdded"){
        sortingParameters = {"createdAt" : -1};
    }
    else{
        sortingOption = "";
    }

    restaurants=await Restaurant.find({"title" : new RegExp(req.query.search, 'i'), 
                                       "location" : new RegExp(req.query.place, 'i'),
                                       "price" : {$gte : req.query.minprice , $lte : req.query.maxprice },
                                       "cuisine" : {$in : cuisineList}
                                    }).sort(sortingParameters)

    res.render('restaurants/index', { restaurants, cuisines, selectedCuisines, sortingOption, searchText, minPrice, maxPrice, place});
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