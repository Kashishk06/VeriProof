/**
 * VeriProof Email Dispatch Service
 * Handles credential delivery to recipients via backend email gateway.
 */

export interface EmailPayload {
  recipientName: string;
  recipientEmail: string;
  documentId: string;
  documentTitle: string;
  verificationUrl: string;
  qrPayload?: string;
  fileName: string;
  issuerOrg: string;
}

export interface EmailSendResult {
  success: boolean;
  status: 'SENT' | 'FAILED' | 'UNAVAILABLE';
  message: string;
  details?: string;
}

export const formatEmailTemplate = (payload: EmailPayload) => {
  return {
    subject: 'Your Verified Document — VeriProof',
    body: `Dear ${payload.recipientName},

Your document has been issued through VeriProof.

Document ID: ${payload.documentId}

Please find your protected document attached (${payload.fileName}). Use the provided verification link or QR code, if available, to verify the document.

Verification Link: ${payload.verificationUrl}

Regards,
VeriProof`
  };
};

export const sendDocumentEmail = async (payload: EmailPayload): Promise<EmailSendResult> => {
  // 1. Verify recipient email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!payload.recipientEmail || !emailRegex.test(payload.recipientEmail.trim())) {
    return {
      success: false,
      status: 'FAILED',
      message: `Invalid recipient email address: '${payload.recipientEmail || 'empty'}'`,
      details: 'Please provide a valid recipient email format before requesting dispatch.'
    };
  }

  // 2. Resolve configured endpoint
  const endpoint = (window as any).__EMAIL_SERVICE_ENDPOINT__ || '/api/v1/email/send';

  try {
    const template = formatEmailTemplate(payload);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: payload.recipientEmail.trim(),
        subject: template.subject,
        body: template.body,
        documentId: payload.documentId,
        verificationUrl: payload.verificationUrl,
        attachmentName: payload.fileName,
        issuerOrg: payload.issuerOrg
      })
    });

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        success: true,
        status: 'SENT',
        message: `Email successfully delivered to ${payload.recipientEmail}.`,
        details: data.message || 'Confirmed by backend mail gateway.'
      };
    } else {
      return {
        success: false,
        status: 'FAILED',
        message: `Email dispatch failed: Server returned HTTP ${response.status}.`,
        details: `Endpoint ${endpoint} failed. Please verify mail server credentials.`
      };
    }
  } catch (err: any) {
    // Expected when no backend is running on /api/v1/email/send
    return {
      success: false,
      status: 'UNAVAILABLE',
      message: `Email Service Unavailable: No backend mail gateway is configured (${endpoint}).`,
      details: 'Email dispatch requires configuring an authorized backend SMTP relay or API gateway.'
    };
  }
};
