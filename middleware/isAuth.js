const jwt = require("jsonwebtoken");

module.exports.isAuth = (req, res, next) => {
  console.log("CHECKING TOKEN");
  const authorisationHeader = req.get("Authorization");

  if (!authorisationHeader) {
    const error = new Error("User not authorised");
    error.statusCode = 500;
    throw error;
  }

  const token = authorisationHeader.split(" ")[1];

  try {
    tokenDecoded = jwt.verify(token, "GaydioheadIsOomfAurSangeetGlueHai");
  } catch (err) {
    err.statusCode = 401;
    throw err;
  }

  if (!tokenDecoded) {
    const error = new Error("Invalid token");
    error.statusCode = 401;
    throw error;
  }

  req.userId = tokenDecoded.userId;
  console.log(req.userId);

  console.log("AUTHORISED");

  next();
};
