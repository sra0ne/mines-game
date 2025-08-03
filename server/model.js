const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 3 },
    time: { type: Number, required: true },
    level: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

const Score = mongoose.model("Score", scoreSchema);

module.exports = Score;
