const path = require("path");

const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../.env") });
const bcrypt = require("bcrypt");

const db = require("./db");
const { v4: uuidv4 } = require("uuid");
const { DATE } = require("sequelize");

console.log("DB_USER in db.js:", process.env.DB_USER);
console.log("DB_PASS in db.js:", process.env.DB_PASS);
console.log("DB_NAME in db.js:", process.env.DB_NAME);

const DeliveryService = require("../Delivery/deliveryModel");

async function createDummyData() {
  try {
    const existingManager = await db.Users.findOne({
      where: { User_Email: "manager@manager.com" },
    });
    if (existingManager) {
      console, log("Dummy data already exists, skipping creation.");
      return;
    }
    //Driver
    const driversalt = await bcrypt.genSalt(10);
    const driverHashedPass = await bcrypt.hash("driver1", driversalt);
    const driver = await db.Users.create({
      Id: uuidv4(),
      User_Email: "driver1@driver.com",
      User_Pass: driverHashedPass,
      User_Type: "Driver",
      User_FullName: "Driver1",
      User_Surname: "Driver",
      User_Region: "Gauteng",
      User_Telephone: "0123456789",
    });

    //Manager

    //Driver2
    const driver2salt = await bcrypt.genSalt(10);
    const driver2HashedPass = await bcrypt.hash("driver2", driver2salt);
    const driver2 = await db.Users.create({
      Id: uuidv4(),
      User_Email: "driver2@driver.com",
      User_Pass: driver2HashedPass,
      User_Type: "Driver",
      User_FullName: "Driver2",
      User_Surname: "Driver",
      User_Region: "Gauteng",
      User_Telephone: "0123456789",
    });

    //Driver3
    const driver3salt = await bcrypt.genSalt(10);
    const driver3HashedPass = await bcrypt.hash("driver3", driver3salt);
    const driver3 = await db.Users.create({
      Id: uuidv4(),
      User_Email: "driver3@driver.com",
      User_Pass: driver3HashedPass,
      User_Type: "Driver",
      User_FullName: "Driver3",
      User_Surname: "Driver",
      User_Region: "Gauteng",
      User_Telephone: "0123456789",
    });

    //Manager 1
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash("manager1", salt);

    const manager1 = await db.Users.create({
      Id: uuidv4(),
      User_Email: "manager1@manager.com",
      User_Pass: hashedPass,
      User_Type: "Manager",
      User_FullName: "Manager1",
      User_Surname: "Manager",
      User_Region: "Gauteng",
      User_Telephone: "1123456789",
    });

    //Manager 2
    const hashedPass2 = await bcrypt.hash("manager2", salt);
    const manager2 = await db.Users.create({
      Id: uuidv4(),
      User_Email: "manager2@manager.com",
      User_Pass: hashedPass2,
      User_Type: "Manager",
      User_FullName: "Manager2",
      User_Surname: "Manager",
      User_Region: "Limpopo",
      User_Telephone: "1123456789",
    });

    //Rep

    const hashedPassRep = await bcrypt.hash("Sales", salt);
    const Srep = await db.Users.create({
      Id: uuidv4(),
      User_Email: "ndzaza@eg.com",
      User_Pass: hashedPassRep,
      User_Type: "SRep",
      User_FullName: "Ndzalama",
      User_Surname: "Maluleke",
      User_Region: "Gauteng",
      User_Telephone: "1123456789",
    });

    console.log("ManagerID: " + manager1.Id);
    console.log("Re[ID: " + Srep.Id);
    //Store
    //-26.176155292558615, 27.937895596236626 HMZ COORDINATES
    const store = await db.Stores.create({
      Id: uuidv4(),
      Name: "Qual-eat-y Emmerentia",
      Size: "Medium",
      Region: "Gauteng",
      Area: "Emmerentia",
      PostCode: "2195",
      Road: "27 Greenhill Rd",
      AddionalAddressInfo: "",
      Latitude: -26.176155292558615,
      Longitude: 27.937895596236626,
      Manager_Id: manager1.Id,
      SalesRep_Id: Srep.Id,
    });

    const store1 = await db.Stores.create({
      Id: uuidv4(),
      Name: "Qual-eat-y UJ APK",
      Size: "Small",
      Region: "Gauteng",
      Area: "Rossmore",
      PostCode: "2195",
      Road: "5 Kingsway Ave",
      AddionalAddressInfo: "",
      Latitude: -26.176155292558615,
      Longitude: 27.937895596236626,
      Manager_Id: manager1.Id,
      SalesRep_Id: Srep.Id,
    });

    console.log("Store Manager ID " + store.Manager_Id);
    console.log("Store Id: ", store.Id);

    //Store
    const store2 = await db.Stores.create({
      Id: uuidv4(),
      Name: "Store2",
      Size: "Medium",
      Region: "Gauteng",
      Area: "storeArea",
      PostCode: "1234",
      Road: "storeStreet",
      AddionalAddressInfo: "",
      Latitude: -26.176155292558615,
      Longitude: 27.937895596236626,
      Manager_Id: manager2.Id,
    });

    const standing1 = await db.StoreStandings.create({
      Store_Id: store.Id,
    });

    const demerit1 = await db.Demerits.create({
      Store_Standing_Id: standing1.Id,
    });
    const standing2 = await db.StoreStandings.create({
      Store_Id: store1.Id,
    });

    const demerit2 = await db.Demerits.create({
      Store_Standing_Id: standing2.Id,
    });

    const standing3 = await db.StoreStandings.create({
      Store_Id: store2.Id,
    });

    const demerit3 = await db.Demerits.create({
      Store_Standing_Id: standing3.Id,
    });

    console.log("Store Manager ID " + store.Manager_Id);

    //Shelving
    const shelving = await db.Shelvings.create({
      Id: uuidv4(),
      Store_Id: store.Id,
      salesRep_Id: Srep.Id,
    });

    //Shelving
    let d = shelving.UploadDateTime;
    d.setDate(d.getDate() + 3);

    const CSCat = await db.PictureCategories.create({
      id: uuidv4(),
      Type: "Clip-Strip",
      shelf_Id: shelving.Id,
    });
    const PwCat = await db.PictureCategories.create({
      id: uuidv4(),
      Type: "Power-Wing",
      shelf_Id: shelving.Id,
    });
    const BnCat = await db.PictureCategories.create({
      id: uuidv4(),
      Type: "Bin",
      shelf_Id: shelving.Id,
    });
    const FdCat = await db.PictureCategories.create({
      id: uuidv4(),
      Type: "Full-Drop",
      shelf_Id: shelving.Id,
    });
    const IsCat = await db.PictureCategories.create({
      id: uuidv4(),
      Type: "Island",
      shelf_Id: shelving.Id,
    });

    const pic1 = await db.Pictures.create({
      id: uuidv4(),
      Path: "/shelving_pics/Clip_Strip.jpg",
      Pic_CatID: CSCat.Id,
    });
    const pic2 = await db.Pictures.create({
      id: uuidv4(),

      Path: "/shelving_pics/PowerWing.jpg",
      Pic_CatID: PwCat.Id,
    });
    const pic3 = await db.Pictures.create({
      id: uuidv4(),
      Type: "Bin",
      Path: "/shelving_pics/Bin.webp",
      Pic_CatID: BnCat.Id,
    });
    const pic4 = await db.Pictures.create({
      id: uuidv4(),
      Path: "/shelving_pics/Fulldrop.jpg",
      Pic_CatID: FdCat.Id,
    });
    const pic5 = await db.Pictures.create({
      id: uuidv4(),
      Path: "/shelving_pics/Island.jpg",
      Pic_CatID: IsCat.Id,
    });

    //Product
    const product1 = await db.Products.create({
      Id: uuidv4(),
      Name: "Product1",
      Price: 19.99,
      Description: "A product description",
      CostPerUnit: 9.99,
    });
    const product2 = await db.Products.create({
      Id: uuidv4(),
      Name: "Product2",
      Price: 20.49,
      Description: "A product description pt 2",
      CostPerUnit: 10.65,
    });

    const Leaderboard = await db.Leaderboards.create({ Store_Id: store.Id });

    const leaderboard2 = await db.Leaderboards.create({ Store_Id: store2.Id });

    //Order
    const order1 = await db.Orders.create({
      Id: uuidv4(),
      Store_Id: store.Id,
      Placement_Date: new Date(),
      Due_Date: new Date(Date.now() + 86400000),
      Status: "Rejected",
      ExternalOrderNo: "1176073592",
      Upload_Timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    });

    const order2 = await db.Orders.create({
      Id: uuidv4(),
      Store_Id: store2.Id,
      Placement_Date: new Date(),
      Due_Date: new Date(Date.now() + 86400000),
      Status: "Approved",
      ExternalOrderNo: "1176073593",
    });

    const order3 = await db.Orders.create({
      Id: uuidv4(),
      Store_Id: store2.Id,
      Placement_Date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      Due_Date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      Status: "Approved",
      ExternalOrderNo: "1176073594",
    });

    //REMOVED THE DELIVERIES BECAUSE YOU DONT CREATE DELIVERIES LIKE THIS READS UNPROCESSED ORDERS AND MAKES THEM

    console.log("order.Id:", order1.Id);
    console.log("product.Id:", product1.Id);

    await db.OrderProducts.create({
      OrderId: order2.Id,
      ProdId: product1.Id,
      Quantity: 51,
      UnitCost: product1.Price,
      GrossCost: (product1.Price * 51).toFixed(2),
    });
    await db.OrderProducts.create({
      OrderId: order2.Id,
      ProdId: product2.Id,
      Quantity: 17,
      UnitCost: product2.Price,
      GrossCost: (product2.Price * 17).toFixed(2),
    });

    await db.OrderProducts.create({
      OrderId: order3.Id,
      ProdId: product1.Id,
      Quantity: 4,
      UnitCost: product1.Price,
      GrossCost: (product1.Price * 4).toFixed(2),
    });

    await db.OrderProducts.create({
      OrderId: order3.Id,
      ProdId: product2.Id,
      Quantity: 52,
      UnitCost: product2.Price,
      GrossCost: (product2.Price * 52).toFixed(2),
    });

    await db.OrderProducts.create({
      OrderId: order1.Id,
      ProdId: product2.Id,
      Quantity: 18,
      UnitCost: product2.Price,
      GrossCost: (product2.Price * 18).toFixed(2),
    });


    await DeliveryService.assignDelivery();
    console.log("Store 1 Id: ", store1.Id);
    console.log("Store 2 Id: ", store2.Id);
    console.log("Dummy data created successfully!");
  } catch (error) {
    console.error("Error creating dummy data:", error);
  }
}

module.exports = { createDummyData };
