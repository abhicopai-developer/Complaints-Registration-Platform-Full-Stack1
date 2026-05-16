import express from "express";
import { db } from "../db/index.js";
import { complaints, users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { authenticateToken, isAdmin } from "../middleware/auth.js";

const router = express.Router();

// GET /api/admin/complaints
router.get("/complaints", authenticateToken, isAdmin, async (req, res) => {
  try {
    const allComplaints = await db.select({
      id: complaints.id,
      complaint_text: complaints.complaint_text,
      ai_question: complaints.ai_question,
      user_answer: complaints.user_answer,
      created_at: complaints.created_at,
      user_name: users.name,
      user_email: users.email,
    })
    .from(complaints)
    .innerJoin(users, eq(complaints.user_id, users.id));

    res.json(allComplaints);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch all complaints." });
  }
});

export default router;
