const { Sequelize, DataTypes } = require("sequelize");
const mysql = require("mysql2");

const dotenv = require("dotenv");
dotenv.config();

const dbConnection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: process.env.DB_PORT || 3306,
  password: process.env.DB_PASS,
});

dbConnection.query(
  //replace ManeliDB with whatever you want to name it in your env file
  "CREATE DATABASE IF NOT EXISTS manelidb",
  (err, result) => {
    if (err) {
      console.log("Error: " + err);
      return;
    }
  }
);

dbConnection.end();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    dialect: "mysql",
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    logging: false, //turn to true if you want to see everything happening when sequelize connects
  }
);

const Users = require("../database/Models/user");
const Stores = require("../database/Models/store");
const Shelvings = require("../database/Models/shelving");
const Pictures = require("../database/Models/picture");
const Orders = require("./Models/orders");
const Products = require("../database/Models/product");
const Deliveries = require("../database/Models/delivery");
const OrderProducts = require("../database/Models/orderproducts");
const Leaderboards = require("../database/Models/leaderboard");
const SalesData = require("../database/Models/salesdata");
const PictureCategories = require("./Models/picturecategories");
const StoreStandings = require("./Models/storeStanding");
const Demerits = require("./Models/demerit");

// initialize models with their attributes that we define in the Models folder
//pass sequelize instance we created above to this initialization
//set timestamps false bacause we dont need the fields they create
const models = {
  Users: Users.init(Users.attributes, {
    sequelize,
    modelName: "Users",
    tableName: "users",
    timestamps: false,
  }),
  Stores: Stores.init(Stores.attributes, {
    sequelize,

    modelName: "Stores",
    tableName: "stores",
  }),
  StoreStandings: StoreStandings.init(StoreStandings.attributes, {
    sequelize,
    modelName: "StoreStandings",
    tableName: "storestandings",
    timestamps: true,
    createdAt: false,
    updatedAt: true,
  }),
  Demerits: Demerits.init(Demerits.attributes, {
    sequelize,
    modelName: "Demerits",
    tableName: "demerits",
    timestamps: true,
    createdAt: false,
    updatedAt: true,
  }),

  Shelvings: Shelvings.init(Shelvings.attributes, {
    sequelize,
    modelName: "Shelvings",
    tableName: "shelvings",
    timestamps: false,
  }),
  PictureCategories: PictureCategories.init(PictureCategories.attributes, {
    sequelize,
    modelName: "PictureCategories",
    tableName: "picturecategories",
    timestamps: false,
  }),
  Pictures: Pictures.init(Pictures.attributes, {
    sequelize,
    modelName: "Pictures",
    tableName: "pictures",
    timestamps: false,
  }),
  Orders: Orders.init(Orders.attributes, {
    sequelize,
    modelName: "Orders",
    tableName: "Orders",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["Store_Id", "ExternalOrderNo"],
        name: "unique_extenal_store_Order_combo",
      },
    ],
  }),
  Products: Products.init(Products.attributes, {
    sequelize,
    modelName: "Product",
    tableName: "product",
    timestamps: false,
  }),
  OrderProducts: OrderProducts.init(OrderProducts.attributes, {
    sequelize,
    modelName: "OrderProducts",
    tableName: "orderproducts",
    timestamps: false,
  }),
  Deliveries: Deliveries.init(Deliveries.attributes, {
    sequelize,
    modelName: "Deliveries",
    tableName: "deliveries",
    timestamps: false,
  }),
  Leaderboards: Leaderboards.init(Leaderboards.attributes, {
    sequelize,
    modelName: "Leaderboards",
    tableName: "leaderboards",
    timestamps: false,
  }),
  SalesData: SalesData.init(SalesData.attributes, {
    sequelize,
    modelName: "SalesData",
    tableName: "salesdata",
    timestamps: false,
  }),
};

require("./Models/associations")(models);

// close sequelize connection on exit of program
// Done to prevent locks on the database
process.on("SIGINT", async () => {
  console.log("\nClosing database connections...");
  await sequelize.close();
  process.exit(0);
});

const initializeDB = async () => {
  //Sync the models we define with the DB
  try {
    // await sequelize.sync({ force: true });
    await sequelize.sync({ force: true }); //need to wait till all models are synced otherwise insertions start breaking
    // in future set altrer:true but since we keep reinserting the same product values it will complain if it isnt force:true
    console.log("All modles syncronised");

    return true;
  } catch (err) {
    console.log(`Error syching:${err}`);
    return false;
  }
};

//Export the sequelize isntance we use and the models
//Reason we do this is because using a difference sequelize instance causes issues with the associations(FKs)
//Also can cause locks to occur
module.exports = {
  sequelize,
  initializeDB,
  ...models,
};
