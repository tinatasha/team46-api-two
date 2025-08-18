const OrderService = require("./orderModel");
const db = require("../database/db");
const orderModel = require("./orderModel");
const deliveryModel = require("../Delivery/deliveryModel");

exports.getOrderDetails = async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(404).json({ message: "Order ID not provided" });
  }

  try {
    const orderDetails = await OrderService.getOrderDetails(orderId);
    return res.status(200).json({
      success: true,
      orderDetails,
    });
  } catch (err) {
    return res.status(500).json({ message: "Error retrieving order details" });
  }
};

exports.getOrders = async (req, res) => {
  const limit = parseInt(req.query.limit);
  const page = parseInt(req.query.currentPage);
  const userRegion = req.query.userRegion;
  const searchPhrase = req.query.searchParam || "";
  const orderType = req.query.filter;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  const dateRange = {};

  if (startDate && endDate) {
    (dateRange.startDate = new Date(startDate)),
      (dateRange.endDate = new Date(endDate));
  }
  console.log(dateRange);

  try {
    const offset = (page - 1) * limit;

    const { count, rows } = await OrderService.getAllOrdersFiltered(
      userRegion,
      searchPhrase,
      limit,
      offset,
      orderType,
      dateRange.startDate,
      dateRange.endDate
    );

    const ordersWithCost = rows.map((order) => {
      const grossCost = order.Products.reduce((acc, prod) => {
        const gross = parseFloat(prod.OrderProducts?.GrossCost || 0);
        return acc + gross;
      }, 0);
      return {
        ...order.toJSON(),
        GrossCost: grossCost.toFixed(2),
      };
    });

    res.json({
      success: true,
      Orders: ordersWithCost,
      totalOrders: count,
    });
    return;
  } catch (err) {
    console.error("Error Fetching Orders: ", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

exports.getApprovedOrders = async (req, res) => {
  try {
    const orders = await db.Orders.findAll({
      where: { Status: "Approved" },
      include: [
        {
          model: db.Stores,
          as: "Store_Ordering",
          attributes: ["Name", "Region"],
        },
        {
          model: db.Products,
          through: {
            model: db.OrderProducts,
            attributes: ["Quantity", "GrossCost"],
          },
        },
      ],
      order: [["Placement_Date", "DESC"]],
    });

    const ordersWithCost = orders.map((order) => {
      const grossCost = order.Products.reduce((acc, prod) => {
        const gross = parseFloat(prod.OrderProducts?.GrossCost || 0);
        return acc + gross;
      }, 0);
      return {
        ...order.toJSON(),
        GrossCost: grossCost.toFixed(2),
      };
    });

    res.json(ordersWithCost);
  } catch (err) {
    console.error("Error fetching approved orders: ", err);
    res.status(500).json({ error: "Failed to fetch approved orders" });
  }
};

exports.getRejectedOrders = async (req, res) => {
  try {
    const orders = await db.Orders.findAll({
      where: { Status: "Rejected" },
      include: [
        {
          model: db.Stores,
          as: "Store_Ordering",
          attributes: ["Name", "Region"],
        },
        {
          model: db.Products,
          through: {
            model: db.OrderProducts,
            attributes: ["Quantity", "GrossCost"],
          },
        },
      ],
      order: [["Placement_Date", "DESC"]],
    });

    const ordersWithCost = orders.map((order) => {
      const grossCost = order.Products.reduce((acc, prod) => {
        const gross = parseFloat(prod.OrderProducts?.GrossCost || 0);
        return acc + gross;
      }, 0);
      return {
        ...order.toJSON(),
        GrossCost: grossCost.toFixed(2),
      };
    });

    res.json(ordersWithCost);
  } catch (err) {
    console.error("Error fetching rejected orders: ", err);
    res.status(500).json({ error: "Failed to fetch rejected orders" });
  }
};

exports.getHomePageInfo = async (req, res) => {
  try {
    const Manager = req.body;

    if (!!Manager == false) {
      res.status(400).json({ message: "No manager Id was passed through" });
      return;
    }

    const rejectedCount = await OrderService.retrieveRejectedCount(
      Manager.managerId
    );
    const overdueCount = await OrderService.retrieveOverdueCount(
      Manager.managerId
    );
    const overdueOrders = await OrderService.retrieveOverdueOrders(
      Manager.managerId
    );

    const objOverdueOrders = overdueOrders.map((order) => order.toJSON());

    res.status(200).json({
      numRejected: rejectedCount,
      numOverdue: overdueCount,
      overdueOrders: objOverdueOrders,
    });
    return;
  } catch (error) {
    console.error("Error getting data", error);
    res.status(400).json({
      message: "failed to retrieve basic home page info",
      error: error,
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    /*
if(!status || !reason || !modifiedBy) {
  return res.status(400).json({ error: 'Missing required fields'})
}
    */

    const order = await db.Orders.findByPk(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    await order.update({
      Status: status,
      Reason: reason,
      Modified_At: new Date(),
      Modified_By: 0,
      Previous_Status: order.Status,
    });

    res.json({
      success: true,
      message: `Order ${status} successfully`,
      order,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};
exports.getModifiedOrders = async (req, res) => {
  const region = req.query.region;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  const searchParam = req.query.searchParam || "";
  const dateRange = {};
  if (!region) {
    res.status(400).json({ success: false, message: "Missing Region " });
    return;
  }

  if (startDate && endDate) {
    (dateRange.startDate = new Date(startDate)),
      (dateRange.endDate = new Date(endDate));
  }

  try {
    const offset = (page - 1) * limit;

    const { count, rows } = await orderModel.getModifiedOrders(
      region,
      offset,
      limit,
      dateRange.startDate,
      dateRange.endDate,
      searchParam
    );

    const ordersObj = rows.map((order) => ({
      id: order.Id,
      placeDT: order.Placement_Date,
      dueDT: order.Due_Date,
      status: order.status,
      externalNo: order.ExternalOrderNo,
      modifiedDt: order.Modified_At,
      reason: order.Reason,
      storeName: order.Store_Ordering.Name,
      storeSize: order.Store_Ordering.Size,
    }));

    res
      .status(200)
      .json({ success: true, orders: ordersObj, totalOrders: count });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "You failed" });
  }
};
exports.getManualProcessingOrders = async (req, res) => {
  const region = req.query.region;
  const searchPhrase = req.query.searchPhrase || "";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;

  //Order these by desc going from an order expiring sooner to those later

  if (!region) {
    res.status(400).json({ success: false, message: "Missing Key Field" });
  }

  console.log("page", req.query);
  const offset = (page - 1) * limit;
  try {
    const { count, rows } = await orderModel.getManualApprovalOrders(
      region,
      offset,
      limit,
      searchPhrase
    );

    const objOrders = rows.map((order) => ({
      orderId: order.Id,
      orderExternalNo: order.ExternalOrderNo,
      orderDueDT: order.Due_Date,
      orderPlaceDT: order.Placement_Date,
      storeId: order.Store_Ordering.Id,
      storeName: order.Store_Ordering.Name,
      storeSize: order.Store_Ordering.Size,
      storeStanding: order.Store_Ordering.Standing.Standing,
    }));

    res
      .status(200)
      .json({ success: true, orders: objOrders, totalOrders: count });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failure to get manual approval orders",
    });
  }
};
exports.overrideAutomaticOrderReject = async (req, res) => {
  const orderId = req.params.orderId;
  const managerId = req.params.managerId;

  if (!orderId || !managerId) {
    res.status(400).json({ success: false, message: "Missing Key Details" });
    return;
  }
  const trans = await db.sequelize.transaction();
  const reviewDate = new Date();
  try {
    const result = await orderModel.updateAutoRejectedOrder(
      orderId,
      managerId,
      reviewDate,
      trans
    );
    if (result) {
      await deliveryModel.assignDelivery(); //assign deliveries before commiting this wa this newly approved order isassigned a delivery

      await trans.commit();
      res
        .status(200)
        .json({ success: true, message: "Succesfully approved order" });
      return;
    }
    res
      .status(400)
      .json({ success: false, message: "Internal Error Try again" });
    return;
  } catch (error) {
    await trans.rollback();
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
    return;
  }
};
