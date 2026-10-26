import {
  User,
  LedgerEntry,
  Post,
  Comment,
  StreamMoment,
  PayoutRequest,
  LiveAlertEvent,
  PlatformSettings,
  Poll,
  PaidQuestion,
  SafetyReport,
  WallOfFameSupporter,
} from '../types/index.ts';

// In-Memory Transactional SQLite/SQL Store
class DatabaseStore {
  public users: Map<string, User> = new Map();
  public ledger: LedgerEntry[] = [];
  public posts: Map<string, Post> = new Map();
  public comments: Map<string, Comment[]> = new Map();
  public postLikes: Map<string, Set<string>> = new Map(); // postId -> Set of userIds
  public follows: Map<string, Set<string>> = new Map(); // creatorId -> Set of fan userIds
  public streamMoments: Map<string, StreamMoment[]> = new Map(); // creatorId -> moments
  public payouts: PayoutRequest[] = [];
  public polls: Poll[] = [];
  public paidQuestions: PaidQuestion[] = [];
  public reports: SafetyReport[] = [];
  public userBlocks: Map<string, Set<string>> = new Map(); // userId -> Set of blocked userIds

  public settings: PlatformSettings = {
    coinToInrRate: 1.0, // 1 Coin = ₹1.00
    platformFeePercent: 10, // 10% platform fee
    welcomeBonus: 100,
    minCashoutCoins: 100,
  };

  // Rate limiting tracker: userId -> array of timestamps (ms)
  private sendTimestamps: Map<string, number[]> = new Map();

  // Alert listeners for real-time live events (SSE)
  private alertListeners: Array<(alert: LiveAlertEvent) => void> = [];

  constructor() {
    this.seedInitialData();
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
  }

  private generateReceipt(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'SB-';
    for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    code += '-';
    for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
  }

