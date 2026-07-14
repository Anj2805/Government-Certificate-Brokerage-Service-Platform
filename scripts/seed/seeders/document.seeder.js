const Document = require('../../../src/modules/documents/document.model');
const DocumentStatus = require('../../../src/common/enums/document-status.enum');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

async function seedDocuments(requests) {
  console.log('Seeding Documents...');
  const documentDocs = [];

  for (const req of requests) {
    const requiredTypes = req.serviceSnapshot.requiredDocuments;
    if (!requiredTypes || requiredTypes.length === 0) continue;

    const uploadedDocs = [];

    for (const type of requiredTypes) {
      const isVerified = req.status === 'approved' || req.status === 'completed' || req.status === 'ready_for_dispatch' || req.status === 'in_transit' || req.status === 'out_for_delivery';
      const isRejected = req.status === 'correction_required' && Math.random() > 0.5;

      const docStatus = isVerified ? DocumentStatus.VERIFIED : (isRejected ? DocumentStatus.REJECTED : DocumentStatus.PENDING);
      
      const fileName = `${type}-demo.pdf`;
      const filePath = path.join(__dirname, '..', 'assets', fileName);
      
      // Make sure the dummy pdf exists (it should be generated)
      const size = fs.existsSync(filePath) ? fs.statSync(filePath).size : 10240;

      const doc = await Document.findOneAndUpdate(
        { request: req._id, documentType: type },
        {
          title: `${type.replace('-', ' ').toUpperCase()}`,
          documentType: type,
          originalName: fileName,
          filename: `${Date.now()}-${Math.random().toString(36).substring(7)}-${fileName}`,
          storageProvider: 'local',
          mimeType: 'application/pdf',
          size: size,
          path: `seed/assets/${fileName}`, // Safe demo storage path simulation
          uploadedBy: req.citizen,
          ownerUser: req.citizen,
          request: req._id,
          status: docStatus,
          verifiedAt: isVerified ? req.assignedAt : undefined,
          verifiedBy: isVerified ? req.assignedAgent : undefined,
          rejectedAt: isRejected ? req.assignedAt : undefined,
          rejectedBy: isRejected ? req.assignedAgent : undefined,
          rejectionReason: isRejected ? 'Document is blurry or illegible.' : undefined,
          hash: crypto.createHash('sha256').update(`${req._id}-${type}`).digest('hex')
        },
        { upsert: true, new: true }
      );
      
      documentDocs.push(doc);
      uploadedDocs.push(doc._id);
    }

    // Agent uploaded documents for completed requests
    if (req.status === 'completed' && req.assignedAgent) {
      const agentDocTypes = ['verification_report', 'agent_notes', 'additional_proof', 'final_certification'];
      for (const aType of agentDocTypes) {
        const aFileName = `agent-${aType}-demo.pdf`;
        const agentDoc = await Document.findOneAndUpdate(
          { request: req._id, documentType: aType },
          {
            title: `${aType.replace('_', ' ').toUpperCase()}`,
            documentType: aType,
            originalName: aFileName,
            filename: `${Date.now()}-${Math.random().toString(36).substring(7)}-${aFileName}`,
            storageProvider: 'local',
            mimeType: 'application/pdf',
            size: 10240,
            path: `seed/assets/dummy.pdf`, 
            uploadedBy: req.assignedAgent, 
            ownerUser: req.citizen, 
            request: req._id,
            status: DocumentStatus.VERIFIED,
            verifiedAt: req.assignedAt,
            verifiedBy: req.assignedAgent,
            hash: crypto.createHash('sha256').update(`${req._id}-${aType}-agent`).digest('hex')
          },
          { upsert: true, new: true }
        );
        documentDocs.push(agentDoc);
        uploadedDocs.push(agentDoc._id);
      }
    }

    // Attach documents to request
    if (uploadedDocs.length > 0) {
      req.documents = uploadedDocs;
      await req.save();
    }
  }

  console.log(`Seeded ${documentDocs.length} Documents.`);
  return documentDocs;
}

module.exports = { seedDocuments };
