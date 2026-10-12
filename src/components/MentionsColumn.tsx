"use client";

import { useEffect, useState } from "react";
import { XGlyph } from "./XGlyph";
import { ago, num } from "./format";
import { currentFocus, onFocusToken, type FocusedToken } from "./tokenFocus";

type Mention = {
  id: string;
  url: string;
  text: string;
  createdAt: string | null;
  likes: number;
  reposts: number;
  replies: number;
  views: number | null;
  author: { username: string; name: string; avatar: string | null; followers: number; verified: boolean };
};

// Right-hand column: what X is saying about the token currently in focus.
export function MentionsColumn() {
  const [token, setToken] = useState<FocusedToken | null>(null);
  const [sort, setSort] = useState<"top" | "latest">("top");
  const [posts, setPosts] = useState<Mention[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setToken(currentFocus());
    return onFocusToken(setToken);
  }, []);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    setPosts(null);
    setErr(null);
    fetch(`/api/mentions?mint=${token.mint}&sort=${sort}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setPosts(d.posts ?? []);
        if (d.error) setErr(d.error);
      })
      .catch(() => alive && setErr("Could not load posts from X."));
    return () => {
      alive = false;
    };
  }, [token, sort]);

  return (
    <section className="flex h-[70dvh] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-line bg-panel xl:h-full xl:min-h-0">
      <header className="border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <XGlyph className="h-3.5 w-3.5 text-ink" />
          <h2 className="text-sm font-bold">{token ? `$${token.symbol} on X` : "On X"}</h2>
        </div>
        {token && (
          <div className="mt-2.5 flex gap-1" role="tablist" aria-label="Sort posts">
            {(["top", "latest"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={sort === s}
                onClick={() => setSort(s)}
                className={`rounded-full px-2.5 py-0.5 text-[11px] ${sort === s ? "bg-hat text-night" : "text-mute hover:text-ink"}`}
              >
                {s === "top" ? "Top" : "Latest"}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="scroll-thin flex-1 overflow-y-auto">
        {!token ? (
          <p className="px-4 py-6 text-xs leading-6 text-mute">
            Paste a contract address in the chat. The most-engaged posts that mention it show up here.
          </p>
        ) : posts === null ? (
          <ul aria-label="Loading posts" className="divide-y divide-line">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="space-y-2 px-4 py-4">
                <div className="h-3 w-1/2 animate-pulse rounded bg-panel-2" />
                <div className="h-3 w-full animate-pulse rounded bg-panel-2" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-panel-2" />
              </li>
            ))}
          </ul>
        ) : posts.length === 0 ? (
          <p className="px-4 py-6 text-xs leading-6 text-mute">
            {err ?? `No posts with this address yet. ${sort === "top" ? "Try Latest." : "Fresh tokens often aren't on X yet."}`}
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {posts.map((p) => (
              <li key={p.id}>
                <a href={p.url} target="_blank" rel="noreferrer" className="block px-4 py-3.5 hover:bg-panel-2/60">
                  <div className="flex items-center gap-2.5">
                    {p.author.avatar ? (
                      <img src={p.author.avatar} alt="" className="h-8 w-8 shrink-0 rounded-full bg-panel-2 object-cover" />
                    ) : (
                      <span className="h-8 w-8 shrink-0 rounded-full bg-panel-2" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold">
                        {p.author.name}
                        {p.author.verified && <span className="ml-1 text-[#9fb4ff]" title="Verified">✓</span>}
                      </p>
                      <p className="truncate text-[11px] text-mute">
                        @{p.author.username} · {num(p.author.followers)} followers
                      </p>
                    </div>
                    {p.createdAt && <span className="shrink-0 text-[11px] text-mute">{ago(p.createdAt)}</span>}
                  </div>
                  <p className="mt-2 line-clamp-5 whitespace-pre-wrap [overflow-wrap:anywhere] text-[13px] leading-5">
                    {highlight(p.text, token.mint)}
                  </p>
                  <p className="mt-2 flex gap-3 text-[11px] text-mute">
                    <span title="Likes">♥ {num(p.likes)}</span>
                    <span title="Reposts">⟲ {num(p.reposts)}</span>
                    <span title="Replies">↩ {num(p.replies)}</span>
                    {p.views != null && <span title="Views">◉ {num(p.views)}</span>}
                  </p>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// Mark the contract address inside the post text.
function highlight(text: string, mint: string) {
  const i = text.indexOf(mint);
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <span className="rounded bg-hat/15 px-0.5 text-hat">{`${mint.slice(0, 4)}…${mint.slice(-4)}`}</span>
      {text.slice(i + mint.length)}
    </>
  );
}
