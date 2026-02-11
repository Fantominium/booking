import * as React from "react";

type PasswordResetEmailProps = {
  readonly resetLink: string;
  readonly expiresInMinutes: number;
};

export const PasswordResetEmail = ({
  resetLink,
  expiresInMinutes,
}: PasswordResetEmailProps): JSX.Element => {
  return (
    <html>
      <body style={{ fontFamily: "Arial, sans-serif", lineHeight: "1.6", color: "#333" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
          <h1
            style={{ color: "#2c3e50", borderBottom: "2px solid #3498db", paddingBottom: "10px" }}
          >
            Password Reset Request
          </h1>

          <p>Hello,</p>

          <p>
            We received a request to reset your password for your TruFlow Booking admin account. If
            you didn&apos;t make this request, you can safely ignore this email.
          </p>

          <p>To reset your password, click the button below:</p>

          <div style={{ textAlign: "center", margin: "30px 0" }}>
            <a
              href={resetLink}
              style={{
                display: "inline-block",
                padding: "12px 30px",
                backgroundColor: "#3498db",
                color: "#ffffff",
                textDecoration: "none",
                borderRadius: "5px",
                fontWeight: "bold",
              }}
            >
              Reset Password
            </a>
          </div>

          <p style={{ fontSize: "14px", color: "#7f8c8d" }}>
            Or copy and paste this link into your browser:
          </p>

          <p
            style={{
              fontSize: "14px",
              color: "#7f8c8d",
              wordBreak: "break-all",
              backgroundColor: "#ecf0f1",
              padding: "10px",
              borderRadius: "3px",
            }}
          >
            {resetLink}
          </p>

          <div
            style={{
              marginTop: "30px",
              padding: "15px",
              backgroundColor: "#fff3cd",
              border: "1px solid #ffc107",
              borderRadius: "5px",
            }}
          >
            <p style={{ margin: "0", fontSize: "14px", color: "#856404" }}>
              <strong>⚠️ Important:</strong> This link will expire in {expiresInMinutes} minutes.
              For security reasons, you&apos;ll need to request a new reset link after that time.
            </p>
          </div>

          <div style={{ marginTop: "30px", paddingTop: "20px", borderTop: "1px solid #ecf0f1" }}>
            <p style={{ fontSize: "12px", color: "#95a5a6" }}>
              If you didn&apos;t request a password reset, please contact your system administrator
              immediately, as this may indicate someone is trying to access your account.
            </p>

            <p style={{ fontSize: "12px", color: "#95a5a6", marginTop: "20px" }}>
              <strong>TruFlow Booking</strong>
              <br />
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
};

export const generatePasswordResetHtml = (props: PasswordResetEmailProps): string => {
  // Convert JSX to HTML string for email sending
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
      Password Reset Request
    </h1>

    <p>Hello,</p>

    <p>
      We received a request to reset your password for your TruFlow Booking admin account.
      If you didn't make this request, you can safely ignore this email.
    </p>

    <p>
      To reset your password, click the button below:
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${props.resetLink}" style="display: inline-block; padding: 12px 30px; background-color: #3498db; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Reset Password
      </a>
    </div>

    <p style="font-size: 14px; color: #7f8c8d;">
      Or copy and paste this link into your browser:
    </p>

    <p style="font-size: 14px; color: #7f8c8d; word-break: break-all; background-color: #ecf0f1; padding: 10px; border-radius: 3px;">
      ${props.resetLink}
    </p>

    <div style="margin-top: 30px; padding: 15px; background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 5px;">
      <p style="margin: 0; font-size: 14px; color: #856404;">
        <strong>⚠️ Important:</strong> This link will expire in ${props.expiresInMinutes} minutes.
        For security reasons, you'll need to request a new reset link after that time.
      </p>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
      <p style="font-size: 12px; color: #95a5a6;">
        If you didn't request a password reset, please contact your system administrator
        immediately, as this may indicate someone is trying to access your account.
      </p>

      <p style="font-size: 12px; color: #95a5a6; margin-top: 20px;">
        <strong>TruFlow Booking</strong><br>
        This is an automated message, please do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
`.trim();
};
