const { sequelize, DataTypes, Model } = require("sequelize");
const { v4: uuidv4, validate } = require("uuid");

class StoreStandings extends Model {}

StoreStandings.attributes = {
  Id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  Standing: {
    type: DataTypes.ENUM("Good", "Partial Risk", "High Risk", "BlackListed"),
    allowNull: false,
    defaultValue: "Good",
  },

  //UpdatedAt field for when standing changed
};
module.exports = StoreStandings;
