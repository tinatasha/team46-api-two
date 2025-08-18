const db = require("../database/db");
const { Op, fn, col, QueryTypes } = require("sequelize");
const { salesPointMeta } = require("../Metadata/pointMultiplier");
const { findOrCreateBoard } = require("../Leaderboard/leaderboardModel");
const { sequelize } = require("../database/Models/user");

class SalesDataService {
  async populateSalesData(deliveryId) {
    try {
      const delivery = await db.Deliveries.findOne({
        where: { Id: deliveryId },
        include: {
          model: db.Orders,
          as: "Order",
          include: [
            {
              model: db.Stores,
              as: "Store_Ordering",
              attributes: ["Id"],
            },
            {
              model: db.Products,
              as: "Products",
              through: {
                attributes: ["Quantity", "GrossCost", "ProdId"],
                model: db.OrderProducts,
              },
            },
          ],
        },
      });

      if (!delivery) {
        console.log("Delivery not found");
      }

      const order = delivery.Order;
      const storeId = order.Store_Ordering.Id;

      const deliveredDate = delivery.DeliveredDate;
      const year = deliveredDate.getFullYear();
      const month = deliveredDate.getMonth() + 1;

      const store = await db.Stores.findOne({
        where: { Id: storeId },
        attributes: ["Size"],
        raw: true,
      });

      console.log("Products on order:", order.Products);
      const board = await findOrCreateBoard(storeId);

      let Mult;

      console.log(store.Size);
      if (store.Size === "Large") {
        Mult = salesPointMeta.LARGE;
      }
      if (store.Size === "Medium") {
        Mult = salesPointMeta.MEDIUM;
      }
      if (store.Size === "Small") {
        Mult = salesPointMeta.SMALL;
      }
      let calcXp = 0;

      for (const product of order.Products) {
        const item = product.OrderProducts;

        //console.log("Product", product.Id, "through:", product.through);

        const sd = await db.SalesData.create({
          year,
          month,
          product_quantity: item.Quantity,
          total_product_cost: item.GrossCost,
          Product_Id: product.Id,
          Store_Id: storeId,
        });

        const totalXpSale = sd.total_product_cost * Mult;

        calcXp += totalXpSale;
      }
      await board.increment({ Sales_Score: calcXp });
      await board.reload();

      console.log("XP:" + board.Sales_Score);
    } catch (err) {
      console.log("Error populating salees data: ", err);
    }
  }

  async getStores(region) {
    try {
      const stores = await db.Stores.findAll({
        where: {
          Region: region,
        },
        attributes: ["Id", "Name"],
      });

      return stores;
    } catch (error) {
      throw new Error("Couldnt Retrieve Stores due to Error:" + error);
    }
  }

  async getStoreMonthlyData(Year, storeIds) {
    try {
      const MonthlySalesData = await db.SalesData.findAll({
        where: {
          Store_Id: { [Op.in]: storeIds },
          year: Year,
        },
        attributes: [
          "month",
          [
            db.sequelize.fn("SUM", db.sequelize.col("total_product_cost")),
            "Total Sales",
          ],
        ],
        group: ["month"],
        order: [["month", "ASC"]],
        raw: true, // need this when you dont want the model object returned and instead want a  json object
      });

      return MonthlySalesData;
    } catch (error) {
      throw new Error("Couldnt Retrieve Sales Data due to Error:" + error);
    }
  }

  async getProdutYearlyData(
    Year,
    storeIds,
    offset,
    limit,
    sortingField,
    direction
  ) {
    try {
      const yearlyProductData = await db.SalesData.findAll({
        where: {
          Store_Id: { [Op.in]: storeIds },
          year: Year,
        },
        attributes: [
          "Product_Id",
          "year",
          [
            db.sequelize.fn("SUM", db.sequelize.col("total_product_cost")),
            "Total_Product_Sales",
          ],
          [
            db.sequelize.fn("SUM", db.sequelize.col("product_quantity")),
            "Total_Product_Quantity",
          ],
        ],
        include: [
          {
            model: db.Products,
            as: "Product",
            required: true,
            attributes: ["Name"],
          },
        ],
        group: ["Product_Id", "year", "Product.Name"],
        order: [[sequelize.literal(sortingField), direction]], //sorting field should either be quantity or cost;dorection ASC or DESC
        offset: offset,
        limit: limit,
        raw: true,
      });

      return yearlyProductData;
    } catch (error) {
      console.error(error);
      throw new Error("Error getting monthly sales Data ERROR");
    }
  }
  //NOTE THIS METHOD NEEDS TO BE UPDATED LATER TO ACCOUNT FOR ONLY COMPARING UP TO THE CURRENT MONTH We are in
  async getProductRanks(year, field, direction, storeIds) {
    try {
      //Window functions like rank dont work with aliases made in aggregates like sum so we cant pass in the aliases from outside
      //instead reassing back to the table fields
      //hacky fix try something better later
      let windowField = "";
      if (field === "Total_Product_Sales") {
        windowField = "total_product_cost";
      }

      if (field === "Total_Product_Quantity") {
        windowField = "product_quantity";
      }

      const ranks = await db.sequelize.query(
        `SELECT SD.Product_Id,
         Rank() OVER (ORDER BY SUM(SD.${windowField})  ${direction}) AS ProductRank FROM ${db.SalesData.getTableName()} As SD
         WHERE SD.year =:year AND SD.Store_id in (:storeIds)
         GROUP BY SD.Product_Id
         `,
        {
          replacements: { year: year, storeIds: storeIds },
          type: QueryTypes.SELECT,
        }
      );
      return ranks;
    } catch (error) {
      console.error("Failed to get Ranks", error);
      throw new Error("Failure getting Ranks for map creation ");
    }
  }

  async getProductDetails(year, storeIds, productId, sortType) {
    let type = "";
    if (sortType === "PC") {
      type = "total_product_cost";
    } else if (sortType === "PQ") {
      type = "product_quantity";
    }

    try {
      const productData = db.SalesData.findAll({
        where: {
          Store_Id: { [Op.in]: storeIds },
          Product_Id: productId,
          year: year,
        },
        attributes: [
          "month",
          "year",
          [db.sequelize.fn("SUM", db.sequelize.col(type)), "Total"],
        ],

        order: [["month", "ASC"]],
        group: ["month"],
        raw: true,
      });
      return productData;
    } catch (error) {
      console.error("Failure in getting sales data", error);
      throw new Error("Failure in getting product data for year given");
    }
  }

  async getRegionalSales(region, year) {
    try {
      const sales = await db.SalesData.findAll({
        where: { year: year },
        attributes: [
          [
            db.sequelize.fn("SUM", db.sequelize.col("total_product_cost")),
            "Total",
          ],
        ],
        include: {
          model: db.Stores,
          as: "Store",
          where: { Region: region },
          required: true,
          attributes: [],
        },
        raw: true,
      });
      console.log("sr", sales);
      return sales[0];
    } catch (error) {
      console.error("Failure getting regional sales", error);
      throw new Error("Failure getting regional sales");
    }
  }
}

module.exports = new SalesDataService();
