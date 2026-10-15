const crypto = require("crypto");
const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Order = require("../models/order.model");
const Product = require("../models/product.model");
const razorpay = require("../config/razorpay");

// the customer always comes from the auth middleware (req.user), never from the request body or URL

// order of the bonus status progression (PENDING_PAYMENT is the payment stage and is not part of it)
const STATUS_FLOW = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];

// returns { error } or { address } with every field trimmed
const validateShippingAddress = (shippingAddress) => {
    const input = shippingAddress || {};
    const fields = {
        fullName: "Full name",
        phone: "Phone",
        addressLine1: "Address line",
        city: "City",
        state: "State",
        pincode: "Pincode"
    };
    const address = {};

    for (const [field, label] of Object.entries(fields)) {
        const value = typeof input[field] === "string" ? input[field].trim() : "";

        if (!value) {
            return { error: `${label} is required.` };
        }

        address[field] = value;
    }

    if (!/^\d{10}$/.test(address.phone)) {
        return { error: "Phone must be a valid 10-digit number." };
    }

    if (!/^\d{6}$/.test(address.pincode)) {
        return { error: "Pincode must contain 6 digits." };
    }

    return { address };
};

const createPaymentOrder = async (req, res) => {
    try {
        // in Express 5, req.body is undefined when no JSON body is sent.
        // Only the shipping address is read: prices, totals and items from the client are ignored.
        const { shippingAddress } = req.body || {};

        const customer = await Customer.findById(req.user._id).populate("cart.product");
        const cart = customer.cart || [];

        if (cart.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Your cart is empty."
            });
        }

        const { error, address } = validateShippingAddress(shippingAddress);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error
            });
        }

        // a product deleted from the catalog populates as null
        if (cart.some((item) => !item.product)) {
            return res.status(400).json({
                success: false,
                message: "A product in your cart is no longer available. Please remove it and try again."
            });
        }

        // re-check every item against the LATEST stock in MongoDB
        for (const item of cart) {
            if (item.quantity > item.product.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${item.product.name}.`
                });
            }
        }

        if (!razorpay.isRazorpayConfigured()) {
            return res.status(503).json({
                success: false,
                message: "Online payment is not configured. Please try again later."
            });
        }

        // snapshot the latest product data and calculate the total on the server
        const items = cart.map((item) => ({
            product: item.product._id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            image: item.product.image
        }));

        const totalAmount = items.reduce((total, item) => total + item.price * item.quantity, 0);

        const order = await Order.create({
            user: req.user._id,
            items,
            shippingAddress: address,
            totalAmount,
            paymentStatus: "PENDING",
            status: "PENDING_PAYMENT"
        });

        let razorpayOrder;

        try {
            razorpayOrder = await razorpay.getRazorpay().orders.create({
                amount: Math.round(totalAmount * 100), // INR -> paise
                currency: "INR",
                receipt: order._id.toString()
            });
        }
        catch (razorpayError) {
            console.error(razorpayError);

            // the order never became payable, so don't keep it; the cart is untouched
            await Order.deleteOne({ _id: order._id });

            return res.status(502).json({
                success: false,
                message: "Unable to start the payment. Please try again."
            });
        }

        order.razorpayOrderId = razorpayOrder.id;
        await order.save();

        // only safe values: the Key ID is public, the key secret is never returned
        return res.status(201).json({
            success: true,
            shopKartOrderId: order._id,
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key: process.env.RAZORPAY_KEY_ID
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

const verifyPayment = async (req, res) => {
    try {
        const {
            shopKartOrderId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body || {};

        if (
            !mongoose.Types.ObjectId.isValid(shopKartOrderId) ||
            typeof razorpay_payment_id !== "string" || !razorpay_payment_id ||
            typeof razorpay_signature !== "string" || !razorpay_signature
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment details"
            });
        }

        // the order must belong to the logged-in customer
        const order = await Order.findOne({ _id: shopKartOrderId, user: req.user._id });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (order.paymentStatus === "PAID") {
            // already verified (e.g. a repeated request): return it without touching the cart again
            if (order.razorpayPaymentId === razorpay_payment_id) {
                return res.status(200).json({
                    success: true,
                    message: "Payment already verified",
                    order
                });
            }

            return res.status(400).json({
                success: false,
                message: "Order is already paid"
            });
        }

        // the signature is checked against the Razorpay order id STORED for this order,
        // never against the one sent by the browser
        if (!order.razorpayOrderId || (razorpay_order_id && razorpay_order_id !== order.razorpayOrderId)) {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed"
            });
        }

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
            .update(`${order.razorpayOrderId}|${razorpay_payment_id}`)
            .digest("hex");

        const expected = Buffer.from(expectedSignature);
        const received = Buffer.from(razorpay_signature);

        if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed"
            });
        }

        // only now is the order paid; the filter makes this a one-time PENDING -> PAID transition
        const paidOrder = await Order.findOneAndUpdate(
            { _id: order._id, user: req.user._id, paymentStatus: "PENDING" },
            {
                $set: {
                    paymentStatus: "PAID",
                    status: "PLACED",
                    razorpayPaymentId: razorpay_payment_id
                }
            },
            { new: true }
        );

        if (!paidOrder) {
            return res.status(409).json({
                success: false,
                message: "Order payment status changed. Please refresh."
            });
        }

        // reduce stock for every purchased item; the stock filter keeps it from going negative
        // if the same stock was sold to someone else between order creation and payment
        for (const item of paidOrder.items) {
            const reduced = await Product.updateOne(
                { _id: item.product, stock: { $gte: item.quantity } },
                { $inc: { stock: -item.quantity } }
            );

            if (reduced.matchedCount === 0) {
                console.error(`Stock shortfall for product ${item.product} on paid order ${paidOrder._id}`);
                await Product.updateOne({ _id: item.product }, { $set: { stock: 0 } });
            }
        }

        // the cart is cleared only after a verified payment
        await Customer.updateOne({ _id: req.user._id }, { $set: { cart: [] } });

        return res.status(200).json({
            success: true,
            message: "Payment verified",
            order: paidOrder
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

const getOrders = async (req, res) => {
    try {
        // only this customer's placed orders, newest first (unpaid checkout attempts are not orders yet)
        const orders = await Order.find({ user: req.user._id, status: { $ne: "PENDING_PAYMENT" } })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: orders.length,
            orders
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

const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order id"
            });
        }

        // another customer's order is reported as not found, so its existence isn't revealed
        const order = await Order.findOne({ _id: id, user: req.user._id });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        return res.status(200).json({
            success: true,
            order
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

// BONUS: development-only status progression PLACED -> CONFIRMED -> SHIPPED -> DELIVERED
const updateOrderStatus = async (req, res) => {
    try {
        if (process.env.NODE_ENV === "production") {
            return res.status(403).json({
                success: false,
                message: "Order status updates are only available in development"
            });
        }

        const { id } = req.params;
        const { status } = req.body || {};

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order id"
            });
        }

        if (!STATUS_FLOW.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Status must be one of: ${STATUS_FLOW.join(", ")}`
            });
        }

        const order = await Order.findOne({ _id: id, user: req.user._id });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // an unpaid order stays in the payment stage; only verify-payment can move it to PLACED
        if (order.paymentStatus !== "PAID") {
            return res.status(400).json({
                success: false,
                message: "Only paid orders can change status"
            });
        }

        const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];

        if (status !== nextStatus) {
            return res.status(400).json({
                success: false,
                message: nextStatus
                    ? `Order status can only move from ${order.status} to ${nextStatus}`
                    : "Order is already delivered"
            });
        }

        // the filter ensures the status didn't change since it was read
        const updatedOrder = await Order.findOneAndUpdate(
            { _id: order._id, status: order.status },
            { $set: { status } },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(409).json({
                success: false,
                message: "Order status changed. Please refresh."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Order status updated",
            order: updatedOrder
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
    createPaymentOrder,
    verifyPayment,
    getOrders,
    getOrderById,
    updateOrderStatus
};
