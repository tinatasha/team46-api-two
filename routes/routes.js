const express = require("express");
const router = express.Router();

//connect all user routes to server
const userRoutes = require("../User/userRoutes");
router.use("/users", userRoutes);

//connect all shelving routes to server
const shelvingRoutes = require("../Shelving/shelvingRoutes");
router.use("/shelf", shelvingRoutes);

//connect all store routes to server
const storeRoutes = require("../Store/storeRoutes");
router.use("/store", storeRoutes);

//connect all order routes to server
const orderRoutes = require("../Order/orderRoutes");
router.use("/orders", orderRoutes);

//connect all delivery routes
const deliveryRoutes = require("../Delivery/deliveryRoutes");
router.use("/deliveries", deliveryRoutes);

//connect all Sales Data routes (reportin)
const salesDataRoutes = require("../salesData/salesDataRoutes");
router.use("/salesdata", salesDataRoutes);

//connect all leaderboard routes
const leaderboardRoutes = require("../Leaderboard/leaderboardRoutes");
router.use("/leaderboard", leaderboardRoutes);



module.exports = router;
