const Request = require('../../../src/modules/requests/request.model');
const Payment = require('../../../src/modules/payments/payment.model');
const RequestStatus = require('../../../src/common/enums/request-status.enum');
const DeliveryStatus = require('../../../src/common/enums/delivery-status.enum');
const PaymentStatus = require('../../../src/common/enums/payment-status.enum');
const UserRoles = require('../../../src/common/enums/user-roles.enum');
const crypto = require('crypto');

// Map specific Agent personas to specific Citizen personas
const SCENARIOS = [
  // 1. Experienced Active Citizen (Aarav) - 2 completed free, 1 completed COD, 1 under review (Assigned to High Perf Agent)
  { scenarioType: 'EXPERIENCED_ACTIVE', requestType: 'COMPLETED_FREE', count: 2, agentScenario: 'HIGH_PERFORMANCE' },
  { scenarioType: 'EXPERIENCED_ACTIVE', requestType: 'COMPLETED_COD', count: 1, agentScenario: 'HIGH_PERFORMANCE' },
  { scenarioType: 'EXPERIENCED_ACTIVE', requestType: 'UNDER_REVIEW', count: 1, agentScenario: 'HIGH_PERFORMANCE' },
  
  // 2. Correction Workflow Citizen (Meera) - Assigned to Correction Agent
  { scenarioType: 'CORRECTION_WORKFLOW', requestType: 'CORRECTION_REQUIRED', count: 1, agentScenario: 'CORRECTION_AGENT' },
  
  // 3. New User / Empty State (Rohan) - No requests
  
  // 4. Application Under Review (Kavya) - Assigned to Document Verification Specialist
  { scenarioType: 'UNDER_REVIEW', requestType: 'UNDER_REVIEW', count: 1, agentScenario: 'DOCUMENT_VERIFICATION' },
  
  // 5. Approved / Ready for Dispatch (Arjun) - Assigned to Document Verification Specialist
  { scenarioType: 'APPROVED_READY', requestType: 'READY_FOR_DISPATCH', count: 1, agentScenario: 'DOCUMENT_VERIFICATION' },
  
  // 6. Document in Transit (Ishita) - Assigned to Low Workload Agent
  { scenarioType: 'IN_TRANSIT', requestType: 'IN_TRANSIT', count: 1, agentScenario: 'LOW_WORKLOAD' },
  
  // 7. Out for Delivery / COD Due (Vivek) - Assigned to High Performance Agent
  { scenarioType: 'OUT_FOR_DELIVERY', requestType: 'OUT_FOR_DELIVERY_COD', count: 1, agentScenario: 'HIGH_PERFORMANCE' },
  
  // 8. High-Risk / Manual Review (Nisha) - Assigned to Admin / No specific agent
  { scenarioType: 'HIGH_RISK', requestType: 'UNDER_REVIEW_RISK', count: 1, agentScenario: 'UNASSIGNED' },
  
  // 9. Failed Delivery / Recipient Not Present (Aditya) - Assigned to High Performance Agent
  { scenarioType: 'FAILED_DELIVERY', requestType: 'DELIVERY_FAILED', count: 1, agentScenario: 'HIGH_PERFORMANCE' },
  
  // 10. Rejected Application with History (Priya) - 1 Rejected, 1 Completed Paid
  { scenarioType: 'REJECTED_HISTORY', requestType: 'REJECTED', count: 1, agentScenario: 'DOCUMENT_VERIFICATION' },
  { scenarioType: 'REJECTED_HISTORY', requestType: 'COMPLETED_PAID', count: 1, agentScenario: 'HIGH_PERFORMANCE' },
];

function getRandomPastDate(daysAgoStart, daysAgoEnd) {
  const now = new Date();
  const days = Math.floor(Math.random() * (daysAgoStart - daysAgoEnd + 1)) + daysAgoEnd;
  now.setDate(now.getDate() - days);
  return now;
}

function generateApplicationData(service) {
  return {
    purpose: 'Showcase Application Request',
    applicantIncome: '450000',
    yearsOfResidence: '10',
    referenceNumber: crypto.randomBytes(4).toString('hex').toUpperCase(),
  };
}

