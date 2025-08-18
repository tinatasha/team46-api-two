const storeModel = require("./storeModel");
const StoreService = require("./storeModel");

exports.getAllStores = async (req, res) => {
  try {
    const stores = await StoreService.getAllStores();
    return res.status(200).json({ success: true, stores });
  } catch (error) {
    console.error("Error in getAllStores:", error);
    return res
      .status(500)
      .json({ success: false, message: "error retrieving stores" });
  }
};
exports.getStoreDetails = async (req, res) => {
  const { storeId } = req.body;

  if (!storeId) {
    return res.status(404).json({
      message: "Store Id not provided",
    });
  }

  try {
    const storeDetails = await StoreService.getStoreDetails(storeId);
    return res.status(200).json({
      success: true,
      storeDetails,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error retrieving store details",
    });
  }
};

exports.createStore = async (req, res) => {
  const {
    storeName,
    size,
    region,
    area,
    postcode,
    road,
    additionalAddressInfo,
    latitude,
    longitude,
  } = req.body;

  try {
    const newStore = await StoreService.createStore(req.body);
    return res.status(200).json({
      success: true,
      newStore: newStore,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getSalesRepStores = async (req, res) => {
  const repID = req.query.RepId;

  if (!repID) {
    return res.status(400).json({ success: false, error: "Missing userId" });
  }

  try {
    const stores = await StoreService.getSalesRepStores(repID);

    return res.status(200).json({
      success: true,
      RetStores: stores,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getManagerStores = async (req, res) => {
  const manID = req.query.ManagerId;

  console.log(req.query);
  if (!manID) {
    return res.status(400).json({ success: false, error: "Missing userId" });
  }

  try {
    const stores = await StoreService.getManagerStores(manID);

    console.log(stores);
    return res.status(200).json({
      success: true,
      RetStores: stores,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getAvailableStores = async (req, res) => {
  const { region, managerId } = req.query;

  if (!region || !managerId) {
    res
      .status(400)
      .json({ success: false, message: "Some fields are missing" });
    return;
  }

  try {
    const stores = await storeModel.getAvailableStores(region, managerId);

    if (!stores) {
      res
        .status(400)
        .Json({ success: false, message: "No stores could be retrieved" });
      return;
    }

    const objStores = stores.map((store) => store.toJSON());

    res.status(200).json({ success: true, stores: objStores });
    return;
  } catch (error) {
    console.log("error retrieving stores error:" + error);

    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
const sequelize = require("sequelize");

exports.getStoresBySalesRep = async (req, res, next) => {
  const repId = req.userId;

  if (!repId) {
    const error = new Error("No user Id found");
    error.statusCode = 500;
    next(error);
  }

  try {
    console.log("I got here to store routes");
    const stores = await StoreService.getSalesRepStores(repId);
    res.status(200).json({ stores: stores });
  } catch (err) {
    next(err);
  }
};

exports.getStoreStandings = async (req, res) => {
  const region = req.query.region;
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  let filter = req.query.filter || "A"; //A  for all ,R for Risky  ,VR for Very Risk ,HR for high risk
  const searchPhrase = req.query.searchPhrase || "";

  if (!region) {
    res.status(400).json({ success: false, message: "Missing Region" });
    return;
  }
  console.log("sear", searchPhrase);
  const filterArr = [];
  if (filter === "A") {
    filterArr.push("Good", "Partial Risk", "High Risk", "BlackListed");
  }

  if (filter === "G") {
    filterArr.push("Good");
  }

  if (filter === "R") {
    filterArr.push("Partial Risk", "High Risk", "BlackListed");
  }

  if (filter === "VR") {
    filterArr.push("High Risk", "BlackListed");
  }
  try {
    const offset = (page - 1) * limit;

    console.log("Fil arr", filterArr);
    const { count, rows } = await storeModel.getStoreStandings(
      region,
      limit,
      offset,
      filterArr,
      searchPhrase
    );
    console.log(`Count for ${region} is  ${count}`);

    const returnObj = rows.map((Standing) => ({
      storeName: Standing.Name,
      storeId: Standing.Id,
      storeStanding: Standing?.Standing?.Standing,
      storeDemeritsPoints: Standing?.Standing?.Demerit?.Points,
      demeritUpdateDT: Standing?.Standing?.Demerit?.updatedAt,
    }));
    res
      .status(200)
      .json({ success: true, standings: returnObj, storeStandTotal: count });
    return;
  } catch (error) {
    console.error("oops we failed", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
