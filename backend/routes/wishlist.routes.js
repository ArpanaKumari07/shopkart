const express = require("express");

const {
    addToWishlist,
    getWishlist,
    removeFromWishlist
} = require("../controllers/wishlist.controller");

const protect = require("../middlewares/auth.middleware");

const router = express.Router();

// every wishlist route is protected, the customer is identified from the JWT cookie
router.get("/", protect, getWishlist);
router.post("/:productId", protect, addToWishlist);
router.delete("/:productId", protect, removeFromWishlist);

module.exports = router;
