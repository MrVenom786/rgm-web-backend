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
/* RATE QUOTE ROUTE */
/* ============================= */

router.post("/", async (req, res) => {
  try {
    const {
      company,
      website,
      name,
      phone,
      email,
      customerType,
      commodity,
      dollarValue,
      frequency,
      details,
    } = req.body;

    if (!name || !phone || !email) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    /* EMAIL TO OWNER */
    await transporter.sendMail({
      from: `"RGM Logistics" <${process.env.GMAIL_USER}>`,
      to: process.env.OWNER_EMAIL,
      subject: "🚛 New Rate Quote Request",
      html: `
        <h2>New Rate Quote Request</h2>
        <p><b>Company:</b> ${company || "N/A"}</p>
        <p><b>Website:</b> ${website || "N/A"}</p>
        <p><b>Name:</b> ${name}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Customer Type:</b> ${customerType || "N/A"}</p>
        <p><b>Commodity:</b> ${commodity || "N/A"}</p>
        <p><b>Dollar Value:</b> ${dollarValue || "N/A"}</p>
        <p><b>Shipment Frequency:</b> ${frequency || "N/A"}</p>
        <p><b>Details:</b> ${details || "N/A"}</p>
      `,
    });

    /* AUTO-REPLY TO CUSTOMER */
    await transporter.sendMail({
      from: `"RGM Logistics" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "We Received Your Rate Quote Request",
      text: `Hello ${name},

Thank you for requesting a rate quote with RGM Logistics.
Our team is reviewing your freight details and will contact you shortly.

– RGM Logistics`,
    });

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("❌ Rate Quote Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit rate quote",
    });
  }
});

export default router;
