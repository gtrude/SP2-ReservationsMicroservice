const path = require('path');
const express = require('express');
const app = express();
const apiRoutes = require('./routes/api');
const { startKafkaProducer } = require('./connectors/kafka');
const cors = require("cors");
const mongoose = require("mongoose");
const matchesRoute = require("./routes/matches");
const stripeRoute = require("./routes/stripe");

//.env imports
const dotenv = require("dotenv");
dotenv.config()
// Connect to mongoDB
const connect = async () => {
    try {
      await mongoose.connect(process.env.MONGO);
      console.log("Connected to mongoDB.");
    } catch (error) {
      throw error;
    }
  };
// Cors for mongo connection
app.use(cors());

// Config setup to parse JSON payloads from HTTP POST request body
app.use(express.json());
app.use(express.urlencoded({extended:false}));

// Matches route
app.use("/api/matches", matchesRoute);
app.use("/api/stripe", stripeRoute);
// Register the api routes
apiRoutes(app);

// If request doesn't match any of the above routes then return 404
app.use((req, res, next) => {
  return res.status(404).send();
});

// Create HTTP Server and Listen for Requests
app.listen(8080, async (req, res) => {
  // Start Kafka Producer
  connect();
  await startKafkaProducer();
});