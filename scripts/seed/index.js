require('dotenv').config();
const mongoose = require('mongoose');
const { seedUsers } = require('./seeders/user.seeder');
const { seedServices } = require('./seeders/service.seeder');
const { seedRequests } = require('./seeders/request.seeder');
const { seedDocuments } = require('./seeders/document.seeder');
const { seedNotifications } = require('./seeders/notification.seeder');
const { generateAssets } = require('./assets/dummy-pdf');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI;

async function checkSafety() {
  if (process.env.NODE_ENV === 'production') {
    console.error('CRITICAL: Refusing to run seed script in production environment.');
    process.exit(1);
  }

  if (!MONGODB_URI) {
    console.error('CRITICAL: MONGODB_URI is not set.');
    process.exit(1);
  }

  // Enforce test/demo string in the URI unless forced
  const isSafeDB = MONGODB_URI.toLowerCase().includes('test') || MONGODB_URI.toLowerCase().includes('demo') || MONGODB_URI.includes('localhost') || MONGODB_URI.includes('127.0.0.1');
  const isReset = process.argv.includes('--reset');
  const isForceUnsafe = process.argv.includes('--force-unsafe');

  if (isReset && !isSafeDB && !isForceUnsafe) {
    console.error('CRITICAL: The database URI does not appear to be a test or demo database.');
    console.error('Refusing to execute destructive --reset command.');
    console.error('If you are absolutely certain, pass --force-unsafe along with --reset.');
    process.exit(1);
  }
}

async function dropCollections() {
  console.log('Resetting Database Collections...');
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
  console.log('Database reset complete.');
}

function generateManifest(data) {
  const manifestPath = path.join(__dirname, '..', '..', 'SHOWCASE_ACCOUNTS.md');
  const content = `# DEMO / DEVELOPMENT CREDENTIALS ONLY
**DO NOT USE THESE PASSWORDS IN PRODUCTION**

## Architecture Seed Manifest
Generated At: ${new Date().toISOString()}

### Overview
- Citizens: ${data.citizens.length}
- Agents: ${data.agents.length}
- Admins: 1
- Services: ${data.services.length}
- Requests: ${data.requests.length}
- Documents: ${data.documents.length}
- Payments: ${data.payments.length}
- Deliveries: ${data.deliveries.length}
- Notifications: ${data.notifications.length}

## Demo Accounts Reference

All seeded accounts use the password: \`Abcd@123\`

### Admin
| Name | Email | Scenario |
|------|-------|----------|
| Demo Admin | admin.demo@sevasetu.example | Full dashboard analytics and settings access |

### Agents
| Name | Email | Designation |
|------|-------|-------------|
${data.agents.map(a => `| ${a.firstName} ${a.lastName} | ${a.email} | ${a.designation} |`).join('\n')}

### Citizens
| Name | Email | Note |
|------|-------|------|
${data.citizens.map(c => `| ${c.firstName} ${c.lastName} | ${c.email} | Diverse workflow stages |`).join('\n')}

`;

  fs.writeFileSync(manifestPath, content);
  console.log('Manifest written to SHOWCASE_ACCOUNTS.md');
}

async function runSeeder() {
  try {
    await checkSafety();
    const isReset = process.argv.includes('--reset');
    
    console.log(`Connecting to ${MONGODB_URI.replace(/:([^:@]+)@/, ':****@')} ...`);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to Database.');

    if (isReset) {
      await dropCollections();
    }

    // 1. Generate Static Assets
    await generateAssets();

    // 2. Users (Admin, Agents, Citizens)
    const { agents, citizens } = await seedUsers();

    const adminUser = await mongoose.model('User').findOne({ role: 'admin' });

    // 3. Services
    const services = await seedServices(adminUser._id);

    // 4. Requests (Payments & Deliveries are interleaved)
    const { requestDocs, paymentDocs, deliveryDocs } = await seedRequests(citizens, agents, services, adminUser);

    // 5. Documents
    const documents = await seedDocuments(requestDocs);

    // 6. Notifications
    const notifications = await seedNotifications(requestDocs, adminUser);

    // 7. Write Manifest
    generateManifest({
      agents, citizens, services, requests: requestDocs, documents,
      payments: paymentDocs, deliveries: deliveryDocs, notifications
    });

    console.log('Showcase Seed System executed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error executing seeder:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  const isShowcase = process.argv.includes('--showcase');
  if (isShowcase) {
    runSeeder();
  } else {
    console.log('No supported seed flag passed. Try: node scripts/seed/index.js --showcase');
    process.exit(0);
  }
}
