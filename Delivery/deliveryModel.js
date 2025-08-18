const db = require("../database/db");
const { getUnassignedApprovedOrders } = require("../Order/orderModel");
const { getUsersByRole } = require("../User/userModel");
const { populateSalesData } = require("../salesData/salesDataModel");
const { DemeritMap } = require("../Metadata/demeritThreshold");
const geolib = require("geolib");

const jwt = require("jsonwebtoken");

class DeliveryService {
  async ShowOverdueDeliveries(driverId) {
    try {
      const deliveries = await db.Deliveries.findAll({
        where: {
          Driver_Id: driverId,
          //Status: "In Transit"
        },
        attributes: { exclude: [] },
        include: [
          {
            model: db.Orders,
            as: "Order",
            attributes: { exclude: [] },
            include: [{
              model: db.Stores,
              as: "Store_Ordering",
              attributes: { exclude: [] }
            },
            {
              model: db.Products,
              attributes: { exclude: [] },
              through: { attributes: [] }
            }]
          },
        ],
      });

      if (!deliveries || deliveries.length === 0) {
        console.log("Delivery not found");
        return [];
      }


      function dayDiff(date1, date2) {
        const msPerDay = 24 * 60 * 60 * 1000;
        return Math.floor((date1 - date2) / msPerDay);
      }


      console.log(`Deliveries found: ${deliveries.length}`);
      const overdueDeliveries = [];

      for (const delivery of deliveries) {
        console.log(`Delivery ${delivery.Id} status: ${delivery.Status}`);

        if (delivery.Order) {
    console.log(`Order due date: ${delivery.Order.Due_Date}`);
  }
        const order = delivery.Order;

        if (!order) {
          continue;
        }

        const dueDate = new Date(order.Due_Date);
        const today = new Date();
        const daysPastDue = dayDiff(today, dueDate);

        console.log(`Driver ${driverId} delivery ${delivery.Id} daysPastDue: ${daysPastDue}`);

        if (daysPastDue > 0) {
          overdueDeliveries.push({
            ...delivery.toJSON(),
            overdue: true,
            daysPastDue,
            overdueMsg: daysPastDue + " days"

          });
        }
      }

      console.log("Overdue deliveries to return:", overdueDeliveries.map(d => ({
  id: d.Id,
  daysPastDue: d.daysPastDue
})));
      return overdueDeliveries;

      // const order = delivery.Order;
      // //console.log(order);

      // if (!order) {
      //   console.log("Order for delivery not found");

      // }

      // if (!delivery.Driver_Id) {
      //   console.log("Order has not been assigned");
      // }

      // //const placementDate = new Date(order.Placement_Date);
      // const dueDate = new Date(order.Due_Date);
      // const today = new Date();



      // //Check dueDate
      // //const dueDateDiff = dayDiff(placementDate, dueDate);
      // const daysPastDue = dayDiff(today, dueDate);
      // console.log("Days past Due", daysPastDue);
      // console.log("Today: ", today);
      // console.log("Expected due date: ", dueDate);
      // //console.log("Today ", todayDiff);

      // if (daysPastDue > 1) {
      //   return {
      //     overdue: true,
      //     message: "Delivery is overdue",
      //   };
      // } else {
      //   return {
      //     overdue: false,
      //     message: "Delivery is not overdue",
      //   };
      // }
    } catch (err) {
      console.log("Error checking overdue status: ", err);
      return [];
    }
  }

  async getDeliveriesByStatusAndRegion(status, region) {
    try {
      if (!status || !region) {
        throw new Error("Both status and region parameters are required");
      }

      if (!["Pending", "In Transit", "Delivered"].includes(status)) {
        throw new Error("Invalid Status Value");
      }

      return await db.Deliveries.findAll({
        where: { Status: status },
        include: [
          {
            model: db.Orders,
            as: "Order",
            required: true,
            include: [
              {
                model: db.Stores,
                as: "Store_Ordering",
                where: { region },
                required: true,
              },
              {
                model: db.Users,
                as: "Driver",
                attributes: ["User_FullName", "User_Telephone"],
              },
            ],
          },
        ],
        order: [["DeliveredDate", "DESC"]],
      });
    } catch (error) {
      console.error("Error in getDeliveriesByStatusAndRegion: ", error);
      throw error;
    }
  }

