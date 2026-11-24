export type MessagingRecipientRole = 'FARMER' | 'CUSTOMER';

export interface MessagingRecipient {
  userId: string;
  name: string;
  role: MessagingRecipientRole;
  profilePhoto: string | null;
  village: string | null;
  state: string | null;
}

export const MESSAGING_RECIPIENTS_ENDPOINT = '/user/messaging-recipients';

/**
 * Parses and sanitizes the response from GET /user/messaging-recipients.
 * Retains only safe display fields (userId, name, role, profilePhoto, village, state)
 * and filters strictly to the expected target role.
 */
export const parseMessagingRecipients = (
  payload: unknown,
  expectedRole: MessagingRecipientRole,
): MessagingRecipient[] => {
  const rawList = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown[] } | null | undefined)?.data)
      ? ((payload as { data: unknown[] }).data)
      : [];

  const sanitized: MessagingRecipient[] = [];
  for (const item of rawList) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const rec = item as Record<string, unknown>;
    const role = typeof rec.role === 'string' ? rec.role.trim().toUpperCase() : '';
    if (role !== expectedRole) {
      continue;
    }
    const userIdRaw = rec.userId ?? rec.farmerId ?? rec.id;
    const userId = typeof userIdRaw === 'string' ? userIdRaw.trim() : '';
    if (!userId) {
      continue;
    }
    const name =
      typeof rec.name === 'string' && rec.name.trim().length > 0
        ? rec.name.trim()
        : 'Unknown';

    sanitized.push({
      userId,
      name,
      role: expectedRole,
      profilePhoto: typeof rec.profilePhoto === 'string' ? rec.profilePhoto : null,
      village: typeof rec.village === 'string' ? rec.village : null,
      state: typeof rec.state === 'string' ? rec.state : null,
    });
  }
  return sanitized;
};

/**
 * Case-insensitive recipient search by display name, village, or state.
 */
export const filterMessagingRecipients = (
  recipients: MessagingRecipient[],
  query: string,
): MessagingRecipient[] => {
  const q = (query || '').trim().toLowerCase();
  if (!q) {
    return recipients;
  }
  return recipients.filter((r) => {
    const nameMatch = r.name.toLowerCase().includes(q);
    const villageMatch = (r.village || '').toLowerCase().includes(q);
    const stateMatch = (r.state || '').toLowerCase().includes(q);
    return nameMatch || villageMatch || stateMatch;
  });
};

export interface FarmerMessageBuildInput {
  isAdminMessage: boolean;
  specificUserId?: string | null;
  title: string;
  formattedMessage: string;
}

export interface FarmerMessageBuildResult {
  ok: boolean;
  errorCode?: 'TITLE_OR_MESSAGE_REQUIRED' | 'SELECT_CUSTOMER_REQUIRED';
  payload?: {
    receiverType: 'ADMIN' | 'CUSTOMER';
    receiverId?: string;
    title: string;
    message: string;
    notificationType: 'ADMIN' | 'FARMER';
  };
}

/**
 * Validates and builds the NotificationSendRequest payload for FarmerMessageCustomerScreen.
 * - Farmer -> Admin: does NOT require a customer ID; sends specific admin ID when provided,
 *   or undefined (routed to active admins by backend) when omitted.
 * - Farmer -> Customer: requires a specific customer ID (broadcast to all customers is disabled per BUG-014).
 */
export const buildFarmerMessagePayload = (
  input: FarmerMessageBuildInput,
): FarmerMessageBuildResult => {
  const trimmedTitle = (input.title || '').trim();
  const trimmedMessage = (input.formattedMessage || '').trim();
  if (!trimmedTitle || !trimmedMessage) {
    return { ok: false, errorCode: 'TITLE_OR_MESSAGE_REQUIRED' };
  }

  const trimmedRecipientId = typeof input.specificUserId === 'string'
    ? input.specificUserId.trim()
    : '';

  if (input.isAdminMessage) {
    return {
      ok: true,
      payload: {
        receiverType: 'ADMIN',
        receiverId: trimmedRecipientId.length > 0 ? trimmedRecipientId : undefined,
        title: trimmedTitle,
        message: trimmedMessage,
        notificationType: 'ADMIN',
      },
    };
  }

  if (!trimmedRecipientId) {
    return { ok: false, errorCode: 'SELECT_CUSTOMER_REQUIRED' };
  }

  return {
    ok: true,
    payload: {
      receiverType: 'CUSTOMER',
      receiverId: trimmedRecipientId,
      title: trimmedTitle,
      message: trimmedMessage,
      notificationType: 'FARMER',
    },
  };
};
