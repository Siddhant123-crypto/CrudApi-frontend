import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MESSAGING_RECIPIENTS_ENDPOINT,
  parseMessagingRecipients,
  filterMessagingRecipients,
  buildFarmerMessagePayload,
} from './messagingRecipientsUtils.ts';

test('uses PII-safe /user/messaging-recipients endpoint', () => {
  assert.equal(MESSAGING_RECIPIENTS_ENDPOINT, '/user/messaging-recipients');
});

test('customer-to-farmer parsing keeps only FARMER recipients and strips PII', () => {
  const backendResponse = [
    {
      userId: '11111111-1111-1111-1111-111111111111',
      name: 'Ramesh Patil',
      role: 'FARMER',
      profilePhoto: 'https://res.cloudinary.com/demo/ramesh.jpg',
      village: 'Satara',
      state: 'Maharashtra',
      email: 'should_not_leak@example.com',
      mobile: '9876543210',
      password: '$2a$10$secretHashValue',
      address: 'Private Street 1',
    },
    {
      userId: '22222222-2222-2222-2222-222222222222',
      name: 'Other Customer',
      role: 'CUSTOMER',
      profilePhoto: null,
      village: 'Pune',
      state: 'Maharashtra',
    },
  ];

  const farmers = parseMessagingRecipients(backendResponse, 'FARMER');
  assert.equal(farmers.length, 1);
  assert.equal(farmers[0].userId, '11111111-1111-1111-1111-111111111111');
  assert.equal(farmers[0].name, 'Ramesh Patil');
  assert.equal(farmers[0].profilePhoto, 'https://res.cloudinary.com/demo/ramesh.jpg');
  assert.equal(farmers[0].village, 'Satara');
  assert.equal(farmers[0].state, 'Maharashtra');
  assert.equal('password' in farmers[0], false);
  assert.equal('email' in farmers[0], false);
  assert.equal('mobile' in farmers[0], false);
  assert.equal('address' in farmers[0], false);
});

test('farmer-to-customer parsing supports wrapped { data: [...] } payloads', () => {
  const wrapped = {
    data: [
      {
        userId: '33333333-3333-3333-3333-333333333333',
        name: 'Asha Deshmukh',
        role: 'CUSTOMER',
        profilePhoto: null,
        village: 'Nashik',
        state: 'Maharashtra',
      },
    ],
  };

  const customers = parseMessagingRecipients(wrapped, 'CUSTOMER');
  assert.equal(customers.length, 1);
  assert.equal(customers[0].name, 'Asha Deshmukh');
  assert.equal(customers[0].role, 'CUSTOMER');
});

test('filterMessagingRecipients searches by name, village, and state safely', () => {
  const list = parseMessagingRecipients(
    [
      { userId: 'u1', name: 'Suresh', role: 'FARMER', profilePhoto: null, village: 'Satara', state: 'Maharashtra' },
      { userId: 'u2', name: 'Meena', role: 'FARMER', profilePhoto: null, village: 'Indore', state: 'Madhya Pradesh' },
    ],
    'FARMER',
  );

  assert.equal(filterMessagingRecipients(list, '').length, 2);
  assert.equal(filterMessagingRecipients(list, 'sur').length, 1);
  assert.equal(filterMessagingRecipients(list, 'indore')[0].userId, 'u2');
  assert.equal(filterMessagingRecipients(list, 'maharashtra')[0].userId, 'u1');
  assert.equal(filterMessagingRecipients(list, 'nonexistent').length, 0);
});

test('Farmer -> Admin without preSelectedCustomerId succeeds and omits receiverId', () => {
  const res = buildFarmerMessagePayload({
    isAdminMessage: true,
    specificUserId: '',
    title: 'Need Support',
    formattedMessage: 'From: Farmer\n\nPlease help with verification',
  });
  assert.equal(res.ok, true);
  assert.equal(res.payload?.receiverType, 'ADMIN');
  assert.equal(res.payload?.receiverId, undefined);
  assert.equal(res.payload?.notificationType, 'ADMIN');
});

test('Farmer -> Admin with explicit admin ID preserves receiverId', () => {
  const res = buildFarmerMessagePayload({
    isAdminMessage: true,
    specificUserId: 'admin-uuid-123',
    title: 'Reply to Admin',
    formattedMessage: 'From: Farmer\n\nThank you',
  });
  assert.equal(res.ok, true);
  assert.equal(res.payload?.receiverType, 'ADMIN');
  assert.equal(res.payload?.receiverId, 'admin-uuid-123');
  assert.equal(res.payload?.notificationType, 'ADMIN');
});

test('Farmer -> Specific Customer succeeds with receiverId', () => {
  const res = buildFarmerMessagePayload({
    isAdminMessage: false,
    specificUserId: 'cust-uuid-456',
    title: 'Fresh Harvest',
    formattedMessage: 'From: Farmer\n\nOrder ready',
  });
  assert.equal(res.ok, true);
  assert.equal(res.payload?.receiverType, 'CUSTOMER');
  assert.equal(res.payload?.receiverId, 'cust-uuid-456');
  assert.equal(res.payload?.notificationType, 'FARMER');
});

test('Farmer -> All Customers (missing customer ID) is rejected per BUG-014', () => {
  const res = buildFarmerMessagePayload({
    isAdminMessage: false,
    specificUserId: '   ',
    title: 'Broadcast Attempt',
    formattedMessage: 'From: Farmer\n\nHello everyone',
  });
  assert.equal(res.ok, false);
  assert.equal(res.errorCode, 'SELECT_CUSTOMER_REQUIRED');
  assert.equal(res.payload, undefined);
});

test('Farmer -> Admin with empty title/message is rejected cleanly', () => {
  const res = buildFarmerMessagePayload({
    isAdminMessage: true,
    specificUserId: undefined,
    title: '   ',
    formattedMessage: 'From: Farmer\n\nHello',
  });
  assert.equal(res.ok, false);
  assert.equal(res.errorCode, 'TITLE_OR_MESSAGE_REQUIRED');
});
