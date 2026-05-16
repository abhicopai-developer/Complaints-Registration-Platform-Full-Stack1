import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import aiRoutes from "./routes/ai.js";
import complaintRoutes from "./routes/complaints.js";
import adminRoutes from "./routes/admin.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5500",
  "http://127.0.0.1:5500"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("Complaints Registration API is running.");
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
