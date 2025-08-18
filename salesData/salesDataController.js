const SalesDataService = require("./salesDataModel");
const { MonthlyMap } = require("../Metadata/MonthMap");
const { regionalMap } = require("../Metadata/regions");
const salesDataModel = require("./salesDataModel");

exports.getYearOnYearSalesData = async (req, res) => {
  const { region } = req.query; //extract manager id from params

  if (!region) {
    res
      .status(400)
      .json({ success: false, message: "Some fields are missing" });
    return;
  }

  try {
    const stores = await SalesDataService.getStores(region);

    const StoreIds = stores.map((store) => store.Id);
    const currentYear = new Date().getFullYear();
    const prevYear = new Date().getFullYear() - 1;
    const currentYearSD = await SalesDataService.getStoreMonthlyData(
      currentYear,
      StoreIds
    );
    const prevYearSD = await SalesDataService.getStoreMonthlyData(
      prevYear,
      StoreIds
    );

    const dataMap = new Map();

    const currentYearDataCleaned = currentYearSD.map((SD) =>
      dataMap.set(SD.month, {
        month: SD.month,
        curryear: SD["Total Sales"],
        prevyear: 0,
      })
    );

    for (const item of prevYearSD) {
      if (dataMap.has(item.month)) {
        const dataObj = dataMap.get(item.month);

        dataObj.prevyear = item["Total Sales"];

        dataMap.set(item.month, dataObj);
      } else {
        dataMap.set(item.month, {
          month: item.month,
          curryear: 0,
          prevyear: item["Total Sales"],
        });
      }
    }
    const arr = [];

    dataMap.forEach((val, key) => arr.push(val));

    res.status(200).json({
      success: true,
      salesData: arr,
      currentYear: currentYear,
      previousYear: prevYear,
    });
    return;
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error:" });
  }
};
exports.getYearVsYearProductData = async (req, res) => {
  const { managerId, region } = req.query; //extract manager id from params

  if (!managerId || !region) {
    res
      .status(400)
      .json({ success: false, message: "Some fields are missing" });
    return;
  }

  try {
    const storeIds = await SalesDataService.getStores(managerId, region);

    const StoreIds = storeIds.map((store) => store.Id);
    const currentYear = new Date().getFullYear();
    const prevYear = new Date().getFullYear() - 1;

    const currentYearProducts = await SalesDataService.getProductMonthlyData(
      currentYear,
      StoreIds
    );
    const previousYearProducts = await SalesDataService.getProductMonthlyData(
      prevYear,
      StoreIds
    );

    const currProdsCleaned = currentYearProducts.map((prod) => ({
      month: prod.month,
      dataPoint: prod.Total_Product_Sales,
      Year: currentYear,
      name: prod["Product.Name"],
    }));

    const prevProdsCleaned = previousYearProducts.map((prod) => ({
      month: prod.month,
      dataPoint: prod.Total_Product_Sales,
      Year: prevYear,
      name: prod["Product.Name"],
    }));

    res.status(200).json({
      success: true,
      currentPD: currProdsCleaned,
      previousPD: prevProdsCleaned,
    });
    return;
  } catch (error) {
    console.log("Error getting data ERROR:", error);
    res
      .status(500)
      .json({ success: false, message: "Error getting data", error: error });
  }
};

