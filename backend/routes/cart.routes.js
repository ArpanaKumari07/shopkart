const express = require("express");

const {
    addToCart,
    getCart,
    updateCartQuantity,
    removeFromCart
} = require("../controllers/cart.controller");

const protect = require("../middlewares/auth.middleware");

const router = express.Router();

// every cart route is protected, the customer is identified from the JWT cookie
router.get("/", protect, getCart);
router.post("/:productId", protect, addToCart);
router.patch("/:productId", protect, updateCartQuantity);
router.delete("/:productId", protect, removeFromCart);

module.exports = router;