  async getRegionalDeliveries(regionName, status) {
    try {
      const regionalDeliveries = await db.Deliveries.findAll({
        where: {
          status: status,
        },
        required: true,
        include: [
          {
            model: db.Orders,
            as: "Order",
            include: [
              {
                model: db.Stores,
                as: "Store_Ordering",
                where: {
                  region: regionName,
                },
                required: true,
              },
            ],
            required: true,
          },
        ],
        raw: true,
        nest: true,
      });

      return regionalDeliveries;
    } catch (error) {
      console.log("Error retrieving region specific deliveries");
      throw error;
    }
  }

  async getDriverDeliveryCount(driverId) {
    try {
      const numDeliveries = await db.Deliveries.count({
        where: {
          Driver_Id: driverId,
          Status: "In Transit",
        },
      });
      return numDeliveries;
    } catch (error) {
      console.error(
        `ERROR in getDriverDeliveryCount for driver ${driverId}:`,
        error`  `
      );
      throw error;
    }
  }

  async assignDelivery() {
    try {
      const unassignedApprovedOrders = await getUnassignedApprovedOrders();

      const allDrivers = await getUsersByRole("Driver");

      const allUpdatedOrders = [];

      for (const order of unassignedApprovedOrders) {
        const store = await db.Stores.findByPk(order.Store_Id, {
          attributes: ["Region"],
        });

        if (!store || !store.Region) {
          console.log(`Order ${order.Id} doesn't have store or region`);
          continue;
        }

        const storeRegion = store.Region;

        const regionalDrivers = allDrivers.filter(
          (driver) => driver.User_Region === storeRegion
        );

        let driverWithLeastDeliveries = null;
        let minDeliveries = Infinity;

        for (const regionalDriver of regionalDrivers) {
          //console.log("Regional Driver Id: ", regionalDriver.Id);
          const currentDriverDeliveries = await this.getDriverDeliveryCount(
            regionalDriver.Id
          );

          if (currentDriverDeliveries < minDeliveries) {
            minDeliveries = currentDriverDeliveries;
            driverWithLeastDeliveries = regionalDriver.Id;
          }
        }

        if (driverWithLeastDeliveries !== null) {
          try {
            await db.Deliveries.findOrCreate({
              where: { Order_Id: order.Id },
              defaults: {
                Order_Id: order.Id,
                Status: "Pending",
              },
            });
            //console.log("Before update - Order ID: " + order.Id + ", Status: " + deliveryBefore.Status + ", Driver_Id: " + deliveryBefore.Driver_Id);

            const [updatedRows, updatedOrders] = await db.Deliveries.update(
              {
                Driver_Id: driverWithLeastDeliveries,
                Status: "In Transit",
              },
              {
                where: {
                  Order_Id: order.Id,
                  Status: "Pending",
                },
                returning: true,
              }
            );

            if (updatedRows > 0) {
              // console.log(`===========================================================================================`);
              // console.log(`SUCCESS: Order ID ${order.Id} successfully updated to 'In Transit' and assigned to driver ${driverWithLeastDeliveries}.`);
              // console.log(`===========================================================================================`);

              for (const updatedOrder of updatedOrders) {
                allUpdatedOrders.push(updatedOrder);
              }
            }
          } catch (error) {
            console.log("Error allocating deliveries: ", error);
          }
        }
      }

      console.log("--- Delivery Assignment Process Completed ---");
      return allUpdatedOrders;
    } catch (error) {
      console.error("Error during delivery assignment: ", error);
      throw error;
    }
  }

  async showAllocatedDeliveries(driverId) {
    try {
      //console.log(`Fetching deliveries for driverId: "${driverId}"`);

      const allocatedDeliveries = await db.Deliveries.findAll({
        where: {
          Driver_Id: driverId,
          Status: "In Transit",
        },
        attributes: { exclude: [] },
        include: [
          {
            model: db.Orders,
            as: "Order",
            attributes: { exclude: [] },
            include: [
              {
                model: db.Stores,
                as: "Store_Ordering",
                attributes: { exclude: [] },
              },
              {
                model: db.Products,
                attributes: { exclude: [] },
                through: { attributes: [] },
              },
            ],
          },
        ],
      });
      //console.log("Deliveries found:", allocatedDeliveries.length);
      return allocatedDeliveries;
    } catch (error) {
      console.error(
        `Error fetching pending deliveries for driver ${driverId}:`,
        error
      );
      return [];
    }
  }

