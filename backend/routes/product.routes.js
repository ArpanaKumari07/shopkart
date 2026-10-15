const express = require("express");

const {
    createProduct,
    getProducts,
    getProductById
} = require("../controllers/product.controller");

const router = express.Router();

// open for this lab, no admin auth required yet
router.post("/", createProduct);
router.get("/", getProducts);
router.get("/:id", getProductById);

module.exports = router;
