const { Sequelize } = require("sequelize");
const db = require("../database/db");
const LeaderboardService = require("./leaderboardModel");
const { salesPointMeta } = require("../Metadata/pointMultiplier");
async function updateSalesScores() {
  console.log("running");
  const stores = await db.Stores.findAll();

  for (const store of stores) {
    const multiplier =
      store.size === "Medium"
        ? salesPointMeta.MEDIUM
        : store.size === "Large"
        ? salesPointMeta.LARGE
        : store.size === "Small"
        ? salesPointMeta.SMALL
        : 0;
    const salesAgg = await db.SalesData.findAll({
      attributes: [
        [
          Sequelize.fn("SUM", Sequelize.col("total_product_cost")),
          "totalSales",
        ],
      ],
      where: { Store_Id: store.Id },
      raw: true,
    });

    const totalSales = parseFloat(salesAgg.totalSales || 0);
    const computedScore = +(totalSales * multiplier).toFixed(2);
    console.log("Computed Score:" + computedScore);

    await db.Leaderboards.upsert({
      Store_Id: store.Id,
      Sales_Score: computedScore,
    });
  }
}

exports.refreshSalesScores = async (req, res) => {
  try {
    res.status(200).json({ message: "Sales scores updated successfully" });
  } catch (err) {
    console.error("Error updating sales scores:", err);
    res.status(500).json({ message: "Error updating leaderboard scores" });
  }
};

exports.getLeaderboardBySizeRegion = async (req, res) => {
  const { size, region } = req.params;
  const searchPhrase = req.query.searchPhrase || ""; //secondary option cant be empty object because that evluates to truthy
  const limit = parseInt(req.query.limit);
  const page = parseInt(req.query.page);

  try {
    if (!size || !region || !limit || !page) {
      res
        .status(400)
        .json({ success: false, message: "Some  key Fields are missing" });
      return;
    }

    const offset = (page - 1) * limit;

    const allStoreRanks = await LeaderboardService.getRanksAndStoreIds(
      size,
      region
    );

    const rankStoreIDMap = new Map();

    allStoreRanks.map((asr) => {
      rankStoreIDMap.set(asr.Store_Id, asr.StoreRank);
    });

    console.log(rankStoreIDMap);

    const Ranks = await LeaderboardService.getAllRankRecords(
      size,
      region,
      searchPhrase,
      limit,
      offset
    );
    //Number of stores of given size in the region
    const totalCount = await LeaderboardService.getNumberOfRecords(
      size,
      region,
      searchPhrase
    );

    const storeRanks = Ranks.map((rank) => ({
      storeId: rank["Store.Id"],
      storeName: rank["Store.Name"],
      storeSize: rank["Store.Size"],
      storePosition: rankStoreIDMap.get(rank["Store.Id"]),
      storeTotalScore: rank.TotalScore,
      storeSalesScore: rank.Sales_Score,
      storeMerchScore: rank.Merchandise_Score,
    }));

    //use 3 because at the moment only want 3 stores
    const topXStoreIds = await LeaderboardService.getTopXStoreIds(
      size,
      region,
      3
    );

    const cleanedIds = topXStoreIds.map((board) => ({
      storeId: board["Store.Id"],
    }));

    if (storeRanks) {
      res.status(200).json({
        success: true,
        StoreRanks: storeRanks,
        totalStoreCount: totalCount,
        topXStoreIds: cleanedIds,
      });
      return;
    }
  } catch (err) {
    console.error("Error fetching leaderboard by size:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const results = await db.Leaderboards.findAll({
      include: [
        {
          model: db.Stores,
          as: "Store",
          attributes: ["Name", "Region", "Size"],
        },
      ],
      attributes: {
        include: [
          [
            db.Leaderboards.sequelize.literal(
              "Sales_Score + Merchandise_Score"
            ),
            "Total_Score",
          ],
        ],
      },
      order: [[db.Leaderboards.sequelize.literal("Total_Score"), "DESC"]],
    });
    res.status(200).json(results);
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateLeaderboard = async (req, res) => {
  const { Store_Id, Sales_Score, Merchandise_Score } = req.body;

  try {
    await db.Leaderboards.upsert({ Store_Id, Sales_Score, Merchandise_Score });

    res.status(200).json({ message: "Leaderboard updated" });
  } catch (err) {
    console.error("Update failed:", err);
    res.status(500).json({ error: "Failed to update leaderboard" });
  }
};

exports.updateSalesScores = updateSalesScores;
