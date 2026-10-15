const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },

        password: {
            type: String,
            required: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        // only Product ObjectIds are stored, the Product collection stays the source of truth
        wishlist: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product"
                }
            ],
            default: []
        },

        // each item stores a Product reference + quantity only; price/stock are always read from Product,
        // and subtotal / item counts are derived on the frontend, never stored
        cart: {
            type: [
                {
                    product: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "Product",
                        required: true
                    },
                    quantity: {
                        type: Number,
                        default: 1,
                        min: 1
                    }
                }
            ],
            default: []
        }
    },
    {
        timestamps: true
    }
);

const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;