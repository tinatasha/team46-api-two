const { sequelize, DataTypes, Model } = require("sequelize");
const { v4: uuidv4, validate } = require("uuid");

class Pictures extends Model {}

Pictures.attributes = {
  Id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  Path: {
    type: DataTypes.STRING(500),
    allowNull: false, //cant have pic record but no actual image
    unique: true,
  },
};
module.exports = Pictures;
