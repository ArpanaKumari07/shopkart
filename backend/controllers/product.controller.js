const mongoose = require("mongoose");
const Product = require("../models/product.model");

const createProduct = async (req, res) => {
    try {
        // in Express 5, req.body is undefined when no JSON body is sent
        const { name, description, price, category, image, stock } = req.body || {};

        // price and stock are checked against undefined so that 0 reaches the number checks below
        if (!name || !description || price === undefined || !category || !image || stock === undefined) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if (typeof price !== "number" || price <= 0) {
            return res.status(400).json({
                success: false,
                message: "Price must be a number greater than 0"
            });
        }

        if (typeof stock !== "number" || stock < 0) {
            return res.status(400).json({
                success: false,
                message: "Stock must be a number greater than or equal to 0"
            });
        }

        const product = await Product.create({
            name,
            description,
            price,
            category,
            image,
            stock
        });

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            product
        });
    }
    catch (error) {
        console.error(error);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

const getProducts = async (req, res) => {
    try {
        const { search, category } = req.query;

        // build the MongoDB filter dynamically: an empty object matches every product
        const filter = {};

        if (search) {
            // escape regex special characters so input like "c++" or "(" is searched literally
            const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            // $options: "i" makes the match case-insensitive
            filter.name = { $regex: safeSearch, $options: "i" };
        }

        if (category) {
            filter.category = category;
        }

        // the listing page only needs these fields (description is shown on the details page)
        const products = await Product.find(filter)
            .select("name price category image stock")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: products.length,
            products
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

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product id"
            });
        }

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(200).json({
            success: true,
            product
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
    createProduct,
    getProducts,
    getProductById
};
