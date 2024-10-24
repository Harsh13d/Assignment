const mongoose = require("mongoose");

const busSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  rows:{
    type: Number,
    required: true,
  },
  columns:{
    type: Number,
    required: true,
  },
  busNumber: { 
    type: String,
    required: true,
  },
  from: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },

  departure: {
    type: String,
    required: true,
  },
  arrival: {
    type: String,
    required: true,
  },
  journeyDate: {
    type: String,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  seatsBooked: {
    type: Array,
    default: [],
  },
  occupancyLevel: {
    type: String,
    enum: ["Green", "Yellow", "Red"],
    default: "Green"
  }
, 
  status: {
    type: String,
    enum:["Yet to start","Running","Completed"],
    default: "Yet to start",
  },
  routeDetails: [{
    stopName: { type: String, required: true },  // e.g., "Kanpur"
    distanceFromStart: { type: Number, required: true },  // e.g., in kilometers
    arrivalTime: { type: String, required: true },  // e.g., "2024-10-24T14:30:00Z"
  }]
});

module.exports = mongoose.model("buses", busSchema);