  // --- Seed Initial Data ---
  private seedInitialData() {
    // 1. Admin
    const admin: User = {
      id: 'usr_admin',
      username: 'admin',
      displayName: 'System Admin',
      email: 'admin@sb.com',
      role: 'admin',
      avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=AdminSB',
      followersCount: 0,
      followingCount: 0,
      createdAt: '2026-10-01T10:00:00Z',
    };
    this.users.set(admin.id, admin);

    // 2. Creators
    const nova: User = {
      id: 'usr_nova',
      username: 'novaplays',
      displayName: 'Nova Plays',
      email: 'nova@sb.com',
      role: 'creator',
      avatarUrl: '/src/assets/images/creator_novaplays_1793017028962.jpg',
      coverUrl: '/src/assets/images/moment_esports_win_1793017030160.jpg',
      bio: 'Competitive FPS Champion & Nightly Grinder 🎮 | Climbing to Predator Rank | Drop in and say hi!',
      category: 'Gaming',
      isLive: true,
      streamTitle: 'Road to Grandmaster | Chill late night ranked queue',
      followersCount: 2480,
      followingCount: 12,
      socials: {
        twitch: 'novaplays_live',
        youtube: 'novagaming_hub',
        instagram: 'nova.plays',
        x: 'novaplays_gg',
      },
      createdAt: '2026-10-05T12:00:00Z',
    };
    this.users.set(nova.id, nova);

    const pete: User = {
      id: 'usr_pete',
      username: 'pixelpete',
      displayName: 'Pixel Pete',
      email: 'pete@sb.com',
      role: 'creator',
      avatarUrl: '/src/assets/images/creator_pixelpete_1793017029781.jpg',
      coverUrl: '/src/assets/images/moment_creative_art_1793017031247.jpg',
      bio: 'Concept Artist & Lofi Animator 🎨 | Fantasy worlds & cozy studio vibes | Ask me anything about digital art!',
      category: 'Art',
      isLive: true,
      streamTitle: 'Fantasy Mountain Kingdom Speedpaint & Studio Q&A',
      followersCount: 1850,
      followingCount: 24,
      socials: {
        youtube: 'pixelpete_art',
        instagram: 'pixelpete.sketches',
        x: 'pixelpete',
      },
      createdAt: '2026-10-08T14:00:00Z',
    };
    this.users.set(pete.id, pete);

    // 3. Fans
    const sam: User = {
      id: 'usr_sam',
      username: 'sam_prime',
      displayName: 'Sam',
      email: 'sam@sb.com',
      role: 'fan',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=SamPrime',
      followersCount: 15,
      followingCount: 4,
      fanLevel: 'Gold',
      twoFactorEnabled: false,
      createdAt: '2026-10-10T08:00:00Z',
    };
    this.users.set(sam.id, sam);

    const riya: User = {
      id: 'usr_riya',
      username: 'riya_vibes',
      displayName: 'Riya',
      email: 'riya@sb.com',
      role: 'fan',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=RiyaVibes',
      followersCount: 8,
      followingCount: 6,
      fanLevel: 'Silver',
      twoFactorEnabled: false,
      createdAt: '2026-10-12T09:30:00Z',
    };
    this.users.set(riya.id, riya);

    // Initial Ledger entries (Computed balances)
    // Sam: +100 bonus, +2000 purchase, -500 gift to Nova (Trophy), -100 supercoins to Pete = 1500 balance
    this.addLedgerEntryDirect({
      id: 'led_1',
      userId: sam.id,
      type: 'bonus',
      amount: 100,
      balanceAfter: 100,
      receiptCode: 'SB-INIT-001',
      createdAt: '2026-10-10T08:01:00Z',
    });
    this.addLedgerEntryDirect({
      id: 'led_2',
      userId: sam.id,
      type: 'purchase',
      amount: 2000,
      balanceAfter: 2100,
      receiptCode: 'SB-CARD-8812',
      createdAt: '2026-10-15T12:00:00Z',
    });
    this.addLedgerEntryDirect({
      id: 'led_3',
      userId: sam.id,
      type: 'gift_sent',
      amount: -500,
      balanceAfter: 1600,
      counterpartyId: nova.id,
      counterpartyName: nova.displayName,
      giftName: 'Trophy',
      giftCombo: 1,
      message: 'GG on that insane clutch victory!',
      receiptCode: 'SB-GIFT-1001',
      createdAt: '2026-10-24T18:30:00Z',
    });
    this.addLedgerEntryDirect({
      id: 'led_4',
      userId: nova.id,
      type: 'gift_received',
      amount: 500,
      balanceAfter: 500,
      counterpartyId: sam.id,
      counterpartyName: sam.displayName,
      giftName: 'Trophy',
      giftCombo: 1,
      message: 'GG on that insane clutch victory!',
      receiptCode: 'SB-GIFT-1001',
      createdAt: '2026-10-24T18:30:00Z',
    });
    this.addLedgerEntryDirect({
      id: 'led_5',
      userId: sam.id,
      type: 'gift_sent',
      amount: -100,
      balanceAfter: 1500,
      counterpartyId: pete.id,
      counterpartyName: pete.displayName,
      giftName: 'Supercoins',
      message: 'Loved the fantasy sky colors today!',
      receiptCode: 'SB-GIFT-1002',
      createdAt: '2026-10-25T11:15:00Z',
    });
    this.addLedgerEntryDirect({
      id: 'led_6',
      userId: pete.id,
      type: 'gift_received',
      amount: 100,
      balanceAfter: 100,
      counterpartyId: sam.id,
      counterpartyName: sam.displayName,
      giftName: 'Supercoins',
      message: 'Loved the fantasy sky colors today!',
      receiptCode: 'SB-GIFT-1002',
      createdAt: '2026-10-25T11:15:00Z',
    });

    // Riya: +100 bonus, +1000 purchase, -200 supercoins to Nova, -50 Coffee to Nova = 850 balance
    this.addLedgerEntryDirect({
      id: 'led_7',
      userId: riya.id,
      type: 'bonus',
      amount: 100,
      balanceAfter: 100,
      receiptCode: 'SB-INIT-002',
      createdAt: '2026-10-12T09:31:00Z',
    });
    this.addLedgerEntryDirect({
      id: 'led_8',
      userId: riya.id,
      type: 'purchase',
      amount: 1000,
      balanceAfter: 1100,
      receiptCode: 'SB-UPI-9921',
      createdAt: '2026-10-18T16:20:00Z',
    });
    this.addLedgerEntryDirect({
      id: 'led_9',
      userId: riya.id,
      type: 'gift_sent',
      amount: -200,
      balanceAfter: 900,
      counterpartyId: nova.id,
      counterpartyName: nova.displayName,
      giftName: 'Supercoins',
      message: 'Keep rocking the tournament!',
      receiptCode: 'SB-GIFT-1003',
      createdAt: '2026-10-25T14:10:00Z',
    });
    this.addLedgerEntryDirect({
      id: 'led_10',
      userId: nova.id,
      type: 'gift_received',
      amount: 200,
      balanceAfter: 700,
      counterpartyId: riya.id,
      counterpartyName: riya.displayName,
      giftName: 'Supercoins',
      message: 'Keep rocking the tournament!',
      receiptCode: 'SB-GIFT-1003',
      createdAt: '2026-10-25T14:10:00Z',
    });
    this.addLedgerEntryDirect({
      id: 'led_11',
      userId: riya.id,
      type: 'gift_sent',
      amount: -50,
      balanceAfter: 850,
      counterpartyId: nova.id,
      counterpartyName: nova.displayName,
      giftName: 'Coffee',
      message: 'Fuel for the late night stream ☕',
      receiptCode: 'SB-GIFT-1004',
      createdAt: '2026-10-25T19:40:00Z',
    });
    this.addLedgerEntryDirect({
      id: 'led_12',
      userId: nova.id,
      type: 'gift_received',
      amount: 50,
      balanceAfter: 750,
      counterpartyId: riya.id,
      counterpartyName: riya.displayName,
      giftName: 'Coffee',
      message: 'Fuel for the late night stream ☕',
      receiptCode: 'SB-GIFT-1004',
      createdAt: '2026-10-25T19:40:00Z',
    });

    // Seed Posts
    const postNova1: Post = {
      id: 'post_nova_1',
      creatorId: nova.id,
      creatorName: nova.displayName,
      creatorAvatar: nova.avatarUrl,
      content: '🔥 WE HIT TOP 500! Thank you to everyone who supported during the 12-hour marathon stream. Wall of fame rewards going out tonight! Check out the stream moment from our final championship win.',
      imageUrl: '/src/assets/images/moment_esports_win_1793017030160.jpg',
      isPinned: true,
      likesCount: 142,
      likedByMe: true,
      commentsCount: 3,
      createdAt: '2026-10-25T20:00:00Z',
    };
    this.posts.set(postNova1.id, postNova1);

    const postNova2: Post = {
      id: 'post_nova_2',
      creatorId: nova.id,
      creatorName: nova.displayName,
      creatorAvatar: nova.avatarUrl,
      content: 'Tonight schedule: Starting with viewer custom lobbies at 8 PM IST, then 1v1 community tourney! Winner gets a special Supergift shoutout on the OBS overlay!',
      isPinned: false,
      likesCount: 68,
      likedByMe: false,
      commentsCount: 1,
      createdAt: '2026-10-26T02:00:00Z',
    };
    this.posts.set(postNova2.id, postNova2);

    const postPete1: Post = {
      id: 'post_pete_1',
      creatorId: pete.id,
      creatorName: pete.displayName,
      creatorAvatar: pete.avatarUrl,
      content: 'Here is the step-by-step lighting pass on today\'s fantasy floating islands landscape piece. Let me know in the comments if you prefer the dusk or golden hour lighting!',
      imageUrl: '/src/assets/images/moment_creative_art_1793017031247.jpg',
      isPinned: true,
      likesCount: 189,
      likedByMe: false,
      commentsCount: 2,
      createdAt: '2026-10-25T16:00:00Z',
    };
    this.posts.set(postPete1.id, postPete1);

    // Seed Comments
    this.comments.set(postNova1.id, [
      {
        id: 'comm_1',
        postId: postNova1.id,
        userId: sam.id,
        userName: sam.displayName,
        userAvatar: sam.avatarUrl,
        userRole: 'fan',
        fanBadge: 'Gold',
        content: 'That final 1v3 flick shot was legendary! Well deserved Predator rank.',
        createdAt: '2026-10-25T20:15:00Z',
      },
      {
        id: 'comm_2',
        postId: postNova1.id,
        userId: riya.id,
        userName: riya.displayName,
        userAvatar: riya.avatarUrl,
        userRole: 'fan',
        fanBadge: 'Silver',
        content: 'Was cheering the whole time! Don\'t forget to sleep haha.',
        createdAt: '2026-10-25T20:30:00Z',
      },
    ]);

    this.comments.set(postPete1.id, [
      {
        id: 'comm_3',
        postId: postPete1.id,
        userId: sam.id,
        userName: sam.displayName,
        userAvatar: sam.avatarUrl,
        userRole: 'fan',
        fanBadge: 'Gold',
        content: 'The rim lighting on the floating temple ruins is stunning!',
        createdAt: '2026-10-25T16:40:00Z',
      },
    ]);

    // Seed Stream Moments
    this.streamMoments.set(nova.id, [
      {
        id: 'mom_1',
        creatorId: nova.id,
        title: 'Championship Trophy Moment - Aura Esports Final',
        imageUrl: '/src/assets/images/moment_esports_win_1793017030160.jpg',
        views: 8420,
        likes: 620,
        timestamp: 'Season 4 Grand Final',
      },
    ]);

    this.streamMoments.set(pete.id, [
      {
        id: 'mom_2',
        creatorId: pete.id,
        title: 'Fantasy Island Temple Speedpaint Stream Session',
        imageUrl: '/src/assets/images/moment_creative_art_1793017031247.jpg',
        views: 4190,
        likes: 430,
        timestamp: 'Live Studio Workshop #42',
      },
    ]);

    // Seed Follows
    this.follows.set(nova.id, new Set([sam.id, riya.id]));
    this.follows.set(pete.id, new Set([sam.id]));

    // Seed Payout Requests
    this.payouts.push({
      id: 'pay_1',
      creatorId: nova.id,
      creatorName: nova.displayName,
      type: 'upi',
      coinsAmount: 300,
      inrAmount: 270,
      feeDeducted: 30,
      destination: 'novaplays@okhdfcbank',
      status: 'pending',
      createdAt: '2026-10-25T22:00:00Z',
    });

    this.payouts.push({
      id: 'pay_2',
      creatorId: pete.id,
      creatorName: pete.displayName,
      type: 'voucher',
      coinsAmount: 100,
      inrAmount: 90,
      feeDeducted: 10,
      destination: 'Amazon India',
      voucherCode: 'AMZN-8924-K281',
      status: 'paid',
      createdAt: '2026-10-23T15:00:00Z',
    });

    // Seed Polls
    this.polls.push({
      id: 'poll_1',
      creatorId: nova.id,
      question: 'Which game should we play for Saturday Community Stream?',
      options: [
        { id: 'opt_1', text: 'Apex Legends Custom Tourney', votes: 45 },
        { id: 'opt_2', text: 'Valorant Ranked Grinding', votes: 38 },
        { id: 'opt_3', text: 'Cyberpunk 2077 Max Difficulty', votes: 19 },
      ],
      costCoins: 5,
      totalVotes: 102,
      createdAt: '2026-10-25T10:00:00Z',
    });

    // Seed Paid Questions
    this.paidQuestions.push({
      id: 'q_1',
      creatorId: pete.id,
      fanId: sam.id,
      fanName: sam.displayName,
      question: 'What brush pack do you recommend for beginners painting cloud textures?',
      answer: 'I use the Kyle T. Webster gouache & soft wet blender brushes in Photoshop! Start with large block-ins before detailing.',
      coinsAmount: 25,
      createdAt: '2026-10-25T17:10:00Z',
    });
  }

