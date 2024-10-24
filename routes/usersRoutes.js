const express = require("express");
const router = express.Router();
const {
  getAllClients,
  GetUserById,
} = require("../controllers/usersController");
const {isLoggedIn, isAdmin} = require("../middlewares/authMiddleware");

router.get("/get-all-users", isLoggedIn, isAdmin, getAllClients);
router.get("/:userId", isLoggedIn, GetUserById);

module.exports = router;
