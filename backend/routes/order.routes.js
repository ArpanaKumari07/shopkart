const express = require("express");

const {
    createPaymentOrder,
    verifyPayment,
    getOrders,
    getOrderById,
    updateOrderStatus
} = require("../controllers/order.controller");

const protect = require("../middlewares/auth.middleware");

const router = express.Router();

// every order route is protected, the customer is identified from the JWT cookie
router.post("/create-payment-order", protect, createPaymentOrder);
router.post("/verify-payment", protect, verifyPayment);
router.get("/", protect, getOrders);
router.get("/:id", protect, getOrderById);

// BONUS: development-only order status progression
router.patch("/:id/status", protect, updateOrderStatus);

module.exports = router;
