const busModel = require("../models/busModel");
const Bus = require("../models/busModel");
// Add a new bus
const AddBus = async (req, res) => {
  try {
    const existingBus = await Bus.findOne({ busNumber: req.body.busNumber });
    existingBus
      ? res.send({ message: "Bus already exists", success: false, data: null })
      : await new Bus(req.body).save();

    res.status(200).send({
      message: "Bus created successfully",
      success: true,
    });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
};

// get all buses and if the journeyDate is passed 1 hour ago , make the status of the bus to "Completed"
const GetAllBuses = async (req, res) => {
  try {
    const buses = await Bus.find();
    buses.forEach(async (bus) => {
      const journey = new Date(bus.journeyDate);

      const departure = new Date(
        `${journey.getFullYear()}-${
          journey.getMonth() + 1
        }-${journey.getDate()} ${bus.departure}`
      );

      if (departure.getTime() - new Date().getTime() < 3600000) {
        await Bus.findByIdAndUpdate(bus._id, { status: "Completed" });
      }
    });

    const orderedBuses = buses.sort((a, b) => {
      if (a.status === "Completed" && b.status !== "Completed") {
        return 1;
      } else if (a.status !== "Completed" && b.status === "Completed") {
        return -1;
      } else {
        return new Date(a.journeyDate) - new Date(b.journeyDate);
      }
    });

    res.status(200).send({
      message: "Buses fetched successfully",
      success: true,
      data: orderedBuses,
    });
  } catch (error) {
    res.status(500).send({
      message: "No Buses Found",
      success: false,
      data: error,
    });
  }
};

// get all buses by from and to
const GetBusesByFromAndTo = async (req, res) => {
  try {
    const buses = await Bus.find({
      from: req.query.from,
      to: req.query.to,
      journeyDate: req.query.journeyDate,
    });

    const updatePromises = buses.map(async (bus) => {
      const journey = new Date(bus.journeyDate);
      const departure = new Date(
        `${journey.getFullYear()}-${
          journey.getMonth() + 1
        }-${journey.getDate()} ${bus.departure}`
      );

      if (departure.getTime() < new Date().getTime()) {
        // If the bus has already departed, mark it as "Completed"
        return Bus.findByIdAndUpdate(bus._id, { status: "Completed" });
      }
    });

    // Wait for all update operations to complete
    await Promise.all(updatePromises);

    const filteredBuses = buses.filter(
      (bus) => bus.status !== "Completed" && bus.status !== "In Transit"
    );

    res.status(200).send({
      message: "Buses fetched successfully",
      success: true,
      data: filteredBuses,
    });
  } catch (error) {
    res.status(500).send({
      message: "No Buses Found",
      success: false,
      data: error,
    });
  }
};

// update a bus
const UpdateBus = async (req, res) => {
  // if the bus is completed , you can't update it
  const bus = await Bus.findById(req.params.id);
  if (bus.status === "Completed") {
    res.status(400).send({
      message: "You can't update a completed bus",
      success: false,
    });
  } else {
    try {
      await Bus.findByIdAndUpdate(req.params.id, req.body);
      res.status(200).send({
        message: "Bus updated successfully",
        success: true,
      });
    } catch (error) {
      res.status(500).send({
        message: "Bus not found",
        success: false,
        data: error,
      });
    }
  }
};

// delete a bus
const DeleteBus = async (req, res) => {
  try {
    await Bus.findByIdAndDelete(req.params.id);
    res.status(200).send({
      message: "Bus deleted successfully",
      success: true,
    });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
};

// get bus by id
const GetBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    res.status(200).send({
      message: "Bus fetched successfully",
      success: true,
      data: bus,
    });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
};

// Estimated Arrival time
const GetEstimatedTimeForStop = async (req, res) => {
  const getETAForStop = (bus, stopName) => {
    
    const targetStop = bus.routeDetails.find(
      (s) => s.stopName.toLowerCase() === stopName.toLowerCase()
    );
    if (!targetStop) {
      throw new Error(`Stop ${stopName} not found in route`);
    }

    const currentDateTime = new Date();
    const journeyDate = new Date(bus.journeyDate); 

    // Helper function to combine date and time
    const combineDateAndTime = (date, time) => {
      const [hours, minutes] = time.split(/[:\s]/); // Split time into components
      const ampm = time.includes("PM") ? 12 : 0; // Check if it's PM
      const finalHours = (parseInt(hours) % 12) + ampm; // Convert 12-hour to 24-hour time
      const dateTime = new Date(date);
      dateTime.setHours(finalHours);
      dateTime.setMinutes(parseInt(minutes));
      return dateTime;
    };

    const busDepartureTime = combineDateAndTime(journeyDate, bus.departure);
    const busArrivalTime = combineDateAndTime(journeyDate, bus.arrival);

    if (currentDateTime < busDepartureTime) {
      console.log("The bus has not started yet.");
      return "The bus has not started yet.";
    }

    if (currentDateTime >= busArrivalTime) {
      console.log("The bus has reached its destination.");
      return "The bus has reached its destination.";
    }

    let lastPassedStopIndex = 0;

    for (let i = 0; i < bus.routeDetails.length; i++) {
      const stopArrivalTime = combineDateAndTime(
        journeyDate,
        bus.routeDetails[i].arrivalTime
      );

      if (currentDateTime > stopArrivalTime) {
        lastPassedStopIndex = i;
      } else {
        break; // Stop looping once the current time is before the next stop
      }
    }

    const lastPassedStop = bus.routeDetails[lastPassedStopIndex];
    const targetStopArrivalTime = combineDateAndTime(
      journeyDate,
      targetStop.arrivalTime
    );

    // Calculate remaining time in milliseconds
    const timeDifference = targetStopArrivalTime - currentDateTime;
    const remainingHours = Math.floor(timeDifference / (1000 * 60 * 60)); // Convert to hours
    const remainingMinutes = Math.floor(
      (timeDifference % (1000 * 60 * 60)) / (1000 * 60)
    ); // Convert to minutes
    return {
      lastPassedStop,
      message: `The bus last passed ${lastPassedStop.stopName} at ${lastPassedStop.arrivalTime} and will arrive at ${stopName} at ${targetStop.arrivalTime}.`,
      remainingHours,
      remainingMinutes,
    };
  };

  try {
    const { busId, stopName } = req.body;

    // Step 1: Find the bus
    const bus = await Bus.findById(busId);
    if (!bus) {
      throw new Error("Bus not found");
    }
    const targetStop = bus.routeDetails.find(
      (s) => s.stopName.toLowerCase() === stopName.toLowerCase()
    );
    if (!targetStop) {
      throw new Error(`Stop ${stopName} not found in route`);
    }
    console.log(targetStop);
    const etaInfo = getETAForStop(bus, stopName);
    console.log("hey", etaInfo);
    // Step 3: Send the response
    res.status(200).send({
      data: { etaInfo },
      success: true,
    });
  } catch (error) {
    res.status(500).send({
      message: "Error in estimating time for stop",
      error: error.message,
      success: false,
    });
  }
};

module.exports = {
  AddBus,
  GetAllBuses,
  UpdateBus,
  DeleteBus,
  GetBusById,
  GetBusesByFromAndTo,
  GetEstimatedTimeForStop,
};
