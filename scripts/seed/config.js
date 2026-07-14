const mongoose = require('mongoose');
const AgentStatus = require('../../src/common/enums/agent-status.enum');

const TEST_PASSWORD = 'Abcd@123';

const ADMIN = {
  firstName: 'Demo',
  lastName: 'Admin',
  email: 'admin.demo@sevasetu.example',
  phone: '9999999999',
  purpose: 'Demonstrate the complete operational platform'
};

const AGENTS = [
  {
    firstName: 'Ravi', lastName: 'Kumar', email: 'ravi.highperf@sevasetu.example', phone: '8888888881',
    designation: 'Senior Agent', serviceSpecialization: 'Certificates', agentStatus: AgentStatus.APPROVED,
    purpose: 'High-Performance Active Agent', scenarioType: 'HIGH_PERFORMANCE'
  },
  {
    firstName: 'Sneha', lastName: 'Patil', email: 'sneha.docs@sevasetu.example', phone: '8888888882',
    designation: 'Verification Officer', serviceSpecialization: 'Licenses', agentStatus: AgentStatus.APPROVED,
    purpose: 'Document Verification Specialist', scenarioType: 'DOCUMENT_VERIFICATION'
  },
  {
    firstName: 'Amit', lastName: 'Singh', email: 'amit.correction@sevasetu.example', phone: '8888888883',
    designation: 'Field Agent', serviceSpecialization: 'Inspections', agentStatus: AgentStatus.APPROVED,
    purpose: 'Correction Workflow Agent', scenarioType: 'CORRECTION_AGENT'
  },
  {
    firstName: 'Pooja', lastName: 'Sharma', email: 'pooja.low@sevasetu.example', phone: '8888888884',
    designation: 'Junior Agent', serviceSpecialization: 'General', agentStatus: AgentStatus.APPROVED,
    purpose: 'Low-Workload Agent', scenarioType: 'LOW_WORKLOAD'
  },
  {
    firstName: 'Karan', lastName: 'Mehta', email: 'karan.pending@sevasetu.example', phone: '8888888885',
    designation: 'Trainee', serviceSpecialization: 'Support', agentStatus: AgentStatus.PENDING,
    purpose: 'New / Pending / Inactive Agent', scenarioType: 'PENDING_APPROVAL'
  }
];

const CITIZENS = [
  { 
    firstName: 'Aarav', lastName: 'Sharma', email: 'aarav.active@sevasetu.example', phone: '7777777771', 
    address: '12 MG Road', city: 'Mumbai', state: 'Maharashtra', postalCode: '400001',
    purpose: 'Experienced Active Citizen', scenarioType: 'EXPERIENCED_ACTIVE'
  },
  { 
    firstName: 'Meera', lastName: 'Verma', email: 'meera.correction@sevasetu.example', phone: '7777777772', 
    address: '34 Brigade Road', city: 'Bengaluru', state: 'Karnataka', postalCode: '560001',
    purpose: 'Correction Workflow Citizen', scenarioType: 'CORRECTION_WORKFLOW'
  },
  { 
    firstName: 'Rohan', lastName: 'Das', email: 'rohan.new@sevasetu.example', phone: '7777777773', 
    address: '56 Park Street', city: 'Kolkata', state: 'West Bengal', postalCode: '700016',
    purpose: 'New User / Empty State', scenarioType: 'NEW_USER'
  },
  { 
    firstName: 'Kavya', lastName: 'Nair', email: 'kavya.review@sevasetu.example', phone: '7777777774', 
    address: '78 Marine Drive', city: 'Kochi', state: 'Kerala', postalCode: '682031',
    purpose: 'Application Under Review', scenarioType: 'UNDER_REVIEW'
  },
  { 
    firstName: 'Arjun', lastName: 'Mehta', email: 'arjun.dispatch@sevasetu.example', phone: '7777777775', 
    address: '90 CG Road', city: 'Ahmedabad', state: 'Gujarat', postalCode: '380009',
    purpose: 'Approved / Ready for Dispatch', scenarioType: 'APPROVED_READY'
  },
  { 
    firstName: 'Ishita', lastName: 'Roy', email: 'ishita.transit@sevasetu.example', phone: '7777777776', 
    address: '12 Janpath', city: 'New Delhi', state: 'Delhi', postalCode: '110001',
    purpose: 'Document in Transit', scenarioType: 'IN_TRANSIT'
  },
  { 
    firstName: 'Vivek', lastName: 'Kumar', email: 'vivek.delivery@sevasetu.example', phone: '7777777777', 
    address: '34 FC Road', city: 'Pune', state: 'Maharashtra', postalCode: '411004',
    purpose: 'Out for Delivery / COD Due', scenarioType: 'OUT_FOR_DELIVERY'
  },
  { 
    firstName: 'Nisha', lastName: 'Joshi', email: 'nisha.risk@sevasetu.example', phone: '7777777778', 
    address: '56 MI Road', city: 'Jaipur', state: 'Rajasthan', postalCode: '302001',
    purpose: 'High-Risk / Manual Review', scenarioType: 'HIGH_RISK'
  },
  { 
    firstName: 'Aditya', lastName: 'Rao', email: 'aditya.failed@sevasetu.example', phone: '7777777779', 
    address: '78 Banjara Hills', city: 'Hyderabad', state: 'Telangana', postalCode: '500034',
    purpose: 'Failed Delivery / Recipient Not Present', scenarioType: 'FAILED_DELIVERY'
  },
  { 
    firstName: 'Priya', lastName: 'Kapoor', email: 'priya.rejected@sevasetu.example', phone: '7777777770', 
    address: '90 Sector 17', city: 'Chandigarh', state: 'Chandigarh', postalCode: '160017',
    purpose: 'Rejected Application with History', scenarioType: 'REJECTED_HISTORY'
  }
];

module.exports = {
  TEST_PASSWORD,
  ADMIN,
  AGENTS,
  CITIZENS
};
