export const getPasswordResetEmailTemplate = (resetLink: string) => {
  return {
    subject: 'Reset Your JobAI Password',
    text: `
      You requested to reset your password for your JobAI account.
      
      Please click the following link to reset your password:
      ${resetLink}
      
      This link will expire in 1 hour.
      
      If you did not request this password reset, please ignore this email.
      
      Best regards,
      The JobAI Team
    `,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              font-family: Arial, sans-serif;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #3b82f6;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Reset Your Password</h1>
            <p>You requested to reset your password for your JobAI account.</p>
            <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
            <a href="${resetLink}" class="button">Reset Password</a>
            <p>If you did not request this password reset, please ignore this email.</p>
            <p>If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
            <p style="word-break: break-all;">${resetLink}</p>
            <div class="footer">
              <p>Best regards,<br>The JobAI Team</p>
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `
  };
};

export const getEmailVerificationTemplate = (verificationLink: string, userName: string) => {
  return `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <h2 style="color: #2563eb; margin-bottom: 20px;">Welcome to JobAI!</h2>
      <p>Hello ${userName},</p>
      <p>Thank you for registering with JobAI. Please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationLink}" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Verify Email Address
        </a>
      </div>
      <p>This verification link will expire in 1 hour.</p>
      <p>If you did not create an account, please ignore this email.</p>
      <p>Best regards,<br>The JobAI Team</p>
    </div>
  `;
}; 