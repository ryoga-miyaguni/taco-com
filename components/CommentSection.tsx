"use client";

import { useEffect, useState } from "react";
import type { Comment, ReportReason, SliderRatings } from "@/lib/types";
import { AVATAR_EMOJI, REPORT_REASON_LABEL, SLIDER_RATING_DEF } from "@/lib/types";
import {
  addComment,
  addReply,
  deleteComment,
  editComment,
  findExistingComment,
  loadCommentsForShop,
  loadReplies,
} from "@/lib/comments";
import { useAuth } from "./AuthProvider";
import { getLikedCommentIds, toggleLike } from "@/lib/likes";
import { getBadge } from "@/lib/badges";
import { getUserById } from "@/lib/auth";
import { hasReported, reportComment } from "@/lib/reports";

const MAX_BODY = 200;
const DEFAULT_SLIDER: SliderRatings = { texture: 2, style: 2, volume: 2, atmosphere: 2 };

export function CommentSection({ shopId }: { shopId: string }) {
  const { user, requireAuth } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [body, setBody] = useState("");
  const [sliderRatings, setSliderRatings] = useState<SliderRatings>(DEFAULT_SLIDER);
  const [error, setError] = useState<string | null>(null);
  const [existingComment, setExistingComment] = useState<Comment | null>(null);

  const reloadLikes = () =>
    setLikedIds(user ? getLikedCommentIds(user.id) : new Set());

  const reload = () => {
    const loaded = loadCommentsForShop(shopId);
    setComments(loaded);
    reloadLikes();
    setExistingComment(
      user ? (findExistingComment(shopId, user.id) ?? null) : null
    );
  };

  useEffect(() => {
    reload();
    setBody("");
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAuth()) return;

    const trimmed = body.trim();
    if (!trimmed) { setError("コメントを入力してください"); return; }
    if (trimmed.length > MAX_BODY) { setError(`${MAX_BODY}文字以内で入力してください`); return; }

    try {
      addComment({
        shopId,
        userId: user!.id,
        nickname: user!.displayName,
        avatarKey: user!.avatarKey,
        body: trimmed,
        sliderRatings,
      });
      setBody("");
      setSliderRatings(DEFAULT_SLIDER);
      setError(null);
      reload();
    } catch (err) {
      if (err instanceof Error && err.message === "DUPLICATE_COMMENT") {
        setError("この店舗にはすでに口コミを投稿しています");
      }
    }
  };

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-ink text-lg">口コミ</h3>
        <span className="font-serif-it italic text-[11px] text-naranja-deep tracking-[0.2em] uppercase">
          {comments.length} reseñas
        </span>
      </div>

      {/* 投稿フォーム */}
      <form
        onSubmit={handleSubmit}
        className="mt-3 bg-masa-hi border-2 border-ink rounded-lg p-3 space-y-2 shadow-[3px_3px_0_var(--ink)]"
      >
        {user ? (
          existingComment ? (
            <p className="text-[12px] text-ink/60 font-serif-it italic text-center py-2">
              口コミ投稿済み — 下のカードから編集できます ✏️
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-lg leading-none">{AVATAR_EMOJI[user.avatarKey]}</span>
                <span className="font-display text-[13px] text-ink">{user.displayName}</span>
              </div>
              <SliderRatingPicker value={sliderRatings} onChange={setSliderRatings} />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="味の感想、おすすめメニューなど…"
                rows={3}
                maxLength={MAX_BODY}
                className="w-full resize-none bg-crema border-2 border-ink rounded-lg px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-naranja"
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-muted-foreground">
                  {body.length}/{MAX_BODY}
                </span>
                {error && (
                  <span className="text-[11px] text-salsa font-bold">{error}</span>
                )}
                <button
                  type="submit"
                  className="font-display text-[13px] px-5 h-9 rounded-full bg-naranja text-crema border-2 border-ink shadow-[2px_2px_0_var(--ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[1px_1px_0_var(--ink)] transition-all"
                >
                  投稿 →
                </button>
              </div>
            </>
          )
        ) : (
          <button
            type="button"
            onClick={() => requireAuth()}
            className="w-full font-serif-it italic text-[13px] text-muted-foreground py-3 text-center hover:text-naranja transition-colors"
          >
            ログインしてレビューを書く →
          </button>
        )}
      </form>

      {/* コメント一覧 */}
      {comments.length === 0 ? (
        <p className="mt-4 text-center text-[11px] font-serif-it italic text-muted-foreground">
          まだ口コミはありません — Sé el primero
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {comments.map((c, i) => (
            <CommentCard
              key={c.id}
              comment={c}
              rotate={i % 2 === 0 ? "-0.35deg" : "0.35deg"}
              shopId={shopId}
              liked={likedIds.has(c.id)}
              onChanged={reload}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── CommentCard ─────────────────────────────────────────────────────────────

function CommentCard({
  comment: c,
  rotate,
  shopId,
  liked,
  onChanged,
}: {
  comment: Comment;
  rotate: string;
  shopId: string;
  liked: boolean;
  onChanged: () => void;
}) {
  const { user, requireAuth } = useAuth();
  const isOwner = !!user && user.id === c.userId;

  const author = getUserById(c.userId);
  const badge = author ? getBadge(author.maxLikes) : null;

  const handleLike = () => {
    if (!requireAuth()) return;
    toggleLike(c.id, user!.id);
    onChanged();
  };

  const [reported, setReported] = useState(
    () => !!user && hasReported(c.id, user.id),
  );
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const handleReportSubmit = (reason: ReportReason) => {
    reportComment(c.id, user!.id, reason);
    setReported(true);
    setReportModalOpen(false);
    onChanged();
  };

  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(c.body);
  const [editSlider, setEditSlider] = useState<SliderRatings>(
    c.sliderRatings ?? DEFAULT_SLIDER
  );
  const [replyOpen, setReplyOpen] = useState(false);
  const [replies, setReplies] = useState<Comment[]>([]);
  const [showReplies, setShowReplies] = useState(false);

  const reloadReplies = () => setReplies(loadReplies(c.id));

  useEffect(() => {
    if (showReplies) reloadReplies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showReplies, c.id]);

  const handleDelete = () => {
    if (!user) return;
    if (!window.confirm("このコメントを削除しますか？")) return;
    deleteComment(c.id, user.id);
    onChanged();
  };

  const handleEditSave = () => {
    if (!user) return;
    const trimmed = editBody.trim();
    if (!trimmed) return;
    editComment(c.id, user.id, trimmed, editSlider);
    setEditing(false);
    onChanged();
  };

  const replyCount = loadReplies(c.id).length;

  return (
    <li
      className="relative bg-crema border-2 border-ink rounded-lg p-3 shadow-[2px_2px_0_var(--ink)]"
      style={{ transform: `rotate(${rotate})` }}
    >
      {/* 著者行 */}
      <div className="flex items-center gap-2">
        <span className="h-6 w-6 rounded-full bg-naranja text-crema border-2 border-ink flex items-center justify-center text-[13px] shrink-0">
          {AVATAR_EMOJI[c.avatarKey]}
        </span>
        <span className="font-display text-[13px] text-ink truncate">{c.nickname}</span>
        {badge && (
          <span title={`${badge.label} — ${badge.description}`} className="text-base leading-none shrink-0">
            {badge.emoji}
          </span>
        )}
        {c.isEdited && (
          <span className="ml-auto shrink-0 text-[10px] font-mono text-ink/40 border border-ink/20 rounded px-1.5 py-0.5">
            編集済み
          </span>
        )}
      </div>

      {/* スライダー評価表示 */}
      {c.sliderRatings && !editing && (
        <SliderRatingsDisplay ratings={c.sliderRatings} />
      )}

      {/* 本文 */}
      {editing ? (
        <div className="mt-2 space-y-2">
          <SliderRatingPicker value={editSlider} onChange={setEditSlider} />
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            rows={3}
            maxLength={MAX_BODY}
            autoFocus
            className="w-full resize-none bg-white border-2 border-ink rounded-lg px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-naranja"
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-[11px] font-bold uppercase tracking-wider text-ink/50 hover:text-ink"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleEditSave}
              className="text-[11px] font-bold uppercase tracking-wider text-naranja-deep hover:underline"
            >
              保存
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-1.5 text-[13px] text-ink whitespace-pre-wrap wrap-break-word leading-snug">
          {c.body}
        </p>
      )}

      {/* フッター */}
      <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-mono text-muted-foreground">
            {formatDate(c.createdAt)}
          </p>
          <button
            type="button"
            onClick={handleLike}
            disabled={isOwner}
            title={isOwner ? "自分のコメントにはいいねできません" : undefined}
            className={`flex items-center gap-1 text-[11px] font-bold px-2 h-6 rounded-full border transition-all ${
              isOwner
                ? "bg-crema text-ink/25 border-ink/20 cursor-not-allowed"
                : liked
                  ? "bg-naranja text-crema border-ink shadow-[1px_1px_0_var(--ink)]"
                  : "bg-crema text-ink/50 border-ink/30 hover:border-ink hover:text-naranja"
            }`}
          >
            <span>{liked ? "♥" : "♡"}</span>
            <span>{c.likeCount}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (!requireAuth()) return;
              setReplyOpen((v) => !v);
            }}
            className="flex items-center gap-1 text-[11px] font-bold px-3 h-7 rounded-full border-2 border-ink/30 text-ink/60 hover:border-naranja hover:text-naranja transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M1 3.5h7a2.5 2.5 0 0 1 0 5H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 5.5 1 3.5 3 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            返信
          </button>

          {isOwner && !editing && (
            <>
              <button
                type="button"
                onClick={() => {
                  setEditBody(c.body);
                  setEditSlider(c.sliderRatings ?? DEFAULT_SLIDER);
                  setEditing(true);
                }}
                className="text-[11px] font-bold px-3 h-7 rounded-full border-2 border-ink/20 text-ink/50 hover:border-ink hover:text-ink transition-colors"
              >
                編集
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="text-[11px] font-bold px-3 h-7 rounded-full border-2 border-salsa/40 text-salsa hover:bg-salsa hover:text-crema transition-colors"
              >
                削除
              </button>
            </>
          )}

          {!isOwner && (
            <button
              type="button"
              onClick={() => {
                if (!requireAuth()) return;
                if (!reported) setReportModalOpen(true);
              }}
              disabled={reported}
              className={`flex items-center gap-1 text-[11px] font-bold px-3 h-7 rounded-full border-2 transition-colors ${
                reported
                  ? "border-ink/10 text-ink/25 cursor-default"
                  : "border-ink/20 text-ink/50 hover:border-salsa hover:text-salsa"
              }`}
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M6 1v5M6 9v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              {reported ? "通報済" : "通報"}
            </button>
          )}
        </div>
      </div>

      {replyOpen && user && (
        <ReplyForm
          shopId={shopId}
          parentId={c.id}
          onSubmitted={() => {
            setReplyOpen(false);
            setShowReplies(true);
            reloadReplies();
          }}
        />
      )}

      {replyCount > 0 && (
        <div className="mt-2 pl-3 border-l-2 border-dashed border-ink/30">
          <button
            type="button"
            onClick={() => setShowReplies((v) => !v)}
            className="text-[11px] font-bold text-naranja-deep hover:underline"
          >
            {showReplies ? "返信を閉じる" : `返信 ${replyCount}件を見る`}
          </button>
          {showReplies && (
            <ul className="mt-2 space-y-2">
              {replies.map((r) => (
                <ReplyCard key={r.id} reply={r} onChanged={reloadReplies} />
              ))}
            </ul>
          )}
        </div>
      )}

      {reportModalOpen && (
        <ReportModal
          onSubmit={handleReportSubmit}
          onClose={() => setReportModalOpen(false)}
        />
      )}
    </li>
  );
}

// ─── ReplyForm ────────────────────────────────────────────────────────────────

function ReplyForm({
  shopId,
  parentId,
  onSubmitted,
}: {
  shopId: string;
  parentId: string;
  onSubmitted: () => void;
}) {
  const { user } = useAuth();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const trimmed = body.trim();
    if (!trimmed) { setError("返信を入力してください"); return; }
    if (trimmed.length > MAX_BODY) { setError(`${MAX_BODY}文字以内`); return; }
    addReply({ shopId, parentId, userId: user.id, nickname: user.displayName, avatarKey: user.avatarKey, body: trimmed });
    setBody("");
    setError(null);
    onSubmitted();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-1">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="返信を入力…"
        rows={2}
        maxLength={MAX_BODY}
        autoFocus
        className="w-full resize-none bg-white border-2 border-ink rounded-lg px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-naranja"
      />
      {error && <p className="text-[11px] text-salsa font-bold">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="submit"
          className="font-display text-[12px] px-4 h-8 rounded-full bg-naranja text-crema border-2 border-ink shadow-[2px_2px_0_var(--ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[1px_1px_0_var(--ink)] transition-all"
        >
          返信する →
        </button>
      </div>
    </form>
  );
}

// ─── ReplyCard ────────────────────────────────────────────────────────────────

function ReplyCard({ reply: r, onChanged }: { reply: Comment; onChanged: () => void }) {
  const { user } = useAuth();
  const isOwner = !!user && user.id === r.userId;

  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(r.body);

  const handleDelete = () => {
    if (!user) return;
    deleteComment(r.id, user.id);
    onChanged();
  };

  const handleEditSave = () => {
    if (!user) return;
    const trimmed = editBody.trim();
    if (!trimmed) return;
    editComment(r.id, user.id, trimmed);
    setEditing(false);
    onChanged();
  };

  return (
    <li className="bg-masa-lo border border-ink/30 rounded-lg p-2">
      <div className="flex items-center gap-2">
        <span className="text-sm leading-none">{AVATAR_EMOJI[r.avatarKey]}</span>
        <span className="font-display text-[12px] text-ink">{r.nickname}</span>
        {r.isEdited && (
          <span className="text-[10px] font-mono text-ink/40 border border-ink/20 rounded px-1 py-0.5">編集済み</span>
        )}
        <span className="ml-auto text-[10px] font-mono text-muted-foreground">
          {formatDate(r.createdAt)}
        </span>
      </div>
      {editing ? (
        <div className="mt-1 space-y-1">
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            rows={2}
            maxLength={MAX_BODY}
            autoFocus
            className="w-full resize-none bg-white border border-ink rounded px-2 py-1 text-[12px] outline-none focus:ring-1 focus:ring-naranja"
          />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setEditing(false)} className="text-[11px] font-bold text-ink/50 hover:text-ink">キャンセル</button>
            <button type="button" onClick={handleEditSave} className="text-[11px] font-bold text-naranja-deep hover:underline">保存</button>
          </div>
        </div>
      ) : (
        <p className="mt-1 text-[12px] text-ink whitespace-pre-wrap wrap-break-word leading-snug">{r.body}</p>
      )}
      {isOwner && !editing && (
        <div className="mt-1 flex gap-2 justify-end">
          <button type="button" onClick={() => setEditing(true)} className="text-[10px] font-bold uppercase text-ink/40 hover:text-ink">編集</button>
          <button type="button" onClick={handleDelete} className="text-[10px] font-bold uppercase text-salsa hover:underline">削除</button>
        </div>
      )}
    </li>
  );
}

// ─── ReportModal ─────────────────────────────────────────────────────────────

function ReportModal({
  onSubmit,
  onClose,
}: {
  onSubmit: (reason: ReportReason) => void;
  onClose: () => void;
}) {
  const reasons = Object.entries(REPORT_REASON_LABEL) as [ReportReason, string][];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="paper card-stamp w-full max-w-xs rounded-2xl border-[3px] border-ink shadow-[6px_6px_0_var(--ink)] bg-crema overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <p className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep mb-0.5">
            Reportar
          </p>
          <h2 className="font-display text-ink text-[18px] leading-tight">
            通報理由を選択
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            該当する理由を選んでください
          </p>
        </div>
        <ul className="px-3 pb-3 space-y-1.5">
          {reasons.map(([key, label]) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => onSubmit(key)}
                className="w-full text-left font-display text-[13px] text-ink px-4 h-11 rounded-xl border-2 border-ink/20 bg-masa-hi hover:border-salsa hover:bg-salsa/5 hover:text-salsa transition-colors"
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
        <div className="px-3 pb-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full font-display text-[12px] text-ink/50 h-9 rounded-xl border-2 border-ink/15 hover:border-ink/30 hover:text-ink transition-colors"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SliderRatingPicker ───────────────────────────────────────────────────────

function SliderRatingPicker({
  value,
  onChange,
}: {
  value: SliderRatings;
  onChange: (v: SliderRatings) => void;
}) {
  return (
    <div className="bg-crema border-2 border-ink rounded-lg px-3 py-2 space-y-2">
      {SLIDER_RATING_DEF.map(({ key, label, left, right }) => (
        <div key={key}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-display text-ink/70">{label}</span>
            <span className="text-[10px] font-mono text-naranja">
              {value[key]}/4
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-ink/50 shrink-0 w-16 text-right">{left}</span>
            <div className="flex gap-1 flex-1 justify-center">
              {([1, 2, 3, 4] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onChange({ ...value, [key]: n })}
                  className={`h-7 w-7 rounded-full border-2 text-[11px] font-bold transition-all ${
                    value[key] === n
                      ? "bg-naranja text-crema border-ink shadow-[1px_1px_0_var(--ink)]"
                      : "bg-crema text-ink/40 border-ink/30 hover:border-naranja hover:text-naranja"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-ink/50 shrink-0 w-16">{right}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── SliderRatingsDisplay ─────────────────────────────────────────────────────

function SliderRatingsDisplay({ ratings }: { ratings: SliderRatings }) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
      {SLIDER_RATING_DEF.map(({ key, label, left, right }) => {
        const val = ratings[key];
        return (
          <div key={key} className="flex flex-col gap-0.5">
            <span className="text-[9px] font-display text-ink/50 uppercase tracking-wider">{label}</span>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-ink/40 w-10 text-right truncate">{left}</span>
              <div className="flex gap-0.5">
                {([1, 2, 3, 4] as const).map((n) => (
                  <div
                    key={n}
                    className={`h-2 w-2 rounded-full border ${
                      n <= val ? "bg-naranja border-naranja" : "bg-transparent border-ink/20"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[9px] text-ink/40 w-10 truncate">{right}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── ヘルパー ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}
