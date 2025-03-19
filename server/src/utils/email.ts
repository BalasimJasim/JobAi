import nodemailer from 'nodemailer';
import { config } from 'dotenv';

config();

// Create reusable transporter
const createTransporter = () => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email configuration is missing. Please check your environment variables.');
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Add TLS options for security
    tls: {
      // Do not fail on invalid certificates
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  });
};

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    console.log('Attempting to send email to:', options.to);
    
    if (!process.env.EMAIL_FROM) {
      throw new Error('EMAIL_FROM environment variable is not set');
    }

    const transporter = createTransporter();

    // Verify SMTP connection configuration
    await transporter.verify();
    console.log('SMTP connection verified successfully');

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    
    // Close the connection pool
    transporter.close();
  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Email options:', {
      to: options.to,
      subject: options.subject,
      from: process.env.EMAIL_FROM
    });
    throw new Error(
      error instanceof Error 
        ? `Failed to send email: ${error.message}`
        : 'Failed to send email'
    );
  }
}

export default {
  sendEmail,
}; 