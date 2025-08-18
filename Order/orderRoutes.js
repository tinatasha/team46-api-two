const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const orderCsvController = require("./orderCsvController");
const orderController = require("./orderController");
const { validateOrderStatusUpdate } = require("./orderValidation");

router.post(
  "/upload-csv",
  upload.single("file"),
  orderCsvController.uploadCombinedOrderCSV
);

router.get("/home/orderinfo", orderController.getHomePageInfo);
router.get("/", orderController.getOrders);
router.get("/approved", orderController.getApprovedOrders);
router.get("/rejected", orderController.getRejectedOrders);
router.get("/orderDetails", orderController.getOrderDetails);
router.get("/modified_orders", orderController.getModifiedOrders);
router.get(
  "/manual_processing_orders",
  orderController.getManualProcessingOrders
);

router.put(
  "/Override_Auto_Rejection/:orderId/:managerId",
  orderController.overrideAutomaticOrderReject
);

router.put("/:id/status", orderController.updateOrderStatus);

module.exports = router;
