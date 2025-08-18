const { sequelize, DataTypes, Model } = require("sequelize");
const { v4: uuidv4, validate } = require("uuid");

class Deliveries extends Model {}

Deliveries.attributes = {
  Id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  DeliveredDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  Status: {
    type: DataTypes.ENUM("Pending", "In Transit", "Delivered", "Rejected"),
  },
  RecipientName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  RecipientSignature: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  RecipientLatitude: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  RecipientLongitude: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  Reason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Rating: {
  //   type: DataTypes.INTEGER,
  //   allowNull: true,
  // }
};
module.exports = Deliveries;

/*  CREATE TABLE IF NOT EXISTS Delivery (
        DeliveryID INT AUTO_INCREMENT PRIMARY KEY,
        OrderID INT NOT NULL,
        DriverID INT NOT NULL,
        DeliveryDate DATE,
        DeliveryStatus INT default 1,  -- e.g., 1:Pending, 2:In Transit, 3:Delivered
        
        FOREIGN KEY (OrderID) REFERENCES _Order(OrderID),
        FOREIGN KEY (DriverID) REFERENCES _User(U_ID)
        */
