import fs from "fs";
import path from "path";
import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

app.post("/apply", async (req, res) => {
  try {
    const data = req.body;

    const mailOptions = {
      from: `"RGM Family" <${process.env.GMAIL_USER}>`,
      to: process.env.OWNER_EMAIL,
      subject: "New Driver Application - RGM Family",
      text: `
RGM FAMILY DRIVER APPLICATION

Name: ${data.firstName} ${data.middleName} ${data.lastName}
Email: ${data.email}
Primary Phone: ${data.primaryPhone}
License Number: ${data.license}

Applicant has requested a virtual meeting via Google Meet.
Please reply with available time and meeting link.
`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Application sent successfully" });
  } catch (error) {
    console.error("Email Error:", error);
    res.status(500).json({ message: "Failed to send application" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
