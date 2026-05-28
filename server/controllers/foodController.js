const FoodItem = require('../models/FoodItem');
const Restaurant = require('../models/Restaurant');
const mongoose = require('mongoose');

// @desc    Add a menu food item to a restaurant
// @route   POST /api/food
// @access  Private (Restaurant Owner)
const addFoodItem = async (req, res, next) => {
  try {
    const { name, description, price, image, category, restaurant: restaurantId } = req.body;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      res.status(404);
      return next(new Error('Target restaurant not found'));
    }

    // Verify ownership
    if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403);
      return next(new Error('Unauthorized: You do not own this restaurant'));
    }

    const foodItem = await FoodItem.create({
      name,
      description: description || '',
      price,
      image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
      category,
      restaurant: restaurantId,
    });

    res.status(201).json({
      success: true,
      data: foodItem,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a menu food item
// @route   PUT /api/food/:id
// @access  Private (Restaurant Owner)
const updateFoodItem = async (req, res, next) => {
  try {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(404);
      return next(new Error('Menu item not found'));
    }
    const foodItem = await FoodItem.findById(req.params.id);
    if (!foodItem) {
      res.status(404);
      return next(new Error('Menu item not found'));
    }

    const restaurant = await Restaurant.findById(foodItem.restaurant);
    if (!restaurant || (restaurant.owner.toString() !== req.user.id && req.user.role !== 'admin')) {
      res.status(403);
      return next(new Error('Unauthorized: You do not own this restaurant'));
    }

    const { name, description, price, image, category, isAvailable } = req.body;

    foodItem.name = name !== undefined ? name : foodItem.name;
    foodItem.description = description !== undefined ? description : foodItem.description;
    foodItem.price = price !== undefined ? price : foodItem.price;
    foodItem.image = image !== undefined ? image : foodItem.image;
    foodItem.category = category !== undefined ? category : foodItem.category;
    foodItem.isAvailable = isAvailable !== undefined ? isAvailable : foodItem.isAvailable;

    await foodItem.save();

    res.json({
      success: true,
      data: foodItem,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a menu food item
// @route   DELETE /api/food/:id
// @access  Private (Restaurant Owner)
const deleteFoodItem = async (req, res, next) => {
  try {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(404);
      return next(new Error('Menu item not found'));
    }
    const foodItem = await FoodItem.findById(req.params.id);
    if (!foodItem) {
      res.status(404);
      return next(new Error('Menu item not found'));
    }

    const restaurant = await Restaurant.findById(foodItem.restaurant);
    if (!restaurant || (restaurant.owner.toString() !== req.user.id && req.user.role !== 'admin')) {
      res.status(403);
      return next(new Error('Unauthorized: You do not own this restaurant'));
    }

    await foodItem.deleteOne();

    res.json({
      success: true,
      data: {},
      message: 'Menu item deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addFoodItem,
  updateFoodItem,
  deleteFoodItem,
};
