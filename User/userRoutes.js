const express = require("express");
const router = express.Router();
const isAuth = require("./../middleware/isAuth");

const userController = require("./userController");
//login rouet
router.post("/login", userController.login);

//register
router.post("/register_driver", userController.registerDriver);
router.post("/register_sales_rep", userController.registerSalesRep);

//GET http://localhost:3001/users/
router.get("/", userController.getUsers);
//http://localhost:3001/users/9c24ef99-fadb-4925-9693-d5a403548390
//the weird stuff after user is an ID
router.get("/:id", userController.getUserById);

router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

router.get("/role/managers", userController.getManagers);
router.get("/role/sreps", userController.getSReps);
router.get("/role/drivers", userController.getDrivers);

router.post("/rest/login", userController.restLogIn);



router.put("/:id/stores",userController.updateSalesRepStores);
router.get("/:id/stores",userController.getStoresForSalesRep);



module.exports = router;
