const { sequelize, DataTypes, Model } = require("sequelize");
const { v4: uuidv4, validate } = require("uuid");

class Products extends Model {}

Products.attributes = {
  Id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  Name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  Price: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  CostPerUnit: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false,
    validate: {
      min: 1,
    },
  },
  Description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
};
module.exports = Products;
