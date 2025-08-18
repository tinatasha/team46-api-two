const { isAuth } = require("../middleware/isAuth");

const express = require("express");
const router = express.Router();

const deliveryController = require("./deliveryController");
//Overdue deliveries
router.get("/overdue", isAuth, deliveryController.ShowOverdueDeliveries);

//Assign all unassigned deliveries
router.post("/assignDeliveries", deliveryController.assignDelivery);

//Penidn deliveries
router.get("/allocated", isAuth, deliveryController.showAllocatedDeliveries);

//Completed deliveires
router.get("/completed", isAuth, deliveryController.showCompletedDeliveries);

//Confirm delivery
router.post("/confirm", isAuth, deliveryController.confirmDelivery);

//Region specific deliveries
router.get("/regional", deliveryController.getRegionalDeliveries);

router.get('/by-status-region', deliveryController.getDeliveriesByStatusAndRegion);

router.get('/', deliveryController.getAllDeliveries );

router.get('/stats', deliveryController.getDeliveryStats);

module.exports = router;
