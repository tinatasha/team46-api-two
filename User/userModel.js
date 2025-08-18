const db = require("../database/db");
const { Op, where } = require("sequelize");

const bcrypt = require("bcrypt");

class User {



  // Get All Users using filters if need be
async getStoresForSalesRep(salesRepId){
  try{
    return await db.Stores.findAll({
      where: { SalesRep_Id: salesRepId },
      attributes: ['Id', 'Name'],

    });
  } catch (err) {
    throw new Error("Failed to get stores for sales rep:")
  }
}
  async getNumEmployees(region, role, searchPhrase) {
    const where = { User_Region: region, User_isDeleted: false };

    if (role !== "All") {
      if (role === "Srep") {
        where.User_Type = "Srep";
      } else if (role === "Driver") {
        where.User_Type = "Driver";
      }
    } else if (role === "All") {
      where.User_Type = { [Op.notIn]: ["Manager"] };
    }
    if (!!searchPhrase === true) {
      where.User_FullName = { [Op.like]: `%${searchPhrase}%` };
    }

    try {
      const count = db.Users.count({ where });

      return count;
    } catch (error) {
      throw new Error("Cant Count Number of employeers \n Error:", error);
    }
  }

  async getUsers(limit, offset, searchPhrase, role, region) {
    const where = { User_Region: region, User_isDeleted: false };

    if (!!searchPhrase == true) {
      where.User_FullName = { [Op.like]: `%${searchPhrase}%` };
    }

    if (role !== "All") {
      if (role === "SRep") {
        where.User_Type = "SRep";
      } else if (role === "Driver") {
        where.User_Type = "Driver";
      }
    } else if (role === "All") {
      where.User_Type = { [Op.notIn]: ["Manager"] };
    }

    console.log(where);
    try {
      const users = await db.Users.findAll({
        where,

        limit: limit,
        offset: offset,
      });
      return users;
    } catch (error) {
      throw new Error("Unable to get users \n Error:", error);
    }
  }
  async getAllUsers() {
    return await db.Users.findAll({
      where: { User_isDeleted: false },
    });
  }

  // Get Users By Role
  async getUsersByRole(role) {
    return await db.Users.findAll({
      where: {
        User_Type: role,
        User_isDeleted: false,
      },
    });
  }

  async getUserById(id) {
    return await db.Users.findOne({
      where: {
        Id: id,
        User_isDeleted: false,
      },
    });
  }
//____________________________________________________________________________________________________________________________________
  async updateUser(id, updatedFields) {
    return await db.Users.update(updatedFields, {
      where: { Id: id },
    });
  }
//____________________________________________________________________________________________________________________________________
  async deleteUser(id) {
    return await db.Users.update(
      { User_isDeleted: true },
      { where: { Id: id } }
    );
  }

  /*
    async ValidateLoginDetails(email, password) {

    const user = await db.Users.findOne({
      where: {
        User_Email: email,
        User_Pass: password,
      },
    });

    return user;
  }
*/

  async ValidateLoginDetails(email, password) {
    const user = await db.Users.findOne({
      where: {
        User_Email: email,
        User_isDeleted: false,
      },
    });
    console.log(user);
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.User_Pass);
    // console.log("Password match result:", isMatch);
    return isMatch ? user : null;
  }

  async getUserByEmail(email) {
    return await db.Users.findOne({
      where: {
        User_Email: email,
      },
    });
  }

  async registerDriver(
    email,
    hashedPassword,
    staffType,
    fullname,
    surname,
    region,
    phoneNo
  ) {
    return await db.Users.create({
      User_Email: email,
      User_Pass: hashedPassword,
      User_Type: staffType,
      User_FullName: fullname,
      User_Surname: surname,
      User_Region: region,
      User_Telephone: phoneNo,
    });
  }

  async registerSalesRep(
    email,
    hashedPassword,
    staffType,
    fullname,
    surname,
    region,
    phoneNo,
    trans
  ) {
    return await db.Users.create(
      {
        User_Email: email,
        User_Pass: hashedPassword,
        User_Type: staffType,
        User_FullName: fullname,
        User_Surname: surname,
        User_Region: region,
        User_Telephone: phoneNo,
      },
      { transaction: trans }
    );
  }

  async assignRepStore(storeId, userId, trans) {
    try {
      const store = await db.Stores.findOne({
        where: { Id: storeId },
        transaction: trans,
      });

      if (!!store === false) {
        return null;
      }

      if (store.SalesRep_Id !== null) {
        return store.Name;
      }
      store.SalesRep_Id = userId;

      await store.save({ transaction: trans });
      return store;
    } catch (err) {
      console.log("Error assigning stores");
      throw new Error("Unable to save store with id:" + storeId);
    }
  }

  async unassignStoresFromSaleRep(salesRepId, transaction) {
    try {
      const stores = await db.Stores.findAll({
        where: { SalesRep_Id: salesRepId},
        transaction,
      });

      for (const store of stores) {
        store.SalesRep_Id = null;
        await store.save({ transaction});
      }
    } catch (err) {
      throw new Error("Failed to unassign stores from sales rep")
    }
  }
}

module.exports = new User();
