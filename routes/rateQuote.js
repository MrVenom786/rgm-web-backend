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
const isValidWebsite = (v) => {
  if (!v) return false;
  const url = String(v).trim();
  if (!url.startsWith("http")) return /^[a-zA-Z0-9][a-zA-Z0-9-.]*\.[a-zA-Z]{2,}$/.test(url);
  try { new URL(url); return true; } catch { return false; }
};

/* ============================= */
/* RATE QUOTE ROUTE */
/* ============================= */

router.post("/", async (req, res) => {
  const body = req.body;
  const name = (body.name || "").trim();
  const phone = (body.phone || "").trim();
  const email = (body.email || "").trim();
  const company = body.company || body.companyName || "N/A";
  const website = body.website || body.companyWebsite || "N/A";
  const customerType = body.customerType || "N/A";
  const commodity = body.commodity || "N/A";
  const dollarValue = body.dollarValue || body.shipmentValue || "N/A";
  const frequency = body.frequency || body.shipmentFrequency || "N/A";
  const details = body.details || body.freightDetails || "N/A";

  if (!name || !phone || !email) {
    return res.status(400).json({
      success: false,
      message: "Required fields missing",
    });
  }

  if (!isValidName(name)) {
    return res.status(400).json({ success: false, message: "Name should contain only letters." });
  }
  if (!isValidPhone(phone)) {
    return res.status(400).json({ success: false, message: "Phone must have at least 10 digits." });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, message: "Please enter a valid email." });
  }
  if (website !== "N/A" && !isValidWebsite(website)) {
    return res.status(400).json({ success: false, message: "Invalid website URL format." });
  }

  const quoteData = {
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
  };

  /* Return 200 immediately – Gmail SMTP times out from Railway, so don't block the response */
  res.status(200).json({ success: true });

  /* Send emails in background (fire-and-forget) */
  (async () => {
    try {
      await transporter.sendMail({
        from: `"RGM Logistics" <${process.env.GMAIL_USER}>`,
        to: process.env.OWNER_EMAIL,
        subject: "🚛 New Rate Quote Request",
        html: `
          <h2>New Rate Quote Request</h2>
          <p><b>Company:</b> ${company}</p>
          <p><b>Website:</b> ${website}</p>
          <p><b>Name:</b> ${name}</p>
          <p><b>Phone:</b> ${phone}</p>
          <p><b>Email:</b> ${email}</p>
          <p><b>Customer Type:</b> ${customerType}</p>
          <p><b>Commodity:</b> ${commodity}</p>
          <p><b>Dollar Value:</b> ${dollarValue}</p>
          <p><b>Shipment Frequency:</b> ${frequency}</p>
          <p><b>Details:</b> ${details}</p>
        `,
      });
      await transporter.sendMail({
        from: `"RGM Logistics" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: "We Received Your Rate Quote Request",
        text: `Hello ${name},\n\nThank you for requesting a rate quote with RGM Logistics.\nOur team is reviewing your freight details and will contact you shortly.\n\n– RGM Logistics`,
      });
    } catch (err) {
      console.error("❌ Rate Quote Email (background):", err.message);
      console.log("📋 RATE QUOTE DATA:", JSON.stringify(quoteData, null, 2));
    }
  })();
});

export default router;
