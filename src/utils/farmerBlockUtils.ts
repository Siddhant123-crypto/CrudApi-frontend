export interface BlockedFarmerProfileLike {
  role?: string | null;
  status?: string | null;
  isActive?: boolean | null;
  blockReason?: string | null;
  blockedUntil?: string | null;
  inactiveSource?: string | null;
}

export const isAdminBlockedFarmer = (profile?: BlockedFarmerProfileLike | null): boolean => {
  if (!profile) return false;
  if (String(profile.inactiveSource || '').toUpperCase() === 'SELF_DEACTIVATION') {
    return false;
  }
  const hasBlockMetadata = Boolean(
    (profile.blockReason && String(profile.blockReason).trim().length > 0) ||
      (profile.blockedUntil && String(profile.blockedUntil).trim().length > 0)
  );
  if (!hasBlockMetadata) {
    return false;
  }
  return (
    String(profile.status || '').toUpperCase() === 'INACTIVE' ||
    profile.isActive === false ||
    hasBlockMetadata
  );
};

export const formatBlockedUntilDate = (blockedUntil?: string | null): string | null => {
  if (!blockedUntil || !String(blockedUntil).trim()) return null;
  const parsed = new Date(blockedUntil);
  if (isNaN(parsed.getTime())) {
    return String(blockedUntil);
  }
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const extractBlockedFarmerInfo = (
  profile?: BlockedFarmerProfileLike | null
): { blocked: boolean; reason: string; blockedUntilText: string | null } => {
  if (!isAdminBlockedFarmer(profile)) {
    return { blocked: false, reason: '', blockedUntilText: null };
  }
  return {
    blocked: true,
    reason: String(profile?.blockReason || '').trim() || 'Account suspended by administrator',
    blockedUntilText: formatBlockedUntilDate(profile?.blockedUntil),
  };
};
