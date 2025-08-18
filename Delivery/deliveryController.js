const DeliveryService = require("./deliveryModel");
const db = require("../database/db");
const { Op } = require("sequelize");

//Check overdue status
exports.ShowOverdueDeliveries = async (req, res) => {

  const driverId = req.userId;
  

  if (!driverId) {
    return res.status(400).json({
      success: false,
      error: "Missing driverId",
    });
  }


  try {


    const overdueDeliveries = await DeliveryService.ShowOverdueDeliveries(driverId);

    console.log("Raw overdue deliveries from service:", overdueDeliveries);
    const formattedOverdueDeliveries = overdueDeliveries.map((delivery) => ({
      id: delivery.Id,
      orderId: delivery.Order_Id,
      deliveredDate: delivery.DeliveredDate,
      status: delivery.Status,
      reason: delivery.Reason,
      recipientName: delivery.RecipientName,
      recipientSignature: delivery.RecipientSignature,
      recipientLatitude: delivery.RecipientLatitude,
      recipientLongitude: delivery.RecipientLongitude,
      daysPastDue: delivery.daysPastDue,
      overdueMsg: delivery.overdueMsg,
      order: delivery.Order ? {
        id: delivery.Order.Id,
        due_date: delivery.Order.Due_Date,
        storeId: delivery.Order.Store_Id,
        store: delivery.Order.Store_Ordering ? {
          id: delivery.Order.Store_Ordering.Id,
          name: delivery.Order.Store_Ordering.Name,
          road: delivery.Order.Store_Ordering.Road,
          area: delivery.Order.Store_Ordering.Area,
          size: delivery.Order.Store_Ordering.Size,
          region: delivery.Order.Store_Ordering.Region,
          postcode: delivery.Order.Store_Ordering.PostCode,
          additional: delivery.Order.Store_Ordering.AdditionalAddressInfo,
          latitude: delivery.Order.Store_Ordering.Latitude,
          longitude: delivery.Order.Store_Ordering.Longitude,


        } : null,
        products: delivery.Order.Products ? delivery.Order.Products.map(product => ({
          id: product.Id,
          name: product.Name,
          price: product.Price,
          quantity: product.OrderProducts ? product.OrderProducts.Quantity : null,
          unitCost: product.OrderProducts ? product.OrderProducts.UnitCost : null,
          grossCost: product.OrderProducts ? product.OrderProducts.GrossCost : null,
        })) : []
      } : null,
    }))

    return res.status(200).json({
      success: true,
      overdueDeliveries: formattedOverdueDeliveries,
      //overdueDeliveries: overdueDeliveries,
    });
  } catch (err) {
    console.error("Error in ShowOverdueDeliveries:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

exports.getAllDeliveries = async (req, res) => {
  try {
    const deliveries = await db.Deliveries.findAll({
      include: [
        {
          model: db.Orders,
          as: "Order",
          include: [
            {
              model: db.Stores,
              as: "Store_Ordering",
              attributes: ["Id", "Name", "Region"],
            },
          ],
          attributes: ["Id", "ExternalOrderNo", "Placement_Date", "Due_Date"],
        },
        {
          model: db.Users,
          as: "Driver",
          attributes: ["Id", "User_FullName", "User_Telephone"],
        },
      ],
      order: [["DeliveredDate", "DESC"]],
    });

    res.status(200).json({
      success: true,
      count: deliveries.length,
      deliveries,
    });
  } catch (error) {
    console.error("Error getting all deliveries:", error);
    res.status(500).json({
      success: false,
      count: "Failed to retrieve deliveries",
    });
  }
};

exports.getDeliveryStats = async (req, res) => {
  try {
    const stats = {
      pendingMerch: await db.Shelvings.count({
        where: { Status: "Pending" },
      }),
      pendingOrders: await db.Orders.count({
        where: { Status: "Approved" },
      }),
      rejectedOrders: await db.Orders.count({
        where: { Status: "Rejected" },
      }),
      overdueOrders: await db.Orders.count({
        where: { Status: "Approved", Due_Date: { [Op.It]: new Date() } },
      }),
      totalDeliveries: await db.Deliveries.count(),
      inTransit: await db.Deliveries.count({
        where: { Status: "In Transit" },
      }),
      delivered: await db.Deliveries.count({
        where: { Status: "Delivered" },
      }),
    };

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error getting delivery stats:", error);
    res.status(500).json({
      success: false,
      error: "failed to retrieve delivery stats",
    });
  }
};

exports.getDeliveriesByStatusAndRegion = async (req, res) => {
  try {
    const { status, region } = req.query;

    if (!status || !region) {
      return res.status(400).json({
        success: false,
        error: "Both status and region parameters are required",
      });
    }

    const deliveries = await DeliveryService.getDeliveriesByStatusAndRegion(
      status,
      region
    );

    return res.status(200).json({
      success: true,
      count: deliveries.length,
      deliveries,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

//Show region specific deliveries
exports.getRegionalDeliveries = async (req, res) => {
  try {
    const { region, status } = req.body;

    const regionalDeliveries = await DeliveryService.getRegionalDeliveries(
      region,
      status
    );
    return res.status(200).json({
      success: true,
      regionalDeliveries,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

//Assign deliveries
exports.assignDelivery = async (req, res) => {
  try {
    const updatedOrders = await DeliveryService.assignDelivery();
    return res.status(200).json({
      success: true,
      updatedOrders: updatedOrders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

//Show pending deliveries for a driver (dashboard)
exports.showAllocatedDeliveries = async (req, res) => {
  //const driverId = req.query.driverId;
  const driverId = req.userId;
  console.log("Entered showAllocatedDeliveries controller");
  console.log("UserId from middleware:", req.userId);

  if (!driverId) {
    return res.status(400).json({
      success: false,
      error: "Missing driverId",
    });
  }

  try {
    const allocatedDeliveries = await DeliveryService.showAllocatedDeliveries(
      driverId
    );

    if (allocatedDeliveries.length > 0) {
      console.log(
        "First delivery:",
        JSON.stringify(allocatedDeliveries[0], null, 2)
      );
    }

    const formattedDeliveries = allocatedDeliveries.map((delivery) => ({
      id: delivery.Id,
      orderId: delivery.Order_Id,
      deliveredDate: delivery.DeliveredDate,
      status: delivery.Status,
      recipientName: delivery.RecipientName,
      recipientSignature: delivery.RecipientSignature,
      recipientLatitude: delivery.RecipientLatitude,
      recipientLongitude: delivery.RecipientLongitude,
      order: delivery.Order ? {
        id: delivery.Order.Id,
        due_date: delivery.Order.Due_Date,
        storeId: delivery.Order.Store_Id,
        store: delivery.Order.Store_Ordering ? {
          id: delivery.Order.Store_Ordering.Id,
          name: delivery.Order.Store_Ordering.Name,
          road: delivery.Order.Store_Ordering.Road,
          area: delivery.Order.Store_Ordering.Area,
          size: delivery.Order.Store_Ordering.Size,
          region: delivery.Order.Store_Ordering.Region,
          postcode: delivery.Order.Store_Ordering.PostCode,
          additional: delivery.Order.Store_Ordering.AdditionalAddressInfo,
          latitude: delivery.Order.Store_Ordering.Latitude,
          longitude: delivery.Order.Store_Ordering.Longitude,


        } : null,
        products: delivery.Order.Products ? delivery.Order.Products.map(product => ({
          id: product.Id,
          name: product.Name,
          price: product.Price,
          quantity: product.OrderProducts ? product.OrderProducts.Quantity : null,
          unitCost: product.OrderProducts ? product.OrderProducts.UnitCost : null,
          grossCost: product.OrderProducts ? product.OrderProducts.GrossCost : null,
        })) : []
      } : null,
    }))

    // for (let i = 0; i < allocatedDeliveries.length; i++) {
    //   const delivery = allocatedDeliveries[i];
    //   formattedDeliveries.push({
    //     id: delivery.Id,
    //     orderId: delivery.Order_Id,
    //     deliveredDate: delivery.DeliveredDate,
    //     status: delivery.Status,
    //     recipientName: delivery.RecipientName,
    //     recipientSignature: delivery.RecipientSignature,
    //     recipientLatitude: delivery.RecipientLatitude,
    //     recipientLongitude: delivery.RecipientLongitude,
    //     driverId: delivery.Driver_Id,
    //   });
    // }

    return res.status(200).json({
      success: true,
      allocatedDeliveries: formattedDeliveries,
    });
  } catch (error) {
    console.error("Error in showAllocatedDeliveries:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

//show completed deliveries for driver
exports.showCompletedDeliveries = async (req, res) => {
  //const driverId = req.query.driverId;
  const driverId = req.userId;
  //console.log(`DRIVER ID: ${driverId}`);

  if (!driverId) {
    return res.status(400).json({
      success: false,
      error: "Missing driverId",
    });
  }

  try {
    const completedDeliveries = await DeliveryService.showCompletedDeliveries(
      driverId
    );

    const formattedDeliveries = completedDeliveries.map((delivery) => ({
      id: delivery.Id,
      orderId: delivery.Order_Id,
      deliveredDate: delivery.DeliveredDate,
      status: delivery.Status,
      reason: delivery.Reason,
      recipientName: delivery.RecipientName,
      recipientSignature: delivery.RecipientSignature,
      recipientLatitude: delivery.RecipientLatitude,
      recipientLongitude: delivery.RecipientLongitude,
      order: delivery.Order ? {
        id: delivery.Order.Id,
        due_date: delivery.Order.Due_Date,
        storeId: delivery.Order.Store_Id,
        store: delivery.Order.Store_Ordering ? {
          id: delivery.Order.Store_Ordering.Id,
          name: delivery.Order.Store_Ordering.Name,
          road: delivery.Order.Store_Ordering.Road,
          area: delivery.Order.Store_Ordering.Area,
          size: delivery.Order.Store_Ordering.Size,
          region: delivery.Order.Store_Ordering.Region,
          postcode: delivery.Order.Store_Ordering.PostCode,
          additional: delivery.Order.Store_Ordering.AdditionalAddressInfo,
          latitude: delivery.Order.Store_Ordering.Latitude,
          longitude: delivery.Order.Store_Ordering.Longitude,


        } : null,
        products: delivery.Order.Products ? delivery.Order.Products.map(product => ({
          id: product.Id,
          name: product.Name,
          price: product.Price,
          quantity: product.OrderProducts ? product.OrderProducts.Quantity : null,
          unitCost: product.OrderProducts ? product.OrderProducts.UnitCost : null,
          grossCost: product.OrderProducts ? product.OrderProducts.GrossCost : null,
        })) : []
      } : null,
    }))

    return res.status(200).json({
      success: true,
      completedDeliveries: formattedDeliveries,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

//Confirm delivery
exports.confirmDelivery = async (req, res) => {

  const {
    deliveryId,
    recipName,
    recipSignature,
    recipLat,
    recipLong,
    //rating,
    reason,
    //status,
  } = req.body;

  const driverId = req.userId;
  console.log("DRiver Iddddd: ", driverId);

  if (
    !driverId ||
    !deliveryId 
  ) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields",
    });
  }

  const trans = await db.sequelize.transaction();

  try {
    const result = await DeliveryService.confirmDelivery(
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
    );
    await trans.commit();

    return res.status(200).json({
      success: true,
      delivery: result,
    });
  } catch (error) {
    await trans.rollback();
    console.error("conf del err ", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
