import express from "express";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { sendOTPEmail } from "../services/email.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// POST /api/auth/send-otp
router.post("/send-otp", async (req, res) => {
  const { name, email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otp_expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  try {
    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (existingUser.length > 0 && existingUser[0].is_verified) {
      return res.status(400).json({ error: "Email already registered." });
    }

    if (existingUser.length > 0) {
      // Update unverified user
      await db.update(users).set({ name, otp, otp_expiry }).where(eq(users.email, email));
    } else {
      // Create unverified user
      await db.insert(users).values({ name, email, otp, otp_expiry, password: "" });
    }

    await sendOTPEmail(email, otp);
    res.json({ message: "OTP sent to your email." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send OTP." });
  }
});

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { email, otp, password } = req.body;

  try {
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (user.length === 0) {
      return res.status(400).json({ error: "User not found." });
    }

    const userData = user[0];

    if (userData.otp !== otp || new Date() > userData.otp_expiry) {
      return res.status(400).json({ error: "Invalid or expired OTP." });
    }

    await db.update(users).set({ 
      password, 
      is_verified: true, 
      otp: null, 
      otp_expiry: null 
    }).where(eq(users.email, email));

    res.json({ message: "Registration successful. You can now login." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Registration failed." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (user.length === 0 || !user[0].is_verified || user[0].password !== password) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const userData = user[0];
    const token = jwt.sign(
      { id: userData.id, email: userData.email, role: userData.role, name: userData.name },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: false, // Per requirements: not HttpOnly for easier local testing
      secure: false,
      sameSite: "lax",
    });

    res.json({ name: userData.name, email: userData.email, role: userData.role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login failed." });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully." });
});

// GET /api/auth/me
router.get("/me", authenticateToken, (req, res) => {
  res.json({ name: req.user.name, email: req.user.email, role: req.user.role });
});

export default router;
