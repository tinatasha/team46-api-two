const express = require("express");
const router = express.Router();
const isAuth = require("./../middleware/isAuth");

const storeController = require("./storeController");

//store route
router.get("/storeDetails", storeController.getStoreDetails);
router.post("/create_Store", storeController.createStore);

router.get("/view_RepStores", storeController.getSalesRepStores);

router.get("/view_ManagerStores", storeController.getManagerStores);
router.get("/view_AvailableStores", storeController.getAvailableStores);
router.get("/get_Store_Standings", storeController.getStoreStandings);

router.get(
  "/get/salesRepStores",
  isAuth.isAuth,
  storeController.getStoresBySalesRep
);

router.get("/stores/all", storeController.getAllStores);

module.exports = router;
