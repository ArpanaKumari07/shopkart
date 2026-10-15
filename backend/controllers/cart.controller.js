const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

// the customer always comes from the auth middleware (req.user), never from the request body or URL

// loads the customer's cart with the CURRENT Product data (latest price and stock), so every
// endpoint can return the updated cart and the frontend state stays in sync with MongoDB
const getPopulatedCart = async (customerId) => {
    const customer = await Customer.findById(customerId)
        .populate({
            path: "cart.product",
            select: "name price image stock"
        })
        .lean();

    // lean() skips schema defaults, so customers created before the cart existed have no cart field;
    // a product deleted from the catalog populates as null, so leave it out of the response
    return (customer.cart || [])
        .filter((item) => item.product)
        .map((item) => ({ product: item.product, quantity: item.quantity }));
};

const addToCart = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product id"
            });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (product.stock < 1) {
            return res.status(400).json({
                success: false,
                message: "Product is out of stock"
            });
        }

        // already in the cart: +1, but the filter only matches while quantity is below the current stock
        const increased = await Customer.updateOne(
            {
                _id: req.user._id,
                cart: { $elemMatch: { product: product._id, quantity: { $lt: product.stock } } }
            },
            { $inc: { "cart.$.quantity": 1 } }
        );

        if (increased.modifiedCount === 0) {
            // not in the cart yet: add one row with quantity 1 (the filter prevents duplicate rows)
            const added = await Customer.updateOne(
                { _id: req.user._id, "cart.product": { $ne: product._id } },
                { $push: { cart: { product: product._id, quantity: 1 } } }
            );

            // neither update matched, so the product is in the cart and already at the stock limit
            if (added.modifiedCount === 0) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${product.stock} in stock`
                });
            }
        }

        const cart = await getPopulatedCart(req.user._id);

        return res.status(200).json({
            success: true,
            message: "Cart updated",
            cart
        });
    }
    catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

const getCart = async (req, res) => {
    try {
        const cart = await getPopulatedCart(req.user._id);

        return res.status(200).json({
            success: true,
            cart
        });
    }
    catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

const updateCartQuantity = async (req, res) => {
    try {
        const { productId } = req.params;
        // in Express 5, req.body is undefined when no JSON body is sent
        const { quantity } = req.body || {};

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product id"
            });
        }

        if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be a whole number of at least 1"
            });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (quantity > product.stock) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.stock} in stock`
            });
        }

        const result = await Customer.updateOne(
            { _id: req.user._id, "cart.product": product._id },
            { $set: { "cart.$.quantity": quantity } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not in cart"
            });
        }

        const cart = await getPopulatedCart(req.user._id);

        return res.status(200).json({
            success: true,
            message: "Cart updated",
            cart
        });
    }
    catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product id"
            });
        }

        // only the authenticated customer's document is touched; the filter only matches if the
        // product is in their cart (modifiedCount can't be used: timestamps always update updatedAt)
        const result = await Customer.updateOne(
            { _id: req.user._id, "cart.product": productId },
            { $pull: { cart: { product: productId } } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not in cart"
            });
        }

        const cart = await getPopulatedCart(req.user._id);

        return res.status(200).json({
            success: true,
            message: "Product removed from cart",
            cart
        });
    }
    catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

module.exports = {
    addToCart,
    getCart,
    updateCartQuantity,
    removeFromCart
};
