const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require('express-rate-limit');
const bodyParser = require("body-parser");
const status = require("express-status-monitor");
const app = express();

require("dotenv").config();

app.use(cookieParser());  // cookie acsess and cookie set
app.use(cors());
app.use(express.json({limit: "16kb"}));
app.use(status());
// app.use(bodyParser.json());

const port = process.env.PORT || 3000;
const db = process.env.mongo_url || "mongodb://localhost/busbooking";

mongoose
  .connect(db)
  .then(() => console.log("Successfully connected to mongodb"))
  .catch((err) => console.log(err));

let limiter = rateLimit({max:1000,windowMs:60*60*1000,message:'We have recived to many request from this IP. Please try after one hour'});
// app.use('/api,limiter');
app.use("/api/users", require("./routes/usersRoutes"));
app.use("/api/buses", require("./routes/busesRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/bookings", require("./routes/bookingsRoutes"));

// listen to port
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

