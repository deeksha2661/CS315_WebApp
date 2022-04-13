const Restaurant = require('../models/restaurant');
const Review = require('../models/review');

module.exports.createReview = async (req, res) => {
    const restaurant = await Restaurant.findById(req.params.id);
    const review = new Review(req.body.review);
    review.author = req.user._id;
    restaurant.reviews.push(review);
    restaurant.ratingSum += parseInt(req.body.review.rating);
    restaurant.totalReviews += 1;
    restaurant.avgRating = Math.round((restaurant.ratingSum * 10)/restaurant.totalReviews)/10;
    await review.save();
    await restaurant.save();
    req.flash('success', 'Created new review!');
    res.redirect(`/restaurants/${restaurant._id}`);
}

module.exports.deleteReview = async (req, res) => {
    const {id, reviewId} = req.params;
    await Restaurant.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Successfully deleted review')
    res.redirect(`/restaurants/${id}`);
}