exports.getProductTableData = async (req, res) => {
  //get page and limit as well as managerId and region

  const region = req.query.region;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  let sortField = req.query.field;
  const direction = req.query.direction;

  if (!region) {
    console.log("region:", region);
    res.status(500).json({ success: false, message: "Missing Key Details" });
    return;
  }
  console.log(req.query);
  //Get the Product records here in order selected by Frontend
  try {
    const stores = await SalesDataService.getStores(region);

    if (stores.length == 0) {
      console.log("here", stores);
      res
        .status(200)
        .json({ success: false, message: "No Stores in this Region" });
      return;
    }

    const StoreIds = stores.map((store) => store.Id);
    const currentYear = new Date().getFullYear();
    const prevYear = new Date().getFullYear() - 1;

    const offset = (page - 1) * limit;

    if (sortField === "PC") {
      sortField = "Total_Product_Sales";
    } else if (sortField === "PQ") {
      sortField = "Total_Product_Quantity";
    }

    const currYearsData = await SalesDataService.getProdutYearlyData(
      currentYear,
      StoreIds,
      offset,
      limit,
      sortField,
      direction
    );

    const prevYearsData = await SalesDataService.getProdutYearlyData(
      prevYear,
      StoreIds,
      offset,
      limit,
      sortField,
      direction
    );

    //Get the rankings of products in the current year based on what we focussing on
    const ProductRanks = await SalesDataService.getProductRanks(
      currentYear,
      sortField,
      direction,
      StoreIds
    );

    const prodRankMap = new Map();

    ProductRanks.forEach((PR) =>
      prodRankMap.set(PR.Product_Id, PR.ProductRank)
    );

    //Create two maps to match current years to previous years
    //In this way can show new products in current year that perform well even if they dont exist in previous year
    const currentYearMap = new Map();
    const previousYearMap = new Map();

    currYearsData.forEach((CYD) => currentYearMap.set(CYD.Product_Id, CYD));
    prevYearsData.forEach((PYD) => previousYearMap.set(PYD.Product_Id, PYD));

    let mergedProductRecords = [];
    let checkedIds = {};

    //WE only include rank details for this year because prev year is not relevant

    currentYearMap.forEach((CYD, ProdID) => {
      const PrevYearData = previousYearMap.get(ProdID);

      mergedProductRecords.push({
        prodId: ProdID,
        currentYear: currentYear,
        previousYear: prevYear,
        currYearSalesVal: CYD.Total_Product_Sales,
        prevYearSalesVal: PrevYearData?.Total_Product_Sales || 0,
        currYearSalesQuant: CYD.Total_Product_Quantity,
        prevYearSalesQuant: PrevYearData?.Total_Product_Quantity || 0,
        prodName: (CYD || PrevYearData)?.["Product.Name"] || "Unknown",
        prodRank: prodRankMap.get(ProdID),
      });
      checkedIds[ProdID] = true;
    });

    previousYearMap.forEach((PYD, ProdID) => {
      if (!checkedIds[ProdID]) {
        mergedProductRecords.push({
          prodId: ProdID,
          currentYear: prevYear,
          currYearSalesVal: PYD.Total_Product_Sales,
          currYearSalesQuant: PYD.Total_Product_Quantity,
          prodName: PYD?.["Product.Name"] || "Unknown",
        });
      }
    });
    console.log("Prods", mergedProductRecords);
    res.status(200).json({
      success: true,
      dataRecords: mergedProductRecords,
      totalRecords: ProductRanks.length,
    });
    return;
  } catch (error) {
    console.error("Error Occuered:", error);
    res.status(500).json({
      success: false,
      message: "Internal SErver error try again later",
    });
    return;
  }
};

exports.getProductData = async (req, res) => {
  const prodId = req.params.prodId;
  const region = req.params.region;
  const type = req.query.type || "PC";
  const startYear = req.query.startYear || new Date().getFullYear() - 1;
  const endYear = req.query.endYear || new Date().getFullYear();

  const stores = await SalesDataService.getStores(region);

  console.log("stores", stores);
  const StoreIds = stores.map((store) => store.Id);
  if (!prodId || !region || !type) {
    res.status(400).json({ success: false, message: "Key Fields Missing" });
    return;
  }

  try {
    console.log("IDs:", StoreIds);
    console.log("prod:", prodId);
    console.log("start", startYear);

    const startDataMap = new Map();
    const endDataMap = new Map();

    const objArray = [];

    const startData = await SalesDataService.getProductDetails(
      startYear,
      StoreIds,
      prodId,
      type
    );
    const endData = await SalesDataService.getProductDetails(
      endYear,
      StoreIds,
      prodId,
      type
    );

    for (const monthItem of startData) {
      startDataMap.set(monthItem.month, monthItem.Total);
    }

    for (const monthItem of endData) {
      endDataMap.set(monthItem.month, monthItem.Total);
    }

    for (const month of MonthlyMap.keys()) {
      objArray.push({
        label: MonthlyMap.get(month),
        KeyA: startDataMap.get(month) || 0,
        KeyB: endDataMap.get(month) || 0,
      });
    }

    res.status(200).json({
      success: true,
      data: objArray,
      startYear: startYear,
      endYear: endYear,
      totalRecords: objArray.length,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({ success: false, message: "Internal Server error" });
    return;
  }
};
exports.getRegionalSalesPerYear = async (req, res) => {
  const selectedYear = req.query.Year || new Date().getFullYear();
  if (!selectedYear) {
    res.status(400).json({ success: false, message: "Missing Fields Key" });
    return;
  }

  try {
    //convert the map to an array
    const regions = Array.from(regionalMap.values());

    const regionalSales = await Promise.all(
      regions.map(async (region) => {
        const total = await salesDataModel.getRegionalSales(
          region,
          selectedYear
        );

        return { region, KeyA: total.Total };
      })
    );

    console.log("regions sales:", regionalSales);
    res.status(200).json({
      success: true,
      message: "succesfully retrieved regional data",
      salesData: regionalSales,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "internal server error" });
  }
};
