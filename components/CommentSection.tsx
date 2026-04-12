"use client";

import { useEffect, useState } from "react";
import type { Comment } from "@/lib/types";
import {
  addComment,
  deleteComment,
  getGuestId,
  loadCommentsForShop,
} from "@/lib/comments";

const MAX_BODY = 200;

export function CommentSection({ shopId }: { shopId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [guestId, setGuestId] = useState<string>("");
  const [nickname, setNickname] = useState("");
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(5);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setGuestId(getGuestId());
    setComments(loadCommentsForShop(shopId));
    setBody("");
    setError(null);
  }, [shopId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) {
      setError("コメントを入力してください");
      return;
    }
    if (trimmed.length > MAX_BODY) {
      setError(`${MAX_BODY}文字以内で入力してください`);
      return;
    }
    addComment({ shopId, nickname, body: trimmed, rating });
    setComments(loadCommentsForShop(shopId));
    setBody("");
    setError(null);
  };

  const handleDelete = (id: string) => {
    deleteComment(id);
    setComments(loadCommentsForShop(shopId));
  };

  return (
    <div className="mt-5 pt-4 border-t border-gray-100">
      <h3 className="text-sm font-bold text-gray-900 mb-3">
        口コミ ({comments.length})
      </h3>

      <form onSubmit={handleSubmit} className="mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="ニックネーム（任意）"
            maxLength={20}
            className="flex-1 min-w-0 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <StarPicker value={rating} onChange={setRating} />
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="味の感想、おすすめメニューなど"
          rows={3}
          maxLength={MAX_BODY}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {body.length}/{MAX_BODY}
          </span>
          {error && <span className="text-xs text-red-600">{error}</span>}
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-md"
          >
            投稿
          </button>
        </div>
      </form>

      {comments.length === 0 ? (
        <p className="text-xs text-gray-400">まだ口コミはありません</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="text-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-gray-900 truncate">
                    {c.nickname}
                  </span>
                  <span className="text-amber-500 text-xs shrink-0">
                    {"★".repeat(c.rating)}
                    <span className="text-gray-300">
                      {"★".repeat(5 - c.rating)}
                    </span>
                  </span>
                </div>
                {c.guestId === guestId && (
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    className="text-xs text-gray-400 hover:text-red-600"
                  >
                    削除
                  </button>
                )}
              </div>
              <p className="mt-1 text-gray-700 whitespace-pre-wrap break-words">
                {c.body}
              </p>
              <p className="mt-0.5 text-[10px] text-gray-400">
                {formatDate(c.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 shrink-0">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n}つ星`}
          className={`text-lg leading-none ${
            n <= value ? "text-amber-500" : "text-gray-300"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}
