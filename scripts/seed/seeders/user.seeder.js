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
    const isApproved = agent.agentStatus === AgentStatus.APPROVED;
    const isHighPerf = agent.scenarioType === 'HIGH_PERFORMANCE';
    const doc = await User.findOneAndUpdate(
      { email: agent.email },
      {
        ...agent,
        password: passwordHash,
        role: UserRoles.AGENT,
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        agentStatus: agent.agentStatus || AgentStatus.APPROVED,
        agentReviewedAt: isApproved ? new Date() : undefined,
        agentIdentifier: `AGT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random()*1000)}`,
        profilePhoto: isHighPerf ? 'https://ui-avatars.com/api/?name=' + agent.firstName + '+' + agent.lastName + '&background=random' : undefined
      },
      { upsert: true, new: true }
    );
    doc.scenarioType = agent.scenarioType;
    doc.purpose = agent.purpose;
    agentDocs.push(doc);
  }

  // 3. Citizens
  const citizenDocs = [];
  for (const citizen of CITIZENS) {
    const isExperienced = citizen.scenarioType === 'EXPERIENCED_ACTIVE';
    const doc = await User.findOneAndUpdate(
      { email: citizen.email },
      {
        ...citizen,
        password: passwordHash,
        role: UserRoles.CITIZEN,
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        phone: citizen.phone,
        profilePhoto: isExperienced ? 'https://ui-avatars.com/api/?name=' + citizen.firstName + '+' + citizen.lastName + '&background=random' : undefined,
        idProofStatus: isExperienced ? 'verified' : 'unverified',
        idProofVerifiedAt: isExperienced ? new Date() : undefined
      },
      { upsert: true, new: true }
    );
    doc.scenarioType = citizen.scenarioType;
    doc.purpose = citizen.purpose;
    citizenDocs.push(doc);
  }

  console.log(`Seeded 1 Admin, ${agentDocs.length} Agents, ${citizenDocs.length} Citizens.`);
  
  return {
    agents: agentDocs,
    citizens: citizenDocs
  };
}

module.exports = { seedUsers };
