

# LinkedIn-Inspired Feed Transformation Plan

## Executive Summary

Transform the current job-heavy feed into an engaging, content-rich social experience. The goal is to make users **want** to scroll through the feed, discover insights, and interact with content - just like LinkedIn.

---

## Current State Analysis

| Content Type | Count in DB | Current Feed Behavior |
|--------------|-------------|----------------------|
| Jobs | 129 | Dominates the feed (majority of items) |
| Courses | 6 | Mixed in with jobs |
| Blogs | 6 | Recently added, shown but minimal |
| Videos | 1 | Rare appearance |

**Key Issues Identified:**
1. Feed is 90%+ job listings - feels like a job board, not a social feed
2. Cards look identical - no variety in visual presentation
3. No social features (reactions, comments, sharing)
4. No engaging content types (polls, quick tips, industry news)
5. Users can only "Skip" or "View" - no meaningful engagement

---

## Proposed Transformation

### Phase 1: Remove Jobs from Feed

**Change the Feed Purpose:**
- Feed = Discovery, Learning, Engagement
- Jobs Hub = Job search (already exists at `/app/jobs`)

**Technical Changes:**
1. Remove `type: 'job'` from `useFeedRecommendations.ts` fetch
2. Remove "Jobs" filter option from `FeedFilters.tsx`
3. Update feed type definitions to exclude 'job'

### Phase 2: Create New "Post" Content Type

Instead of just blogs, courses, and videos, introduce a flexible **Post** system (like LinkedIn posts).

**New Database Table: `feed_posts`**

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| author_name | text | Admin/author name |
| author_avatar | text | Avatar URL |
| author_title | text | e.g., "Career Coach at GRO10X" |
| content_type | enum | 'text', 'poll', 'tip', 'news', 'announcement' |
| text_content | text | Main post text (markdown supported) |
| media_url | text | Image/video URL |
| poll_options | jsonb | For polls: [{id, text, votes}] |
| poll_ends_at | timestamp | When poll closes |
| link_url | text | External link |
| link_preview | jsonb | {title, description, image} |
| tags | text[] | Topic tags |
| is_pinned | boolean | Show at top |
| is_active | boolean | Published status |
| created_at | timestamp | Posted at |

**New Database Table: `post_reactions`**

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| post_id | uuid | FK to feed_posts |
| talent_id | uuid | FK to talents |
| reaction_type | text | 'like', 'insightful', 'celebrate', 'support' |
| created_at | timestamp | Reacted at |

**New Database Table: `poll_votes`**

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| post_id | uuid | FK to feed_posts (poll post) |
| talent_id | uuid | FK to talents |
| option_id | text | Which option they voted for |
| voted_at | timestamp | When voted |

### Phase 3: New LinkedIn-Style Post Card Component

**Design Inspiration (LinkedIn Post Structure):**
```
┌─────────────────────────────────────────┐
│ [Avatar] Author Name          • 2h      │
│          Author Title                   │
├─────────────────────────────────────────┤
│                                         │
│ Post content text goes here...          │
│ Can be multiple paragraphs.             │
│                                         │
│ #CareerTips #FreshGraduates             │
│                                         │
├─────────────────────────────────────────┤
│ [Optional Media: Image or Poll]         │
│                                         │
│ For Polls:                              │
│  ○ Option 1 ─────────── 45%            │
│  ● Option 2 ─────────────────── 55%    │
│  500 votes • 2 days left                │
│                                         │
├─────────────────────────────────────────┤
│ 👍 142  💡 28                           │
├─────────────────────────────────────────┤
│ [👍 Like] [💡 Insightful] [🔗 Share]    │
└─────────────────────────────────────────┘
```

**New Components to Create:**

1. `src/components/feed/PostCard.tsx` - Main LinkedIn-style post card
2. `src/components/feed/ReactionBar.tsx` - Like, Insightful, Celebrate buttons
3. `src/components/feed/PollWidget.tsx` - Interactive poll voting
4. `src/components/feed/ShareSheet.tsx` - Share options (WhatsApp, LinkedIn, Copy Link)
5. `src/components/feed/PostAuthor.tsx` - Avatar + name + title row

### Phase 4: Update Feed Filters

**New Filter Categories:**
```
[All] [Articles] [Videos] [Polls] [Tips] [Courses]
```

Remove "Jobs" filter entirely - direct users to Jobs Hub.

### Phase 5: Admin Post Manager

Create `src/components/dashboard/FeedPostsManager.tsx` for admins to:
- Create text posts, polls, tips, announcements
- Upload images
- Schedule posts
- View engagement stats (reactions, shares, poll votes)
- Pin important posts

### Phase 6: Enhanced Course/Blog Cards

Update existing `FeedCardRedesigned.tsx` to support:
- Author section at top (like LinkedIn)
- Description as "post content"
- Media below content
- Reaction bar at bottom
- Share functionality

---

## Technical Implementation Details

### Database Migration

