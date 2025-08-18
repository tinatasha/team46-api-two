const { Model, sequelize } = require("sequelize");

module.exports = (models) => {
  //Store to Manager Association 1-1 (A store has only 1 manager as managers are based on region)
  models.Stores.belongsTo(models.Users, {
    foreignKey: {
      name: "Manager_Id",
      allowNull: false,
    }, //NOTE: need to discuss possibility of having multiple managers per region
    as: "Manager",
  });

  // Manager to Store Association 1-N (A single manager can have many stores to manage)
  models.Users.hasMany(models.Stores, {
    foreignKey: {
      name: "Manager_Id",
    },
    as: "ManagedStores",
  });

  //Store to Sales Rep Association
  models.Stores.belongsTo(models.Users, {
    foreignKey: {
      name: "SalesRep_Id",
      allowNull: true,
    },
    as: "SalesRep",
  });
  models.Users.hasMany(models.Stores, {
    foreignKey: {
      name: "SalesRep_Id",
    },
    as: "SalesRepStores",
  });

  //User to Shelving Relationship
  models.Users.hasMany(models.Shelvings, {
    foreignKey: {
      name: "salesRep_Id",
      allowNull: false,
    },
    as: "Shelvings",
  });

  models.Shelvings.belongsTo(models.Users, {
    foreignKey: {
      name: "salesRep_Id",
      allowNull: false,
    },
    as: "SalesRep",
  });

  //Shelving to Store association 1-1 (1 shelving belongs to only 1 store)
  models.Shelvings.belongsTo(models.Stores, {
    foreignKey: {
      name: "Store_Id",
      allowNull: false,
    },
    as: "Store",
  });

  //Store to shelving association 1-N (1 store can have many different shelvings mapping to it)
  models.Stores.hasMany(models.Shelvings, {
    foreignKey: {
      name: "Store_Id",
    },
    as: "StoreShelvings",
  });

  models.PictureCategories.belongsTo(models.Shelvings, {
    foreignKey: {
      name: "shelf_Id",
      allowNull: false,
    },
    as: "Shelving",
  });

  models.Shelvings.hasMany(models.PictureCategories, {
    foreignKey: {
      name: "shelf_Id",
      allowNull: false,
    },
    as: "PicCategories",
  });
  models.Pictures.belongsTo(models.PictureCategories, {
    foreignKey: {
      name: "Pic_CatID",
      allowNull: false,
    },
    as: "Category",
  });

  //Pictures to Shelvings
  models.PictureCategories.hasMany(models.Pictures, {
    foreignKey: {
      name: "Pic_CatID",
    },
    as: "Pictures",
  });

  models.Leaderboards.belongsTo(models.Stores, {
    foreignKey: {
      name: "Store_Id",
      allowNull: false,
    },
    as: "Store",
  });

  models.Stores.hasOne(models.Leaderboards, {
    foreignKey: {
      name: "Store_Id",
    },
    as: "StoreRank",
  });
  models.Orders.belongsTo(models.Stores, {
    foreignKey: {
      name: "Store_Id",
      allowNull: false,
    },
    as: "Store_Ordering",
  });
  models.Stores.hasMany(models.Orders, {
    foreignKey: {
      name: "Store_Id",
    },
    as: "Orders_Made",
  });

  models.Orders.belongsToMany(models.Products, {
    through: "OrderProducts",
    foreignKey: {
      name: "OrderId",
      allowNull: false,
    }, // points to the source model while other key points to the target model
    otherKey: {
      name: "ProdId",
      allowNull: false,
    },
  });
  models.Products.belongsToMany(models.Orders, {
    through: "OrderProducts",
    foreignKey: {
      name: "ProdId",
      allowNull: false,
    },
    otherKey: {
      name: "OrderId",
      allowNull: false,
    },
  });

  models.Deliveries.belongsTo(models.Users, {
    foreignKey: {
      name: "Driver_Id",
      allowNull: true,
    },
    as: "Driver",
  });
  models.Users.hasMany(models.Deliveries, {
    foreignKey: {
      name: "Driver_Id",
    },
    as: "Deliveries",
  });

  models.Deliveries.belongsTo(models.Orders, {
    foreignKey: {
      name: "Order_Id",
      allowNull: false,
    },
    as: "Order",
  });
  models.Orders.hasOne(models.Deliveries, {
    foreignKey: {
      name: "Order_Id",
    },
    as: "Delivery",
  });
  models.Products.hasMany(models.SalesData, {
    foreignKey: {
      name: "Product_Id",
    },
    as: "SalesData",
  });
  models.SalesData.belongsTo(models.Products, {
    foreignKey: {
      name: "Product_Id",
    },
    as: "Product",
  });
  models.Stores.hasMany(models.SalesData, {
    foreignKey: {
      name: "Store_Id",
    },
    as: "SalesData",
  });
  models.SalesData.belongsTo(models.Stores, {
    foreignKey: {
      name: "Store_Id",
    },
    as: "Store",
  });

  models.StoreStandings.belongsTo(models.Stores, {
    foreignKey: {
      name: "Store_Id",
      allowNull: false,
    },
    as: "Store",
  });
  models.Stores.hasOne(models.StoreStandings, {
    foreignKey: {
      name: "Store_Id",
    },
    as: "Standing",
  });

  models.Demerits.belongsTo(models.StoreStandings, {
    foreignKey: {
      name: "Store_Standing_Id",
      allowNull: false,
    },
    as: "Standing",
  });

  models.StoreStandings.hasOne(models.Demerits, {
    foreignKey: {
      name: "Store_Standing_Id",
    },
    as: "Demerit",
  });

  models.Demerits.hasMany(models.Deliveries, {
    foreignKey: {
      name: "Demerit_Id",
      allowNull: true,
    },
    as: "Deliveries",
  });

  models.Deliveries.belongsTo(models.Demerits, {
    foreignKey: {
      name: "Demerit_Id",
    },
    as: "Demerit",
  });
};
