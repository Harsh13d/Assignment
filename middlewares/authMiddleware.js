const jwt = require("jsonwebtoken");

// Middleware to check if the user is logged in
const isLoggedIn = (req, res, next) => {
  try {
    // Get the token from the cookies
    const token = req.cookies.authToken;
    if (!token) {
      return res.status(401).send({
        message: "Authentication failed, token not provided",
        success: false,
      });
    }

    // Verify the token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = decodedToken;
    req.params.userId = decodedToken.userId; // Attach userId to params
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    res.status(401).send({
      message: "Authentication failed",
      success: false,
    });
  }
};

// Middleware to check if the user is an admin
const isAdmin = (req, res, next) => {
  // Ensure the user is authenticated and is an admin
  if (!req.auth || !req.auth.isAdmin) {
    return res.status(403).send({
      message: "Unauthorized access, admin privileges required",
      success: false,
    });
  }
  next();
};

module.exports = { isLoggedIn, isAdmin };
