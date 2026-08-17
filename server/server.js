import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: true,
    credentials: false,
  })
);

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use("/auth", authRoutes);
app.use("/resume", resumeRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AI Resume Analyzer API Running",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI,
      {
        serverSelectionTimeoutMS: 5000,
      }
    );

    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT}`
      );
    });

  } catch (error) {
    console.error(
      "MongoDB connection failed:",
      error.message
    );

    process.exit(1);
  }
};

startServer();
