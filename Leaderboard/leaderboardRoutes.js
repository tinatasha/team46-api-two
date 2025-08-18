const express = require("express");
const router = express.Router();
const leaderboardController = require("./leaderboardController");
const { isAuth } = require("../middleware/isAuth");

router.get("/", leaderboardController.getLeaderboard);
router.post("/update", leaderboardController.updateLeaderboard);
router.get(
  "/size/:size/region/:region/",
  leaderboardController.getLeaderboardBySizeRegion
);
router.post("/refresh-sales-scores", leaderboardController.refreshSalesScores);

router.get("/auth", isAuth, leaderboardController.getLeaderboard);

module.exports = router;
