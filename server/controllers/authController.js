import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const register = async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    const user = await User.create({ ...req.body, password: hashedPassword });
    res.json({ _id: user._id, name: user.name, email: user.email });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Email already exists. Please login instead." });
    }
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const isMatch = await bcrypt.compare(req.body.password, user.password);
  if (!isMatch && user.password !== req.body.password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET
  );

  res.json({ token });
};