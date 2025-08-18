const db = require("../database/db");
const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const DeliveryService = require("../Delivery/deliveryModel");
const StoreService = require("../Store/storeModel");

function parseDate(str) {
  const [day, month, year] = str.split("/");
  return new Date(year, month - 1, day);
}

exports.uploadCombinedOrderCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No File Uploade" });
    }

    const csvContent = req.file.buffer.toString("utf-8");
    const lines = csvContent.trim().split(/\r?\n/);

    if (lines.length < 2) {
      return res
        .status(400)
        .json({ error: "CSV file is empty or missing data" });
    }

    const header = lines[0].split("|").map((h) => h.trim());
    const dataLines = lines.slice(1);

    const ordersMap = new Map();
    for (const line of dataLines) {
      if (!line.trim()) {
        continue;
      }
      const values = line.split("|").map((v) => v.trim());
      const row = {};
      header.forEach((h, i) => {
        row[h] = values[i];
      });

      const {
        ExternalOrderNo,
        OrderDate,
        DropDate,
        StoreName,
        Region,
        ProductName,
        Quantity,
      } = row;

      console.log(
        `Parsed OrderNo=${ExternalOrderNo}, StoreName=${StoreName}, Region=${Region}`
      );

      const mapKey = `${ExternalOrderNo.trim()}-${StoreName.trim()}-${Region.trim()}`;

      if (!ordersMap.has(mapKey)) {
        ordersMap.set(mapKey, {
          ExternalOrderNo,
          OrderDate: parseDate(OrderDate),
          DropDate: parseDate(DropDate),
          StoreName,
          Region,
          products: [],
        });
      }

      ordersMap.get(mapKey).products.push({
        ProductName,
        Quantity: parseInt(Quantity, 10),
      });
    }

    for (const orderData of ordersMap.values()) {
      const store = await db.Stores.findOne({
        where: {
          [Op.and]: [
            db.sequelize.where(
              db.sequelize.fn("lower", db.sequelize.col("Name")),
              Op.eq,
              orderData.StoreName.trim().toLowerCase()
            ),
            db.sequelize.where(
              db.sequelize.fn("lower", db.sequelize.col("Region")),
              Op.eq,
              orderData.Region.trim().toLowerCase()
            ),
          ],
        },
      });

      if (!store) {
        console.warn(
          `Store not found: ${orderData.StoreName} in ${orderData.Region}`
        );
        continue;
      } else {
        console.log(
          `Store found: ${store?.dataValues.Name ?? "Unknown"} (${store.Id})`
        );
      }

      let grossTotal = 0;
      for (const prod of orderData.products) {
        const product = await db.Products.findOne({
          where: { Name: prod.ProductName },
        });
        if (product) {
          grossTotal += product.Price * prod.Quantity;
        }
      }

      console.log(
        `Order ${orderData.ExternalOrderNo} gross total: ${grossTotal}`
      );
      const status = grossTotal < 1000 ? "Rejected" : "Approved";
      let needsManaulReview = false;

      let order = await db.Orders.findOne({
        where: {
          ExternalOrderNo: orderData.ExternalOrderNo,
          Store_Id: store.Id,
        },
      });

      const storeStanding = await StoreService.getStoreStanding(store.Id);

      console.log(
        `Standing of store ${store.Name} is ${storeStanding?.Standing}`
      );
      if (
        storeStanding !== null &&
        (storeStanding.Standing === "BlackListed" ||
          storeStanding.Standing === "High Risk")
      ) {
        needsManaulReview = true; // if the store is not in good o partial risk standing it will need its orders to be manually approved before hand
      }

      //you cant set an order to be pending if its either  rejected or approved based on its gross total
      //either add another field of think of another way
      if (!order) {
        order = await db.Orders.create({
          Id: uuidv4(),
          Store_Id: store.Id,
          Placement_Date: orderData.OrderDate,
          Due_Date: orderData.DropDate,
          Status: status,
          RequiresReview: needsManaulReview,
          ExternalOrderNo: orderData.ExternalOrderNo,
          Upload_Timestamp: new Date(),
        });
        console.log(
          `Order ${order.ExternalOrderNo} created with status ${status}`
        );
      } else {
        order.Store_Id = store.Id;
        order.Placement_Date = orderData.OrderDate;
        order.Due_Date = orderData.DropDate;
        order.Status = status;
        order.RequiresReview = needsManaulReview;
        order.ExternalOrderNo = orderData.ExternalOrderNo;
        order.Upload_Timestamp = new Date();
        await order.save();
        console.log(`Order ${order.ExternalOrderNo} updated`);

        await db.OrderProducts.destroy({
          where: { OrderId: order.Id },
        });
      }
      for (const prod of orderData.products) {
        const product = await db.Products.findOne({
          where: { Name: prod.ProductName },
        });

        if (!product) {
          console.warn(`Product not found: ${prod.ProductName}`);
          continue;
        }

        await db.OrderProducts.create({
          OrderId: order.Id,
          ProdId: product.Id,
          Quantity: prod.Quantity,
          UnitCost: product.Price,
          GrossCost: (product.Price * prod.Quantity).toFixed(2),
        });
      }
    }
    //Only Approved orders get assigned as deliveries so no need to do checks in that refards
    await DeliveryService.assignDelivery();

    res.status(200).json({ message: "CSV processed successfully" });
  } catch (error) {
    console.error("Error parsing CSV", error);
    res
      .status(500)
      .json({ error: "Internal server error while processing CSV" });
  }
};
