const Booking = require("../models/bookingsModel");
const Bus = require("../models/busModel");
const User = require("../models/usersModel");
const mongoose = require('mongoose');

const BookSeat = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { seats, bus: busId } = req.body;
    const userId = req.params.userId;

    // Step 1: Find the user
    const user = await User.findById(userId).session(session);
    if (!user) throw new Error("User not found");

    // Step 2: Find the bus
    const bus = await Bus.findById(busId).session(session);
    if (!bus) throw new Error("Bus not found");

    // Step 3: Validate seat numbers
    if (!Array.isArray(seats) || seats.length === 0) {
      throw new Error("No seats provided");
    }

    // Check for valid seat numbers and uniqueness
    const seatSet = new Set();
    for (const seat of seats) {
      if (typeof seat !== "number" || seat <= 0 || seat > bus.capacity) {
        throw new Error(`Invalid seat number: ${seat}. Must be greater than 0 and less than or equal to capacity (${bus.capacity}).`);
      }
      if (seatSet.has(seat)) {
        throw new Error(`Duplicate seat number: ${seat}. All seat numbers must be unique.`);
      }
      seatSet.add(seat);
    }

    // Step 4: Check if requested seats are already booked
    const alreadyBookedSeats = bus.seatsBooked.filter(seat => seats.includes(seat));
    if (alreadyBookedSeats.length > 0) {
      throw new Error(`Seats ${alreadyBookedSeats.join(", ")} are already booked`);
    }

    // Step 5: Check if there are enough available seats
    const availableSeats = bus.capacity - bus.seatsBooked.length;
    if (seats.length > availableSeats) {
      throw new Error("Not enough seats available");
    }

    // Step 6: Create and save the new booking
    const newBooking = new Booking({
      bus: busId,
      user: userId,
      seats,
    });
    await newBooking.save({ session });

    // Step 7: Update the bus's booked seats and recalculate occupancy level
    bus.seatsBooked.push(...seats);
    bus.occupancyLevel = calculateOccupancyLevel(bus.seatsBooked, bus.capacity);

    await bus.save({ session });

    // Step 8: Commit the transaction
    await session.commitTransaction();
    res.status(200).send({
      message: "Seat booked successfully",
      data: newBooking,
      success: true,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    res.status(500).send({
      message: "Booking failed",
      data: error.message,
      success: false,
    });
  } finally {
    session.endSession();
  }
};

const BookNoOfSeat = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { numberOfSeats, bus: busId } = req.body; // Take the number of seats from the request
    const userId = req.params.userId;

    // Step 1: Find the user
    const user = await User.findById(userId).session(session);
    if (!user) throw new Error("User not found");

    // Step 2: Find the bus
    const bus = await Bus.findById(busId).session(session);
    if (!bus) throw new Error("Bus not found");

    // Step 3: Check if the number of seats is valid
    if (typeof numberOfSeats !== "number" || numberOfSeats <= 0) {
      throw new Error("Invalid number of seats provided");
    }

    // Step 4: Check if there are enough available seats
    const availableSeats = bus.capacity - bus.seatsBooked.length;
    if (numberOfSeats > availableSeats) {
      throw new Error("Not enough seats available");
    }

    // Step 5: Generate random seat numbers
    const allSeats = Array.from({ length: bus.capacity }, (_, i) => i + 1); // Create an array of seat numbers from 1 to capacity
    const availableSeatNumbers = allSeats.filter(seat => !bus.seatsBooked.includes(seat)); // Filter out booked seats

    const assignedSeats = [];
    while (assignedSeats.length < numberOfSeats) {
      const randomIndex = Math.floor(Math.random() * availableSeatNumbers.length);
      const seatNumber = availableSeatNumbers.splice(randomIndex, 1)[0]; // Get a random available seat
      assignedSeats.push(seatNumber);
    }

    // Step 6: Create and save the new booking
    const newBooking = new Booking({
      bus: busId,
      user: userId,
      seats: assignedSeats, // Use the randomly assigned seat numbers
    });
    await newBooking.save({ session });

    // Step 7: Update the bus's booked seats and recalculate occupancy level
    bus.seatsBooked.push(...assignedSeats);
    bus.occupancyLevel = calculateOccupancyLevel(bus.seatsBooked, bus.capacity);

    await bus.save({ session });

    // Step 8: Commit the transaction
    await session.commitTransaction();
    res.status(200).send({
      message: "Seats booked successfully",
      data: {
        booking: newBooking,
        assignedSeats,
      },
      success: true,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    res.status(500).send({
      message: "Booking failed",
      data: error.message,
      success: false,
    });
  } finally {
    session.endSession();
  }
};

// Helper function to calculate occupancy level
const calculateOccupancyLevel = (seatsBooked, capacity) => {
  const occupancyPercentage = (seatsBooked.length / capacity) * 100;
  if (occupancyPercentage <= 60) return "Green";
  if (occupancyPercentage <= 90) return "Yellow";
  return "Red";
};

const GetAllBookings = async (req, res) => {
  Booking.find().populate("bus").populate("user").exec()
  .then((bookings) => {
    res.status(200).send({
      message: "All bookings",
      data: bookings,
      success: true,
    });
  })
  .catch((error) => {
    res.status(500).send({
      message: "Failed to get bookings",
      data: error,
      success: false,
    });
  });
};

const GetAllBookingsByUser = (req, res) => {
  Booking.find({ user: req.params.user_Id }).populate([
    "bus",
    "user",
  ]).exec()
  .then((bookings) => {
    res.status(200).send({
      message: "Bookings fetched successfully",
      data: bookings,
      success: true,
    });
  })
  .catch ((error) => {
    res.status(500).send({
      message: "Bookings fetch failed",
      data: error,
      success: false,
    });
  });
};

const CancelBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Step 1: Find the booking, user, and bus
    const booking = await Booking.findById(req.params.booking_id).session(session);
    const user = await User.findById(req.params.user_id).session(session);
    const bus = await Bus.findById(req.params.bus_id).session(session);

    if(bus.status!="Yet to start"){
      throw new Error("Bus journey started already");
    }
    if (!booking || !user || !bus) {
      throw new Error("Booking, User, or Bus not found");
    }

    // Step 2: Remove the booking
    await booking.remove({ session });

    // Step 3: Remove the booked seats from the bus
    bus.seatsBooked = bus.seatsBooked.filter(
      (seat) => !booking.seats.includes(seat)
    );
    
    // Step 4: Recalculate occupancy level
    bus.occupancyLevel = calculateOccupancyLevel(bus.seatsBooked, bus.capacity);
    await bus.save({ session });

    // Step 5: Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).send({
      message: "Booking cancelled successfully",
      data: booking,
      success: true,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);

    res.status(500).send({
      message: "Booking cancellation failed",
      data: error.message,
      success: false,
    });
  }
};



module.exports = {
  BookSeat,
  BookNoOfSeat,
  GetAllBookings,
  GetAllBookingsByUser,
  CancelBooking
};