async function seedRequests(citizens, agents, services, admin) {
  console.log('Seeding Requests...');
  const requestDocs = [];
  const paymentDocs = [];

  let requestCounter = 1000;

  for (const scenario of SCENARIOS) {
    const citizen = citizens.find(c => c.scenarioType === scenario.scenarioType);
    if (!citizen) continue;

    const agent = agents.find(a => a.scenarioType === scenario.agentScenario);

    for (let i = 0; i < scenario.count; i++) {
      requestCounter++;
      
      let service;
      if (scenario.requestType.includes('FREE')) {
        service = services.find(s => s.serviceCharge === 0);
      } else if (scenario.requestType.includes('COD') || scenario.requestType.includes('PAID')) {
        service = services.find(s => s.serviceCharge > 0);
      } else {
        service = services[Math.floor(Math.random() * services.length)];
      }

      if (!service) service = services[0];

      let reqStatus = RequestStatus.DRAFT;
      let payStatus = service.serviceCharge > 0 ? PaymentStatus.DUE : PaymentStatus.NOT_REQUIRED;
      let delStatus = DeliveryStatus.NOT_REQUIRED;
      
      let submittedAt = null, assignedAt = null, completedAt = null, rejectedAt = null;
      const history = [];
      const createDate = getRandomPastDate(120, 10);
      
      const requestNumber = `REQ-${new Date(createDate).getFullYear()}-${requestCounter}`;
      
      let isCOD = scenario.requestType.includes('COD');

      const adminId = admin._id;
      const citizenId = citizen._id;
      const agentId = agent ? agent._id : undefined;

      if (scenario.requestType.includes('COMPLETED')) {
        reqStatus = RequestStatus.COMPLETED;
        delStatus = DeliveryStatus.DELIVERED;
        if (service.serviceCharge > 0) payStatus = PaymentStatus.PAID;
        submittedAt = createDate;
        assignedAt = new Date(createDate.getTime() + 86400000);
        completedAt = new Date(createDate.getTime() + 86400000 * 5);
        history.push(
          { fromStatus: RequestStatus.DRAFT, toStatus: RequestStatus.SUBMITTED, changedBy: citizenId, changedByRole: UserRoles.CITIZEN, changedAt: submittedAt },
          { fromStatus: RequestStatus.SUBMITTED, toStatus: RequestStatus.ASSIGNED, changedBy: adminId, changedByRole: UserRoles.ADMIN, changedAt: assignedAt },
          { fromStatus: RequestStatus.ASSIGNED, toStatus: RequestStatus.UNDER_REVIEW, changedBy: agentId, changedByRole: UserRoles.AGENT, changedAt: new Date(assignedAt.getTime() + 10000) },
          { fromStatus: RequestStatus.UNDER_REVIEW, toStatus: RequestStatus.APPROVED, changedBy: agentId, changedByRole: UserRoles.AGENT, changedAt: new Date(assignedAt.getTime() + 86400000) },
          { fromStatus: RequestStatus.APPROVED, toStatus: RequestStatus.COMPLETED, changedBy: agentId, changedByRole: UserRoles.AGENT, changedAt: completedAt }
        );
      } else if (scenario.requestType === 'UNDER_REVIEW' || scenario.requestType === 'UNDER_REVIEW_RISK') {
        reqStatus = RequestStatus.UNDER_REVIEW;
        submittedAt = createDate;
        assignedAt = new Date(createDate.getTime() + 3600000);
        history.push(
          { fromStatus: RequestStatus.DRAFT, toStatus: RequestStatus.SUBMITTED, changedBy: citizenId, changedByRole: UserRoles.CITIZEN, changedAt: submittedAt }
        );
        
        if (agentId) {
          history.push(
            { fromStatus: RequestStatus.SUBMITTED, toStatus: RequestStatus.ASSIGNED, changedBy: adminId, changedByRole: UserRoles.ADMIN, changedAt: assignedAt },
            { fromStatus: RequestStatus.ASSIGNED, toStatus: RequestStatus.UNDER_REVIEW, changedBy: agentId, changedByRole: UserRoles.AGENT, changedAt: new Date(assignedAt.getTime() + 10000) }
          );
        }
      } else if (scenario.requestType === 'CORRECTION_REQUIRED') {
        reqStatus = RequestStatus.CORRECTION_REQUIRED;
        submittedAt = createDate;
        assignedAt = new Date(createDate.getTime() + 3600000);
        history.push(
          { fromStatus: RequestStatus.DRAFT, toStatus: RequestStatus.SUBMITTED, changedBy: citizenId, changedByRole: UserRoles.CITIZEN, changedAt: submittedAt },
          { fromStatus: RequestStatus.SUBMITTED, toStatus: RequestStatus.ASSIGNED, changedBy: adminId, changedByRole: UserRoles.ADMIN, changedAt: assignedAt },
          { fromStatus: RequestStatus.ASSIGNED, toStatus: RequestStatus.UNDER_REVIEW, changedBy: agentId, changedByRole: UserRoles.AGENT, changedAt: new Date(assignedAt.getTime() + 10000) },
          { fromStatus: RequestStatus.UNDER_REVIEW, toStatus: RequestStatus.CORRECTION_REQUIRED, changedBy: agentId, changedByRole: UserRoles.AGENT, reason: "Address proof is blurry and unreadable.", changedAt: new Date(assignedAt.getTime() + 86400000) }
        );
      } else if (scenario.requestType === 'REJECTED') {
        reqStatus = RequestStatus.REJECTED;
        submittedAt = createDate;
        assignedAt = new Date(createDate.getTime() + 3600000);
        rejectedAt = new Date(createDate.getTime() + 86400000 * 2);
        history.push(
          { fromStatus: RequestStatus.DRAFT, toStatus: RequestStatus.SUBMITTED, changedBy: citizenId, changedByRole: UserRoles.CITIZEN, changedAt: submittedAt },
          { fromStatus: RequestStatus.SUBMITTED, toStatus: RequestStatus.ASSIGNED, changedBy: adminId, changedByRole: UserRoles.ADMIN, changedAt: assignedAt },
          { fromStatus: RequestStatus.ASSIGNED, toStatus: RequestStatus.UNDER_REVIEW, changedBy: agentId, changedByRole: UserRoles.AGENT, changedAt: new Date(assignedAt.getTime() + 10000) },
          { fromStatus: RequestStatus.UNDER_REVIEW, toStatus: RequestStatus.REJECTED, changedBy: agentId, changedByRole: UserRoles.AGENT, reason: "Incomplete application details and invalid supporting documents.", changedAt: rejectedAt }
        );
      } else if (scenario.requestType === 'READY_FOR_DISPATCH') {
        reqStatus = RequestStatus.APPROVED;
        delStatus = DeliveryStatus.READY_FOR_DISPATCH;
        submittedAt = createDate;
        assignedAt = new Date(createDate.getTime() + 3600000);
        history.push(
          { fromStatus: RequestStatus.DRAFT, toStatus: RequestStatus.SUBMITTED, changedBy: citizenId, changedByRole: UserRoles.CITIZEN, changedAt: submittedAt },
          { fromStatus: RequestStatus.SUBMITTED, toStatus: RequestStatus.ASSIGNED, changedBy: adminId, changedByRole: UserRoles.ADMIN, changedAt: assignedAt },
          { fromStatus: RequestStatus.ASSIGNED, toStatus: RequestStatus.UNDER_REVIEW, changedBy: agentId, changedByRole: UserRoles.AGENT, changedAt: new Date(assignedAt.getTime() + 10000) },
          { fromStatus: RequestStatus.UNDER_REVIEW, toStatus: RequestStatus.APPROVED, changedBy: agentId, changedByRole: UserRoles.AGENT, changedAt: new Date(assignedAt.getTime() + 86400000) }
        );
      } else if (scenario.requestType === 'IN_TRANSIT') {
        reqStatus = RequestStatus.APPROVED;
        delStatus = DeliveryStatus.IN_TRANSIT;
        submittedAt = createDate;
        assignedAt = new Date(createDate.getTime() + 3600000);
      } else if (scenario.requestType === 'OUT_FOR_DELIVERY_COD') {
        reqStatus = RequestStatus.APPROVED;
        delStatus = DeliveryStatus.OUT_FOR_DELIVERY;
        payStatus = PaymentStatus.COD_DUE;
        submittedAt = createDate;
        assignedAt = new Date(createDate.getTime() + 3600000);
      } else if (scenario.requestType === 'DELIVERY_FAILED') {
        reqStatus = RequestStatus.APPROVED;
        delStatus = DeliveryStatus.DELIVERY_ATTEMPTED;
        submittedAt = createDate;
        assignedAt = new Date(createDate.getTime() + 3600000);
      }

      // 1. Create Request
      const reqDoc = await Request.findOneAndUpdate(
        { requestNumber },
        {
          citizen: citizenId,
          service: service._id,
          applicantSnapshot: {
            firstName: citizen.firstName,
            lastName: citizen.lastName,
            email: citizen.email,
            phone: citizen.phone,
            address: citizen.address,
            city: citizen.city,
            state: citizen.state,
            postalCode: citizen.postalCode
          },
          serviceSnapshot: {
            serviceName: service.name,
            category: service.category,
            estimatedProcessingDays: service.estimatedProcessingDays,
            serviceCharge: service.serviceCharge,
            requiredDocuments: service.requiredDocuments
          },
          assignedAgent: agentId,
          status: reqStatus,
          paymentStatus: payStatus,
          paymentMethod: isCOD ? 'CASH_ON_DELIVERY' : undefined,
          deliveryStatus: delStatus,
          trackingId: ['ready_for_dispatch','in_transit','out_for_delivery','delivered','delivery_attempted'].includes(delStatus) ? `TRK-${requestNumber}` : undefined,
          deliveryAddress: {
            recipientName: `${citizen.firstName} ${citizen.lastName}`,
            mobileNumber: citizen.phone,
            houseNumber: '123',
            street: citizen.address,
            district: citizen.city,
            state: citizen.state,
            pinCode: citizen.postalCode,
            addressType: 'Home'
          },
          deliveryDeclarationAccepted: true,
          applicationData: generateApplicationData(service),
          statusHistory: history,
          submittedAt,
          assignedAt,
          completedAt,
          rejectedAt,
          createdAt: createDate,
          
          // Add notes if this is a high risk scenario
          notes: scenario.requestType === 'UNDER_REVIEW_RISK' ? 'Requires manual verification by Admin due to mismatched documents. Previous applications were rejected for similar reasons.' : undefined
        },
        { upsert: true, new: true }
      );
      requestDocs.push(reqDoc);

      // 2. Create Payment
      if (service.serviceCharge > 0) {
        const payment = await Payment.findOneAndUpdate(
          { request: reqDoc._id },
          {
            citizen: citizenId,
            service: service._id,
            paymentType: isCOD ? 'CASH_ON_DELIVERY' : 'OFFLINE',
            paymentMethod: isCOD ? 'CASH' : 'SERVICE_CENTER',
            status: payStatus,
            amountDue: service.serviceCharge,
            amountPaid: payStatus === PaymentStatus.PAID ? service.serviceCharge : 0,
            currency: 'INR',
            collectedAt: payStatus === PaymentStatus.PAID ? completedAt || new Date() : undefined,
            receiptNumber: payStatus === PaymentStatus.PAID ? `RCT-${requestNumber}` : undefined
          },
          { upsert: true, new: true }
        );
        paymentDocs.push(payment);
        reqDoc.payment = payment._id;
        await reqDoc.save();
      }
    }
  }

  console.log(`Seeded ${requestDocs.length} Requests, ${paymentDocs.length} Payments.`);
  return { requestDocs, paymentDocs, deliveryDocs: [] };
}

module.exports = { seedRequests };
