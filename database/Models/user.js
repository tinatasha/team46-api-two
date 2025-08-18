const { sequelize, DataTypes, Model, DATE } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

class Users extends Model {}

Users.attributes = {
  Id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4, //generate unique user id on isnertion
    primaryKey: true,
  },
  User_Email: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  User_Pass: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  User_Type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [["Manager", "SRep", "Driver"]],
    },
  },
  User_FullName: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  User_Surname: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  User_CreationTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  User_Region: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  User_Telephone: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  User_isDeleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
};

module.exports = Users;
/*        create Table IF NOT EXISTS _User (
          U_ID int AUTO_INCREMENT,
          UserEmail VARCHAR(255) NOT NULL,
          U_Password VARCHAR(255) NOT NULL,
          UserType VARCHAR(50) NOT NULL,
          U_FullName VARCHAR(100),
          U_Surname VARCHAR(100),-- nulls allowed so in case admin no name needed since its just admin;if manager give name
          U_CreationTime Datetime DEFAULT Current_Timestamp,-- sets up time when record is made,if record too old deactivate
          U_Region VARCHAR(150),
          U_Telephone VARCHAR(10),

          Primary Key (U_ID),

          CHECK(UserType IN('Manager','SRep','Driver')) 
      );
      */
