const db = require("../database/db");
const { Op, fn, Sequelize, where, QueryTypes } = require("sequelize");
const Stores = require("../database/Models/store");

class LeaderboardService {
  async getTopXStoreIds(size, region, lim) {
    try {
      console.log("runnin");
      const ids = await db.Leaderboards.findAll({
        include: [
          {
            model: Stores,
            as: "Store",
            where: { Size: size, Region: region },
            attributes: ["Id"],
          },
        ],
        attributes: [],
        //works because literals are just raw sql in the end
        order: [Sequelize.literal("Sales_Score + Merchandise_Score DESC")],
        limit: lim,
        raw: true,
      });
      return ids;
    } catch (error) {
      console.error("Failed to get top 3 Store Ids", error);
      throw new Error("Failed TO get TOp 3");
    }
  }
  /*Due to how search and ranks were setup search and filter params affected rank seen on front end so get rank first then map to store id
    Use this map lookup to later create object sent to the front with the store ranks as they should be*/

  //Couldnt get it to work trying with sequelize like before so raw sql query used instead (T-T)
  async getRanksAndStoreIds(size, region) {
    try {
      const ranks = await db.sequelize.query(
        `SELECT S.ID AS Store_Id,
         Rank() OVER (ORDER BY LB.Sales_Score+LB.Merchandise_Score DESC) AS StoreRank FROM ${db.Leaderboards.getTableName()} LB INNER JOIN ${db.Stores.getTableName()} S ON S.ID =LB.Store_Id WHERE S.Size=:size AND S.Region=:region`,
        {
          replacements: { size: size, region: region },
          type: QueryTypes.SELECT,
        }
      );
      return ranks;
    } catch (error) {
      console.error("Failed to get Ranks", error);
      throw new Error("Failure getting Ranks For map creation");
    }
  }

  async getAllRankRecords(size, region, searchPhrase, lim, offset) {
    //if you name a variable same as your where clause it can be passed through straight and will evaluate whats witin the obj

    /*Original where 
       where: {
            Size: size,
            Region: region,
            Name: { [Op.iLike]: `%${searchPhrase}%` }, //Ilike is similar to 'like' but is case insensitive
          },


          */
    const where = { Size: size, Region: region };
    if (!!searchPhrase === true) {
      where.Name = { [Op.like]: `%${searchPhrase}%` }; //Ilikie is for postgresss sql not mysql
    }
    console.log(where);
    try {
      const boards = await db.Leaderboards.findAll({
        include: [
          {
            model: db.Stores,
            as: "Store",
            where,
            attributes: ["Name", "Size", "Id"],
          },
        ],

        attributes: {
          include: [
            //calculate total score column and include it in every record
            //then order by this total score column
            [
              Sequelize.literal("Sales_Score + Merchandise_Score"),
              "TotalScore",
            ],
          ],
        },
        order: [[Sequelize.literal("TotalScore"), "DESC"]],

        limit: lim,
        offset: offset,
        raw: true,
      });
      return boards;
    } catch (error) {
      console.log(error);
      throw new Error("Failed getting Leaderboards", error);
    }
  }
  async getNumberOfRecords(size, region, searchPhrase) {
    const where = {
      Size: size,
      Region: region,
    };

    if (!!searchPhrase === true) {
      where.Name = { [Op.like]: `%${searchPhrase}%` }; //Ilikie is for postgresss sql not mysql
    }
    try {
      const count = await db.Leaderboards.count({
        include: [
          {
            model: db.Stores,
            as: "Store",
            where,
            attributes: [],
          },
        ],
      });

      return count;
    } catch (error) {
      throw new Error("Failed to retrieve record count", error);
    }
  }

  async findOrCreateBoard(storeId) {
    try {
      const [board] = await db.Leaderboards.findOrCreate({
        where: { Store_Id: storeId },
      });
      return board;
    } catch (error) {
      console.error("Couldnt find or create leaderboard record", error);
      throw new Error("Failed TO find or Create Record");
    }
  }
}
module.exports = new LeaderboardService();
