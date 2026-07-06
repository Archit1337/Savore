const { z } = require('zod');

// Reusable validation wrapper
const validateRequest = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
      res.status(400);
      return next(new Error(errorMessages));
    }
    next(error);
  }
};

// Zod schemas
const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['customer', 'restaurant', 'admin']).optional(),
  address: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const restaurantSchema = z.object({
  name: z.string().min(1, 'Restaurant name is required'),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  tags: z.array(z.string()).optional(),
  cuisines: z.array(z.string()).optional(),
  deliveryTime: z.number().min(1, 'Delivery time must be positive').optional(),
  deliveryFee: z.number().min(0, 'Delivery fee cannot be negative').optional(),
});

const foodItemSchema = z.object({
  name: z.string().min(1, 'Food item name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be greater than 0'),
  image: z.string().optional(),
  category: z.string().min(1, 'Menu category is required'),
  restaurant: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Restaurant ID'),
});

const orderSchema = z.object({
  restaurant: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Restaurant ID'),
  items: z.array(
    z.object({
      foodItem: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Food Item ID'),
      quantity: z.number().int().min(1, 'Quantity must be at least 1'),
      price: z.number().nonnegative('Price cannot be negative'),
    })
  ).min(1, 'Order must contain at least one item'),
  paymentMethod: z.enum(['COD', 'CARD', 'ONLINE', 'SIMULATED', 'UPI']),
  deliveryAddress: z.string().min(1, 'Delivery address is required'),
});

module.exports = {
  validateRegister: validateRequest(registerSchema),
  validateLogin: validateRequest(loginSchema),
  validateRestaurant: validateRequest(restaurantSchema),
  validateFoodItem: validateRequest(foodItemSchema),
  validateOrder: validateRequest(orderSchema),
};
