const express = require("express");
const router = express();

const {
  AddBus,
  GetAllBuses,
  UpdateBus,
  DeleteBus,
  GetBusById,
  GetBusesByFromAndTo,
  GetEstimatedTimeForStop,
} = require("../controllers/busController");
const {isLoggedIn, isAdmin} = require("../middlewares/authMiddleware");

router.post("/add-bus", isLoggedIn, isAdmin, AddBus);
router.post("/get-all-buses", isLoggedIn, GetAllBuses);
router.put("/:id", isLoggedIn, isAdmin, UpdateBus);
router.delete("/:id", isLoggedIn, isAdmin, DeleteBus);
router.get("/:id", isLoggedIn, GetBusById);
router.post("/get", isLoggedIn, GetBusesByFromAndTo);
router.post("/getETA", isLoggedIn, GetEstimatedTimeForStop);

module.exports = router;
