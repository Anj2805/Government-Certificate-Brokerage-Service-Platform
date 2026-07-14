const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../../src/modules/users/user.model');
const Request = require('../../src/modules/requests/request.model');
const Notification = require('../../src/modules/notifications/notification.model');
const Document = require('../../src/modules/documents/document.model');
const { CITIZENS, AGENTS, ADMIN, TEST_PASSWORD } = require('./config');
const { comparePassword } = require('../../src/modules/auth/password.util');

async function verifyShowcaseSeed() {
  console.log('\\n--- Starting Persona Verification ---');
  let errors = 0;

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to Database.');

    // 1. Verify Admin Persona
    console.log('\\nChecking Admin Persona...');
    const adminUser = await User.findOne({ email: ADMIN.email }).select('+password');
    if (!adminUser) throw new Error('Admin user missing');
    if (adminUser.role !== 'admin') throw new Error('Admin role incorrect');
    const pwdAdminMatch = await comparePassword(TEST_PASSWORD, adminUser.password);
    if (!pwdAdminMatch) throw new Error('Admin password mismatch');
    
    // Admin counts
    const adminRequestCount = await Request.countDocuments();
    if (adminRequestCount === 0) throw new Error('Admin cannot see requests');
    console.log('✅ Admin persona valid.');

    // 2. Verify Agent Personas
    console.log('\\nChecking Agent Personas...');
    for (const agentData of AGENTS) {
      const agentUser = await User.findOne({ email: agentData.email }).select('+password');
      if (!agentUser) { console.error(`❌ Missing agent: ${agentData.email}`); errors++; continue; }
      if (agentUser.role !== 'agent') { console.error(`❌ Agent role incorrect: ${agentData.email}`); errors++; continue; }
      const pwdMatch = await comparePassword(TEST_PASSWORD, agentUser.password);
      if (!pwdMatch) { console.error(`❌ Password mismatch: ${agentData.email}`); errors++; continue; }
      
      if (agentUser.agentStatus !== agentData.agentStatus) {
        console.error(`❌ Agent status mismatch: Expected ${agentData.agentStatus}, got ${agentUser.agentStatus}`);
        errors++;
      }

      const assignedCount = await Request.countDocuments({ assignedAgent: agentUser._id });
      console.log(`✅ Agent ${agentData.scenarioType} (${agentData.email}) valid. Assigned requests: ${assignedCount}`);
    }

    // 3. Verify Citizen Personas
    console.log('\\nChecking Citizen Personas...');
    for (const citizenData of CITIZENS) {
      const citizenUser = await User.findOne({ email: citizenData.email }).select('+password');
      if (!citizenUser) { console.error(`❌ Missing citizen: ${citizenData.email}`); errors++; continue; }
      if (citizenUser.role !== 'citizen') { console.error(`❌ Citizen role incorrect: ${citizenData.email}`); errors++; continue; }
      const pwdMatch = await comparePassword(TEST_PASSWORD, citizenUser.password);
      if (!pwdMatch) { console.error(`❌ Password mismatch: ${citizenData.email}`); errors++; continue; }
      
      const citizenRequests = await Request.find({ citizen: citizenUser._id });
      console.log(`✅ Citizen ${citizenData.scenarioType} (${citizenData.email}) valid. Total requests: ${citizenRequests.length}`);
      
      // Scenario-specific checks
      if (citizenData.scenarioType === 'EXPERIENCED_ACTIVE') {
        if (citizenRequests.length < 4) { console.error('❌ Missing requests for Experienced Citizen'); errors++; }
      }
      if (citizenData.scenarioType === 'NEW_USER') {
        if (citizenRequests.length !== 0) { console.error('❌ New User should have 0 requests'); errors++; }
      }
      if (citizenData.scenarioType === 'CORRECTION_WORKFLOW') {
        const hasCorrection = citizenRequests.some(r => r.status === 'correction_required');
        if (!hasCorrection) { console.error('❌ Correction citizen missing CORRECTION_REQUIRED request'); errors++; }
      }
      if (citizenData.scenarioType === 'HIGH_RISK') {
        const hasRisk = citizenRequests.some(r => r.notes && r.notes.includes('manual verification'));
        if (!hasRisk) { console.error('❌ High Risk citizen missing manual verification request'); errors++; }
      }
    }

    // 4. Cross Persona Consistency Check
    console.log('\\nChecking Cross-Persona Consistency...');
    const correctionReq = await Request.findOne({ status: 'correction_required' }).populate('citizen assignedAgent');
    if (correctionReq) {
      if (correctionReq.citizen.email !== 'meera.correction@sevasetu.example') {
         console.error('❌ Correction request not assigned to correct citizen'); errors++;
      }
      if (correctionReq.assignedAgent.email !== 'amit.correction@sevasetu.example') {
         console.error('❌ Correction request not assigned to correct agent'); errors++;
      }
      console.log('✅ Correction workflow cross-persona consistency valid.');
    } else {
      console.error('❌ Missing CORRECTION_REQUIRED request entirely'); errors++;
    }

    const highRiskReq = await Request.findOne({ notes: /manual verification/i }).populate('citizen assignedAgent');
    if (highRiskReq) {
      if (highRiskReq.citizen.email !== 'nisha.risk@sevasetu.example') {
        console.error('❌ High risk request not assigned to correct citizen'); errors++;
      }
      if (highRiskReq.assignedAgent) {
        console.error('❌ High risk request should be unassigned for Admin review'); errors++;
      }
      console.log('✅ High Risk cross-persona consistency valid.');
    }

    if (errors === 0) {
      console.log('\\n🎉 All Showcase Persona Verification Tests Passed!');
      process.exit(0);
    } else {
      console.error(`\\n⚠️ Seed Verification failed with ${errors} errors.`);
      process.exit(1);
    }

  } catch (error) {
    console.error('Verification crashed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

verifyShowcaseSeed();
