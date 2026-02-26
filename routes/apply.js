import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

/* ============================= */
/* MAIL CONFIG */
/* ============================= */

if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
  console.error("❌ Gmail credentials missing in Railway environment variables");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  connectionTimeout: 60000,
  greetingTimeout: 30000,
});

/* ============================= */
/* VALIDATION HELPERS */
/* ============================= */

const isValidName = (v) => v && /^[a-zA-Z\s\-'.]+$/.test(String(v).trim()) && String(v).trim().length >= 2;
const isValidPhone = (v) => v && /^\d+$/.test(String(v).replace(/\D/g, "")) && String(v).replace(/\D/g, "").length >= 10;
const isValidEmail = (v) => v && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());
const isValidCity = (v) => v && /^[a-zA-Z\s\-'.]+$/.test(String(v).trim()) && String(v).trim().length >= 2;
const isValidState = (v) => v && /^[a-zA-Z\s\-'.]+$/.test(String(v).trim()) && String(v).trim().length >= 2;
const isValidZip = (v) => v && /^[a-zA-Z0-9\s\-]+$/.test(String(v).trim()) && String(v).trim().length >= 3;

/* ============================= */
/* APPLY ROUTE */
/* ============================= */

router.post("/", async (req, res) => {
  const data = req.body || {};

  if (!data.firstName || !data.lastName || !data.email || !data.primaryPhone) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }

  if (!isValidName(data.firstName)) {
    return res.status(400).json({ success: false, message: "First name should contain only letters." });
  }
  if (!isValidName(data.lastName)) {
    return res.status(400).json({ success: false, message: "Last name should contain only letters." });
  }
  if (data.middleName && !isValidName(data.middleName)) {
    return res.status(400).json({ success: false, message: "Middle name should contain only letters." });
  }
  if (!isValidPhone(data.primaryPhone)) {
    return res.status(400).json({ success: false, message: "Phone must have at least 10 digits." });
  }
  if (!isValidEmail(data.email)) {
    return res.status(400).json({ success: false, message: "Please enter a valid email." });
  }
  if (data.city && !isValidCity(data.city)) {
    return res.status(400).json({ success: false, message: "City should contain only letters." });
  }
  if (data.state && !isValidState(data.state)) {
    return res.status(400).json({ success: false, message: "State should contain only letters." });
  }
  if (data.zip && !isValidZip(data.zip)) {
    return res.status(400).json({ success: false, message: "Invalid PINCODE/ZIP format." });
  }

  /* Return 200 immediately – Gmail SMTP times out from Railway, so don't block the response */
  res.status(200).json({ success: true });

  /* Send emails in background (fire-and-forget) */
  (async () => {
    try {
      await transporter.sendMail({
        from: `"RGM Family" <${process.env.GMAIL_USER}>`,
        to: process.env.OWNER_EMAIL,
        subject: "New Driver Application - RGM Family",
        text: `
New Driver Application

Name: ${data.firstName} ${data.lastName}
Phone: ${data.primaryPhone}
Email: ${data.email}
License: ${data.license}

Applicant requests Google Meet interview.
      `,
      });
      await transporter.sendMail({
        from: `"RGM Family" <${process.env.GMAIL_USER}>`,
        to: data.email,
        subject: "Application Received - RGM Family",
        text: `Hi ${data.firstName},

Thank you for applying to RGM Family.
We have received your application and will contact you soon.

Best regards,
RGM Team`,
      });
    } catch (err) {
      console.error("❌ Apply Email (background):", err.message);
      console.log("📋 APPLICATION DATA:", JSON.stringify(data, null, 2));
    }
  })();
});

export default router;
