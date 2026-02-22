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
});

/* ============================= */
/* APPLY ROUTE */
/* ============================= */

router.post("/", async (req, res) => {
  try {
    const data = req.body;

    if (!data.firstName || !data.lastName || !data.email || !data.primaryPhone) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Send to owner
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

    // Confirmation email to applicant
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

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("❌ Apply Route Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit application",
    });
  }
});

export default router;
