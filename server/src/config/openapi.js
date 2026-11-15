const ok = { description: 'Successful response' };
const auth = [{ bearerAuth: [] }];
const body = { required: true, content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } } };

export default {
  openapi: '3.0.0',
  info: { title: 'SkyKart API', version: '1.0.0', description: 'REST API for the SkyKart storefront.' },
  servers: [{ url: '/api/v1' }],
  components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } }, responses: { Error: { description: 'Consistent API error', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: false }, message: { type: 'string' }, code: { type: 'string' }, details: {} } } } } } } },
  paths: {
    '/auth/register': { post: { summary: 'Register a customer', requestBody: body, responses: { '201': ok, '400': { $ref: '#/components/responses/Error' } } } },
    '/auth/login': { post: { summary: 'Log in and receive an access token', requestBody: body, responses: { '200': ok, '401': { $ref: '#/components/responses/Error' } } } },
    '/users/me': { get: { summary: 'Get the current profile', security: auth, responses: { '200': ok } }, patch: { summary: 'Update the current profile', security: auth, requestBody: body, responses: { '200': ok } } },
    '/categories': { get: { summary: 'List active categories', responses: { '200': ok } } },
    '/products': { get: { summary: 'Search and filter the product catalogue', parameters: [
      { in: 'query', name: 'q', schema: { type: 'string', maxLength: 120 } },
      { in: 'query', name: 'category', schema: { type: 'string', example: 'home-living' } },
      { in: 'query', name: 'minPrice', schema: { type: 'number', minimum: 0 } },
      { in: 'query', name: 'maxPrice', schema: { type: 'number', minimum: 0 } },
      { in: 'query', name: 'inStock', schema: { type: 'boolean' } },
      { in: 'query', name: 'featured', schema: { type: 'boolean' } },
      { in: 'query', name: 'sort', schema: { type: 'string', enum: ['newest', 'price_asc', 'price_desc', 'name_asc', 'rating', 'bestselling'] } },
      { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1 } },
      { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 48 } },
    ], responses: { '200': ok, '400': { $ref: '#/components/responses/Error' } } } },
    '/products/{slug}': { get: { summary: 'Get an active product by slug', parameters: [{ in: 'path', name: 'slug', required: true, schema: { type: 'string' } }], responses: { '200': ok, '404': { $ref: '#/components/responses/Error' } } } },
    '/products/by-ids': { get: { summary: 'Get up to 12 active products in requested ID order', parameters: [{ in: 'query', name: 'ids', required: true, schema: { type: 'string', example: '64b000000000000000000001,64b000000000000000000002' } }], responses: { '200': ok, '400': { $ref: '#/components/responses/Error' } } } },
    '/cart': { get: { summary: 'Read the current cart and server calculated totals', security: auth, responses: { '200': ok } } },
    '/cart/items': { post: { summary: 'Add an item to the cart', security: auth, requestBody: body, responses: { '201': ok } } },
    '/cart/coupon': {
      post: { summary: 'Apply a server-validated coupon to the cart', security: auth, requestBody: body, responses: { '200': ok, '400': { $ref: '#/components/responses/Error' } } },
      delete: { summary: 'Remove the cart coupon', security: auth, responses: { '200': ok } },
    },
    '/addresses': {
      get: { summary: 'List the current user address book', security: auth, responses: { '200': ok } },
      post: { summary: 'Add a delivery address (maximum 10)', security: auth, requestBody: body, responses: { '201': ok, '400': { $ref: '#/components/responses/Error' } } },
    },
    '/addresses/{id}': {
      put: { summary: 'Update an owned address', security: auth, parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], requestBody: body, responses: { '200': ok, '404': { $ref: '#/components/responses/Error' } } },
      delete: { summary: 'Delete an owned address', security: auth, parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { '200': ok, '404': { $ref: '#/components/responses/Error' } } },
    },
    '/addresses/{id}/default': { patch: { summary: 'Make an owned address the default', security: auth, parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { '200': ok, '404': { $ref: '#/components/responses/Error' } } } },
    '/orders/checkout': { post: { summary: 'Create an order, reserve stock, then run simulated payment', security: auth, parameters: [{ in: 'header', name: 'Idempotency-Key', required: true, schema: { type: 'string', minLength: 8, maxLength: 64 } }], requestBody: body, responses: { '201': ok, '400': { $ref: '#/components/responses/Error' }, '409': { $ref: '#/components/responses/Error' } } } },
    '/orders': { get: { summary: 'List the current user orders with pagination and status filtering', security: auth, parameters: [{ in: 'query', name: 'page', schema: { type: 'integer', minimum: 1 } }, { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 50 } }, { in: 'query', name: 'status', schema: { type: 'string', enum: ['placed', 'paid', 'packed', 'shipped', 'delivered', 'cancelled'] } }], responses: { '200': ok } } },
    '/orders/{id}': { get: { summary: 'Get an owned order', security: auth, parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], responses: { '200': ok, '404': { $ref: '#/components/responses/Error' } } } },
    '/orders/{id}/pay-retry': { post: { summary: 'Retry sandbox payment for an owned pending or failed order', security: auth, parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }, { in: 'header', name: 'Idempotency-Key', required: true, schema: { type: 'string', minLength: 8, maxLength: 64 } }], requestBody: body, responses: { '200': ok, '409': { $ref: '#/components/responses/Error' } } } },
    '/orders/{id}/cancel': { post: { summary: 'Cancel an owned placed or paid order and restore stock', security: auth, parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }], requestBody: body, responses: { '200': ok, '409': { $ref: '#/components/responses/Error' } } } },
    '/admin/dashboard': { get: { summary: 'Read admin sales, status and low stock summary', security: auth, responses: { '200': ok, '403': { $ref: '#/components/responses/Error' } } } },
  },
};
