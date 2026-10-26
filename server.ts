import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from './src/server/db.ts';
import { User, LiveAlertEvent, Post, Comment, PaidQuestion, SafetyReport } from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory session tracking for active user (defaults to Fan Sam)
let currentSessionUserId = 'usr_sam';

async function startServer() {
  const app = express();
  app.use(express.json());

  // Static assets serving
  app.use('/src/assets/images', express.static(path.join(__dirname, 'src/assets/images')));

  // --- Auth & Session Routes ---
  app.get('/api/auth/me', (req: Request, res: Response) => {
    const user = db.users.get(currentSessionUserId) || db.users.get('usr_sam')!;
    const balance = db.getBalance(user.id);
    const followingSet = db.follows.get('usr_nova')?.has(user.id) || false;
    res.json({
      user,
      balance,
      inrValue: balance * db.settings.coinToInrRate,
      settings: db.settings,
    });
  });

  app.post('/api/auth/switch-role', (req: Request, res: Response) => {
    const { userId, role } = req.body;
    let targetUser: User | undefined;

    if (userId && db.users.has(userId)) {
      targetUser = db.users.get(userId);
    } else if (role === 'admin') {
      targetUser = db.users.get('usr_admin');
    } else if (role === 'creator') {
      targetUser = db.users.get('usr_nova');
    } else {
      targetUser = db.users.get('usr_sam');
    }

    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    currentSessionUserId = targetUser.id;
    const balance = db.getBalance(targetUser.id);

    res.json({
      user: targetUser,
      balance,
      inrValue: balance * db.settings.coinToInrRate,
      settings: db.settings,
    });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password, code2fa } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const found = Array.from(db.users.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim()
    );

    if (!found) {
      return res.status(401).json({ error: 'No account found with this email. Please check your credentials.' });
    }

    // Optional 2FA simulation
    if (found.twoFactorEnabled && !code2fa) {
      return res.status(200).json({ requires2fa: true, message: 'Please enter your 6-digit authentication code' });
    }

    currentSessionUserId = found.id;
    const balance = db.getBalance(found.id);
    res.json({
      user: found,
      balance,
      inrValue: balance * db.settings.coinToInrRate,
      settings: db.settings,
    });
  });

  app.post('/api/auth/signup', (req: Request, res: Response) => {
    const { username, displayName, email, role, twoFactor } = req.body;
    if (!username || !displayName || !email) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
    const existing = Array.from(db.users.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim() || u.username.toLowerCase() === cleanUsername
    );

    if (existing) {
      return res.status(400).json({ error: 'Username or email already in use. Try logging in.' });
    }

    const newId = `usr_${cleanUsername}_${Date.now().toString(36)}`;
    const userRole = role === 'creator' ? 'creator' : 'fan';
    const newUser: User = {
      id: newId,
      username: cleanUsername,
      displayName: displayName.trim(),
      email: email.toLowerCase().trim(),
      role: userRole,
      avatarUrl: `https://api.dicebear.com/7.x/${userRole === 'creator' ? 'adventurer' : 'bottts'}/svg?seed=${cleanUsername}`,
      coverUrl: userRole === 'creator' ? '/src/assets/images/moment_esports_win_1793017030160.jpg' : undefined,
      category: userRole === 'creator' ? 'Gaming' : undefined,
      isLive: userRole === 'creator' ? true : false,
      followersCount: 0,
      followingCount: 0,
      twoFactorEnabled: !!twoFactor,
      fanLevel: 'Bronze',
      createdAt: new Date().toISOString(),
    };

    db.users.set(newUser.id, newUser);
    currentSessionUserId = newUser.id;

    // Welcome bonus of 100 coins
    const bonus = db.settings.welcomeBonus;
    db.ledger.push({
      id: `led_bonus_${Date.now()}`,
      userId: newUser.id,
      type: 'bonus',
      amount: bonus,
      balanceAfter: bonus,
      receiptCode: `SB-WELCOME-${Math.floor(1000 + Math.random() * 9000)}`,
      message: 'Welcome to Streamer Buddy! Starter coin bonus',
      createdAt: new Date().toISOString(),
    });

    res.json({
      user: newUser,
      balance: bonus,
      inrValue: bonus * db.settings.coinToInrRate,
      settings: db.settings,
    });
  });

  // --- Wallet & Ledger Routes ---
  app.get('/api/wallet/ledger', (req: Request, res: Response) => {
    const userId = (req.query.userId as string) || currentSessionUserId;
    const history = db.getLedgerHistory(userId);
    const balance = db.getBalance(userId);
    res.json({ balance, inrValue: balance * db.settings.coinToInrRate, history });
  });

  app.post('/api/wallet/buy', (req: Request, res: Response) => {
    try {
      const { coinsAmount, paymentMethod, metadata } = req.body;
      const entry = db.buyCoins(currentSessionUserId, Number(coinsAmount), paymentMethod, metadata || {});
      const balance = db.getBalance(currentSessionUserId);
      res.json({ success: true, entry, balance, inrValue: balance * db.settings.coinToInrRate });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Payment processing failed' });
    }
  });

  // --- Creators Routes ---
  app.get('/api/creators', (req: Request, res: Response) => {
    const search = ((req.query.search as string) || '').toLowerCase();
    const category = (req.query.category as string) || 'all';

    let creators = Array.from(db.users.values()).filter((u) => u.role === 'creator');

    if (category !== 'all') {
      creators = creators.filter((c) => c.category?.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      creators = creators.filter(
        (c) =>
          c.displayName.toLowerCase().includes(search) ||
          c.username.toLowerCase().includes(search) ||
          c.bio?.toLowerCase().includes(search)
      );
    }

    const result = creators.map((c) => {
      const followers = db.follows.get(c.id);
      return {
        ...c,
        followersCount: followers ? followers.size : c.followersCount,
        isFollowedByMe: followers ? followers.has(currentSessionUserId) : false,
      };
    });

    res.json(result);
  });

  app.get('/api/creators/:id', (req: Request, res: Response) => {
    const creator = db.users.get(req.params.id);
    if (!creator || creator.role !== 'creator') {
      return res.status(404).json({ error: 'Creator not found' });
    }

    const followers = db.follows.get(creator.id) || new Set();
    const moments = db.streamMoments.get(creator.id) || [];
    const posts = Array.from(db.posts.values())
      .filter((p) => p.creatorId === creator.id)
      .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      creator: {
        ...creator,
        followersCount: followers.size,
        isFollowedByMe: followers.has(currentSessionUserId),
      },
      streamMoments: moments,
      posts,
      balance: db.getBalance(creator.id),
    });
  });

  app.post('/api/creators/:id/follow', (req: Request, res: Response) => {
    const creatorId = req.params.id;
    const creator = db.users.get(creatorId);
    if (!creator) return res.status(404).json({ error: 'Creator not found' });

    let followers = db.follows.get(creatorId);
    if (!followers) {
      followers = new Set();
      db.follows.set(creatorId, followers);
    }

    const isFollowing = followers.has(currentSessionUserId);
    if (isFollowing) {
      followers.delete(currentSessionUserId);
    } else {
      followers.add(currentSessionUserId);
    }

    res.json({ isFollowedByMe: !isFollowing, followersCount: followers.size });
  });

  // --- Support & Gifting Routes ---
  app.post('/api/support/send', (req: Request, res: Response) => {
    try {
      const { creatorId, giftType, amount, giftDetails } = req.body;
      const result = db.sendSupport(currentSessionUserId, creatorId, giftType, Number(amount), giftDetails || {});
      const fanBalance = db.getBalance(currentSessionUserId);
      res.json({
        success: true,
        receiptCode: result.fanEntry.receiptCode,
        balance: fanBalance,
        alert: result.alert,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Support transaction failed' });
    }
  });

  // --- Real-time Alerts Engine (SSE) ---
  app.get('/api/alerts/stream', (req: Request, res: Response) => {
    const creatorId = req.query.creatorId as string;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 15000);

    const unsubscribe = db.subscribeAlerts((alert: LiveAlertEvent) => {
      // If creatorId specified, only send for this creator (or send all if none specified)
      if (!creatorId || alert.creatorId === creatorId) {
        res.write(`data: ${JSON.stringify(alert)}\n\n`);
      }
    });

    req.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  });

  app.post('/api/alerts/test', (req: Request, res: Response) => {
    const { creatorId, tier } = req.body;
    const targetCreator = creatorId || 'usr_nova';

    const testGifts = {
      tier1: { name: 'Rose', icon: '🌹', cost: 10 },
      tier2: { name: 'Coffee', icon: '☕', cost: 50 },
      tier3: { name: 'Trophy', icon: '🏆', cost: 500 },
      tier4: { name: 'Rocket', icon: '🚀', cost: 1000 },
    };

    const selectedTier = (tier as keyof typeof testGifts) || 'tier3';
    const giftInfo = testGifts[selectedTier] || testGifts.tier3;

    const alert: LiveAlertEvent = {
      id: `test_${Date.now()}`,
      creatorId: targetCreator,
      senderName: 'Test Fan',
      senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=TestFan',
      giftName: giftInfo.name,
      giftIcon: giftInfo.icon,
      amount: giftInfo.cost,
      comboCount: 3,
      message: `Simulated live test alert for ${giftInfo.name}! Looks amazing on stream! 🎉`,
      isAnonymous: false,
      timestamp: new Date().toISOString(),
      tier: selectedTier,
    };

    db.broadcastAlert(alert);
    res.json({ success: true, alert });
  });

  // --- Posts & Community Feeds ---
  app.get('/api/posts', (req: Request, res: Response) => {
    const creatorId = req.query.creatorId as string;
    let list = Array.from(db.posts.values());

    if (creatorId) {
      list = list.filter((p) => p.creatorId === creatorId);
    }

    // Sort pinned on top, then newest
    list.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Enrich with likes and comments
    const enriched = list.map((p) => {
      const likes = db.postLikes.get(p.id) || new Set();
      const comments = db.comments.get(p.id) || [];
      return {
        ...p,
        likesCount: p.likesCount + likes.size,
        likedByMe: likes.has(currentSessionUserId) || p.likedByMe,
        commentsCount: comments.length,
      };
    });

    res.json(enriched);
  });

  app.post('/api/posts', (req: Request, res: Response) => {
    const creator = db.users.get(currentSessionUserId);
    if (!creator || creator.role !== 'creator') {
      return res.status(403).json({ error: 'Only creators can publish stream posts' });
    }

    const { content, imageUrl, isPinned, isMembersOnly } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Post content cannot be empty' });
    }

    const newPost: Post = {
      id: `post_${Date.now()}`,
      creatorId: creator.id,
      creatorName: creator.displayName,
      creatorAvatar: creator.avatarUrl,
      content: content.trim(),
      imageUrl,
      isPinned: !!isPinned,
      isMembersOnly: !!isMembersOnly,
      likesCount: 0,
      likedByMe: false,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
    };

    // If pinned, unpin other posts by this creator
    if (newPost.isPinned) {
      db.posts.forEach((p) => {
        if (p.creatorId === creator.id) p.isPinned = false;
      });
    }

    db.posts.set(newPost.id, newPost);
    res.json(newPost);
  });

  app.post('/api/posts/:id/like', (req: Request, res: Response) => {
    const post = db.posts.get(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    let likes = db.postLikes.get(post.id);
    if (!likes) {
      likes = new Set();
      db.postLikes.set(post.id, likes);
    }

    const hasLiked = likes.has(currentSessionUserId);
    if (hasLiked) {
      likes.delete(currentSessionUserId);
    } else {
      likes.add(currentSessionUserId);
    }

    res.json({ liked: !hasLiked, totalLikes: post.likesCount + likes.size });
  });

  app.post('/api/posts/:id/pin', (req: Request, res: Response) => {
    const post = db.posts.get(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.creatorId !== currentSessionUserId) {
      return res.status(403).json({ error: 'Only the author can pin this post' });
    }

    // Toggle pin
    const willPin = !post.isPinned;
    if (willPin) {
      db.posts.forEach((p) => {
        if (p.creatorId === currentSessionUserId) p.isPinned = false;
      });
    }
    post.isPinned = willPin;

    res.json({ isPinned: post.isPinned });
  });

  app.get('/api/posts/:id/comments', (req: Request, res: Response) => {
    const comments = db.comments.get(req.params.id) || [];
    res.json(comments);
  });

  app.post('/api/posts/:id/comments', (req: Request, res: Response) => {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content cannot be empty' });
    }

    const user = db.users.get(currentSessionUserId)!;
    const post = db.posts.get(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    let postComments = db.comments.get(post.id);
    if (!postComments) {
      postComments = [];
      db.comments.set(post.id, postComments);
    }

    const newComment: Comment = {
      id: `comm_${Date.now()}`,
      postId: post.id,
      userId: user.id,
      userName: user.displayName,
      userAvatar: user.avatarUrl,
      userRole: user.role,
      fanBadge: user.fanLevel || 'Bronze',
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    postComments.push(newComment);
    res.json(newComment);
  });

  app.delete('/api/posts/:id/comments/:commentId', (req: Request, res: Response) => {
    const post = db.posts.get(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const comments = db.comments.get(post.id) || [];
    const index = comments.findIndex((c) => c.id === req.params.commentId);
    if (index === -1) return res.status(404).json({ error: 'Comment not found' });

    const comment = comments[index];
    const isAuthor = comment.userId === currentSessionUserId;
    const isCreator = post.creatorId === currentSessionUserId;

    if (!isAuthor && !isCreator) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    comments.splice(index, 1);
    res.json({ success: true });
  });

  // --- Wall of Fame ---
  app.get('/api/wall-of-fame/:creatorId', (req: Request, res: Response) => {
    const sortBy = (req.query.sortBy as 'coins' | 'count') || 'coins';
    const supporters = db.getWeeklyWallOfFame(req.params.creatorId, sortBy);
    res.json({
      currentWeek: 'Week 43 (Resets Monday 00:00 UTC)',
      supporters,
    });
  });

  // --- Cash Out & Payouts ---
  app.get('/api/payouts', (req: Request, res: Response) => {
    const creatorId = currentSessionUserId;
    const creatorPayouts = db.payouts.filter((p) => p.creatorId === creatorId);
    res.json(creatorPayouts);
  });

  app.post('/api/payouts/request', (req: Request, res: Response) => {
    try {
      const { type, coinsAmount, destination } = req.body;
      const payout = db.requestCashout(currentSessionUserId, type, Number(coinsAmount), destination);
      res.json({ success: true, payout, newBalance: db.getBalance(currentSessionUserId) });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Cashout request failed' });
    }
  });

  // --- Admin Moderation & Finance ---
  app.get('/api/admin/stats', (req: Request, res: Response) => {
    const user = db.users.get(currentSessionUserId);
    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const allUsers = Array.from(db.users.values());
    const fansCount = allUsers.filter((u) => u.role === 'fan').length;
    const creatorsCount = allUsers.filter((u) => u.role === 'creator').length;

    const coinsSold = db.ledger
      .filter((l) => l.type === 'purchase')
      .reduce((sum, l) => sum + l.amount, 0);

    const coinsGifted = db.ledger
      .filter((l) => l.type === 'gift_received')
      .reduce((sum, l) => sum + l.amount, 0);

    const pendingPayouts = db.payouts.filter((p) => p.status === 'pending');
    const totalFeesEarned = db.payouts
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + p.feeDeducted, 0);

    res.json({
      fansCount,
      creatorsCount,
      coinsSold,
      coinsGifted,
      pendingPayoutsCount: pendingPayouts.length,
      pendingPayoutsValue: pendingPayouts.reduce((sum, p) => sum + p.inrAmount, 0),
      totalFeesEarned,
      settings: db.settings,
    });
  });

  app.get('/api/admin/payouts', (req: Request, res: Response) => {
    const user = db.users.get(currentSessionUserId);
    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    res.json(db.payouts);
  });

  app.post('/api/admin/payouts/:id/action', (req: Request, res: Response) => {
    try {
      const user = db.users.get(currentSessionUserId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { action, reason } = req.body;
      const updated = db.processAdminPayout(req.params.id, action, reason);
      res.json({ success: true, payout: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Payout action failed' });
    }
  });

  app.post('/api/admin/rates', (req: Request, res: Response) => {
    const user = db.users.get(currentSessionUserId);
    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { coinToInrRate, platformFeePercent } = req.body;
    if (coinToInrRate && Number(coinToInrRate) > 0) {
      db.settings.coinToInrRate = Number(coinToInrRate);
    }
    if (platformFeePercent !== undefined && Number(platformFeePercent) >= 0) {
      db.settings.platformFeePercent = Number(platformFeePercent);
    }

    res.json({ success: true, settings: db.settings });
  });

  // --- Polls & Paid Questions ---
  app.get('/api/polls', (req: Request, res: Response) => {
    res.json(db.polls);
  });

  app.post('/api/polls/:id/vote', (req: Request, res: Response) => {
    const poll = db.polls.find((p) => p.id === req.params.id);
    if (!poll) return res.status(404).json({ error: 'Poll not found' });

    const { optionId } = req.body;
    const option = poll.options.find((o) => o.id === optionId);
    if (!option) return res.status(400).json({ error: 'Invalid option' });

    const balance = db.getBalance(currentSessionUserId);
    if (balance < poll.costCoins) {
      return res.status(400).json({ error: `You need ${poll.costCoins} coins to vote` });
    }

    // Deduct coins for voting
    db.ledger.push({
      id: `led_vote_${Date.now()}`,
      userId: currentSessionUserId,
      type: 'poll_vote',
      amount: -poll.costCoins,
      balanceAfter: balance - poll.costCoins,
      message: `Voted in poll: "${poll.question}"`,
      receiptCode: `SB-POLL-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
    });

    option.votes += 1;
    poll.totalVotes += 1;
    poll.userVotedOptionId = optionId;

    res.json({ success: true, poll, balance: db.getBalance(currentSessionUserId) });
  });

  app.get('/api/questions', (req: Request, res: Response) => {
    const creatorId = req.query.creatorId as string;
    let list = db.paidQuestions;
    if (creatorId) {
      list = list.filter((q) => q.creatorId === creatorId);
    }
    res.json(list);
  });

  app.post('/api/questions', (req: Request, res: Response) => {
    const { creatorId, question, coinsAmount } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question cannot be empty' });
    }

    const cost = Number(coinsAmount) || 25;
    const balance = db.getBalance(currentSessionUserId);
    if (balance < cost) {
      return res.status(400).json({ error: `You need ${cost} coins to ask a priority question` });
    }

    const fan = db.users.get(currentSessionUserId)!;

    // Atomic debit fan, credit creator
    db.ledger.push({
      id: `led_q_${Date.now()}`,
      userId: currentSessionUserId,
      type: 'paid_question',
      amount: -cost,
      balanceAfter: balance - cost,
      message: `Priority question asked to creator`,
      receiptCode: `SB-Q-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
    });

    const creatorBal = db.getBalance(creatorId);
    db.ledger.push({
      id: `led_q_cred_${Date.now()}`,
      userId: creatorId,
      type: 'gift_received',
      amount: cost,
      balanceAfter: creatorBal + cost,
      message: `Paid priority question from ${fan.displayName}`,
      receiptCode: `SB-Q-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
    });

    const newQ: PaidQuestion = {
      id: `q_${Date.now()}`,
      creatorId,
      fanId: fan.id,
      fanName: fan.displayName,
      question: question.trim(),
      coinsAmount: cost,
      createdAt: new Date().toISOString(),
    };

    db.paidQuestions.unshift(newQ);
    res.json({ success: true, question: newQ, balance: db.getBalance(currentSessionUserId) });
  });

  // --- Safety & Moderation Reports ---
  app.post('/api/safety/report', (req: Request, res: Response) => {
    const { targetType, targetId, targetContent, reason } = req.body;
    const report: SafetyReport = {
      id: `rep_${Date.now()}`,
      reporterId: currentSessionUserId,
      targetType: targetType || 'user',
      targetId: targetId || 'unknown',
      targetContent: targetContent || '',
      reason: reason || 'Inappropriate content',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    db.reports.push(report);
    res.json({ success: true, message: 'Report submitted for review.' });
  });

  // --- Development Vite Middlewares or Production Static Assets ---
  const distPath = path.join(__dirname, 'dist');
  const hasDist = fs.existsSync(distPath);

  if (process.env.NODE_ENV === 'production' || hasDist) {
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Streamer Buddy full-stack app running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
