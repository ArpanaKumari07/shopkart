const Razorpay = require("razorpay");

// Razorpay TEST MODE credentials come only from backend/.env.
// The key secret never leaves the server: it is used here and for signature verification only.
let instance = null;

const isRazorpayConfigured = () =>
    Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

// created lazily: the Razorpay constructor throws without keys, and the rest of
// ShopKart (auth, products, wishlist, cart) must keep working even if they are missing
const getRazorpay = () => {
    if (!instance) {
        instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
    }

    return instance;
};

module.exports = {
    isRazorpayConfigured,
    getRazorpay
};
