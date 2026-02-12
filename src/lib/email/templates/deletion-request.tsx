import React from "react";

type DeletionRequestEmailProps = {
  token: string;
};

export const DeletionRequestEmail = ({ token }: DeletionRequestEmailProps): React.ReactElement => {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", lineHeight: 1.6, color: "#1f2933" }}>
      <h1 style={{ fontSize: "20px", marginBottom: "12px" }}>Confirm data deletion</h1>
      <p>
        We received a request to delete your personal data from TruFlow. To confirm, use the
        verification token below:
      </p>
      <p style={{ fontSize: "16px", fontWeight: "bold" }}>{token}</p>
      <p>This token expires in 1 hour.</p>
      <p>If you did not request this, you can safely ignore this email.</p>
    </div>
  );
};
