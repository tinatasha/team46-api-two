const { isAuth } = require("../middleware/isAuth");

const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploads");

const shelvingController = require("../Shelving/shelvingControllers");

//upload shelving images
//router.post("/upload", upload.array("images"), shelvingController.uploadImage);

//view shelving images
router.post("/view_shelves", shelvingController.viewUploads);

router.get("/manager_view_shelves", shelvingController.managerShelves);

router.get(
  "/get_Merch_Pics_Pending/:merchId",
  shelvingController.getMerchPicsPending
);
router.get(
  "/get_Merch_Pics_Reviewed/:merchId",
  shelvingController.getMerchReviwed
);

router.get("/get_Number_Pending_Reviews");

router.put(
  "/assign_merch_Feedback",
  shelvingController.giveMerchandiseFeedback
);

router.post(
  "/upload/images",
  isAuth,
  upload.array("image"),
  shelvingController.uploadImage
);

router.get(
  "/store/all",
  isAuth,
  shelvingController.getStoreMerchandisingHistory
);
router.get(
  "/rep/points_by_store",
  /*isAuth,*/
  shelvingController.getRepPointsByStore
);

router.get(
  "/rep_points_by_store",
  /*isAuth,*/
  shelvingController.getAllRepsPointsByStore
);


module.exports = router;