const { sequelize, DataTypes, Model, DATE } = require("sequelize");
const { v4: uuidv4, validate } = require("uuid");
class Stores extends Model {}

Stores.attributes = {
  Id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  Name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  Size: {
    type: DataTypes.ENUM("Large", "Medium","Small"),
    allowNull: false,
    defaultValue: "Large",
    
  },
  Region: {
    type: DataTypes.STRING(155),
    allowNull: false,
  },
  Area: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  PostCode: {
    type: DataTypes.STRING(4),
    allowNull: false,
  },
  Road: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  AdditionalAddressInfo: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  Latitude: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  Longitude: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
};

module.exports = Stores;

/*CREATE TABLE IF NOT EXISTS _STORE(

        S_ID INT AUTO_INCREMENT,
        StoreName VARCHAR(200) NOT NULL,
        StoreSize INT NOT NULL,-- 3 categories 1:Large 2: Medium, 3:Small
        StoreRegion VARCHAR(150) NOT NULL,
        StoreArea VARCHAR(255) NOT NULL,
        StorePostCode VARCHAR(4) NOT NULL,
        StoreStreet VARCHAR(255) NOT NULL,
        StoreStreetLocation VARCHAR(255) NOT NULL,-- Store exists on the provided address at this place E.g THe carlton centre 
        SalesRepID INT,
        ManagerID INT,

        Primary Key (S_ID),

        FOREIGN KEY (SalesRepID) References _User(U_ID),
        FOREIGN KEY (ManagerID) References _User(U_ID)

    );

    */
