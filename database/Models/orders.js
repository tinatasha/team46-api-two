const { sequelize, DataTypes, Model } = require("sequelize");
const { v4: uuidv4, validate } = require("uuid");
const upload = require("../../middleware/uploads");

class Orders extends Model {}

Orders.attributes = {
  Id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  Placement_Date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  Due_Date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  Status: {
    type: DataTypes.ENUM("Rejected", "Approved"),
    allowNull: false,
  },
  ExternalOrderNo: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  Store_Id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  Upload_Timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  Modified_At: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: "Timestamp when order status was last changed",
  },
  Modified_By: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: "User ID who changed the order status",
  },
  Reason: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "Status before the last change",
  },
  RequiresReview: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: "Is the order flagged as needing a manual review",
  },
  Reviewed_By: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: "Who approved this order to be assigned despite risk of store",
  },
  Review_Date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: "When did order get reviewed",
  },
};

Orders.hooks = {
  beforeUpdate: (order) => {
    if (order.changed("Status")) {
      order.Modified_At = new Date();
      order.Previous_Status = order.previous("Status");
    }
  },
};

module.exports = Orders;

/* CREATE TABLE IF NOT EXISTS _Order (
        OrderID INT AUTO_INCREMENT,
        OrderDate DATE,
        DriverID INT,

        PRIMARY KEY (OrderID)

    );*/
