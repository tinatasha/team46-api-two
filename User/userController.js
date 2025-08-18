const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userModel = require("./userModel");
const { sequelize } = require("../database/db");
const { STRING } = require("sequelize");

//GET /users/all




exports.getUsers = async (req, res) => {
  const limit = parseInt(req.query.limit);
  const page = parseInt(req.query.currentPage);
  const role = req.query.role;
  const region = req.query.region;
  const searchPhrase = req.query.searchParams || ""; //secondary option cant be empty object because that evluates to truthy

  if (!limit || !page || !role || !region) {
    res
      .status(400)
      .json({ success: false, message: "Some Key Fields are missing" });
    return;
  }
  const offset = (page - 1) * limit;

  try {
    const users = await userModel.getUsers(
      limit,
      offset,
      searchPhrase,
      role,
      region
    );

    const employeeCount = await userModel.getNumEmployees(
      region,
      role,
      searchPhrase
    );
    return res
      .status(200)
      .json({ success: true, users: users, numEmployees: employeeCount });
  } catch (err) {
    console.error("Error in getAllUsers", err);
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

/*IM leaving these in because some of you might use them remove if you dont need them */

// GET /users/sreps
exports.getSReps = async (req, res) => {
  try {
    const users = await userModel.getUsersByRole("SRep");
    return res.status(200).json({ success: true, users });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

// GET /users/drivers
exports.getDrivers = async (req, res) => {
  try {
    const users = await userModel.getUsersByRole("Driver");
    return res.status(200).json({ success: true, users });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Server error" });
  }
};
// GET /users/managers
exports.getManagers = async (req, res) => {
  try {
    const users = await userModel.getUsersByRole("Manager");
    return res.status(200).json({ success: true, users });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Server error" });
  }
}; /*IM leaving these in because some of you might use them remove if you dont need them */

//GET /users/:id
exports.getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await userModel.getUserById(id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    return res.status(200).json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

//PUT /users/:id
//____________________________________________________________________________________________________________________________________
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  try {
    const result = await userModel.updateUser(id, updatedData);
    if (result[0] === 0) {
      return res
        .status(404)
        .json({ success: false, error: "User not found or no changes made" });
    }
    return res
      .status(200)
      .json({ success: true, message: "User updated successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: "Server error " + err });
  }
};
//____________________________________________________________________________________________________________________________________
// DELETE /users/:id
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await userModel.deleteUser(id);
    if (deleted === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete Error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

// POST /users/login

exports.login = async function (req, res) {
  console.log('Login route hit, req.body:', req.body);
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: "Bad Request: Email and Password Required",
    });
  }

  //console.log(req.body);
  try {
    //chagne findUserByEmail to AuthenticateUser(email,password) perfomr password checking in model
    //keep controller to only handle preprocesssing info and the like

    const user = await userModel.ValidateLoginDetails(email, password);

    if (!user) {
      res.status(401).json({
        success: false,
        error: "Invalid Credentials",
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.Id,
        email: user.User_Email,
        pass: user.User_Pass,
        region: user.User_Region,
        stafftype: user.User_Type,
        Fullname: user.User_FullName,
        Surname: user.User_Surname,
        phoneNo: user.User_Telephone,
      },
    });

    return;
  } catch (err) {
    console.log("Failed to Login " + err);
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// POST /users/register
exports.registerDriver = async (req, res) => {
  const { email, pass, type, fullName, surname, region, phoneNo } =
    req.body || {};

  if (!email || !pass || !type || !region || !phoneNo) {
    return res.status(400).json({
      success: false,
      error: "Some required fields are missing",
    });
  }
  try {
    const existingUser = await userModel.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Email already in use",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(pass, salt);

    await userModel.registerDriver(
      email,
      hashedPass,
      type,
      fullName,
      surname,
      region,
      phoneNo
    );

    return res.status(200).json({
      success: true,
      message: "Driver Successfully Registered",
    });
  } catch (err) {
    console.log("Registration Error", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
exports.registerSalesRep = async (req, res) => {
  const { email, pass, type, fullName, surname, region, phoneNo, stores } =
    req.body || {};
  if (!email || !pass || !type || !region || !phoneNo || !stores) {
    return res.status(400).json({
      success: false,
      error: "Some required fields are missing",
    });
  }

  try {
    const existingUser = await userModel.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Email already in use",
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(pass, salt);
    const trans = await sequelize.transaction();
    const user = await userModel.registerSalesRep(
      email,
      hashedPass,
      type,
      fullName,
      surname,
      region,
      phoneNo,
      trans
    );

    if (!!user === false) {
      await trans.rollback();
      res.status(500).json({
        success: false,
        message: "Failed to create Sales Rep Try again Later",
      });
      return;
    }

    for (const store of stores) {
      //loop through and assign all the stores to sales reps
      const item = await userModel.assignRepStore(store, user.Id, trans);

      if (item === null) {
        await trans.rollback();
        res.status(400).json({
          success: false,
          message: " Selected Store does not exist",
          Id: store,
        });
        return;
      }

      if (typeof item === "string") {
        await trans.rollback();
        res.status(400).json({
          success: false,
          message:
            " Selected Store " + item + " already has an assigned Sales Rep",
        });
        return;
      }
    }
    await trans.commit();

    res
      .status(200)
      .json({ success: true, message: "Sales Rep Succesfully Registered" });
    return;
  } catch (err) {
    console.log(err);
    return res
      .status(400)
      .json({ success: false, error: "Error occured:" + err });
  }
};

exports.restLogIn = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  console.log(`Got email: ${email} and password: ${password}`);

  if (!email || !password) {
    console.log("An error has occured");
    const error = new Error("No user or password entered");
    error.statusCode = 401;
    next(error);
    return;
  }

  const user = await userModel.ValidateLoginDetails(email, password);
  if (!user) {
    console.log("An error has occured");
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    next(error);
    return;
  }

  const loadedUser = user;
  const token = jwt.sign(
    {
      email: loadedUser.email,
      userId: loadedUser.Id,
      role: loadedUser.User_Type,
      region: loadedUser.User_Region,
      fullname: loadedUser.User_FullName
    },
    "GaydioheadIsOomfAurSangeetGlueHai"
  );

  console.log(`The token hahaha: ${token}`);
  console.log(`The user id: ${loadedUser.Id}`);
  //console.log("FULLNAME", loadedUser.fullName);

  res.status(200).json({ token: token, role: loadedUser.User_Type, fullname: loadedUser.User_FullName});
};
//________________________________________________________________________________________________
exports.updateSalesRepStores = async (req, res) => {
  const salesRepId = req.params.id;
  const { stores } = req.body;

  if(!Array.isArray(stores)) {
    return res.status(400).json({
      success: false,
      message: "Stores must be an array of store IDs"
    });
  }

  const transaction = await sequelize.transaction();

  try {


    const currentStores = await userModel.getStoresForSalesRep(salesRepId);
    console.log("Current Stores:", currentStores.map(s => `${s.Id} - ${s.Name}`));

    await userModel.unassignStoresFromSaleRep(salesRepId, transaction);

    for (const storeId of stores) {
      const result = await userModel.assignRepStore(storeId, salesRepId, transaction);


      if(result === null ) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Store with ID ${storeId} does not exist`
        });
      }

      if (typeof result === "string") {
         await transaction.rollback();
         return res.status(400).json({
          success: false,
          message: `Store '${result}' already has an asssigned sales rep`
         });
      }

    }

    await transaction.commit();


    const updatedStores = await userModel.getStoresForSalesRep(salesRepId);
    console.log("Updated Stores:", updatedStores.map(s => `${s.Id} - ${s.Name}`));


    return res.status(200).json({
      success: true,
      message: "Stores updated for sales rep successfully",
      before: currentStores,
      after: updatedStores

    });
  } catch (err){
    await transaction.rollback();
    console.error("Error updating Sales Rep stores:", err);
    return res.status(500).json({
      success: false,
      message: "server error during store update"
    })
  }


}

exports.getStoresForSalesRep = async (req, res) => {
  const { id } = req.params;

  try {
    const stores = await userModel.getStoresForSalesRep(id);

    if (!stores || stores.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No stores found for this sales rep"
      });
    }

    return res.status(200).json({
      success: true,
      stores
    });
  } catch (err) {
    console.error("Error fetching stores for sales rep:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching stores"
    });
  }
};


//________________________________________________________________________________________________


