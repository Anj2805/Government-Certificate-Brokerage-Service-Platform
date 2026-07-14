#!/usr/bin/env node

const dotenv = require('dotenv');
const mongoose = require('mongoose');
const UserRoles = require('../src/common/enums/user-roles.enum');
const Service = require('../src/modules/services/service.model');
const User = require('../src/modules/users/user.model');

dotenv.config();

const ADMIN_EMAIL = 'admin@example.com';

const services = [
  {
    name: 'Income Certificate',
    category: 'certificate',
    description: 'Government income certificate application and brokerage support service.',
    requiredDocuments: ['identity_proof', 'address_proof', 'income_proof', 'passport_size_photo'],
    estimatedProcessingDays: 7,
    serviceCharge: 200,
    isActive: true,
  },
  {
    name: 'Birth Certificate',
    category: 'certificate',
    description: 'Birth certificate application support and document processing service.',
    requiredDocuments: ['hospital_birth_record', 'parent_identity_proof', 'address_proof'],
    estimatedProcessingDays: 10,
    serviceCharge: 150,
    isActive: true,
  },
  {
    name: 'Caste Certificate',
    category: 'certificate',
    description: 'Caste certificate application support service with document verification guidance.',
    requiredDocuments: ['identity_proof', 'address_proof', 'caste_proof', 'family_certificate'],
    estimatedProcessingDays: 14,
    serviceCharge: 250,
    isActive: true,
  },
  {
    name: 'Domicile Certificate',
    category: 'certificate',
    description: 'Domicile certificate application support for residence verification.',
    requiredDocuments: ['identity_proof', 'address_proof', 'residence_proof', 'passport_size_photo'],
    estimatedProcessingDays: 12,
    serviceCharge: 220,
    isActive: true,
  },
  {
    name: 'PAN Service',
    category: 'identity',
    description: 'PAN application and correction support service.',
    requiredDocuments: ['identity_proof', 'address_proof', 'date_of_birth_proof', 'passport_size_photo'],
    estimatedProcessingDays: 15,
    serviceCharge: 300,
    isActive: true,
  },
  {
    name: 'Aadhaar Service',
    category: 'identity',
    description: 'Aadhaar enrolment and update support service.',
    requiredDocuments: ['identity_proof', 'address_proof', 'date_of_birth_proof'],
    estimatedProcessingDays: 10,
    serviceCharge: 180,
    isActive: true,
  },
];

const connectDatabase = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required to run seeders');
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE) || 10,
    serverSelectionTimeoutMS: 10000,
  });
};

const getAdminUser = async () => {
  const admin = await User.findOne({
    email: ADMIN_EMAIL,
    role: UserRoles.ADMIN,
    isActive: true,
  });

  if (!admin) {
    throw new Error(`Active admin not found. Run "npm run seed:admin" first.`);
  }

  return admin;
};

const toServiceModelPayload = (service, adminId) => ({
  name: service.name,
  category: service.category,
  description: service.description,
  requiredDocuments: service.requiredDocuments,
  estimatedProcessingDays: service.estimatedProcessingDays,
  serviceCharge: service.serviceCharge,
  isActive: service.isActive,
  createdBy: adminId,
  updatedBy: adminId,
  deletedAt: null,
});

const seedServices = async () => {
  const admin = await getAdminUser();
  const results = [];

  for (const service of services) {
    const payload = toServiceModelPayload(service, admin._id);

    const seededService = await Service.findOneAndUpdate(
      {
        name: service.name,
        category: service.category,
        deletedAt: null,
      },
      { $set: payload },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    results.push(seededService);
  }

  return results;
};

const run = async () => {
  try {
    await connectDatabase();
    const seededServices = await seedServices();
    console.log(`Services seeded: ${seededServices.length}`);
    seededServices.forEach((service) => console.log(`- ${service.name}`));
  } catch (error) {
    console.error('Failed to seed services:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();
