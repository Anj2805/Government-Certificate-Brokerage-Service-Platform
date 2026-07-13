const User = require('../../../src/modules/users/user.model');
const { hashPassword } = require('../../../src/modules/auth/password.util');
const UserRoles = require('../../../src/common/enums/user-roles.enum');
const AgentStatus = require('../../../src/common/enums/agent-status.enum');
const { TEST_PASSWORD, ADMIN, AGENTS, CITIZENS } = require('../config');

async function seedUsers() {
  console.log('Seeding Users...');
  const passwordHash = await hashPassword(TEST_PASSWORD);

  // 1. Admin
  await User.findOneAndUpdate(
    { email: ADMIN.email },
    {
      ...ADMIN,
      password: passwordHash,
      role: UserRoles.ADMIN,
      isActive: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  // 2. Agents
  const agentDocs = [];
  for (const agent of AGENTS) {
    const doc = await User.findOneAndUpdate(
      { email: agent.email },
      {
        ...agent,
        password: passwordHash,
        role: UserRoles.AGENT,
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        agentStatus: AgentStatus.APPROVED,
        agentReviewedAt: new Date(),
        agentIdentifier: `AGT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random()*1000)}`
      },
      { upsert: true, new: true }
    );
    agentDocs.push(doc);
  }

  // 3. Citizens
  const citizenDocs = [];
  for (const citizen of CITIZENS) {
    const doc = await User.findOneAndUpdate(
      { email: citizen.email },
      {
        ...citizen,
        password: passwordHash,
        role: UserRoles.CITIZEN,
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
      { upsert: true, new: true }
    );
    citizenDocs.push(doc);
  }

  console.log(`Seeded 1 Admin, ${agentDocs.length} Agents, ${citizenDocs.length} Citizens.`);
  
  return {
    agents: agentDocs,
    citizens: citizenDocs
  };
}

module.exports = { seedUsers };
