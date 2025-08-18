const { where } = require("sequelize");
const db = require("../database/db");
const PictureCategories = require("../database/Models/picturecategories");
const {Op} = require("sequelize");

class ShelvingService {
  async createShelf(storeId, RepId, trans) {
    try {
      const shelf = await db.Shelvings.create(
        { Store_Id: storeId, salesRep_Id: RepId },
        { transaction: trans }
      );
      return shelf;
    } catch (error) {
      console.error("failed maing shelf ", error);

      throw new Error("failed to create Shelf");
    }
  }

  async uploadImage(type, filepath, shelving_id, trans) {
    try {
      const picCat = await db.PictureCategories.create(
        {
          shelf_Id: shelving_id,
          Type: type,
        },
        { transaction: trans }
      );

      console.log(picCat);
      const pic = db.Pictures.create(
        { Path: filepath, Pic_CatID: picCat.Id },
        { transaction: trans }
      );
      return pic;
    } catch (error) {
      console.error("Failed linking pic to shelf", error);
      throw new Error("Failed Linking image to shelf");
    }
  }

  //all methods below this should be placed in try catch blocks for their finds so that can throw erros to controller to hadnle it
  async getPendingShelves(regionSelected) {
    const pendingShelves = await db.Shelvings.findAll({
      where: { Status: "PENDING" },
      include: [
        {
          model: db.Stores,
          as: "Store",
          required: true,
          where: { Region: regionSelected },
          attributes: ["Name", "Region"],
        },
      ],
    });
    return pendingShelves;
  }

  async getReviwedShelves(regionSelected) {
    const reviewedShelves = await db.Shelvings.findAll({
      where: { Status: "REVIEWED" },
      include: [
        {
          model: db.Stores,
          as: "Store",
          required: true,
          where: { Region: regionSelected },
          attributes: ["Name", "Region"],
        },
      ],
    });
    return reviewedShelves;
  }

  async getPowerWings(merchId) {
    const pwCat = await db.PictureCategories.findOne({
      where: { shelf_Id: merchId, Type: "Power-Wing" },
    });

    if (!pwCat) {
      return null; //Handled in the front by optional chaining
    }

    const PWPics = await db.Pictures.findAll({
      where: { Pic_CatId: pwCat.Id },
    });

    return { Pics: PWPics, Score: pwCat.Score, Feedback: pwCat.Feedback };
  }
  async getClipStrips(merchId) {
    const csCat = await db.PictureCategories.findOne({
      where: { shelf_Id: merchId, Type: "Clip-Strip" },
    });
    if (!csCat) {
      return null; //Handled in the front by optional chaining
    }
    const CSPics = await db.Pictures.findAll({
      where: { Pic_CatId: csCat.Id },
    });

    return { Pics: CSPics, Score: csCat.Score, Feedback: csCat.Feedback };
  }
  async getIslands(merchId) {
    const isCat = await db.PictureCategories.findOne({
      where: { shelf_Id: merchId, Type: "Island" },
    });

    if (!isCat) {
      return null; //Handled in the front by optional chaining
    }
    const IslandPics = await db.Pictures.findAll({
      where: { Pic_CatId: isCat.Id },
    });

    return { Pics: IslandPics, Score: isCat.Score, Feedback: isCat.Feedback };
  }
  async getFullDrops(merchId) {
    const fdCat = await db.PictureCategories.findOne({
      where: { shelf_Id: merchId, Shelf_Id: merchId, Type: "Full-Drop" },
    });
    if (!fdCat) {
      return null; //Handled in the front by optional chaining
    }
    const FDPics = await db.Pictures.findAll({
      where: { Pic_CatId: fdCat.Id },
    });

    return { Pics: FDPics, Score: fdCat.Score, Feedback: fdCat.Feedback };
  }
  async getBins(merchId) {
    const bnCat = await db.PictureCategories.findOne({
      where: { shelf_Id: merchId, Shelf_Id: merchId, Type: "Bin" },
    });

    if (!bnCat) {
      return null; //Handled in the front by optional chaining
    }
    const BnPics = await db.Pictures.findAll({
      where: { Pic_CatId: bnCat.Id },
    });
    return { Pics: BnPics, Score: bnCat.Score, Feedback: bnCat.Feedback };
  }

  async getMerchInfoByStoreId(storeId) {
    try {
      const merchInfo = await db.Shelvings.findAll({
        where: {
          Store_Id: storeId,
        },
        include: [
          {
            model: PictureCategories,
            as: "PicCategories",
            required: true,
            attributes: ["Type", "Feedback", "Score"],
          },
        ],
        attributes: ["Id", "Status", "UploadDateTime"],
        raw: true,
      });

      return merchInfo;
    } catch (error) {
      console.error("Unalbe TO get merch info by store id:", error);
      throw new Error("Error getting merch info");
    }
  }
  async getMerchScore(merchID) {
    try {
      const scoreInfo = await db.PictureCategories.findAll({
        where: { Shelf_Id: merchID },
        attributes: ["Type", "Score"],
      });
      return scoreInfo;
    } catch (error) {
      console.log("error", error);
      throw new Error("failed to get scores");
    }
  }

  async getReviewedMerchInfo(merchId) {
    const Reviewed = await db.PictureCategories.findAll({
      where: {
        shelf_Id: merchId,
      },
      attributes: ["Feedback", "Type"],
    });

    return Reviewed;
  }

