import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import multer from "multer";

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
  "https://rgminc.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow server-to-server or Postman requests
      if (!origin) return callback(null, true);

      if (!allowedOrigins.includes(origin)) {
        console.log("Blocked by CORS:", origin);
        return callback(new Error("CORS not allowed"), false);
      }

      return callback(null, true);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  })
);

/* ============================= */
/* MIDDLEWARE */
/* ============================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ============================= */
/* MULTER SETUP */
/* ============================= */

const upload = multer({
  storage: multer.memoryStorage(),
});

/* ============================= */
/* HEALTH CHECK ROUTE */
/* ============================= */

app.get("/", (req, res) => {
  res.status(200).send("RGM Backend Running 🚀");
});

/* ============================= */
/* NODEMAILER CONFIG */
/* ============================= */

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error("❌ EMAIL_USER or EMAIL_PASS not set in environment variables");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ============================= */
/* CONTACT FORM ROUTE */
/* ============================= */

app.post("/api/contact", upload.none(), async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !phone || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "New Contact Form Submission",
      html: `
        <h3>New Contact Inquiry</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Email sent successfully",
    });

  } catch (error) {
    console.error("❌ Email Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send email",
    });
  }
});

/* ============================= */
/* START SERVER */
/* ============================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
