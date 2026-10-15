const express = require("express");

const {
    registerCustomer,
    loginCustomer,
    getProfile,
    logoutCustomer,
    changePassword
} = require("../controllers/customer.controller");

const protect = require("../middlewares/auth.middleware");

const router = express.Router();

// not protected since user isn't logged in yet
router.post("/register", registerCustomer);
router.post("/login", loginCustomer);

// protect middleware in both the next routes
router.get("/me", protect, getProfile);
router.post("/logout", protect, logoutCustomer);    // can also make this not protected by just clearing the cookie, but the lab requires protection for this route


router.patch("/change-password", protect, changePassword);

module.exports = router;