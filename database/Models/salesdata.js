const { sequelize, DataTypes, Model, UUID } = require("sequelize");
const { v4: uuidv4, validate } = require("uuid");

//add all the major reporting metrics wed like soproduct performance
class SalesData extends Model {}

SalesData.attributes = {
  Id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  year: {
    type: DataTypes.INTEGER, //do this because working with dates is difficult and we only care about the year and month a order happeneded
    allowNull: false,
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  product_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  },
  total_product_cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  total_product_unit_cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },

  //foreing keys are store id and productid
};
module.exports = SalesData;
