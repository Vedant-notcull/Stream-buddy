import React, { useState } from 'react';
import { User, Post, Comment, StreamMoment } from '../types/index.ts';
import {
  Heart,
  MessageCircle,
  Pin,
  Share2,
  Send,
  Trash2,
  Radio,
  ExternalLink,
  PlusCircle,
  Image as ImageIcon,
  Check,
  ShieldAlert,
  Sparkles,
  X,
  Award,
} from 'lucide-react';

interface CreatorProfileProps {
  creator: User;
  currentUser: User;
  currentUserBalance: number;
  onOpenSendSupport: () => void;
  onOpenWallet: () => void;
  onFollowToggle: () => void;
  isFollowedByMe: boolean;
  followersCount: number;
  streamMoments: StreamMoment[];
  posts: Post[];
  onRefreshPosts: () => void;
  onReportContent: (type: 'user' | 'post' | 'comment', id: string, text: string) => void;
}

export const CreatorProfile: React.FC<CreatorProfileProps> = ({
  creator,
  currentUser,
  currentUserBalance,
  onOpenSendSupport,
  onOpenWallet,
  onFollowToggle,
  isFollowedByMe,
  followersCount,
  streamMoments,
  posts,
  onRefreshPosts,
  onReportContent,
}) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'moments'>('posts');
  const [fullscreenMoment, setFullscreenMoment] = useState<StreamMoment | null>(null);

  // New post state (for creator)
  const [newPostContent, setNewPostContent] = useState<string>('');
  const [newPostImageUrl, setNewPostImageUrl] = useState<string>('');
  const [isPosting, setIsPosting] = useState<boolean>(false);

  // Comments state: postId -> comments list & active draft
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [loadingComments, setLoadingComments] = useState<boolean>(false);

  // Social chips links mapping
  const socialLinks = [
    { name: 'Instagram', handle: creator.socials?.instagram, url: `https://instagram.com/${creator.socials?.instagram}` },
    { name: 'YouTube', handle: creator.socials?.youtube, url: `https://youtube.com/@${creator.socials?.youtube}` },
    { name: 'Twitch', handle: creator.socials?.twitch, url: `https://twitch.tv/${creator.socials?.twitch}` },
    { name: 'X', handle: creator.socials?.x, url: `https://x.com/${creator.socials?.x}` },
  ].filter((s) => !!s.handle);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setIsPosting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newPostContent,
          imageUrl: newPostImageUrl.trim() || undefined,
        }),
      });
      if (res.ok) {
        setNewPostContent('');
        setNewPostImageUrl('');
        onRefreshPosts();
      }
    } catch (err) {
      console.error('Failed to create post', err);
    } finally {
      setIsPosting(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
      onRefreshPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePinPost = async (postId: string) => {
    try {
      await fetch(`/api/posts/${postId}/pin`, { method: 'POST' });
      onRefreshPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleComments = async (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      return;
    }
    setExpandedPostId(postId);
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      const data = await res.json();
      setCommentsMap((prev) => ({ ...prev, [postId]: data }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentDrafts[postId]?.trim();
    if (!text) return;

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const newComm = await res.json();
        setCommentsMap((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), newComm],
        }));
        setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
        onRefreshPosts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCommentsMap((prev) => ({
          ...prev,
          [postId]: (prev[postId] || []).filter((c) => c.id !== commentId),
        }));
        onRefreshPosts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Mini-Instagram Header Profile Card */}
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden shadow-xs">
        {/* Cover Photo */}
        <div className="h-44 sm:h-56 w-full relative bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-800">
          {creator.coverUrl && (
            <img
              src={creator.coverUrl}
              alt="Streamer Cover"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Live Now Pulsing Badge */}
          {creator.isLive && (
            <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black tracking-wide shadow-lg uppercase animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>LIVE NOW</span>
            </div>
          )}

          {/* Category Chip */}
          {creator.category && (
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold border border-white/20">
              {creator.category}
            </div>
          )}
        </div>

        {/* Profile Info Row */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
            {/* Avatar & Identifiers */}
            <div className="flex items-end gap-4">
              <div className="relative">
                <img
                  src={creator.avatarUrl}
                  alt={creator.displayName}
                  referrerPolicy="no-referrer"
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-[var(--bg-card)] shadow-md bg-[var(--bg-card)]"
                />
                {creator.isLive && (
                  <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-[var(--bg-card)] flex items-center justify-center">
                    <Radio className="w-2.5 h-2.5 text-white animate-pulse" />
                  </div>
                )}
              </div>

              <div className="mb-1">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-main)] tracking-tight">
                  {creator.displayName}
                </h1>
                <p className="text-xs text-[var(--text-muted)]">@{creator.username}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={onFollowToggle}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isFollowedByMe
                    ? 'border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--bg-subtle)]'
                    : 'bg-[var(--accent-tint)] text-[var(--accent-violet)] border border-[var(--accent-violet)]/30 hover:bg-[var(--accent-tint)]/80'
                }`}
              >
                {isFollowedByMe ? 'Following' : '+ Follow'}
              </button>

              <button
                onClick={onOpenSendSupport}
                className="px-5 py-2 rounded-xl bg-[var(--accent-violet)] text-white text-xs font-bold hover:opacity-95 shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <div className="sb-coin w-3.5 h-3.5 text-[9px]">🪙</div>
                <span>Send Support</span>
              </button>
            </div>
          </div>

          {/* Bio & Current Stream Title */}
          {creator.streamTitle && (
            <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] mb-3 text-xs flex items-center gap-2">
              <span className="font-bold text-[var(--accent-violet)] uppercase text-[10px] tracking-wider shrink-0">
                Current Stream:
              </span>
              <span className="font-semibold text-[var(--text-main)] truncate">{creator.streamTitle}</span>
            </div>
          )}

          {creator.bio && <p className="text-xs text-[var(--text-main)] leading-relaxed max-w-2xl">{creator.bio}</p>}

          {/* Followers & Counts */}
          <div className="flex items-center gap-6 mt-4 text-xs">
            <div>
              <span className="font-extrabold text-[var(--text-main)] tabular-nums">{followersCount.toLocaleString()}</span>{' '}
              <span className="text-[var(--text-muted)]">followers</span>
            </div>
            <div>
              <span className="font-extrabold text-[var(--text-main)] tabular-nums">
                {creator.followingCount.toLocaleString()}
              </span>{' '}
              <span className="text-[var(--text-muted)]">following</span>
            </div>
            <div>
              <span className="font-extrabold text-[var(--text-main)] tabular-nums">{posts.length}</span>{' '}
              <span className="text-[var(--text-muted)]">posts</span>
            </div>
          </div>

          {/* Social Handle Chips */}
          {socialLinks.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-[var(--border-color)]">
              {socialLinks.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--accent-tint)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--accent-violet)] border border-[var(--border-color)] transition-colors"
                >
                  <span>{s.name}</span>
                  <span className="text-[var(--text-main)] font-mono text-[11px]">@{s.handle}</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mini-Instagram Tab Navigation (Posts / Stream Moments) */}
      <div className="flex items-center justify-center gap-2 border-b border-[var(--border-color)]">
        <button
          onClick={() => setActiveTab('posts')}
          className={`py-3 px-6 text-xs font-bold transition-all relative ${
            activeTab === 'posts'
              ? 'text-[var(--accent-violet)] border-b-2 border-[var(--accent-violet)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          Stream Feed & Highlights ({posts.length})
        </button>
        <button
          onClick={() => setActiveTab('moments')}
          className={`py-3 px-6 text-xs font-bold transition-all relative ${
            activeTab === 'moments'
              ? 'text-[var(--accent-violet)] border-b-2 border-[var(--accent-violet)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          Stream Moments Grid ({streamMoments.length})
        </button>
      </div>

      {/* Creator Only: Post Creator Box */}
      {creator.id === currentUser.id && activeTab === 'posts' && (
        <form onSubmit={handleCreatePost} className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.displayName}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="text-xs font-bold text-[var(--text-main)]">Share stream update with your supporters</span>
          </div>
          <textarea
            rows={2}
            placeholder="What's happening on stream tonight? Share highlights, schedules, or thank your supporters..."
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            className="w-full p-3 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent-violet)] resize-none"
          />
          <div className="flex items-center justify-between gap-3">
            <input
              type="text"
              placeholder="Photo URL or asset path (optional)"
              value={newPostImageUrl}
              onChange={(e) => setNewPostImageUrl(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-main)]"
            />
            <button
              type="submit"
              disabled={isPosting || !newPostContent.trim()}
              className="px-4 py-1.5 rounded-lg bg-[var(--accent-violet)] text-white text-xs font-bold hover:opacity-95 disabled:opacity-50"
            >
              {isPosting ? 'Posting...' : 'Post Update'}
            </button>
          </div>
        </form>
      )}

      {/* View A: Stream Moments Photo Grid */}
      {activeTab === 'moments' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {streamMoments.length === 0 ? (
            <div className="col-span-2 p-8 text-center text-xs text-[var(--text-muted)] rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
              No stream moments uploaded yet.
            </div>
          ) : (
            streamMoments.map((m) => (
              <div
                key={m.id}
                onClick={() => setFullscreenMoment(m)}
                className="group relative rounded-2xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-card)] cursor-pointer shadow-xs"
              >
                <div className="aspect-4/3 w-full overflow-hidden bg-black/10">
                  <img
                    src={m.imageUrl}
                    alt={m.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3">
                  <h4 className="font-bold text-xs text-[var(--text-main)] truncate">{m.title}</h4>
                  <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mt-1">
                    <span>{m.timestamp}</span>
                    <span className="tabular-nums font-mono">{m.views.toLocaleString()} views</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* View B: Posts Feed */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {posts.map((post) => {
            const isAuthor = post.creatorId === currentUser.id;
            const comments = commentsMap[post.id] || [];
            const isExpanded = expandedPostId === post.id;

            return (
              <article
                key={post.id}
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-xs relative"
              >
                {/* Pinned Badge */}
                {post.isPinned && (
                  <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--accent-violet)] mb-3 bg-[var(--accent-tint)] px-2.5 py-0.5 rounded-full">
                    <Pin className="w-3 h-3 fill-current" />
                    <span>Pinned Stream Highlight</span>
                  </div>
                )}

                {/* Post Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.creatorAvatar}
                      alt={post.creatorName}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border border-black/10"
                    />
                    <div>
                      <h3 className="font-bold text-xs text-[var(--text-main)] leading-none">{post.creatorName}</h3>
                      <span className="text-[10px] text-[var(--text-muted)] mt-0.5 block">
                        {new Date(post.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {isAuthor && (
                    <button
                      onClick={() => handlePinPost(post.id)}
                      title={post.isPinned ? 'Unpin' : 'Pin to top'}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-violet)]"
                    >
                      <Pin className={`w-4 h-4 ${post.isPinned ? 'text-[var(--accent-violet)] fill-current' : ''}`} />
                    </button>
                  )}
                </div>

                {/* Content */}
                <p className="text-xs text-[var(--text-main)] leading-relaxed whitespace-pre-line mb-3">{post.content}</p>

                {/* Image Moment */}
                {post.imageUrl && (
                  <div
                    onClick={() =>
                      setFullscreenMoment({
                        id: post.id,
                        creatorId: post.creatorId,
                        title: post.content.slice(0, 30),
                        imageUrl: post.imageUrl!,
                        views: post.likesCount * 12,
                        likes: post.likesCount,
                        timestamp: 'Stream Highlight',
                      })
                    }
                    className="rounded-xl overflow-hidden mb-3 border border-[var(--border-color)] max-h-96 cursor-pointer bg-black/5"
                  >
                    <img
                      src={post.imageUrl}
                      alt="Post visual"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover hover:opacity-95 transition-opacity"
                    />
                  </div>
                )}

                {/* Post Engagement Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)] text-xs text-[var(--text-muted)]">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLikePost(post.id)}
                      className={`flex items-center gap-1.5 font-semibold transition-colors cursor-pointer ${
                        post.likedByMe ? 'text-red-500 font-bold' : 'hover:text-[var(--text-main)]'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${post.likedByMe ? 'fill-current' : ''}`} />
                      <span className="tabular-nums">{post.likesCount}</span>
                    </button>

                    <button
                      onClick={() => handleToggleComments(post.id)}
                      className="flex items-center gap-1.5 hover:text-[var(--text-main)] font-semibold transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="tabular-nums">
                        {isExpanded ? comments.length : post.commentsCount} Comments
                      </span>
                    </button>
                  </div>

                  <button
                    onClick={() => onReportContent('post', post.id, post.content)}
                    title="Report post"
                    className="hover:text-[var(--color-error)] transition-colors p-1"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Expanded Comments Thread */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-[var(--border-color)] space-y-3">
                    {/* Add Comment Input */}
                    <div className="flex items-center gap-2">
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.displayName}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-full object-cover shrink-0"
                      />
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={commentDrafts[post.id] || ''}
                        onChange={(e) =>
                          setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddComment(post.id);
                        }}
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent-violet)]"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        disabled={!commentDrafts[post.id]?.trim()}
                        className="p-1.5 rounded-lg bg-[var(--accent-violet)] text-white hover:opacity-95 disabled:opacity-40"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-2 mt-2">
                      {loadingComments ? (
                        <p className="text-xs text-[var(--text-muted)] text-center py-2">Loading comments...</p>
                      ) : comments.length === 0 ? (
                        <p className="text-xs text-[var(--text-muted)] text-center py-2">
                          No comments yet. Be the first to cheer!
                        </p>
                      ) : (
                        comments.map((comm) => {
                          const canDelete =
                            comm.userId === currentUser.id || post.creatorId === currentUser.id;
                          return (
                            <div
                              key={comm.id}
                              className="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] flex items-start justify-between gap-2"
                            >
                              <div className="flex items-start gap-2 min-w-0">
                                <img
                                  src={comm.userAvatar}
                                  alt={comm.userName}
                                  referrerPolicy="no-referrer"
                                  className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-xs text-[var(--text-main)]">
                                      {comm.userName}
                                    </span>
                                    {comm.fanBadge && (
                                      <span
                                        className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-sm ${
                                          comm.fanBadge === 'Gold' || comm.fanBadge === 'Diamond'
                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                        }`}
                                      >
                                        {comm.fanBadge} Fan
                                      </span>
                                    )}
                                    <span className="text-[10px] text-[var(--text-muted)]">
                                      {new Date(comm.createdAt).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[var(--text-main)] mt-0.5 break-words">
                                    {comm.content}
                                  </p>
                                </div>
                              </div>

                              {canDelete && (
                                <button
                                  onClick={() => handleDeleteComment(post.id, comm.id)}
                                  title="Delete comment"
                                  className="text-[var(--text-muted)] hover:text-[var(--color-error)] p-1 rounded-sm shrink-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox Image Viewer */}
      {fullscreenMoment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-modal">
          <button
            onClick={() => setFullscreenMoment(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-4xl max-h-[85vh] w-full flex flex-col items-center">
            <img
              src={fullscreenMoment.imageUrl}
              alt={fullscreenMoment.title}
              referrerPolicy="no-referrer"
              className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <div className="mt-4 text-center text-white">
              <h3 className="font-bold text-base">{fullscreenMoment.title}</h3>
              <p className="text-xs text-white/70 mt-1">{fullscreenMoment.timestamp}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
