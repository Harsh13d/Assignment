const express = require("express");
const router = express();
const {isLoggedIn} = require("../middlewares/authMiddleware");

const {
  BookSeat,
  GetAllBookings,
  GetAllBookingsByUser,
  CancelBooking,
  BookNoOfSeat,
} = require("../Controllers/bookingController");

router.post("/book-seat", isLoggedIn, BookSeat);
router.post("/book-n-seat", isLoggedIn, BookNoOfSeat);
router.get("/get-all-bookings", isLoggedIn, GetAllBookings);
router.get("/:user_Id", isLoggedIn, GetAllBookingsByUser);
router.delete("/:booking_id/:user_id/:bus_id", isLoggedIn, CancelBooking);

module.exports = router;
