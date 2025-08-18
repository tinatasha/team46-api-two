const { sequelize, DataTypes, Model } = require("sequelize");
const { v4: uuidv4, validate } = require("uuid");

class Shelvings extends Model {}

Shelvings.attributes = {
  Id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },

  Status: {
    type: DataTypes.ENUM("REVIEWED", "PENDING"),
    allowNull: false,
    defaultValue: "PENDING",
  },
  UploadDateTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
  ReviewDate: {
    type: DataTypes.DATE,
    allowNull: true, //If it is null then it has yet to be reviewed
  },
};
module.exports = Shelvings;
