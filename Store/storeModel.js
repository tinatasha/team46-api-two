const { Model, where } = require("sequelize");
const db = require("../database/db");
const StoreStandings = require("../database/Models/storeStanding");
const Demerits = require("../database/Models/demerit");
const { Op } = require("sequelize");
//Update these to match plural form
class StoreService {
  async getStoreDetails(storeId) {
    const store = await db.Stores.findOne({
      where: {
        Id: storeId,
      },
      attributes: { exclude: [] },
    });

    return store;
  }

  async createStore(storeData) {
    const {
      storeName,
      size,
      region,
      area,
      postcode,
      road,
      additionalAddressInfo,
      latitude,
      longitude,
    } = storeData;
    const [result] = await db.query(
      `INSERT INTO _STORE (storeName, size, region, area, postcode, road, additionalAddressInfo, latitude, longitude)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        storeName,
        size,
        region,
        area,
        postcode,
        road,
        additionalAddressInfo,
        latitude,
        longitude,
      ]
    );
    return result;
  }

  async getSalesRepStores(RepId) {
    const stores = await db.Stores.findAll({
      where: { SalesRep_Id: RepId },
    });
    return stores;
  }

  async getManagerStores(ManagerID) {
    const [rows] = await db.query("SELECT * FROM _STORE WHERE ManagerID = ?", [
      ManagerID,
    ]);
    console.log(rows);
    if (rows.length === 0) {
      return null;
    } else {
      return rows;
    }
  }

  async getAvailableStores(region, managerId) {
    try {
      const stores = db.Stores.findAll({
        where: { Region: region, Manager_Id: managerId, SalesRep_Id: null },
        attributes: ["Name", "Id"],
      });
      return stores;
    } catch (error) {
      throw new Error("Could not Retrieve stores", error);
    }
  }

  async getStoreStandings(region, limit, offset, filter, searchPhrase) {
    const where = { Region: region };

    if (searchPhrase) {
      where.Name = { [Op.like]: `%${searchPhrase}%` };
    }
    try {
      const stores = await db.Stores.findAndCountAll({
        where,
        attributes: ["Name", "Id"],
        include: [
          {
            model: StoreStandings,
            as: "Standing",
            attributes: ["Standing"],
            required: true, //force left join
            where:
              filter.length > 0 ? { Standing: { [Op.in]: filter } } : undefined,
            include: [
              {
                model: Demerits,
                as: "Demerit",
                attributes: ["Points", "updatedAt"],
              },
            ],
          },
        ],
        order: [
          [{ model: db.StoreStandings, as: "Standing" }, "Standing", "ASC"], //TO order on joins follow this conventon
        ],
        limit: limit,
        offset: offset,
      });
      return stores;
    } catch (error) {
      console.error(error);
      throw new Error("Failure getting store standings");
    }
  }

  async getStoreStanding(storeId) {
    try {
      const standing = await db.StoreStandings.findOne({
        where: { Store_Id: storeId },
      });
      return standing;
    } catch (error) {
      console.error(error);
      throw new Error("Failed To retrieve Store Standing");
    }
  }

  async getAllStores() {
    return await db.Stores.findAll({
      attributes: [
        "Id",
        "Name",
        "Size",
        "Region",
        "Area",
        "PostCode",
        "Road",
        "AdditionalAddressInfo",
        "Latitude",
        "Longitude",
        "SalesRep_Id",
        "Manager_Id",
      ],
      order: [["Name", "ASC"]],
    });
  }
}
module.exports = new StoreService();
