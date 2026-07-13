const Service = require('../../../src/modules/services/service.model');

const SERVICES = [
  { name: 'Income Certificate', category: 'certificates', estimatedProcessingDays: 7, serviceCharge: 100, requiredDocuments: ['identity-proof', 'income-proof'] },
  { name: 'Birth Certificate', category: 'certificates', estimatedProcessingDays: 14, serviceCharge: 0, requiredDocuments: ['identity-proof', 'hospital-record'] },
  { name: 'Death Certificate', category: 'certificates', estimatedProcessingDays: 14, serviceCharge: 0, requiredDocuments: ['identity-proof', 'hospital-record'] },
  { name: 'Caste Certificate', category: 'certificates', estimatedProcessingDays: 21, serviceCharge: 150, requiredDocuments: ['identity-proof', 'residence-proof', 'caste-proof'] },
  { name: 'Residence Certificate', category: 'certificates', estimatedProcessingDays: 10, serviceCharge: 50, requiredDocuments: ['identity-proof', 'residence-proof'] },
  { name: 'Domicile Certificate', category: 'certificates', estimatedProcessingDays: 15, serviceCharge: 200, requiredDocuments: ['identity-proof', 'residence-proof', 'birth-record'] },
  { name: 'Marriage Certificate', category: 'certificates', estimatedProcessingDays: 20, serviceCharge: 300, requiredDocuments: ['identity-proof', 'marriage-proof'] },
  { name: 'Character Certificate', category: 'verification', estimatedProcessingDays: 30, serviceCharge: 500, requiredDocuments: ['identity-proof', 'residence-proof'] },
  { name: 'Senior Citizen Certificate', category: 'certificates', estimatedProcessingDays: 7, serviceCharge: 0, requiredDocuments: ['identity-proof', 'age-proof'] },
  { name: 'Property Mutation Request', category: 'property', estimatedProcessingDays: 45, serviceCharge: 1000, requiredDocuments: ['identity-proof', 'property-deed', 'tax-receipt'] },
  { name: 'Trade License Application', category: 'business', estimatedProcessingDays: 30, serviceCharge: 2000, requiredDocuments: ['identity-proof', 'business-proof', 'tax-receipt'] },
  { name: 'Water Connection Application', category: 'utility', estimatedProcessingDays: 15, serviceCharge: 500, requiredDocuments: ['identity-proof', 'residence-proof'] },
  { name: 'Document Attestation Service', category: 'verification', estimatedProcessingDays: 3, serviceCharge: 100, requiredDocuments: ['identity-proof', 'document-to-attest'] },
  { name: 'Pension Application Assistance', category: 'welfare', estimatedProcessingDays: 25, serviceCharge: 0, requiredDocuments: ['identity-proof', 'age-proof', 'bank-passbook'] },
  { name: 'Disability Certificate Assistance', category: 'welfare', estimatedProcessingDays: 20, serviceCharge: 0, requiredDocuments: ['identity-proof', 'medical-record'] }
];

async function seedServices(adminId) {
  console.log('Seeding Services...');
  const serviceDocs = [];

  for (const s of SERVICES) {
    const doc = await Service.findOneAndUpdate(
      { name: s.name },
      {
        ...s,
        description: `Official application for ${s.name}`,
        isActive: true,
        requiresIdVerification: true,
        createdBy: adminId
      },
      { upsert: true, new: true }
    );
    serviceDocs.push(doc);
  }

  console.log(`Seeded ${serviceDocs.length} Services.`);
  return serviceDocs;
}

module.exports = { seedServices };
