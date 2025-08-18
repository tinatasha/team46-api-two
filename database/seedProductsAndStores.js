const { v4: uuidv4 } = require("uuid");
const db = require("./db");
const { salesPointMeta } = require("../Metadata/pointMultiplier");
const { regionalMap } = require("../Metadata/regions");
const { DemeritMap } = require("../Metadata/demeritThreshold");
async function seedProductAndStores() {
  try {
    const existingStore = await db.Stores.findOne({
      where: { Name: "SuperSpar Randburg" },
    });
    if (existingStore) {
      console.log("Stores and products already seeded, skipping");
      return;
    }

    const manager = await db.Users.findOne({
      where: { User_Type: "Manager", User_Email: "manager1@manager.com" },
    });

    if (!manager) {
      console.log("No manager found, cannot seed stores");
      return;
    }

    const products = [
      {
        Id: uuidv4(),
        Name: "DOG TREATS BILTONG PORK MANELI 100G",
        Price: 19.9,
        Description: "Delicious pork dog treats",
        CostPerUnit: 9.99,
      },

      {
        Id: uuidv4(),
        Name: "MANELI BEEF BITES 200G",
        Price: 29.99,
        Description: "Beef snacks for pets",
        CostPerUnit: 14.99,
      },

      {
        Id: uuidv4(),
        Name: "CHICKEN CRUNCHY STRIPS 150G",
        Price: 25.49,
        Description: "Crunchy chicken treats",
        CostPerUnit: 12.65,
      },
    ];

    for (let product of products) {
      await db.Products.create(product);
    }

    const sizes = ["Large", "Medium", "Small"];
    const baseNames = ["SuperSpar", "Checkers", "PicknPay"];

    const scoreMap = {
      Large: [
        { Sales_Score: 90.0, Merchandise_Score: 85.0 },
        { Sales_Score: 75.0, Merchandise_Score: 70.0 },
        { Sales_Score: 60.0, Merchandise_Score: 65.0 },
      ],

      Medium: [
        { Sales_Score: 80.0, Merchandise_Score: 78.0 },
        { Sales_Score: 65.0, Merchandise_Score: 60.0 },
        { Sales_Score: 50.0, Merchandise_Score: 55.0 },
      ],

      Small: [
        { Sales_Score: 70.0, Merchandise_Score: 68.0 },
        { Sales_Score: 55.0, Merchandise_Score: 50.0 },
        { Sales_Score: 40.0, Merchandise_Score: 45.0 },
      ],
    };

    let newStore = [];

    for (const key of regionalMap.keys()) {
      for (let size of sizes) {
        for (let i = 0; i < 3; i++) {
          const Store = await db.Stores.create({
            Id: uuidv4(),
            Name: `${baseNames[i]} ${size} Store ${i + 1}`,
            Size: size,
            Region: regionalMap.get(key),
            Area: `${size} Area${i + 1}`,
            PostCode: `100${i}`,
            Road: `${size} Street ${i + 1}`,
            AdditionalAddressInfo: "",
            Latitude: -26.1 + Math.random(),
            Longitude: -28.1 + Math.random(),
            Manager_Id: manager.Id,
          });

          const score = scoreMap[size][i];
          await db.Leaderboards.create({
            Store_Id: Store.Id,
            Sales_Score: score.Sales_Score,
            Merchandise_Score: score.Merchandise_Score,
          });
          const randQuant = Math.floor(Math.random() * 5) + 1;
          let dem = 0;

          if (randQuant === 1) {
            dem = 5;
          } else if (randQuant === 2) {
            dem = 9;
          } else if (randQuant === 3) {
            dem = 20;
          }

          const stand = await db.StoreStandings.create({
            Store_Id: Store.Id,
            Standing: DemeritMap.get(dem) || "Good",
          });

          await db.Demerits.create({
            Store_Standing_Id: stand.Id,
            Points: dem || 0,
          });

          newStore.push(Store);
        }
      }
    }
    await db.SalesData.destroy({ where: {} }); //duplicate issues if you dont keep this in slows resets up even more
    const SeedData = async (p1, p2, p3, store) => {
      const salesData = [];
      let points = 0;
      for (y = 1; y <= 2; y++) {
        for (i = 1; i <= 12; i++) {
          for (c = 1; c <= 2; c++) {
            let year = 2024;
            if (y === 2) {
              year = 2025;
            }

            const randQuant = Math.floor(Math.random() * 10) + 1;

            const RandProduct = Math.floor(Math.random() * 3);
            let SelProd = null;
            if (RandProduct === 0) {
              SelProd = p1;
            }
            if (RandProduct === 1) {
              SelProd = p2;
            }

            if (RandProduct === 2) {
              SelProd = p3;
            }
            const totCost = SelProd.Price * randQuant;
            const totCostPerUnit = SelProd.CostPerUnit * randQuant;

            salesData.push({
              year: year,
              month: i,
              product_quantity: randQuant,
              total_product_cost: totCost,
              total_product_unit_cost: totCostPerUnit,
              Product_Id: SelProd.Id,
              Store_Id: store.Id,
            });

            points +=
              totCost *
              (store.size === "Medium"
                ? salesPointMeta.MEDIUM
                : store.size === "Large"
                ? salesPointMeta.LARGE
                : store.size === "Small"
                ? salesPointMeta.SMALL
                : 1);
          }
        }
      }
      await db.SalesData.bulkCreate(salesData); //speeds up creation so it doesnt take ages to run a single server startup
      await db.Leaderboards.upsert({
        //This needs to be outside the loopss to prevent the seeding from taking too long
        Store_Id: store.Id,
        Sales_Score: points,
      });
    };

    await Promise.all(
      newStore.map((store) =>
        SeedData(products[0], products[1], products[2], store)
      )
    );

    console.log("Seeded products and leaderboard entries successfully!");
  } catch (err) {
    console.error("Error seeding test data:", err);
  }
}

module.exports = { seedProductAndStores };
