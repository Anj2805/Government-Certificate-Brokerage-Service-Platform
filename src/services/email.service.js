const nodemailer = require('nodemailer');
const config = require('../config');

const capturedMessages = [];
const capturedVerificationMessages = [];
const capturedGenericMessages = []; // For idempotency checks

const deliveredIdempotencyKeys = new Set(); // For idempotency checks

const createTransport = () => {
  if (config.isProduction) {
    if (!config.email.smtp.host || !config.email.smtp.user || !config.email.smtp.pass) {
      throw new Error('SMTP configuration is required in production');
    }

    return nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.secure,
      auth: {
        user: config.email.smtp.user,
        pass: config.email.smtp.pass,
      },
    });
  }

  return nodemailer.createTransport({
    jsonTransport: true,
  });
};

let simulateFailure = false;

const sendPasswordResetEmail = async ({ to, resetUrl, expiresInMinutes }) => {
  if (simulateFailure) {
    throw new Error('Simulated email delivery failure');
  }

  const transporter = createTransport();
  const info = await transporter.sendMail({
    from: config.email.from,
    to,
    subject: 'Reset your SevaSetu password',
    text: [
      'A password reset was requested for your SevaSetu account.',
      `This link expires in ${expiresInMinutes} minutes.`,
      '',
      resetUrl,
      '',
      'If you did not request this change, you can ignore this email.',
    ].join('\n'),
  });

  if (!config.isProduction) {
    capturedMessages.push({
      to,
      resetUrl,
      expiresInMinutes,
      messageId: info.messageId,
      sentAt: new Date(),
    });
  }

  return info;
};

const sendEmailVerificationEmail = async ({ to, verificationUrl, expiresInHours }) => {
  if (simulateFailure) {
    throw new Error('Simulated email delivery failure');
  }

  const transporter = createTransport();
  const info = await transporter.sendMail({
    from: config.email.from,
    to,
    subject: 'Verify your SevaSetu email address',
    text: [
      'Welcome to SevaSetu!',
      'Please verify your email address by clicking the link below:',
      '',
      verificationUrl,
      '',
      `This link expires in ${expiresInHours} hours.`,
      '',
      'If you did not request this, you can safely ignore this email.',
    ].join('\n'),
  });

  if (!config.isProduction) {
    capturedVerificationMessages.push({
      to,
      verificationUrl,
      expiresInHours,
      messageId: info.messageId,
      sentAt: new Date(),
    });
  }

  return info;
};

const getCapturedPasswordResetMessages = () => {
  if (config.isProduction) {
    return [];
  }

  return [...capturedMessages];
};

const clearCapturedPasswordResetMessages = () => {
  capturedMessages.length = 0;
};

const getCapturedVerificationMessages = () => {
  if (config.isProduction) {
    return [];
  }
  return [...capturedVerificationMessages];
};

const clearCapturedVerificationMessages = () => {
  capturedVerificationMessages.length = 0;
};

const getCapturedGenericMessages = () => {
  if (config.isProduction) return [];
  return [...capturedGenericMessages];
};

const clearCapturedGenericMessages = () => {
  capturedGenericMessages.length = 0;
  deliveredIdempotencyKeys.clear();
};

const sendEmail = async ({ to, subject, text, providerIdempotencyKey }) => {
  if (simulateFailure) {
    throw new Error('Simulated email delivery failure');
  }

  // Deduplicate using providerIdempotencyKey
  if (!config.isProduction && providerIdempotencyKey) {
    if (deliveredIdempotencyKeys.has(providerIdempotencyKey)) {
      // Return a simulated success response because it was already sent
      return { messageId: `idemp-sim-${providerIdempotencyKey}`, status: 'deduplicated' };
    }
  }

  const transporter = createTransport();
  const info = await transporter.sendMail({
    from: config.email.from,
    to,
    subject,
    text,
  });

  if (!config.isProduction) {
    if (providerIdempotencyKey) {
      deliveredIdempotencyKeys.add(providerIdempotencyKey);
    }
    capturedGenericMessages.push({
      to,
      subject,
      text,
      providerIdempotencyKey,
      messageId: info.messageId,
      sentAt: new Date(),
    });
  }

  return info;
};

const setSimulateFailure = (value) => {
  if (!config.isProduction) {
    simulateFailure = value;
  }
};

module.exports = {
  clearCapturedPasswordResetMessages,
  getCapturedPasswordResetMessages,
  sendPasswordResetEmail,
  sendEmailVerificationEmail,
  getCapturedVerificationMessages,
  clearCapturedVerificationMessages,
  setSimulateFailure,
  sendEmail,
  getCapturedGenericMessages,
  clearCapturedGenericMessages,
};
