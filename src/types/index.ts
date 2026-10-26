export type UserRole = 'fan' | 'creator' | 'admin';

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  coverUrl?: string;
  bio?: string;
  category?: 'Gaming' | 'Art' | 'Music' | 'Tech' | 'IRL';
  isLive?: boolean;
  streamTitle?: string;
  followersCount: number;
  followingCount: number;
  socials?: {
    instagram?: string;
    youtube?: string;
    twitch?: string;
    x?: string;
  };
  fanLevel?: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
  twoFactorEnabled?: boolean;
  isFollowedByMe?: boolean;
  createdAt: string;
}

export type LedgerEntryType =
  | 'purchase'
  | 'bonus'
  | 'gift_sent'
  | 'gift_received'
  | 'payout'
  | 'payout_refund'
  | 'voucher'
  | 'membership'
  | 'poll_vote'
  | 'paid_question';

export interface LedgerEntry {
  id: string;
  userId: string;
  type: LedgerEntryType;
  amount: number; // positive for credit, negative for debit
  balanceAfter: number;
  counterpartyId?: string;
  counterpartyName?: string;
  giftName?: string;
  giftCombo?: number;
  message?: string;
  isAnonymous?: boolean;
  receiptCode: string;
  createdAt: string;
}

export interface Post {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  content: string;
  imageUrl?: string;
  isPinned: boolean;
  isMembersOnly?: boolean;
  likesCount: number;
  likedByMe: boolean;
  commentsCount: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userRole: UserRole;
  fanBadge?: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
  content: string;
  createdAt: string;
}

export interface StreamMoment {
  id: string;
  creatorId: string;
  title: string;
  imageUrl: string;
  views: number;
  likes: number;
  timestamp: string;
}

export interface Supergift {
  id: string;
  name: string;
  cost: number;
  icon: string;
  tier: 'tier1' | 'tier2' | 'tier3' | 'tier4';
  description: string;
  animationType: 'rose' | 'coffee' | 'trophy' | 'rocket';
}

export interface LiveAlertEvent {
  id: string;
  creatorId: string;
  senderName: string;
  senderAvatar: string;
  giftName: string;
  giftIcon: string;
  amount: number;
  comboCount: number;
  message?: string;
  isAnonymous?: boolean;
  timestamp: string;
  tier: 'tier1' | 'tier2' | 'tier3' | 'tier4';
}

export interface PayoutRequest {
  id: string;
  creatorId: string;
  creatorName: string;
  type: 'upi' | 'voucher';
  coinsAmount: number;
  inrAmount: number;
  feeDeducted: number;
  destination: string; // UPI ID or voucher provider (Amazon, Swiggy, Steam)
  voucherCode?: string;
  status: 'pending' | 'paid' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
}

export interface WallOfFameSupporter {
  rank: number;
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string;
  coinsGifted: number;
  giftsCount: number;
  fanLevel: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
  isAnonymous?: boolean;
  isStreamersChoice?: boolean;
}

export interface PlatformSettings {
  coinToInrRate: number; // e.g., 1 coin = 1 INR
  platformFeePercent: number; // e.g., 10%
  welcomeBonus: number; // 100 coins
  minCashoutCoins: number; // 100 coins
}

export interface Poll {
  id: string;
  creatorId: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  costCoins: number;
  totalVotes: number;
  userVotedOptionId?: string;
  createdAt: string;
}

export interface PaidQuestion {
  id: string;
  creatorId: string;
  fanId: string;
  fanName: string;
  question: string;
  answer?: string;
  coinsAmount: number;
  createdAt: string;
}

export interface SafetyReport {
  id: string;
  reporterId: string;
  targetType: 'user' | 'post' | 'comment';
  targetId: string;
  targetContent: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}
