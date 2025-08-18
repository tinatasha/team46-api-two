const { sequelize, DataTypes, Model } = require("sequelize");
const { v4: uuidv4, validate } = require("uuid");

class OrderProducts extends Model {}

OrderProducts.attributes = {
  ProdId: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
  },
  OrderId: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
  },
  Quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  },
  UnitCost: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  GrossCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  },
};
module.exports = OrderProducts;
/* CREATE TABLE IF NOT EXISTS OrderProduct(

        P_ID INT,
        OrderID INT,
        Quantity INT,

        PRIMARY KEY (P_ID,OrderID),

        FOREIGN KEY (P_ID) REFERENCES Product(P_ID),
        FOREIGN KEY (OrderID) REFERENCES _Order (OrderID)
*/