  async markMerchAsReviewed(merchId, trans) {
    try {
      const Merchandise = await db.Shelvings.findOne({
        where: { Id: merchId },
        transaction: trans,
      });

      if (!!Merchandise === false) {
        return false;
      }

      Merchandise.Status = "REVIEWED";
      Merchandise.ReviewDate = new Date();

      await Merchandise.save({ transaction: trans });
      return true;
    } catch (error) {
      console.error("Error Marking Merch As Reviewed", error);
      throw new Error("Failure To Update Merchandise Record");
    }
  }
  async submitMerchCategoryFeedback(merchId, Feedback, Category, trans) {
    try {
      const PicCat = await db.PictureCategories.findOne({
        where: { shelf_Id: merchId, Type: Category },
        transaction: trans,
      });

      if (!!PicCat === false) {
        return false; //check in controller for falsy if it hits you know this is where your problem was
      }

      PicCat.Feedback = Feedback;
      await PicCat.save({ transaction: trans });

      return true;
    } catch (error) {
      console.error("Error Submiting Feedback", error);
      throw new Error("Error occured updating Categories Feedback:", error);
    }
  }

  async updateCategoryScore(merchId, score, category, trans) {
    try {
      const picCat = await db.PictureCategories.findOne({
        where: {
          shelf_Id: merchId,
          Type: category,
        },
      });

      picCat.Score = score;

      await picCat.save({ transaction: trans });
      return;
    } catch (error) {
      console.error(error);
      throw new Error("Error occured in updating clip strips ", error);
    }
  }

  async updateLeaderboardScore(storeId, score, trans) {
    try {
      const board = await db.Leaderboards.findOne({
        where: { Store_Id: storeId },
        transaction: trans,
      });

      if (board) {
        await board.increment({ Merchandise_Score: score }, trans);
      } else {
        await db.Leaderboards.create({
          Store_Id: storeId,
          Merchandise_Score: score,
        });
      }
      return true; //this is fine because in failure case throws clause helps escape
    } catch (error) {
      console.log("Leaderboard error", error);

      throw new Error("Failed Updating leaderboard");
    }
  }

  async getStoreId(merchId) {
    try {
      const record = await db.Shelvings.findOne({
        where: {
          Id: merchId,
        },
        attributes: ["Store_Id"],
      });
      return record.Store_Id; // do this cause we just want the id
    } catch (error) {
      throw new Error("couldnt get store via merchID");
    }
  }

  static CATEGORY_MULTIPLIERS = {
    'Power-Wing': 5.75,
    'Clip-Strip': 4.25,
    'Full-Drop': 2.0,
    'Bin': 3.5,
    'Island':3.5,
    'Default': 1.0
  };


  async getRepPointsByStore(repId, applyMultipliers = true){
    try {
      const shelves = await db.Shelvings.findAll({
        where: { salesRep_Id: repId},
        include: [
          {
            model: db.PictureCategories,
            as: "PicCategories",
            attributes: ["Score", "Type"],
          },
          {
            model: db.Stores,
            as: "Store",
            attributes: ["Name"],
          },
        ],
      });

      const storePoints = {};
      const storeRawPoints = {};

      shelves.forEach((shelf) => {
        const storeName = shelf.Store?.Name || "Unknown Store";

        if(!storePoints[storeName]) {
          storePoints[storeName] = 0;
          storeRawPoints[storeName] = 0;
        }

        shelf.PicCategories.forEach((cat) => {
          const score = cat.Score || 0;
          const type = cat.Type || 'Default';

          storeRawPoints[storeName] += score;


          if (applyMultipliers) {
            const multiplier = ShelvingService.CATEGORY_MULTIPLIERS [type] || ShelvingService.CATEGORY_MULTIPLIERS['Default'];
            storePoints[storeName] += score * multiplier;
          } else {
            storePoints[storeName] += score;
          }
        });
      });
   

    console.log('Raw Points (without multipliers):', storeRawPoints);
    console.log('Multiplied Points (with multipliers):', storePoints);

    return {
      rawPoints: storeRawPoints,
      calculatedPoints: storePoints
    };


      
    } catch (error) {
      console.error("Error fetching rep points by score:", error);
      throw new Error("Failed to get sales rep points by store")
    }
  }

async getAllRepsPointsByStore(managerId, applyMultipliers = true){
  try {
    const stores = await db.Stores.findAll({
      where: {Manager_Id: managerId},
      attributes: ['SalesRep_Id'],
      raw: true,
    });

    if(!stores.length) {
      return [];
    }

    const repIds = [...new Set(stores.map(store => store.SalesRep_Id).filter(id => id))];

    if (!repIds.length) {
      return [];
    }

    const reps = await db.Users.findAll ({
      where: {
        Id: { [Op.in]: repIds},
        User_Type: 'SRep',
      },
      attributes: ['Id', 'User_Fullname','User_Surname'],
      raw: true,
    });

    const results = [];

    for (const rep of reps) {
        const { rawPoints, calculatedPoints} = await this.getRepPointsByStore(rep.Id, applyMultipliers);

        const totalRawPoints = Object.values(rawPoints).reduce((acc, val) => acc + val, 0);
        const totalCalculatedPoints = Object.values(calculatedPoints).reduce((acc, val) => acc + val, 0);

        


        results.push({
          repId: rep.Id,
          name: rep.User_Fullname,
          surname: rep.User_Surname,
          totalRawPoints,
          totalCalculatedPoints,
          rawPointsBreakdown: rawPoints,
          calculatedPointsBreakdown: calculatedPoints,
        });
      }

      return results;
} catch (error){
      console.error("Error fetching all reps points by store:", error);
      throw new Error("Failed to get all sales reps points by store");
    }
  }

  


}

module.exports = new ShelvingService();