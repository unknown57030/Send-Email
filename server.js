const express = require("express");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cookieParser = require("cookie-parser");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const upload = multer({
  storage: multer.memoryStorage(),
});

app.use((req, res, next) => {
  const publicPaths = [
    "/login.html",
    "/login",
    "/favicon.ico"
  ];

  if (publicPaths.includes(req.path)) {
    return next();
  }
  const token = req.cookies?.auth;
  if (!token || token !== process.env.SITE_SECRET) {
    return res.redirect("/login.html"); // You must create this file
  }
  next();
});

app.use(express.static(path.join(__dirname, "public")));

app.post("/login", (req, res) => {
  const { secret } = req.body;
  if (secret === process.env.SITE_SECRET) {
    res.cookie("auth", secret, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
    });
    return res.json({ success: true });
  }
  res.status(401).json({ success: false });
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
          content: req.file.buffer,
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
