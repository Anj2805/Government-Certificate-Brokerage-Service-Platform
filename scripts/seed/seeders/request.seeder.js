const Request = require('../../../src/modules/requests/request.model');
const Payment = require('../../../src/modules/payments/payment.model');
const RequestStatus = require('../../../src/common/enums/request-status.enum');
const DeliveryStatus = require('../../../src/common/enums/delivery-status.enum');
const PaymentStatus = require('../../../src/common/enums/payment-status.enum');
const UserRoles = require('../../../src/common/enums/user-roles.enum');
const crypto = require('crypto');

// Scenarios mapping exactly to the plan
const SCENARIOS = [
  { citizenIndex: 0, type: 'COMPLETED_FREE', count: 2 },
  { citizenIndex: 0, type: 'COMPLETED_COD', count: 1 },
  { citizenIndex: 0, type: 'UNDER_REVIEW', count: 1 },
  
  { citizenIndex: 1, type: 'UNDER_REVIEW', count: 1 },
  { citizenIndex: 1, type: 'CORRECTION_REQUIRED', count: 1 },
  
  { citizenIndex: 2, type: 'APPROVED', count: 1 },
  { citizenIndex: 2, type: 'READY_FOR_DISPATCH', count: 1 },
  
  { citizenIndex: 3, type: 'IN_TRANSIT', count: 1 },
  
  { citizenIndex: 4, type: 'OUT_FOR_DELIVERY_COD', count: 1 },
  
  { citizenIndex: 5, type: 'COMPLETED_FREE', count: 1 },
  
  { citizenIndex: 6, type: 'REJECTED', count: 1 },
  { citizenIndex: 6, type: 'COMPLETED_PAID', count: 1 }, // Already paid offline
  
  { citizenIndex: 7, type: 'UNDER_REVIEW_RISK', count: 1 },
  
  { citizenIndex: 8, type: 'DELIVERY_FAILED', count: 1 },
  
  // Citizen 9 is empty state (no requests)
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
    const citizen = citizens[scenario.citizenIndex];
    if (!citizen) continue;

    for (let i = 0; i < scenario.count; i++) {
      requestCounter++;
      
      // Select a matching service type based on scenario
      let service;
      if (scenario.type.includes('FREE')) {
        service = services.find(s => s.serviceCharge === 0);
      } else if (scenario.type.includes('COD') || scenario.type.includes('PAID')) {
        service = services.find(s => s.serviceCharge > 0);
      } else {
        service = services[Math.floor(Math.random() * services.length)];
      }

      if (!service) service = services[0];

      // Assign an agent deterministically or randomly
      const agent = agents[requestCounter % agents.length];

      let reqStatus = RequestStatus.DRAFT;
      let payStatus = service.serviceCharge > 0 ? PaymentStatus.DUE : PaymentStatus.NOT_REQUIRED;
      let delStatus = DeliveryStatus.NOT_REQUIRED;
      
      let submittedAt = null, assignedAt = null, completedAt = null, rejectedAt = null;
      const history = [];
      const createDate = getRandomPastDate(120, 10);
      
      const requestNumber = `REQ-${new Date(createDate).getFullYear()}-${requestCounter}`;
      
      let isCOD = scenario.type.includes('COD');

      if (scenario.type.includes('COMPLETED')) {
        reqStatus = RequestStatus.COMPLETED;
        delStatus = DeliveryStatus.DELIVERED;
        if (service.serviceCharge > 0) payStatus = PaymentStatus.PAID;
        submittedAt = createDate;
        assignedAt = new Date(createDate.getTime() + 86400000);
        completedAt = new Date(createDate.getTime() + 86400000 * 5);
        history.push(
          { fromStatus: RequestStatus.DRAFT, toStatus: RequestStatus.SUBMITTED, changedBy: citizen._id, changedByRole: UserRoles.CITIZEN, changedAt: submittedAt },
          { fromStatus: RequestStatus.SUBMITTED, toStatus: RequestStatus.ASSIGNED, changedBy: admin._id, changedByRole: UserRoles.ADMIN, changedAt: assignedAt },
          { fromStatus: RequestStatus.ASSIGNED, toStatus: RequestStatus.UNDER_REVIEW, changedBy: agent._id, changedByRole: UserRoles.AGENT, changedAt: new Date(assignedAt.getTime() + 10000) },
          { fromStatus: RequestStatus.UNDER_REVIEW, toStatus: RequestStatus.APPROVED, changedBy: agent._id, changedByRole: UserRoles.AGENT, changedAt: new Date(assignedAt.getTime() + 86400000) },
          { fromStatus: RequestStatus.APPROVED, toStatus: RequestStatus.COMPLETED, changedBy: agent._id, changedByRole: UserRoles.AGENT, changedAt: completedAt }
        );
      } else if (scenario.type === 'UNDER_REVIEW' || scenario.type === 'UNDER_REVIEW_RISK') {
        reqStatus = RequestStatus.UNDER_REVIEW;
        submittedAt = createDate;
        assignedAt = new Date(createDate.getTime() + 3600000);
        history.push(
          { fromStatus: RequestStatus.DRAFT, toStatus: RequestStatus.SUBMITTED, changedBy: citizen._id, changedByRole: UserRoles.CITIZEN, changedAt: submittedAt },
          { fromStatus: RequestStatus.SUBMITTED, toStatus: RequestStatus.ASSIGNED, changedBy: admin._id, changedByRole: UserRoles.ADMIN, changedAt: assignedAt },
          { fromStatus: RequestStatus.ASSIGNED, toStatus: RequestStatus.UNDER_REVIEW, changedBy: agent._id, changedByRole: UserRoles.AGENT, changedAt: new Date(assignedAt.getTime() + 10000) }
        );
      } else if (scenario.type === 'CORRECTION_REQUIRED') {
        reqStatus = RequestStatus.CORRECTION_REQUIRED;
        submittedAt = createDate;
        assignedAt = new Date(createDate.getTime() + 3600000);
        history.push(
          { fromStatus: RequestStatus.DRAFT, toStatus: RequestStatus.SUBMITTED, changedBy: citizen._id, changedByRole: UserRoles.CITIZEN, changedAt: submittedAt },
          { fromStatus: RequestStatus.SUBMITTED, toStatus: RequestStatus.ASSIGNED, changedBy: admin._id, changedByRole: UserRoles.ADMIN, changedAt: assignedAt },
          { fromStatus: RequestStatus.ASSIGNED, toStatus: RequestStatus.UNDER_REVIEW, changedBy: agent._id, changedByRole: UserRoles.AGENT, changedAt: new Date(assignedAt.getTime() + 10000) },
          { fromStatus: RequestStatus.UNDER_REVIEW, toStatus: RequestStatus.CORRECTION_REQUIRED, changedBy: agent._id, changedByRole: UserRoles.AGENT, reason: "Address proof is blurry.", changedAt: new Date(assignedAt.getTime() + 86400000) }
        );
      } else if (scenario.type === 'REJECTED') {
        reqStatus = RequestStatus.REJECTED;
        submittedAt = createDate;
        assignedAt = new Date(createDate.getTime() + 3600000);
        rejectedAt = new Date(createDate.getTime() + 86400000 * 2);
        history.push(
          { fromStatus: RequestStatus.DRAFT, toStatus: RequestStatus.SUBMITTED, changedBy: citizen._id, changedByRole: UserRoles.CITIZEN, changedAt: submittedAt },
          { fromStatus: RequestStatus.SUBMITTED, toStatus: RequestStatus.ASSIGNED, changedBy: admin._id, changedByRole: UserRoles.ADMIN, changedAt: assignedAt },
          { fromStatus: RequestStatus.ASSIGNED, toStatus: RequestStatus.UNDER_REVIEW, changedBy: agent._id, changedByRole: UserRoles.AGENT, changedAt: new Date(assignedAt.getTime() + 10000) },
          { fromStatus: RequestStatus.UNDER_REVIEW, toStatus: RequestStatus.REJECTED, changedBy: agent._id, changedByRole: UserRoles.AGENT, reason: "Incomplete application details and false documents.", changedAt: rejectedAt }
        );
      } else if (scenario.type === 'READY_FOR_DISPATCH' || scenario.type === 'APPROVED') {
        reqStatus = RequestStatus.APPROVED;
        delStatus = DeliveryStatus.READY_FOR_DISPATCH;
        submittedAt = createDate;
        assignedAt = new Date(createDate.getTime() + 3600000);
        history.push(
          { fromStatus: RequestStatus.DRAFT, toStatus: RequestStatus.SUBMITTED, changedBy: citizen._id, changedByRole: UserRoles.CITIZEN, changedAt: submittedAt },
          { fromStatus: RequestStatus.SUBMITTED, toStatus: RequestStatus.ASSIGNED, changedBy: admin._id, changedByRole: UserRoles.ADMIN, changedAt: assignedAt },
          { fromStatus: RequestStatus.ASSIGNED, toStatus: RequestStatus.UNDER_REVIEW, changedBy: agent._id, changedByRole: UserRoles.AGENT, changedAt: new Date(assignedAt.getTime() + 10000) },
          { fromStatus: RequestStatus.UNDER_REVIEW, toStatus: RequestStatus.APPROVED, changedBy: agent._id, changedByRole: UserRoles.AGENT, changedAt: new Date(assignedAt.getTime() + 86400000) }
        );
      } else if (scenario.type === 'IN_TRANSIT') {
        reqStatus = RequestStatus.APPROVED;
        delStatus = DeliveryStatus.IN_TRANSIT;
        submittedAt = createDate;
        assignedAt = new Date(createDate.getTime() + 3600000);
      } else if (scenario.type === 'OUT_FOR_DELIVERY_COD') {
        reqStatus = RequestStatus.APPROVED;
        delStatus = DeliveryStatus.OUT_FOR_DELIVERY;
        payStatus = PaymentStatus.COD_DUE;
        submittedAt = createDate;
        assignedAt = new Date(createDate.getTime() + 3600000);
      } else if (scenario.type === 'DELIVERY_FAILED') {
        reqStatus = RequestStatus.APPROVED;
        delStatus = DeliveryStatus.DELIVERY_ATTEMPTED;
        submittedAt = createDate;
        assignedAt = new Date(createDate.getTime() + 3600000);
      }

      // 1. Create Request
      const reqDoc = await Request.findOneAndUpdate(
        { requestNumber },
        {
          citizen: citizen._id,
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
          assignedAgent: assignedAt ? agent._id : undefined,
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
          createdAt: createDate
        },
        { upsert: true, new: true }
      );
      requestDocs.push(reqDoc);

      // 2. Create Payment
      if (service.serviceCharge > 0) {
        const payment = await Payment.findOneAndUpdate(
          { request: reqDoc._id },
          {
            citizen: citizen._id,
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
