import express from "express";
import { db } from "../db/index.js";
import { complaints } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// POST /api/complaints
router.post("/", authenticateToken, async (req, res) => {
  const { complaint_text, ai_question, user_answer } = req.body;

  try {
    const newComplaint = await db.insert(complaints).values({
      user_id: req.user.id,
      complaint_text,
      ai_question,
      user_answer,
    }).returning();

    res.json(newComplaint[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to submit complaint." });
  }
});

// GET /api/complaints/my
router.get("/my", authenticateToken, async (req, res) => {
  try {
    const myComplaints = await db.select().from(complaints).where(eq(complaints.user_id, req.user.id));
    res.json(myComplaints);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch your complaints." });
  }
});

export default router;
