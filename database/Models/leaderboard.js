const { sequelize, DataTypes, Model } = require("sequelize");
const { v4: uuidv4, validate } = require("uuid");

class Leaderboards extends Model {}

Leaderboards.attributes = {
  Store_Id: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
  },
  Sales_Score: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.0,
    allowNull: false, //null score means no sales values as of yet
    validate: {
      min: 0,
    },
  },
  Merchandise_Score: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.0,
    allowNull: false,
    validate: {
      min: 0,
    },
  },
};

module.exports = Leaderboards;
/*        CREATE TABLE IF NOT EXISTS LEADERBOARD(
        StoreID INT,
        StoreRank INT NOT NULL,
        TotalScore decimal (10,2),
        

        PRIMARY KEY(StoreID),
        FOREIGN KEY (StoreID) REFERENCES _STORE(S_ID)
        */