```sql
-- Create post types enum
CREATE TYPE post_content_type AS ENUM (
  'text', 'poll', 'tip', 'news', 'announcement', 'media'
);

-- Create reaction types enum
CREATE TYPE reaction_type AS ENUM (
  'like', 'insightful', 'celebrate', 'support'
);

-- Feed posts table
CREATE TABLE public.feed_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  author_avatar text,
  author_title text,
  content_type post_content_type NOT NULL DEFAULT 'text',
  text_content text NOT NULL,
  media_url text,
  poll_options jsonb,
  poll_ends_at timestamptz,
  link_url text,
  link_preview jsonb,
  tags text[] DEFAULT '{}',
  is_pinned boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Post reactions table
CREATE TABLE public.post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES feed_posts(id) ON DELETE CASCADE,
  talent_id uuid REFERENCES talents(id) ON DELETE CASCADE,
  reaction_type reaction_type NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, talent_id)
);

-- Poll votes table
CREATE TABLE public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES feed_posts(id) ON DELETE CASCADE,
  talent_id uuid REFERENCES talents(id) ON DELETE CASCADE,
  option_id text NOT NULL,
  voted_at timestamptz DEFAULT now(),
  UNIQUE(post_id, talent_id)
);

-- RLS Policies
ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Anyone can view active posts
CREATE POLICY "Anyone can view active posts"
  ON feed_posts FOR SELECT
  USING (is_active = true);

-- Admins can manage posts
CREATE POLICY "Admins can manage posts"
  ON feed_posts FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Users can react to posts
CREATE POLICY "Users can manage own reactions"
  ON post_reactions FOR ALL
  USING (talent_id IN (SELECT id FROM talents WHERE user_id = auth.uid()));

-- Users can vote on polls
CREATE POLICY "Users can vote on polls"
  ON poll_votes FOR INSERT
  WITH CHECK (talent_id IN (SELECT id FROM talents WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own votes"
  ON poll_votes FOR SELECT
  USING (talent_id IN (SELECT id FROM talents WHERE user_id = auth.uid()));
```

### New Hook: `usePostReactions.ts`

```typescript
// Manage reactions for a post
export function usePostReactions(postId: string) {
  const { talent } = useTalent();
  
  return {
    reactions: [...], // Aggregated reactions count
    userReaction: 'like' | null, // Current user's reaction
    toggleReaction: async (type: ReactionType) => {...},
    isLoading: boolean
  };
}
```

### New Hook: `usePollVoting.ts`

```typescript
// Manage poll voting
export function usePollVoting(postId: string) {
  const { talent } = useTalent();
  
  return {
    hasVoted: boolean,
    userVote: string | null,
    results: { optionId: string, votes: number, percentage: number }[],
    castVote: async (optionId: string) => {...},
    totalVotes: number,
    isLoading: boolean
  };
}
```

### Updated Feed Page Structure

```tsx
// Feed.tsx - Updated structure
<div className="space-y-4">
  {/* Pinned Posts First */}
  {pinnedPosts.map(post => <PostCard key={post.id} post={post} />)}
  
  {/* Mix of content types */}
  {items.map(item => {
    if (item.type === 'post') {
      return <PostCard key={item.id} post={item} />;
    }
    if (item.type === 'blog') {
      return <BlogPostCard key={item.id} post={item} />;
    }
    if (item.type === 'course' || item.type === 'video') {
      return <CourseCard key={item.id} course={item} />;
    }
  })}
</div>
```

---

## File Changes Summary

### New Files to Create:

| File | Purpose |
|------|---------|
| `src/components/feed/PostCard.tsx` | LinkedIn-style post card with reactions |
| `src/components/feed/ReactionBar.tsx` | Like, Insightful, Celebrate buttons |
| `src/components/feed/PollWidget.tsx` | Interactive poll display & voting |
| `src/components/feed/ShareSheet.tsx` | Share dialog (WhatsApp, LinkedIn, Copy) |
| `src/components/feed/PostAuthor.tsx` | Author avatar + name + title header |
| `src/components/dashboard/FeedPostsManager.tsx` | Admin post creation/management |
| `src/hooks/usePostReactions.ts` | Manage reactions for posts |
| `src/hooks/usePollVoting.ts` | Manage poll voting |

### Files to Modify:

| File | Changes |
|------|---------|
| `src/pages/app/Feed.tsx` | Remove jobs, add posts, update layout |
| `src/hooks/useFeedRecommendations.ts` | Exclude jobs, add feed_posts query |
| `src/components/feed/FeedFilters.tsx` | Remove Jobs filter, add Polls/Tips |
| `src/components/feed/FeedCardRedesigned.tsx` | Add author section, reaction bar |

---

## User Experience Improvements

### Before (Current):
- Opens feed, sees wall of job cards
- Only actions: "View Job" or "Skip"
- No reason to scroll unless job hunting
- Static, transactional experience

### After (LinkedIn-Inspired):
- Opens feed, sees mix of content:
  - Industry insight post from Career Coach
  - Poll: "What skill should we cover next?"
  - Quick tip: "5 words to avoid in your CV"
  - New course announcement
  - Blog article on salary negotiation
- Can react (like, insightful) to show appreciation
- Can vote on polls to participate
- Can share interesting posts to WhatsApp
- **Reason to return daily** - new content, engagement, community feel

---

## Migration Path

1. **Phase 1**: Database migration (new tables)
2. **Phase 2**: Create PostCard and related components
3. **Phase 3**: Create FeedPostsManager for admin
4. **Phase 4**: Update Feed.tsx to show posts + hide jobs
5. **Phase 5**: Seed initial posts (convert some blogs to posts)
6. **Phase 6**: Add reaction/poll functionality
7. **Phase 7**: Remove jobs from feed hook completely

