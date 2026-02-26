import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";

import applyRoute from "./routes/apply.js";
import rateQuoteRoute from "./routes/rateQuote.js";

dotenv.config();

const app = express();

/* ============================= */
/* CORS CONFIGURATION */
/* ============================= */

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://rgminc.ca",
  "https://www.rgminc.ca",
  "https://rgminc.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      // Allow all Vercel preview deployments
      if (origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("❌ Blocked by CORS:", origin);
      return callback(new Error("CORS not allowed"));
    },
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  })
);

/* ============================= */
/* MIDDLEWARE */
/* ============================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({
  storage: multer.memoryStorage(),
});

/* ============================= */
/* HEALTH CHECK */
/* ============================= */

app.get("/", (req, res) => {
  res.status(200).send("RGM Backend Running 🚀");
});

/* ============================= */
/* ROUTES */
/* ============================= */

app.use("/api/apply", upload.any(), applyRoute);
app.use("/api/rate-quote", rateQuoteRoute);

/* ============================= */
/* START SERVER */
/* ============================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
