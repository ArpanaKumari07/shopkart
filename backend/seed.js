require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("./models/product.model");
const dns = require("dns");

// same DNS fix as index.js, otherwise the mongodb+srv lookup fails on this network
dns.setServers([
    "8.8.8.8",
    "8.8.4.4"
]);

const sampleProducts = [
    {
        name: "Mechanical Keyboard",
        description: "RGB mechanical keyboard with blue switches.",
        price: 2999,
        category: "Electronics",
        image: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=600",
        stock: 10
    },
    {
        name: "Wireless Mouse",
        description: "Ergonomic wireless mouse with adjustable DPI.",
        price: 799,
        category: "Electronics",
        image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600",
        stock: 25
    },
    {
        name: "Noise Cancelling Headphones",
        description: "Over-ear headphones with active noise cancellation.",
        price: 5499,
        category: "Electronics",
        image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600",
        stock: 8
    },
    {
        name: "Smartphone",
        description: "6.5 inch display smartphone with 128GB storage.",
        price: 15999,
        category: "Electronics",
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600",
        stock: 12
    },
    {
        name: "Men's Casual Shirt",
        description: "Cotton casual shirt, slim fit, machine washable.",
        price: 899,
        category: "Fashion",
        image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600",
        stock: 30
    },
    {
        name: "Running Shoes",
        description: "Lightweight running shoes with breathable mesh.",
        price: 2499,
        category: "Fashion",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
        stock: 20
    },
    {
        name: "The Pragmatic Programmer",
        description: "A classic book on software craftsmanship.",
        price: 649,
        category: "Books",
        image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600",
        stock: 15
    },
    {
        name: "Atomic Habits",
        description: "A guide to building good habits and breaking bad ones.",
        price: 399,
        category: "Books",
        image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600",
        stock: 40
    },
    {
        name: "Table Lamp",
        description: "Minimalist LED table lamp with touch control.",
        price: 1299,
        category: "Home",
        image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600",
        stock: 18
    },
    {
        name: "Non-stick Cookware Set",
        description: "5-piece non-stick cookware set for everyday cooking.",
        price: 3499,
        category: "Home",
        image: "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=600",
        stock: 6
    }
];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");

        await Product.deleteMany({});
        console.log("Existing products cleared");

        const created = await Product.insertMany(sampleProducts);
        console.log(`Inserted ${created.length} sample products`);

        await mongoose.disconnect();
        process.exit(0);
    }
    catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seed();
