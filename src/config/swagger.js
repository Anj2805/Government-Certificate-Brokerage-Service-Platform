const swaggerJSDoc = require('swagger-jsdoc');
const config = require('./index');

const bearerAuth = [{ bearerAuth: [] }];

const successResponse = (description, dataSchema = {}) => ({
  description,
  content: {
    'application/json': {
      schema: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          {
            type: 'object',
            properties: {
              data: dataSchema,
            },
          },
        ],
      },
    },
  },
});

const errorResponse = (description) => ({
  description,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
    },
  },
});

const paginatedResponse = (description, collectionName, itemRef) =>
  successResponse(description, {
    type: 'object',
    properties: {
      [collectionName]: {
        type: 'array',
        items: { $ref: itemRef },
      },
    },
  });

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: config.appName,
      version: '1.0.0',
      description: 'Government Certificate & Brokerage Service Platform API documentation.',
    },
    servers: [
      {
        url: config.api.basePath,
        description: `${config.env} API server`,
      },
    ],
    tags: [
      { name: 'Authentication' },
      { name: 'Users' },
      { name: 'Services' },
      { name: 'Documents' },
      { name: 'Requests' },
      { name: 'Admin Dashboard' },
      { name: 'Notifications' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Use the JWT access token returned from login/register. Example: Bearer eyJhbGciOi...',
        },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Success' },
            data: { type: 'object' },
            meta: { $ref: '#/components/schemas/PaginationMeta' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Request validation failed' },
            details: {
              type: 'array',
              items: { type: 'object' },
            },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            total: { type: 'integer', example: 42 },
            totalPages: { type: 'integer', example: 5 },
          },
        },
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '6677d5f4f5f0f6e4d1a11111' },
            firstName: { type: 'string', example: 'Asha' },
            lastName: { type: 'string', example: 'Verma' },
            email: { type: 'string', format: 'email', example: 'asha@example.com' },
            phone: { type: 'string', example: '+919999999999' },
            role: { type: 'string', enum: ['citizen', 'agent', 'admin'] },
            isActive: { type: 'boolean', example: true },
            emailVerified: { type: 'boolean', example: true },
            emailVerifiedAt: { type: 'string', format: 'date-time' },
            agentStatus: { type: 'string', enum: ['pending', 'approved', 'rejected', 'suspended'] },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'password'],
          properties: {
            firstName: { type: 'string', example: 'Asha' },
            lastName: { type: 'string', example: 'Verma' },
            email: { type: 'string', format: 'email', example: 'asha@example.com' },
            phone: { type: 'string', example: '+919999999999' },
            password: { type: 'string', format: 'password', example: 'StrongPass123' },
            role: { type: 'string', enum: ['citizen'], example: 'citizen' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'asha@example.com' },
            password: { type: 'string', format: 'password', example: 'StrongPass123' },
          },
        },
        RefreshTokenRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string' },
          },
        },
        ChangePasswordRequest: {
          type: 'object',
          required: ['currentPassword', 'newPassword', 'confirmPassword'],
          properties: {
            currentPassword: { type: 'string', format: 'password' },
            newPassword: { type: 'string', format: 'password', minLength: 8, maxLength: 128 },
            confirmPassword: { type: 'string', format: 'password' },
          },
        },
        ForgotPasswordRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email', example: 'citizen@example.com' },
          },
        },
        ResetPasswordRequest: {
          type: 'object',
          required: ['token', 'newPassword', 'confirmPassword'],
          properties: {
            token: { type: 'string' },
            newPassword: { type: 'string', format: 'password', minLength: 8, maxLength: 128 },
            confirmPassword: { type: 'string', format: 'password' },
          },
        },
        VerifyEmailRequest: {
          type: 'object',
          required: ['token'],
          properties: {
            token: { type: 'string' },
          },
        },
        ResendVerificationRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email', example: 'citizen@example.com' },
          },
        },
        ProfileUpdateRequest: {
          type: 'object',
          additionalProperties: false,
          properties: {
            firstName: { type: 'string', minLength: 2, maxLength: 80, example: 'Asha' },
            lastName: { type: 'string', minLength: 2, maxLength: 80, example: 'Verma' },
            phone: { type: 'string', nullable: true, example: '+919999999999' },
          },
        },
        Service: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Service managed by admin' },
            description: { type: 'string' },
            category: { type: 'string', example: 'certificate' },
            requiredDocuments: { type: 'array', items: { type: 'string' } },
            estimatedProcessingDays: { type: 'integer', example: 7 },
            serviceCharge: { type: 'number', example: 200 },
            isActive: { type: 'boolean', example: true },
          },
        },
        ServicePayload: {
          type: 'object',
          required: ['name', 'category', 'requiredDocuments', 'estimatedProcessingDays', 'serviceCharge'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            requiredDocuments: { type: 'array', items: { type: 'string' } },
            estimatedProcessingDays: { type: 'integer', minimum: 1 },
            serviceCharge: { type: 'number', minimum: 0 },
            isActive: { type: 'boolean' },
          },
        },
        Document: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            documentType: { type: 'string', example: 'identity_proof' },
            originalName: { type: 'string', example: 'aadhaar.pdf' },
            filename: { type: 'string' },
            mimeType: { type: 'string', enum: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'] },
            size: { type: 'integer' },
            uploadedBy: { type: 'string' },
            ownerUser: { type: 'string' },
            assignedAgent: { type: 'string' },
            request: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'verified', 'rejected'] },
          },
        },
        Request: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            requestNumber: { type: 'string', example: 'REQ-2026-000001' },
            citizen: { type: 'string' },
            service: { type: 'string' },
            serviceSnapshot: { $ref: '#/components/schemas/ServiceSnapshot' },
            assignedAgent: { type: 'string' },
            status: { $ref: '#/components/schemas/RequestStatus' },
            applicationData: { type: 'object' },
            notes: { type: 'string' },
            documents: { type: 'array', items: { type: 'string' } },
            statusHistory: {
              type: 'array',
              items: { $ref: '#/components/schemas/StatusHistory' },
            },
          },
        },
        ServiceSnapshot: {
          type: 'object',
          properties: {
            serviceName: { type: 'string' },
            category: { type: 'string' },
            estimatedProcessingDays: { type: 'integer' },
            serviceCharge: { type: 'number' },
          },
        },
        RequestStatus: {
          type: 'string',
          enum: ['draft', 'submitted', 'assigned', 'in_progress', 'documents_required', 'completed', 'rejected', 'cancelled'],
        },
        StatusHistory: {
          type: 'object',
          properties: {
            fromStatus: { $ref: '#/components/schemas/RequestStatus' },
            toStatus: { $ref: '#/components/schemas/RequestStatus' },
            changedBy: { type: 'string' },
            changedByRole: { type: 'string', enum: ['citizen', 'agent', 'admin'] },
            reason: { type: 'string' },
            changedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateRequestPayload: {
          type: 'object',
          required: ['serviceId'],
          properties: {
            serviceId: { type: 'string' },
            status: { type: 'string', enum: ['draft', 'submitted'] },
            applicationData: { type: 'object' },
            notes: { type: 'string' },
            documents: { type: 'array', items: { type: 'string' } },
          },
        },
        StatusUpdatePayload: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { $ref: '#/components/schemas/RequestStatus' },
            reason: { type: 'string' },
          },
        },
        AssignAgentPayload: {
          type: 'object',
          required: ['agentId'],
          properties: {
            agentId: { type: 'string' },
            reason: { type: 'string' },
          },
        },
        AdminMetrics: {
          type: 'object',
          properties: {
            totalUsers: { type: 'integer' },
            totalAgents: { type: 'integer' },
            totalServices: { type: 'integer' },
            totalRequests: { type: 'integer' },
            completedRequests: { type: 'integer' },
            rejectedRequests: { type: 'integer' },
            pendingRequests: { type: 'integer' },
          },
        },
        AgentStats: {
          type: 'object',
          properties: {
            totalAssignedRequests: { type: 'integer' },
            inProgressRequests: { type: 'integer' },
            completedRequests: { type: 'integer' },
            documentsRequiredRequests: { type: 'integer' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string' },
            title: { type: 'string' },
            message: { type: 'string' },
            isRead: { type: 'boolean' },
            requestId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
      responses: {
        Unauthorized: errorResponse('JWT access token is missing, invalid, or expired'),
        Forbidden: errorResponse('Authenticated user does not have the required role or permission'),
        NotFound: errorResponse('Resource not found'),
        ValidationError: errorResponse('Request validation failed'),
      },
      parameters: {
        IdParam: {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
        PageQuery: {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', minimum: 1, default: 1 },
        },
        LimitQuery: {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
        },
      },
    },
    paths: {
      '/auth/register': {
        post: {
          tags: ['Authentication'],
          summary: 'Register a citizen user',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
          },
          responses: {
            201: successResponse('User registered', {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                tokens: { $ref: '#/components/schemas/AuthTokens' },
              },
            }),
            400: { $ref: '#/components/responses/ValidationError' },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Login user and receive JWT tokens',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
          },
          responses: {
            200: successResponse('User logged in', {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                tokens: { $ref: '#/components/schemas/AuthTokens' },
              },
            }),
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Authentication'],
          summary: 'Get current authenticated user',
          security: bearerAuth,
          responses: {
            200: successResponse('Current user', {
              type: 'object',
              properties: { user: { $ref: '#/components/schemas/User' } },
            }),
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/auth/refresh-token': {
        post: {
          tags: ['Authentication'],
          summary: 'Rotate refresh token and issue new access token',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshTokenRequest' } } },
          },
          responses: { 200: successResponse('Token refreshed') },
        },
      },
      '/auth/forgot-password': {
        post: {
          tags: ['Authentication'],
          summary: 'Request a password reset email',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ForgotPasswordRequest' } } },
          },
          responses: { 200: successResponse('Password reset requested') },
        },
      },
      '/auth/reset-password': {
        post: {
          tags: ['Authentication'],
          summary: 'Reset password using token from email',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ResetPasswordRequest' } } },
          },
          responses: { 
            200: successResponse('Password reset successfully'),
            400: { $ref: '#/components/responses/ValidationError' },
          },
        },
      },
      '/auth/logout': {
        post: {
          tags: ['Authentication'],
          summary: 'Logout current user',
          security: bearerAuth,
          responses: { 200: successResponse('User logged out') },
        },
      },
      '/auth/verify-email': {
        post: {
          tags: ['Authentication'],
          summary: 'Verify user email',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/VerifyEmailRequest' } } },
          },
          responses: {
            200: successResponse('Email verified successfully'),
            400: { $ref: '#/components/responses/ValidationError' },
          },
        },
      },
      '/auth/resend-verification': {
        post: {
          tags: ['Authentication'],
          summary: 'Resend verification email',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ResendVerificationRequest' } } },
          },
          responses: { 200: successResponse('Verification email sent if eligible') },
        },
      },
      '/auth/change-password': {
        post: {
          tags: ['Authentication'],
          summary: 'Change password for the authenticated user',
          security: bearerAuth,
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ChangePasswordRequest' } } },
          },
          responses: {
            200: successResponse('Password changed; refresh token invalidated'),
            400: { $ref: '#/components/responses/ValidationError' },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/users/me/profile': {
        get: {
          tags: ['Users'],
          summary: 'Get current user profile',
          security: bearerAuth,
          responses: {
            200: successResponse('Profile retrieved', {
              type: 'object',
              properties: { user: { $ref: '#/components/schemas/User' } },
            }),
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
        patch: {
          tags: ['Users'],
          summary: 'Update current user profile',
          security: bearerAuth,
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ProfileUpdateRequest' } } },
          },
          responses: {
            200: successResponse('Profile updated', {
              type: 'object',
              properties: { user: { $ref: '#/components/schemas/User' } },
            }),
            400: { $ref: '#/components/responses/ValidationError' },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/services': {
        get: {
          tags: ['Services'],
          summary: 'List services',
          security: bearerAuth,
          parameters: [
            { $ref: '#/components/parameters/PageQuery' },
            { $ref: '#/components/parameters/LimitQuery' },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'category', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: paginatedResponse('Services fetched', 'services', '#/components/schemas/Service') },
        },
        post: {
          tags: ['Services'],
          summary: 'Create service catalog entry',
          security: bearerAuth,
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ServicePayload' } } },
          },
          responses: { 201: successResponse('Service created', { type: 'object', properties: { service: { $ref: '#/components/schemas/Service' } } }) },
        },
      },
      '/services/{id}': {
        get: {
          tags: ['Services'],
          summary: 'Get service details',
          security: bearerAuth,
          parameters: [{ $ref: '#/components/parameters/IdParam' }],
          responses: { 200: successResponse('Service details', { type: 'object', properties: { service: { $ref: '#/components/schemas/Service' } } }) },
        },
        patch: {
          tags: ['Services'],
          summary: 'Update service',
          security: bearerAuth,
          parameters: [{ $ref: '#/components/parameters/IdParam' }],
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/ServicePayload' } } } },
          responses: { 200: successResponse('Service updated') },
        },
        delete: {
          tags: ['Services'],
          summary: 'Soft delete service',
          security: bearerAuth,
          parameters: [{ $ref: '#/components/parameters/IdParam' }],
          responses: { 200: successResponse('Service deleted') },
        },
      },
      '/services/{id}/status': {
        patch: {
          tags: ['Services'],
          summary: 'Activate or deactivate service',
          security: bearerAuth,
          parameters: [{ $ref: '#/components/parameters/IdParam' }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['isActive'], properties: { isActive: { type: 'boolean' } } } } } },
          responses: { 200: successResponse('Service status updated') },
        },
      },
      '/documents': {
        get: {
          tags: ['Documents'],
          summary: 'View uploaded documents',
          security: bearerAuth,
          parameters: [{ $ref: '#/components/parameters/PageQuery' }, { $ref: '#/components/parameters/LimitQuery' }],
          responses: { 200: paginatedResponse('Documents fetched', 'documents', '#/components/schemas/Document') },
        },
        post: {
          tags: ['Documents'],
          summary: 'Upload document',
          security: bearerAuth,
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['document', 'documentType'],
                  properties: {
                    document: { type: 'string', format: 'binary' },
                    documentType: { type: 'string' },
                    title: { type: 'string' },
                    requestId: { type: 'string' },
                    ownerUserId: { type: 'string' },
                    assignedAgentId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 201: successResponse('Document uploaded') },
        },
      },
      '/documents/{id}': {
        get: { tags: ['Documents'], summary: 'Get document metadata', security: bearerAuth, parameters: [{ $ref: '#/components/parameters/IdParam' }], responses: { 200: successResponse('Document metadata') } },
        delete: { tags: ['Documents'], summary: 'Soft delete document', security: bearerAuth, parameters: [{ $ref: '#/components/parameters/IdParam' }], responses: { 200: successResponse('Document deleted') } },
      },
      '/documents/{id}/verify': {
        patch: { tags: ['Documents'], summary: 'Verify document', security: bearerAuth, parameters: [{ $ref: '#/components/parameters/IdParam' }], responses: { 200: successResponse('Document verified') } },
      },
      '/documents/{id}/reject': {
        patch: {
          tags: ['Documents'],
          summary: 'Reject document',
          security: bearerAuth,
          parameters: [{ $ref: '#/components/parameters/IdParam' }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['rejectionReason'], properties: { rejectionReason: { type: 'string' } } } } } },
          responses: { 200: successResponse('Document rejected') },
        },
      },
      '/requests': {
        get: { tags: ['Requests'], summary: 'Admin list all requests', security: bearerAuth, responses: { 200: paginatedResponse('Requests fetched', 'requests', '#/components/schemas/Request') } },
        post: {
          tags: ['Requests'],
          summary: 'Create request',
          security: bearerAuth,
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateRequestPayload' } } } },
          responses: { 201: successResponse('Request created') },
        },
      },
      '/requests/my': {
        get: { tags: ['Requests'], summary: 'Citizen list own requests', security: bearerAuth, responses: { 200: paginatedResponse('Requests fetched', 'requests', '#/components/schemas/Request') } },
      },
      '/requests/assigned': {
        get: { tags: ['Requests'], summary: 'Agent list assigned requests', security: bearerAuth, responses: { 200: paginatedResponse('Assigned requests fetched', 'requests', '#/components/schemas/Request') } },
      },
      '/requests/{id}': {
        get: { tags: ['Requests'], summary: 'Get request details', security: bearerAuth, parameters: [{ $ref: '#/components/parameters/IdParam' }], responses: { 200: successResponse('Request details') } },
      },
      '/requests/{id}/submit': {
        patch: { tags: ['Requests'], summary: 'Submit draft request', security: bearerAuth, parameters: [{ $ref: '#/components/parameters/IdParam' }], responses: { 200: successResponse('Request submitted') } },
      },
      '/requests/{id}/cancel': {
        patch: { tags: ['Requests'], summary: 'Cancel request', security: bearerAuth, parameters: [{ $ref: '#/components/parameters/IdParam' }], responses: { 200: successResponse('Request cancelled') } },
      },
      '/requests/{id}/assign-agent': {
        patch: { tags: ['Requests'], summary: 'Assign agent to request', security: bearerAuth, parameters: [{ $ref: '#/components/parameters/IdParam' }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/AssignAgentPayload' } } } }, responses: { 200: successResponse('Agent assigned') } },
      },
      '/requests/{id}/progress': {
        patch: { tags: ['Requests'], summary: 'Agent update request progress', security: bearerAuth, parameters: [{ $ref: '#/components/parameters/IdParam' }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/StatusUpdatePayload' } } } }, responses: { 200: successResponse('Request progress updated') } },
      },
      '/requests/{id}/status': {
        patch: { tags: ['Requests'], summary: 'Admin update request status', security: bearerAuth, parameters: [{ $ref: '#/components/parameters/IdParam' }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/StatusUpdatePayload' } } } }, responses: { 200: successResponse('Request status updated') } },
      },
      '/agents/dashboard/stats': {
        get: { tags: ['Agent Dashboard'], summary: 'Agent dashboard statistics', security: bearerAuth, responses: { 200: successResponse('Agent stats', { type: 'object', properties: { stats: { $ref: '#/components/schemas/AgentStats' } } }) } },
      },
      '/agents/requests': {
        get: { tags: ['Agent Dashboard'], summary: 'View assigned requests', security: bearerAuth, responses: { 200: paginatedResponse('Assigned requests fetched', 'requests', '#/components/schemas/Request') } },
      },
      '/agents/requests/{id}': {
        get: { tags: ['Agent Dashboard'], summary: 'View assigned request details', security: bearerAuth, parameters: [{ $ref: '#/components/parameters/IdParam' }], responses: { 200: successResponse('Assigned request details') } },
      },
      '/agents/requests/{id}/progress': {
        patch: { tags: ['Agent Dashboard'], summary: 'Update assigned request progress', security: bearerAuth, parameters: [{ $ref: '#/components/parameters/IdParam' }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/StatusUpdatePayload' } } } }, responses: { 200: successResponse('Progress updated') } },
      },
      '/agents/requests/{id}/documents': {
        post: { tags: ['Agent Dashboard'], summary: 'Upload additional document for assigned request', security: bearerAuth, parameters: [{ $ref: '#/components/parameters/IdParam' }], requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', required: ['document', 'documentType'], properties: { document: { type: 'string', format: 'binary' }, documentType: { type: 'string' }, title: { type: 'string' } } } } } }, responses: { 201: successResponse('Additional document uploaded') } },
      },
      '/admin/dashboard/metrics': {
        get: { tags: ['Admin Dashboard'], summary: 'Admin dashboard metrics', security: bearerAuth, responses: { 200: successResponse('Admin metrics', { type: 'object', properties: { metrics: { $ref: '#/components/schemas/AdminMetrics' } } }) } },
      },
      '/admin/agents': {
        get: { tags: ['Admin Dashboard'], summary: 'View agents', security: bearerAuth, responses: { 200: paginatedResponse('Agents fetched', 'agents', '#/components/schemas/User') } },
      },
      '/admin/agents/{id}/approve': {
        patch: { tags: ['Admin Dashboard'], summary: 'Approve agent', security: bearerAuth, parameters: [{ $ref: '#/components/parameters/IdParam' }], responses: { 200: successResponse('Agent approved') } },
      },
      '/admin/agents/{id}/reject': {
        patch: { tags: ['Admin Dashboard'], summary: 'Reject agent', security: bearerAuth, parameters: [{ $ref: '#/components/parameters/IdParam' }], requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['reason'], properties: { reason: { type: 'string' } } } } } }, responses: { 200: successResponse('Agent rejected') } },
      },
      '/admin/agents/{id}/suspend': {
        patch: { tags: ['Admin Dashboard'], summary: 'Suspend agent', security: bearerAuth, parameters: [{ $ref: '#/components/parameters/IdParam' }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { reason: { type: 'string' } } } } } }, responses: { 200: successResponse('Agent suspended') } },
      },
      '/admin/requests': {
        get: { tags: ['Admin Dashboard'], summary: 'View all requests', security: bearerAuth, responses: { 200: paginatedResponse('Requests fetched', 'requests', '#/components/schemas/Request') } },
      },
      '/admin/requests/{id}': {
        get: { tags: ['Admin Dashboard'], summary: 'View request details', security: bearerAuth, parameters: [{ $ref: '#/components/parameters/IdParam' }], responses: { 200: successResponse('Request details') } },
      },
      '/admin/requests/{id}/assign-agent': {
        patch: { tags: ['Admin Dashboard'], summary: 'Assign agent', security: bearerAuth, parameters: [{ $ref: '#/components/parameters/IdParam' }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/AssignAgentPayload' } } } }, responses: { 200: successResponse('Agent assigned') } },
      },
      '/admin/requests/{id}/status': {
        patch: { tags: ['Admin Dashboard'], summary: 'Update request status', security: bearerAuth, parameters: [{ $ref: '#/components/parameters/IdParam' }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/StatusUpdatePayload' } } } }, responses: { 200: successResponse('Request status updated') } },
      },
      '/notifications': {
        get: { tags: ['Notifications'], summary: 'List user notifications', security: bearerAuth, parameters: [{ $ref: '#/components/parameters/PageQuery' }, { $ref: '#/components/parameters/LimitQuery' }, { name: 'isRead', in: 'query', schema: { type: 'boolean' } }], responses: { 200: paginatedResponse('Notifications fetched', 'notifications', '#/components/schemas/Notification') } },
      },
      '/notifications/unread-count': {
        get: { tags: ['Notifications'], summary: 'Get unread notification count', security: bearerAuth, responses: { 200: successResponse('Unread count fetched', { type: 'object', properties: { unreadCount: { type: 'integer' } } }) } },
      },
      '/notifications/read-all': {
        patch: { tags: ['Notifications'], summary: 'Mark all notifications as read', security: bearerAuth, responses: { 200: successResponse('All notifications marked as read', { type: 'object', properties: { updatedCount: { type: 'integer' } } }) } },
      },
      '/notifications/{id}/read': {
        patch: { tags: ['Notifications'], summary: 'Mark specific notification as read', security: bearerAuth, parameters: [{ $ref: '#/components/parameters/IdParam' }], responses: { 200: successResponse('Notification marked as read', { type: 'object', properties: { notification: { $ref: '#/components/schemas/Notification' } } }) } },
      },
    },
  },
  apis: [],
};

module.exports = swaggerJSDoc(options);
