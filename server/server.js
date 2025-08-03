const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;
mongoose.connect(uri);
const connection = mongoose.connection;
connection.once("open", () => {
  console.log("MongoDB database connection established successfully");
});

const Score = require("./model");
app.post("/api/scores", async (req, res) => {
  try {
    const { name, time, level } = req.body;
    const newScore = new Score({ name, time, level });
    await newScore.save();
    res.status(201).json(newScore);
  } catch (error) {
    res.status(500).json("Error: " + error);
  }
});

app.get("/api/scores/:level", async (req, res) => {
  try {
    const level = req.params.level;
    const scores = await Score.find({ level: level })
      .sort({ time: 1 })
      .limit(10);
    res.json(scores);
  } catch (error) {
    res.status(500).json("Error: " + error);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
