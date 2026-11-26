import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { GuestAccessBanner } from '../components/public/GuestAccessBanner';
import { PageHeading } from './PublicPages';
import { useAppData } from '../hooks/useAppData';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/Toast';
import { canReadForumPost } from '../services/domain/forumPolicy';
import { ROLE_BASE_PATH } from '../data/navigation';
import type { ForumPost } from '../types/forum';

function slugifyTitle(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100); }
function topicKey(post: ForumPost) { return post.topicKey || post.tags[0] || slugifyTitle(post.title); }
function topicTag(post: ForumPost) { return post.tags[0] || slugifyTitle(post.title); }
function useForumData() {
  const { data } = useAppData();
  const { user } = useAuth();
  const posts = useMemo(() => data.forumPosts.filter((post) => canReadForumPost(user?.role ?? 'guest', user?.id ?? null, post)), [data.forumPosts, user?.id, user?.role]);
  // Legacy topic labels have no visibility or source provenance and may outlive
  // their private source post. Project rendered metadata from authorized posts
  // only; do not infer permission for an unfiltered catalog label.
  return { data, posts, user };
}

function useGuestForumAction(post: ForumPost | undefined) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  return (action: 'react' | 'comment') => {
    if (!post) return;
    if (!user) {
      window.dispatchEvent(new CustomEvent('guest-lock', { detail: { title: post.title, verb: action === 'react' ? 'react to this post' : 'comment on this post' } }));
      return;
    }
    if (user.role === 'student') navigate(`${ROLE_BASE_PATH.student}/forum`);
    else showToast('This Forum action is not available for this role.', 'info');
  };
}

function ForumPostCard({ post, commentsCount }: { post: ForumPost; commentsCount: number }) {
  const act = useGuestForumAction(post);
  const tags = post.tags.length ? post.tags : [topicTag(post)];
  return <div className="forum-post-card-wrap"><Card className="forum-post-card"><div className="forum-post-top"><div><span className="bdg bdg-blue">{post.skill ?? 'Community'}</span><span className="bdg bdg-slate">{post.submissionId ? 'Correction' : 'Free topic'}</span><span className="forum-visibility-label">{post.visibility === 'PUBLIC' ? 'Public' : 'Restricted'}</span></div><time>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}</time></div><Link className="forum-post-title" to={`/forum/post/${encodeURIComponent(post.id)}`}><h2>{post.title}</h2></Link><Link className="forum-post-body" to={`/forum/post/${encodeURIComponent(post.id)}`}>{post.body}</Link><div className="forum-post-byline">By {post.authorName || 'BandUp member'}</div><div className="forum-post-actions"><button type="button" className="btn b4" onClick={() => act('react')}>♡ React · {post.reactionCount ?? 0}</button><Link className="btn b4" to={`/forum/post/${encodeURIComponent(post.id)}`}>Comments · {commentsCount}</Link><button type="button" className="btn b4" onClick={() => { if (navigator.clipboard) void navigator.clipboard.writeText(`${location.origin}/forum/post/${encodeURIComponent(post.id)}`); }}>Share</button></div></Card><div className="forum-post-tags">{tags.map((tag) => <span className="forum-tag" key={tag}>{tag.startsWith('#') ? tag : `#${tag}`}</span>)}</div></div>;
}

export function ForumPage() {
  const { posts, user } = useForumData();
  const [skill, setSkill] = useState('All');
  const [search, setSearch] = useState('');
  const visible = posts.filter((post) => (skill === 'All' || post.skill === skill) && [post.title, post.body, topicTag(post), ...post.tags].join(' ').toLowerCase().includes(search.trim().toLowerCase())).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  const groups = new Map<string, ForumPost[]>();
  visible.forEach((post) => { const key = topicKey(post); const current = groups.get(key) ?? []; current.push(post); groups.set(key, current); });
  const topics = [...groups.entries()].map(([key, topicPosts]) => ({ key, posts: topicPosts, label: topicPosts[0].title, skill: topicPosts[0].skill ?? 'Writing', latest: Math.max(...topicPosts.map((post) => post.createdAt ?? 0)), tag: topicTag(topicPosts[0]) })).sort((a, b) => b.latest - a.latest);
  return <><PageHeading title="Forum" description="Writing and Speaking posts, filtered by the visibility you are allowed to access."/><div className="public-container guest-practice-page"><GuestAccessBanner/><div className="forum-controls"><div className="forum-tabs" role="group" aria-label="Forum skill filter">{['All', 'Writing', 'Speaking'].map((item) => <button type="button" key={item} aria-pressed={skill === item} className={skill === item ? 'is-active' : ''} onClick={() => setSkill(item)}>{item}</button>)}</div><label className="forum-search">Search title, content or tag<input className="inp" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title or content"/></label></div><div className="forum-readonly-note">{user ? <><b>Forum access · {user.role === 'teacher' ? 'Teacher / Volunteer' : user.role}.</b> Posts are filtered by your visibility permissions.</> : <><b>Guest access · read-only.</b> Only Public posts are shown. Posting, commenting, liking and reporting require an account.</>}</div><div className="forum-topic-grid">{topics.map((topic) => <article className="forum-topic-wrap" key={topic.key}><Card className="forum-topic-card"><div className="forum-topic-card-top"><span className="bdg bdg-blue">{topic.skill}</span><span>{topic.posts.length} {topic.posts.length === 1 ? 'post' : 'posts'}</span></div><Link to={`/forum/topic/${encodeURIComponent(topic.key)}`}><h2>{topic.label}</h2><p className="forum-topic-excerpt">{topic.posts[0].body.slice(0, 180)}</p></Link><div className="forum-topic-card-footer"><span>Updated {new Date(topic.latest).toLocaleDateString()}</span><Link to={`/forum/topic/${encodeURIComponent(topic.key)}`}>Open topic →</Link></div></Card><div className="forum-post-tags"><span className="forum-tag">#{topic.tag}</span></div></article>)}{topics.length === 0 && <div className="empty forum-empty"><b>No topics to show.</b><p>No topic or post matches your search and visibility permissions.</p></div>}</div></div></>;
}