  async showCompletedDeliveries(driverId) {
    try {
      //console.log(`Fetching deliveries for driverId: "${driverId}"`);

      const completedDeliveries = await db.Deliveries.findAll({
        where: {
          Driver_Id: driverId,
          Status: "Delivered",
        },
        attributes: { exclude: [] },
        include: [
          {
            model: db.Orders,
            as: "Order",
            attributes: { exclude: [] },
            include: [
              {
                model: db.Stores,
                as: "Store_Ordering",
                attributes: { exclude: [] },
              },
              {
                model: db.Products,
                attributes: { exclude: [] },
                through: { attributes: [] },
              },
            ],
          },
        ],
      });
      //console.log("Deliveries found:", allocatedDeliveries.length);
      return completedDeliveries;
    } catch (error) {
      console.error(
        `Error fetching pending deliveries for driver ${driverId}:`,
        error
      );
      return [];
    }
  }

  async confirmDelivery(
    driverId,
    deliveryId,
    recipName,
    recipSignature,
    recipLat,
    recipLong,
    //rating,
    reason,
    //status
    trans

  ) {

    
    try {
      const delivery = await db.Deliveries.findOne({
        where: {
          Id: deliveryId,
          Driver_Id: driverId,
          Status: "In Transit",
        },
        include: {
          model: db.Orders,
          as: "Order",
          attributes: ["Id", "Store_Id"],
          include: {
            model: db.Stores,
            as: "Store_Ordering",
            attributes: ["Latitude", "Longitude"],
          },
        },
        transaction: trans,
      });

      if (!delivery) {
        console.error(
          `Delivery not found for deliveryID ${deliveryId} and driverID ${driverId} `
        );
        throw new Error("Delivery not found");
      }

      //const store = delivery.Order.Store_Ordering;

      //delivery.Status = status;

      delivery.RecipientLatitude = recipLat || null;
      delivery.RecipientLongitude = recipLong || null;
      delivery.RecipientName = recipName || null;
      delivery.RecipientSignature = recipSignature || null;

      if (reason && reason.trim() !== "") {
        delivery.Reason = reason;
        delivery.Status = "Rejected";
        await this.#applyDemerit(delivery, delivery.Order.Store_Id, trans);
      } else {
        delivery.Reason = null;
        delivery.Status = "Delivered";
        //delivery.Rating = rating;
      }

      if (delivery.Status === "Delivered" || delivery.Status === "Rejected") {
        delivery.DeliveredDate = new Date();
      } else {
        delivery.DeliveredDate = null;

      }


      await delivery.save({transaction: trans});

      if (delivery.Status === "Delivered") {
        try {
          populateSalesData(delivery.Id);
        } catch (err) {
          console.log(
            "Error populating sales data from delivery confirmation ",
            err
          );
          throw new Error("failure to populate sales data and leaderboard");
        }

        return delivery;
      }
    } catch (error) {
      console.error(`Error confirming/rejecting delivery: `, error);
      throw error;
    }
  }

  async #applyDemerit(delivery, StoreId, trans) {
    try {
      const standing = await db.StoreStandings.findOne({
        where: { Store_Id: StoreId },
        transaction: trans,
      });

      if (!standing) {
        throw new Error("No Store Standing Found for provided store");
      }

      const demerit = await db.Demerits.findOne({
        where: { Store_Standing_Id: standing.Id },
        transaction: trans,
      });

      if (!demerit) {
        throw new Error("No Demerit Found for provided store");
      }

      //save called outside the block where this is called so we can proceed without worry
      delivery.Demerit_Id = demerit.Id;

      await demerit.increment("Points", { by: 1, transaction: trans });
      await demerit.reload();

      if (DemeritMap.has(demerit.Points)) {
        standing.Standing = DemeritMap.get(demerit.Points);
        await standing.save({ transaction: trans });
      }

      //follow up by incrementing the rejected delivery
    } catch (error) {
      console.error(error);
      throw new Error("Failed to apply demerits");
    }
  }
}
module.exports = new DeliveryService();
