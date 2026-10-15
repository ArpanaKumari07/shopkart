const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

// the customer always comes from the auth middleware (req.user), never from the request body or URL

const addToWishlist = async (req, res) => {
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

        // check + add in ONE atomic update: the filter only matches if the product is not
        // already in the wishlist, so two requests arriving together can't both add it
        const result = await Customer.updateOne(
            { _id: req.user._id, wishlist: { $ne: product._id } },
            { $push: { wishlist: product._id } }
        );

        if (result.modifiedCount === 0) {
            return res.status(409).json({
                success: false,
                message: "Product already in wishlist"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Product added to wishlist"
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

const getWishlist = async (req, res) => {
    try {
        // replace the stored ObjectIds with the Product fields the wishlist UI needs
        const customer = await Customer.findById(req.user._id).populate({
            path: "wishlist",
            select: "name price category image stock"
        });

        return res.status(200).json({
            success: true,
            count: customer.wishlist.length,
            wishlist: customer.wishlist
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

const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product id"
            });
        }

        const customer = await Customer.findById(req.user._id);

        const inWishlist = customer.wishlist.some((id) => id.equals(productId));

        if (!inWishlist) {
            return res.status(404).json({
                success: false,
                message: "Product not in wishlist"
            });
        }

        customer.wishlist = customer.wishlist.filter((id) => !id.equals(productId));

        await customer.save();

        return res.status(200).json({
            success: true,
            message: "Product removed from wishlist"
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
    addToWishlist,
    getWishlist,
    removeFromWishlist
};
