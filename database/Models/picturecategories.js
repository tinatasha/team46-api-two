const { sequelize, DataTypes, Model } = require("sequelize");
const { v4: uuidv4, validate } = require("uuid");
const { max } = require("./user");

class PictureCategories extends Model {}

PictureCategories.attributes = {
  Id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  Type: {
    type: DataTypes.ENUM(
      "Power-Wing",
      "Clip-Strip",
      "Island",
      "Full-Drop",
      "Bin"
    ), //passing string through in query should automatically covert to enum and pull record we want so this is fine
    allowNull: false,
  },
  Feedback: {
    type: DataTypes.TEXT,
    allowNull: true, //Null just means theres  nothing wrong
  },
  Score: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    defaultValue: 0,
    min: 0,
    max: 5,
  },
};
module.exports = PictureCategories;