export function ForumTopicPage() {
  const { topicKey: rawKey } = useParams<{ topicKey: string }>();
  const key = rawKey ? decodeURIComponent(rawKey) : '';
  const { data, posts } = useForumData();
  const topicPosts = posts.filter((post) => topicKey(post) === key).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  if (!topicPosts.length) return <><PageHeading title="Topic unavailable" description="This topic is unavailable under the current visibility permissions."/><div className="public-container guest-practice-page"><Card className="empty">This topic is unavailable.</Card><Link className="btn b4" to="/forum">Back to Forum</Link></div></>;
  const title = topicPosts[0].title;
  const tag = topicTag(topicPosts[0]);
  return <><PageHeading title={title} description={`#${tag} · ${topicPosts.length} ${topicPosts.length === 1 ? 'post' : 'posts'} visible under your access rights`}/><div className="public-container guest-practice-page"><p><Link className="text-link forum-back-link" to="/forum">← Back to Forum</Link></p><div className="forum-topic-posts">{topicPosts.map((post) => <ForumPostCard key={post.id} post={post} commentsCount={data.forumComments.filter((comment) => comment.postId === post.id && !comment.hidden).length}/>)}</div></div></>;
}

export function ForumPostPage() {
  const { postId } = useParams<{ postId: string }>();
  const { data, posts } = useForumData();
  const post = posts.find((entry) => entry.id === postId);
  const act = useGuestForumAction(post);
  if (!post) return <><PageHeading title="Post unavailable" description="This post is unavailable under the current visibility permissions."/><div className="public-container guest-practice-page"><Card className="empty">This post is unavailable.</Card><Link className="btn b4" to="/forum">Back to Forum</Link></div></>;
  const comments = data.forumComments.filter((comment) => comment.postId === post.id && !comment.hidden).sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
  const tags = post.tags.length ? post.tags : [topicTag(post)];
  return <><PageHeading title="Forum post" description={post.skill ?? 'Community'}/><div className="public-container guest-practice-page"><p><Link className="text-link forum-back-link" to={`/forum/topic/${encodeURIComponent(topicKey(post))}`}>← Back to topic</Link></p><Card className="forum-post-detail"><div className="forum-post-top"><span className="bdg bdg-blue">{post.skill ?? 'Community'}</span><span className="forum-visibility-label">{post.visibility === 'PUBLIC' ? 'Public' : 'Restricted'}</span></div><h2>{post.title}</h2><p className="forum-post-author">By {post.authorName || 'BandUp member'} · {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}</p><p className="forum-post-full-body">{post.body}</p><div className="forum-post-tags">{tags.map((tag) => <span className="forum-tag" key={tag}>{tag.startsWith('#') ? tag : `#${tag}`}</span>)}</div><div className="forum-post-actions"><button className="btn b4" type="button" onClick={() => act('react')}>♡ React · {post.reactionCount ?? 0}</button><button className="btn b4" type="button" onClick={() => act('comment')}>Comment · {comments.length}</button><button className="btn b4" type="button" onClick={() => { if (navigator.clipboard) void navigator.clipboard.writeText(location.href); }}>Share</button></div><section className="forum-comment-list"><h3>Comments</h3>{comments.length ? comments.map((comment) => <article key={comment.id}><b>{comment.authorId}</b><p>{comment.body}</p></article>) : <p>No comments are saved for this post.</p>}</section></Card></div></>;
}
