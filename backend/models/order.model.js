const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        // the project's user model is registered as "Customer"
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true
        },

        // snapshot of each product at purchase time, so later Product price/name
        // changes never alter an existing order
        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true
                },
                name: {
                    type: String,
                    required: true
                },
                price: {
                    type: Number,
                    required: true
                },
                quantity: {
                    type: Number,
                    required: true
                },
                image: String
            }
        ],

        shippingAddress: {
            fullName: String,
            phone: String,
            addressLine1: String,
            city: String,
            state: String,
            pincode: String
        },

        // in INR, always calculated on the server from the latest Product prices
        totalAmount: {
            type: Number,
            required: true
        },

        paymentStatus: {
            type: String,
            enum: ["PENDING", "PAID", "FAILED"],
            default: "PENDING"
        },

        status: {
            type: String,
            enum: ["PENDING_PAYMENT", "PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"],
            default: "PENDING_PAYMENT"
        },

        razorpayOrderId: String,
        razorpayPaymentId: String
    },
    {
        timestamps: true
    }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