  private addLedgerEntryDirect(entry: LedgerEntry) {
    this.ledger.push(entry);
  }

  // --- Core Ledger Balance Engine ---
  // Pure computed balance from the ledger: SUM(amount)
  public getBalance(userId: string): number {
    return this.ledger
      .filter((entry) => entry.userId === userId)
      .reduce((sum, entry) => sum + entry.amount, 0);
  }

  public getLedgerHistory(userId: string): LedgerEntry[] {
    return this.ledger
      .filter((entry) => entry.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // --- Buying Coins ---
  public buyCoins(
    userId: string,
    coinsAmount: number,
    paymentMethod: 'upi' | 'card' | 'netbanking',
    metadata: { upiId?: string; upiApp?: string; cardLast4?: string; bankName?: string }
  ): LedgerEntry {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    if (coinsAmount <= 0) throw new Error('Invalid coin quantity');

    const currentBalance = this.getBalance(userId);
    const newBalance = currentBalance + coinsAmount;
    const receiptCode = this.generateReceipt();

    let desc = `Purchased ${coinsAmount} coins via `;
    if (paymentMethod === 'upi') desc += `UPI (${metadata.upiApp || metadata.upiId || 'Direct'})`;
    else if (paymentMethod === 'card') desc += `Card (ending in ${metadata.cardLast4 || '4242'})`;
    else desc += `Net Banking (${metadata.bankName || 'HDFC'})`;

    const entry: LedgerEntry = {
      id: this.generateId('led'),
      userId,
      type: 'purchase',
      amount: coinsAmount,
      balanceAfter: newBalance,
      message: desc,
      receiptCode,
      createdAt: new Date().toISOString(),
    };

    this.ledger.push(entry);
    return entry;
  }

  // --- Atomic Gift & Supercoins Transaction ---
  public sendSupport(
    fanId: string,
    creatorId: string,
    giftType: 'supercoins' | 'supergift',
    amount: number,
    giftDetails: {
      giftName: string;
      giftIcon?: string;
      message?: string;
      isAnonymous?: boolean;
      tier?: 'tier1' | 'tier2' | 'tier3' | 'tier4';
      comboCount?: number;
    }
  ): { fanEntry: LedgerEntry; creatorEntry: LedgerEntry; alert: LiveAlertEvent } {
    const fan = this.users.get(fanId);
    const creator = this.users.get(creatorId);

    if (!fan) throw new Error('Fan not found');
    if (!creator) throw new Error('Creator not found');
    if (creator.role !== 'creator') throw new Error('Target is not a creator');
    if (fanId === creatorId) throw new Error('Cannot send support to yourself');
    if (amount <= 0) throw new Error('Amount must be positive');

    // 1. Rate Limiting Check (max 5 sends per 10s)
    const now = Date.now();
    const timestamps = (this.sendTimestamps.get(fanId) || []).filter((t) => now - t < 10000);
    if (timestamps.length >= 5) {
      throw new Error('Rate limit exceeded: maximum 5 gifts per 10 seconds. Please wait a moment.');
    }
    timestamps.push(now);
    this.sendTimestamps.set(fanId, timestamps);

    // 2. Abusive words filter
    const abusiveWords = ['abuse', 'cheat', 'scam', 'hate', 'trash', 'idiot', 'stupid', 'bastard'];
    if (giftDetails.message) {
      const lowerMsg = giftDetails.message.toLowerCase();
      for (const word of abusiveWords) {
        if (lowerMsg.includes(word)) {
          throw new Error(`Message contains prohibited language: "${word}". Please keep it positive.`);
        }
      }
    }

    // 3. Balance verification
    const fanBalance = this.getBalance(fanId);
    if (fanBalance < amount) {
      throw new Error(`Insufficient coin balance. You have ${fanBalance} coins, need ${amount} coins.`);
    }

    // 4. Atomic Execution: Fan debit and Creator credit
    const fanNewBal = fanBalance - amount;
    const creatorCurrentBal = this.getBalance(creatorId);
    const creatorNewBal = creatorCurrentBal + amount;
    const receiptCode = this.generateReceipt();
    const timestampStr = new Date().toISOString();

    const fanEntry: LedgerEntry = {
      id: this.generateId('led'),
      userId: fanId,
      type: 'gift_sent',
      amount: -amount,
      balanceAfter: fanNewBal,
      counterpartyId: creatorId,
      counterpartyName: creator.displayName,
      giftName: giftDetails.giftName,
      giftCombo: giftDetails.comboCount || 1,
      message: giftDetails.message,
      isAnonymous: giftDetails.isAnonymous,
      receiptCode,
      createdAt: timestampStr,
    };

    const creatorEntry: LedgerEntry = {
      id: this.generateId('led'),
      userId: creatorId,
      type: 'gift_received',
      amount: amount,
      balanceAfter: creatorNewBal,
      counterpartyId: fanId,
      counterpartyName: giftDetails.isAnonymous ? `Fan #${fanId.slice(-4)}` : fan.displayName,
      giftName: giftDetails.giftName,
      giftCombo: giftDetails.comboCount || 1,
      message: giftDetails.message,
      isAnonymous: giftDetails.isAnonymous,
      receiptCode,
      createdAt: timestampStr,
    };

    // Push atomically
    this.ledger.push(fanEntry);
    this.ledger.push(creatorEntry);

    // 5. Build Live Alert Event
    const alert: LiveAlertEvent = {
      id: this.generateId('alrt'),
      creatorId,
      senderName: giftDetails.isAnonymous ? `Fan #${fanId.slice(-4)}` : fan.displayName,
      senderAvatar: giftDetails.isAnonymous ? 'https://api.dicebear.com/7.x/shapes/svg?seed=Anon' : fan.avatarUrl,
      giftName: giftDetails.giftName,
      giftIcon: giftDetails.giftIcon || '🪙',
      amount,
      comboCount: giftDetails.comboCount || 1,
      message: giftDetails.message,
      isAnonymous: giftDetails.isAnonymous,
      timestamp: timestampStr,
      tier: giftDetails.tier || 'tier1',
    };

    // Dispatch to all live listeners (OBS / WebSockets / SSE)
    this.broadcastAlert(alert);

    return { fanEntry, creatorEntry, alert };
  }

  // --- Real-time Alerts Engine ---
  public subscribeAlerts(listener: (alert: LiveAlertEvent) => void): () => void {
    this.alertListeners.push(listener);
    return () => {
      this.alertListeners = this.alertListeners.filter((l) => l !== listener);
    };
  }

  public broadcastAlert(alert: LiveAlertEvent) {
    this.alertListeners.forEach((listener) => {
      try {
        listener(alert);
      } catch (err) {
        console.error('Error dispatching alert to listener:', err);
      }
    });
  }

  // --- Weekly Wall of Fame Computation ---
  public getWeeklyWallOfFame(creatorId: string, sortBy: 'coins' | 'count' = 'coins'): WallOfFameSupporter[] {
    // Filter gifts received by this creator
    const gifts = this.ledger.filter(
      (entry) => entry.userId === creatorId && entry.type === 'gift_received' && entry.counterpartyId
    );

    const supportersMap: Map<
      string,
      { coins: number; count: number; name: string; isAnon: boolean }
    > = new Map();

    gifts.forEach((entry) => {
      const fanId = entry.counterpartyId!;
      const existing = supportersMap.get(fanId) || {
        coins: 0,
        count: 0,
        name: entry.counterpartyName || 'Supporter',
        isAnon: !!entry.isAnonymous,
      };
      existing.coins += entry.amount;
      existing.count += entry.giftCombo || 1;
      supportersMap.set(fanId, existing);
    });

    const list: WallOfFameSupporter[] = [];
    supportersMap.forEach((data, userId) => {
      const user = this.users.get(userId);
      const fanLevel =
        data.coins >= 1000 ? 'Diamond' : data.coins >= 500 ? 'Gold' : data.coins >= 100 ? 'Silver' : 'Bronze';

      list.push({
        rank: 0,
        userId,
        displayName: data.isAnon ? `Fan #${userId.slice(-4)}` : user?.displayName || data.name,
        username: data.isAnon ? 'anonymous' : user?.username || 'user',
        avatarUrl: data.isAnon ? 'https://api.dicebear.com/7.x/shapes/svg?seed=Anon' : user?.avatarUrl || '',
        coinsGifted: data.coins,
        giftsCount: data.count,
        fanLevel,
        isAnonymous: data.isAnon,
        isStreamersChoice: userId === 'usr_sam', // Pinned demo choice
      });
    });

    if (sortBy === 'coins') {
      list.sort((a, b) => b.coinsGifted - a.coinsGifted);
    } else {
      list.sort((a, b) => b.giftsCount - a.giftsCount);
    }

    // Assign ranks
    list.forEach((item, index) => {
      item.rank = index + 1;
    });

    return list;
  }

  // --- Cashout & Payouts ---
  public requestCashout(
    creatorId: string,
    type: 'upi' | 'voucher',
    coinsAmount: number,
    destination: string
  ): PayoutRequest {
    const creator = this.users.get(creatorId);
    if (!creator) throw new Error('Creator not found');
    if (creator.role !== 'creator') throw new Error('Only creators can cash out');

    if (coinsAmount < this.settings.minCashoutCoins) {
      throw new Error(`Minimum cashout is ${this.settings.minCashoutCoins} coins.`);
    }

    const currentBal = this.getBalance(creatorId);
    if (currentBal < coinsAmount) {
      throw new Error(`Insufficient coins. Available: ${currentBal}, requested: ${coinsAmount}.`);
    }

    const grossInr = coinsAmount * this.settings.coinToInrRate;
    const fee = Math.round((grossInr * this.settings.platformFeePercent) / 100);
    const netInr = grossInr - fee;

    // Deduct coins from ledger immediately
    const receiptCode = this.generateReceipt();
    const ledgerEntry: LedgerEntry = {
      id: this.generateId('led'),
      userId: creatorId,
      type: type === 'upi' ? 'payout' : 'voucher',
      amount: -coinsAmount,
      balanceAfter: currentBal - coinsAmount,
      message: `${type === 'upi' ? 'UPI Payout' : 'Voucher Redemption'} to ${destination}`,
      receiptCode,
      createdAt: new Date().toISOString(),
    };
    this.ledger.push(ledgerEntry);

    // If voucher, instant redemption code
    let voucherCode: string | undefined = undefined;
    if (type === 'voucher') {
      const codePrefix = destination.toLowerCase().includes('amazon')
        ? 'AMZN'
        : destination.toLowerCase().includes('swiggy')
        ? 'SWIG'
        : 'STEM';
      voucherCode = `${codePrefix}-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    }

    const payout: PayoutRequest = {
      id: this.generateId('pay'),
      creatorId,
      creatorName: creator.displayName,
      type,
      coinsAmount,
      inrAmount: netInr,
      feeDeducted: fee,
      destination,
      voucherCode,
      status: type === 'voucher' ? 'paid' : 'pending',
      createdAt: new Date().toISOString(),
    };

    this.payouts.unshift(payout);
    return payout;
  }

  // Admin approves or rejects payout (rejection refunds coins!)
  public processAdminPayout(payoutId: string, action: 'approve' | 'reject', rejectionReason?: string): PayoutRequest {
    const payout = this.payouts.find((p) => p.id === payoutId);
    if (!payout) throw new Error('Payout request not found');
    if (payout.status !== 'pending') throw new Error(`Payout is already ${payout.status}`);

    if (action === 'approve') {
      payout.status = 'paid';
    } else {
      payout.status = 'rejected';
      payout.rejectionReason = rejectionReason || 'Information mismatch or compliance check failure';

      // Atomic refund of coins back to creator's ledger!
      const currentBal = this.getBalance(payout.creatorId);
      const refundEntry: LedgerEntry = {
        id: this.generateId('led'),
        userId: payout.creatorId,
        type: 'payout_refund',
        amount: payout.coinsAmount,
        balanceAfter: currentBal + payout.coinsAmount,
        message: `Refunded rejected payout #${payout.id}: ${payout.rejectionReason}`,
        receiptCode: this.generateReceipt(),
        createdAt: new Date().toISOString(),
      };
      this.ledger.push(refundEntry);
    }

    return payout;
  }
}

export const db = new DatabaseStore();
