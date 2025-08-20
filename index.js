const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
require("dotenv").config();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  "/shelving_pics",
  express.static(path.join(__dirname, "shelving_pics"))
); //serve the files in here as static images
const port = process.env.PORT || 3001;
const routes = require("./routes/routes");

const userRoutes = require("./User/userRoutes");
app.use("/users", userRoutes);

const orderRoutes = require("./Order/orderRoutes");
app.use("/orders", orderRoutes);
//even though Db is not user,still needs to be imported so that models can be intialized and avaiable for use in queries
//DO NOT REMOVE THIS LINE
const { initializeDB, sequelize } = require("./database/db");
const { createDummyData } = require("./database/dummy");

const upload = require("./middleware/uploads");

const { updateSalesScores } = require("./Leaderboard/leaderboardController");

//Loadint he routes in this way is alot cleaner imo so i opted to create a routes folder
//where all routes are defined and imported
//the file within just takes the old routes that were here and does them in there while also linking to the appropriate route files
//so that controllers and models can work as they should
app.use("/", routes);

//test api`
app.get("/", (req, res) => {
  console.log(req.body);

  res.json({ test: "test" });
});

app.get("/test-cors", (req, res) => {
  res.json({ message: "CORS working" });
});

const multer = require("multer");
const { seedProductAndStores } = require("./database/seedProductsAndStores");
const testUpload = multer({ storage: multer.memoryStorage() });

app.post("/upload-csv", testUpload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No File Uploaded" });
  }

  const csvContent = req.file.buffer.toString("utf-8");
  console.log("Received CSV content:\n", csvContent);

  res.json({ message: "CSV file received successfully" });
});

app.use((error, req, res, next) => {
  const status = error.statusCode || 500;
  res.status(status).json({ message: error.message || "Error occured" });
});

async function startServer() {
  try {
    const isDBReady = await initializeDB();

    if (!isDBReady) {
      console.log("DB Failed to initialize correctly");
      process.exit();
    }

    await createDummyData();
    console.log("Dummy data inserted");

    await seedProductAndStores();
    console.log("Stores and products inserted");

    app.listen(port, () => {
      console.log("Server running on port: " + port);
    });
  } catch (error) {
    console.error("Error starting server: ", error);
  }
}

startServer();
