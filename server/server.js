import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.use("/auth", authRoutes);
app.use("/resume", resumeRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err.message));

// Routes - Add your routes here as you build them
// app.use("/auth", authRoutes);
// app.use("/resume", resumeRoutes);

app.get("/", (req, res) => res.send("API Running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
