const express = require("express");
const router = express.Router();
const salesDataController = require("./salesDataController");

//get performance of products in current year vs previous year
router.get(
  "/PrevYear_Vs_CurYear_Sales_Performance",
  salesDataController.getYearOnYearSalesData
);

router.get(
  "/PrevYear_Vs_CurrYear_Product_Performance",
  salesDataController.getProductTableData
);

router.get(
  "/single_product_performance/:prodId/:region",
  salesDataController.getProductData
);
router.get(
  "/region/sales_performance",
  salesDataController.getRegionalSalesPerYear
);
module.exports = router;
