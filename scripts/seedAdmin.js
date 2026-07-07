#!/usr/bin/env node

const dotenv = require('dotenv');
const mongoose = require('mongoose');
const UserRoles = require('../src/common/enums/user-roles.enum');
const User = require('../src/modules/users/user.model');
const { hashPassword } = require('../src/modules/auth/password.util');

dotenv.config();

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'Admin@123';

const connectDatabase = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required to run seeders');
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE) || 10,
    serverSelectionTimeoutMS: 10000,
  });
};

const seedAdmin = async () => {
  const password = await hashPassword(ADMIN_PASSWORD);

  const admin = await User.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    {
      $set: {
        firstName: 'System',
        lastName: 'Admin',
        email: ADMIN_EMAIL,
        password,
        role: UserRoles.ADMIN,
        isActive: true,
      },
      $unset: {
        agentStatus: '',
        agentReviewedAt: '',
        agentReviewedBy: '',
        agentRejectionReason: '',
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  return admin;
};

const run = async () => {
  try {
    await connectDatabase();
    const admin = await seedAdmin();
    console.log(`Admin seeded: ${admin.email}`);
  } catch (error) {
    console.error('Failed to seed admin:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();
