const { Literal } = require("sequelize/lib/utils");
const db = require("../database/db");

const { Op } = require("sequelize");
const { attributes } = require("../database/Models/user");
class OrderService {
  async getOrderDetails(orderId) {
    const order = await db.Orders.findOne({
      where: {
        Id: orderId,
      },
      include: [
        {
          model: db.Products,
          through: {
            attributes: ["Quantity", "UnitCost", "GrossCost"],
          },
          attributes: ["Id", "Name", "Price", "Description"],
        },
      ],
    });

    return order;
  }

  async updateOrderStatus(orderId, status, reasons, managerId) {
    return await db.Orders.update(
      {
        Status: status,
        Reason: reasons,
        Modified_At: new Date(),
        Modified_By: managerId,
        Previous_Status: db.sequelize.literal("`Status"),
      },
      {
        where: { Id: orderId },
        returning: true,
        plain: true,
      }
    );
  }
  async retrieveRejectedCount(managerId) {
    const rejectedCount = await db.Orders.count({
      where: { Status: "Rejected" },
      include: [
        {
          model: db.Stores,
          as: "Store_Ordering",
          required: true,
          where: { Manager_Id: managerId },
        },
      ],
      attributes: [],
    });
    return rejectedCount;
  }

  async retrieveOverdueCount(managerId) {
    const overdueCount = await db.Orders.count({
      where: {
        Status: "Approved",
        Due_Date: {
          [Op.lt]: new Date(), //check for case due date is before today
        }, //no idea if lt will work for this
      },
      include: [
        {
          model: db.Stores,
          as: "Store_Ordering",
          required: true,
          where: { Manager_Id: managerId },
        },
      ],
      attributes: [],
    });
    return overdueCount;
  }

  async retrieveOverdueOrders(managerId) {
    const overdueOrders = await db.Orders.findAll({
      where: {
        Status: "Approved",
        Due_Date: {
          [Op.lt]: new Date(), //check for case due date is before today
        },
      },
      include: [
        {
          model: db.Stores,
          as: "Store_Ordering",
          required: true,
          where: { Manager_Id: managerId },
          attributes: ["Id", "Name"],
        },
      ],
    });
    return overdueOrders;
  }

  async getUnassignedApprovedOrders() {
    const orders = await db.Orders.findAll({
      where: {
        Status: "Approved",
        RequiresReview: false, //IF it needs a review dont assign it to a delivery
      },
      include: [
        {
          model: db.Deliveries,
          as: "Delivery",
          where: {
            Driver_Id: null,
          },
          required: false,
        },
      ],
    });
    console.log("Unassigned approved orders count:", orders.length);
    orders.forEach((order) => {
      console.log(
        `Order ID: ${order.Id}, Delivery ID: ${order.Delivery?.Id}, Driver_Id: ${order.Delivery?.Driver_Id}`
      );
    });
    return orders;
  }
  async getAllOrdersFiltered(
    userRegion,
    searchPhrase,
    limit,
    offset,
    filter,
    startDate,
    endDate
  ) {
    const where = { RequiresReview: false };

    if (filter !== "All") {
      if (filter === "Approved") {
        where.Status = "Approved";
      } else if (filter === "Rejected") {
        where.Status = "Rejected";
      }
    }

    if (searchPhrase) {
      where.ExternalOrderNo = { [Op.like]: `%${searchPhrase}%` };
    }

    if (startDate && endDate) {
      where.Placement_Date = { [Op.between]: [startDate, endDate] };
    }

    try {
      const orders = await db.Orders.findAndCountAll({
        where,
        include: [
          {
            model: db.Stores,
            as: "Store_Ordering",
            attributes: ["Name"],
            where: { Region: userRegion },
          },
          {
            model: db.Products,
            through: {
              model: db.OrderProducts,
              attributes: ["Quantity", "GrossCost"],
            },
          },
          {
            model: db.Deliveries,
            attributes: ["Status"],
            as: "Delivery",
            required: false,
          },
        ],
        order: [["Placement_Date", "ASC"]],
        limit: limit,
        offset: offset,
        distinct: true, //prevents double counting of repeated join records
      });
      return orders;
    } catch (error) {
      console.error("Couldnt Get Orders:", error);
      throw new Error("Couldnt get orders");
    }
  }

  async getModifiedOrders(
    region,
    offset,
    limit,
    startDate,
    endDate,
    searchParam
  ) {
    const include = [
      {
        model: db.Stores,
        as: "Store_Ordering",
        attributes: ["Name", "Size"],
        where: { Region: region },
        required: true,
      },
    ];
    const where = { Modified_At: { [Op.ne]: null } };

    if (searchParam) {
      where.ExternalOrderNo = { [Op.like]: `%${searchParam}%` };
    }

    if (startDate && endDate) {
      where.Placement_Date = { [Op.between]: [startDate, endDate] };
    }

    try {
      const orders = await db.Orders.findAndCountAll({
        where,
        include,
        order: [["Placement_Date", "DESC"]],
        attributes: [
          "Id",
          "Placement_Date",
          "Due_Date",
          "Status",
          "ExternalOrderNo",
          "Modified_At",
          "Reason",
        ],
      });
      return orders;
    } catch (error) {
      console.error(error);
      throw new Error("Failure in retrieving modified errors");
    }
  }
  async getManualApprovalOrders(region, offset, limit, searchPharase) {
    const where = { Region: region };

    if (searchPharase) {
      where.Name = searchPharase;
    }

    try {
      const orders = await db.Orders.findAndCountAll({
        where: { RequiresReview: true },
        include: [
          {
            model: db.Stores,
            as: "Store_Ordering",
            attributes: ["Name", "Size", "Id"],
            where,
            required: true,
            include: [
              {
                model: db.StoreStandings,
                as: "Standing",
                attributes: ["Standing"],
              },
            ],
          },
        ],
        attributes: ["Id", "Placement_Date", "Due_Date", "ExternalOrderNo"],
        offset,
        limit,
      });

      return orders;
    } catch (error) {
      console.error(error);
      throw new Error("Failure to get orders needing manual approval");
    }
  }

  //Update automatically rejected orders (those which have stores that may be high risks or blacklisted)
  async updateAutoRejectedOrder(orderId, managerId, reviewDate, trans) {
    try {
      const order = await db.Orders.findByPk(orderId, {
        transaction: trans,
      });

      await order.update(
        {
          RequiresReview: false,
          Reviewed_By: managerId,
          Review_Date: reviewDate,
        },
        { transaction: trans }
      );

      return true;
    } catch (error) {
      console.error(error);

      throw new Error("Unable to Update order");
    }
  }
}
module.exports = new OrderService();
