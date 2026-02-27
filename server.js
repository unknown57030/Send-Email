const express = require("express");
const nodemailer = require("nodemailer");
const multer = require("multer");
const fs = require("fs");

const app = express();
app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
});

app.post("/send-email", upload.single("pdf"), async (req, res) => {
  try {
    const { emails, subject, description } = req.body;
    const emailList = emails.split(",").map(e => e.trim());

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    for (const email of emailList) {
      let mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject,
        text: description,
        attachments: [],
      };

      if (req.file) {
        mailOptions.attachments.push({
          filename: req.file.originalname,
          path: req.file.buffer,
          contentType: "application/pdf",
        });
      }

      await transporter.sendMail(mailOptions);
    }

    res.send("✅ Email sent successfully!");
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).send("❌ Failed to send email.");
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
