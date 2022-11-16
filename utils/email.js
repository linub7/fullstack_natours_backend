const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  // 2) Define Email Options
  const mailOptions = {
    from: 'Mohammad Hadi<hello@mohammad.io>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html: TODO
  };
  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
