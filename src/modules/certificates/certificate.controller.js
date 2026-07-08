const httpStatus = require('http-status');
const ApiResponse = require('../../common/responses/api-response');
const asyncHandler = require('../../utils/async-handler');
const certificateService = require('./certificate.service');

const downloadCertificate = asyncHandler(async (req, res) => {
  const certificate = await certificateService.downloadCertificate(req.params.id, req.user);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Certificate-${certificate.publicVerificationId}.pdf"`);
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const pdfStream = certificateService.generateCertificatePdfStream(certificate);
  pdfStream.pipe(res);
});

const verifyPublicCertificate = asyncHandler(async (req, res) => {
  const result = await certificateService.verifyPublicCertificate(req.params.publicVerificationId);

  return ApiResponse.success(res, {
    message: result.valid ? 'Certificate is valid' : 'Certificate is invalid or not found',
    data: result,
  });
});

module.exports = {
  downloadCertificate,
  verifyPublicCertificate,
};
