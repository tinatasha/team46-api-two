const { sequelize, DataTypes, Model } = require("sequelize");
const { v4: uuidv4, validate } = require("uuid");

class Demerits extends Model {}

Demerits.attributes = {
  Id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  Points: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },

  //UpdatedAt field for when standing changed
};
module.exports = Demerits;
