const { sequelize } = require("../database/db");
const ShelvingService = require("./shelvingModels");
const {
  salesPointMeta,
  merchPointMeta,
} = require("../Metadata/pointMultiplier");
const fs = require("fs/promises");
const path = require("path");
const { type } = require("os");

exports.uploadImage = async (req, res) => {
  console.log("UPLOADING IMAGES");
  const images = req.files;

  console.log("body", req.body);

  let metadata = req.body.metadata;
  const storeId = req.body.storeId;
  const repId = req.userId;

  metadata = JSON.parse(metadata);

  if (!storeId || !repId) {
    res.status(400).json({ success: false, message: "Missing Key atributes" });
    return;
  }
  console.log("Rep ID", repId);
  console.log("image count", images.length);
  if (images.length !== metadata) {
    return res.status(400).json({
      success: false,
      error: "No. of images and types don't align",
    });
  }
  const trans = await sequelize.transaction();
  try {
    //createShelf(storeId)

    const shelf = await ShelvingService.createShelf(storeId, repId, trans);
    const shelving_id = shelf.Id;

    if (!shelving_id) {
      await trans.rollback();

      return res.status(500).json({
        success: false,
        error: "Unable to create shelf",
      });
    }
    console.log(shelving_id);

    const renamedImages = await Promise.all(
      images.map(async (image) => {
        const imageType = image.originalname.split("_")[0];

        const newname = `${shelving_id}_${image.originalname}`;
        const newImagePath = path.join(image.destination, newname);

        await fs.rename(image.path, newImagePath);

        return {
          path: newImagePath,
          type: imageType,
        };
      })
    );

    for (let i = 0; i < renamedImages.length; i++) {
      console.log(renamedImages[i]);
      const url = "\\" + renamedImages[i].path;
      const type = renamedImages[i].type;

      //uploadImage(type, filepath, shelving_id)
      console.log(url);
      const pic = await ShelvingService.uploadImage(
        type,
        url,
        shelving_id,
        trans
      );
      if (!pic) {
        console.log("you are a failure you will never make it");
        await trans.rollback();
        res
          .status(400)
          .json({ success: false, message: "Failed to Upload try again" });
        return;
      }
    }
    await trans.commit();
    return res.status(200).json({
      success: true,
      message: "Images Uploaded succesfully",
    });
  } catch (err) {
    await trans.rollback();
    console.error("failed to make shlving references", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

exports.viewUploads = async (req, res) => {
  const { userId } = req.body;

  if (userId === null) {
    return res.status(401).json({
      success: false,
      error: "user id is null",
    });
  }

  const shelves = await ShelvingService.viewShelf(userId);

  return res.status(200).json({
    success: true,
    message: {
      shelves: shelves,
    },
  });
};

exports.managerShelves = async (req, res) => {
  const regionSelected = req.query.regionSelected;

  console.log("sel", regionSelected);
  if (!!regionSelected == false) {
    res.status(400).json({
      success: false,
      error: "Manager details not passed succesfully",
    });
    return;
  }

  try {
    const reviwedShelves = await ShelvingService.getReviwedShelves(
      regionSelected
    );
    const pendingShelves = await ShelvingService.getPendingShelves(
      regionSelected
    );

    const objReviwedShelves = reviwedShelves.map((reviwed) => reviwed.toJSON());
    const objPendingShelves = pendingShelves.map((pending) => pending.toJSON());

    res.status(200).json({
      success: true,
      reviwedMerch: objReviwedShelves,
      pendingMerch: objPendingShelves,
    });
    return;
  } catch (error) {
    console.error("Failure getting manager shelves", error);
    res
      .status(400)
      .json({ success: false, message: "Error retrieving shelving records" });
    return;
  }
};

exports.getMerchPicsPending = async (req, res) => {
  const shelfId = req.params.merchId;

  if (!!shelfId == false) {
    res
      .status(400)
      .json({ success: false, message: "Couldnt retrieve merchandise upload" });
    return;
  }

  try {
    const powerWings = await ShelvingService.getPowerWings(shelfId);
    const clipStrips = await ShelvingService.getClipStrips(shelfId);
    const fullDrop = await ShelvingService.getFullDrops(shelfId);
    const islands = await ShelvingService.getIslands(shelfId);
    const bins = await ShelvingService.getBins(shelfId);

    //convert all to json to make it easier in frontend
    //if its empty map does nothing so doing it this way wont cause problems
    //NOTE:REq.header gives localhost+port and browers youre using keep in mind for later
    const objPowerWings = powerWings?.Pics?.map((PW) => ({
      picID: PW.Id,
      picType: PW.Type,
      picPath: `http://${req.headers.host}${PW.Path}`,
    }));

    const objClipStrips = clipStrips?.Pics?.map((CS) => ({
      picID: CS.Id,
      picType: CS.Type,
      picPath: `http://${req.headers.host}${CS.Path}`,
    }));

    const objFullDrops = fullDrop?.Pics?.map((FD) => ({
      picID: FD.Id,
      picType: FD.Type,
      picPath: `http://${req.headers.host}${FD.Path}`,
    }));
    const objIslands = islands?.Pics?.map((IS) => ({
      picID: IS.Id,
      picType: IS.Type,
      picPath: `http://${req.headers.host}${IS.Path}`,
    }));

    const objBins = bins?.Pics?.map((BN) => ({
      picID: BN.Id,
      picType: BN.Type,
      picPath: `http://${req.headers.host}${BN.Path}`,
    }));
    //no need to check lengths as if we get back empty array from query just return empty array and display ntohing
    res.status(200).json({
      success: true,
      Power_Wings: objPowerWings,
      Clip_Strips: objClipStrips,
      Full_Drop: objFullDrops,
      Islands: objIslands,
      Bins: objBins,
    });
    return;
  } catch (error) {
    console.error(error);
    res
      .status(400)
      .json({ succes: false, message: "Failed to get Pics,Error:" + error });
    return;
  }
};

exports.getMerchReviwed = async (req, res) => {
  const shelfId = req.params.merchId;

  if (!!shelfId === false) {
    res.status(400).json({
      success: false,
      message: "Failed to retrieve merchandise record",
    });
    return;
  }
  try {
    const powerWings = await ShelvingService.getPowerWings(shelfId);
    const clipStrips = await ShelvingService.getClipStrips(shelfId);
    const fullDrop = await ShelvingService.getFullDrops(shelfId);
    const islands = await ShelvingService.getIslands(shelfId);
    const bins = await ShelvingService.getBins(shelfId);

    //get all the images and their data
    const objPowerWings = powerWings?.Pics?.map((PW) => ({
      picID: PW.Id,
      picType: PW.Type,
      picPath: `http://${req.headers.host}${PW.Path}`,
      picPoints: powerWings.Score,
      picFeedback: powerWings.Feedback,
    }));

    const objClipStrips = clipStrips?.Pics?.map((CS) => ({
      picID: CS.Id,
      picType: CS.Type,
      picPath: `http://${req.headers.host}${CS.Path}`,
      picPoints: clipStrips.Score,
      picFeedback: clipStrips.Feedback,
    }));

    const objFullDrops = fullDrop?.Pics?.map((FD) => ({
      picID: FD.Id,
      picType: FD.Type,
      picPath: `http://${req.headers.host}${FD.Path}`,
      picPoints: fullDrop.Score,
      picFeedback: fullDrop.Feedback,
    }));
    const objIslands = islands?.Pics?.map((IS) => ({
      picID: IS.Id,
      picType: IS.Type,
      picPath: `http://${req.headers.host}${IS.Path}`,
      picPoints: islands.Score,
      picFeedback: islands.Feedback,
    }));

    const objBins = bins?.Pics?.map((BN) => ({
      picID: BN.Id,
      picType: BN.Type,
      picPath: `http://${req.headers.host}${BN.Path}`,
      picPoints: bins.Score,
      picFeedback: bins.Feedback,
    }));

    res.status(200).json({
      success: true,
      Power_Wings: objPowerWings,
      Clip_Strips: objClipStrips,
      Full_Drop: objFullDrops,
      Islands: objIslands,
      Bins: objBins,
    });
  } catch (error) {
    console.log(error);
    res
      .status(400)
      .json({ success: false, message: "Error while getting reviwed record" });
    return;
  }
};

exports.giveMerchandiseFeedback = async (req, res) => {
  // consider using transactions everywhere maybe port over later
  // works but grouping db operations together and doing all or nothing with grouped ones
  //  so either all of them go through or none do
  // ideal for this because we cannot give feedback or give points if one of them fails will break DB
  const trans = await sequelize.transaction();

  const merchId = req.body.merchId;

  if (!!merchId == false) {
    res
      .status(400)
      .json({ success: false, message: "Failed to retrieve merchandise ID " });
    return;
  }

  const PowerWing = req.body.PW;
  const ClipStrip = req.body.CS;
  const FullDrop = req.body.FD;
  const Island = req.body.IS;
  const Bin = req.body.BN;

  const CatArr = [PowerWing, ClipStrip, FullDrop, Island, Bin];
  try {
    for (const ShelfCat of CatArr) {
      if (!ShelfCat.isNotNull) {
        continue;
      }

      await ShelvingService.updateCategoryScore(
        merchId,
        ShelfCat.Score,
        ShelfCat.category,
        trans
      );

      const feedbackStatus = await ShelvingService.submitMerchCategoryFeedback(
        merchId,
        ShelfCat.feedback,
        ShelfCat.category,
        trans
      );

      if (!feedbackStatus) {
        await trans.rollback();
        res.status(400).json({
          success: false,
          message: "Failed to find an existing shelving record",
        });
        return;
      }
    }

    const markMerch = await ShelvingService.markMerchAsReviewed(merchId, trans);

    if (!markMerch) {
      console.error("Failure Marking Merchandise as Reviewed");
      await trans.rollback();
      res.status(400).json({
        success: false,
        message: "Failed to Update Shelving Record",
      });
      return;
    }

    //update the leaderboard score by adding thes points to it
    const StoreID = await ShelvingService.getStoreId(merchId);

    if (!StoreID) {
      res
        .status(400)
        .json({ succes: false, message: "Failed to retrieve store ID" });
      return;
    }

    //calc the values
    const pwPoints = merchPointMeta.powerWingMulti * PowerWing.Score;

    const csPoints = merchPointMeta.clipStripMulti * ClipStrip.Score;

    const fdPoints = merchPointMeta.powerWingMulti * FullDrop.Score;

    const bnPoints = merchPointMeta.powerWingMulti * Bin.Score;

    const isPoints = merchPointMeta.powerWingMulti * Island.Score;

    //do checls for negatives
    //should never happen but do it to be safe

    const finalMerchScore =
      pwPoints + csPoints + fdPoints + bnPoints + isPoints;
    await ShelvingService.updateLeaderboardScore(
      StoreID,
      finalMerchScore,
      trans
    );

    await trans.commit();

    res
      .status(200)
      .json({ success: true, message: "Succesfully Reviwed Merchandise" });
    return;
  } catch (error) {
    await trans.rollback();
    console.log(error);

    res.status(400).json({
      success: false,
      message: "Failure to submit feedback",
      error: error.message,
    });
    return;
  }
};

exports.getStoreMerchandisingHistory = async (req, res, next) => {
  console.log(req.query);
  const storeId = req.query.storeId;

  if (!!storeId === false) {
    console.error("Store id not Provided");
    const error = new Error("No store id found");
    error.statusCode = 404;
    next(error);
  }

  try {
    const merchandisingInfo = await ShelvingService.getMerchInfoByStoreId(
      storeId
    );

    console.log("MERCHANDISING INFO");
    console.log(merchandisingInfo);

    for (let i = 0; i < merchandisingInfo.length; i++) {
      const scoreArr = await ShelvingService.getMerchScore(
        merchandisingInfo[i].Id
      );

      let xpEarned = 0;

      scoreArr.forEach((score) => {
        if (score.Type === "Power-Wing") {
          xpEarned += score.Score * merchPointMeta.powerWingMulti;
          console.log(xpEarned);
        }

        console.log(score);

        if (score.type === "Full-Drop") {
          xpEarned += score.Score * merchPointMeta.fullDropMulti;
          console.log(score.Score);
        }

        if (score.type === "Clip-Strip") {
          xpEarned += score.Score * merchPointMeta.clipStripMulti;
          console.log(xpEarned);
        }
        if (score.type === "Island") {
          xpEarned += score.Score * merchPointMeta.islandMulti;
          console.log(xpEarned);
        }
        if (score.type === "Bin") {
          xpEarned += score.Score * merchPointMeta.binMulti;
          console.log(xpEarned);
        }
      });
      console.log("XP:" + xpEarned);

      merchandisingInfo[i].points = xpEarned;
    }

    res.status(200).json(merchandisingInfo);
  } catch (err) {
    next(err);
  }
};

exports.getRepPointsByStore = async (req, res) => {
  console.log("Query Params:", req.query);
  const repId  =  req.query.repId;
  

  if(!repId) {
     console.log("No repId provided");
    return res.status(400).json({success: false, message: "repId is required" });

  }

  try {
    const pointsByStore = await ShelvingService.getRepPointsByStore(repId);
    console.log("Points from DB:", pointsByStore);
    res.status(200).json({ success: true, data: pointsByStore });
  } catch (error) {
    console.error("Error fetching sales rep points by store", error);
    res.status(500).json({ success: false, message: "Failed to get rep points"});
  }
};

exports.getAllRepsPointsByStore = async (req, res) => {
  const managerId = req.query.managerId;

  if (!managerId) {
    return res.status(400).json({ success: false, message:"managerId is required"});
  }

  try {
    const data = await ShelvingService.getAllRepsPointsByStore(managerId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Failed to get all reps point by store:", error);
    res.status(500).json({ success: false, message: "Failed to get reps points" });
  }
}