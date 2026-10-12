// Tiny pub/sub so the chat can tell other dashboard panels which token is "in focus".
export type FocusedToken = { mint: string; symbol: string };

const EVENT = "token:focus";

export function focusToken(mint: string, symbol: string) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __tmFocus?: FocusedToken };
  if (w.__tmFocus?.mint === mint) return;
  w.__tmFocus = { mint, symbol };
  window.dispatchEvent(new CustomEvent<FocusedToken>(EVENT, { detail: { mint, symbol } }));
}

export function currentFocus(): FocusedToken | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { __tmFocus?: FocusedToken }).__tmFocus ?? null;
}

export function onFocusToken(cb: (t: FocusedToken) => void) {
  const h = (e: Event) => cb((e as CustomEvent<FocusedToken>).detail);
  window.addEventListener(EVENT, h);
  return () => window.removeEventListener(EVENT, h);
}

// Ask the chat to send a message (e.g. re-check a token from History).
const SEND = "chat:send";
export function requestChat(text: string) {
  window.dispatchEvent(new CustomEvent<string>(SEND, { detail: text }));
}
export function onRequestChat(cb: (text: string) => void) {
  const h = (e: Event) => cb((e as CustomEvent<string>).detail);
  window.addEventListener(SEND, h);
  return () => window.removeEventListener(SEND, h);
}

// Lets panels refresh after the chat produced something new.
const UPDATED = "chat:updated";
export function chatUpdated() {
  window.dispatchEvent(new Event(UPDATED));
}
export function onChatUpdated(cb: () => void) {
  window.addEventListener(UPDATED, cb);
  return () => window.removeEventListener(UPDATED, cb);
}

// A swap went through: positions should refresh.
const TRADED = "trade:done";
export function tradeDone() {
  window.dispatchEvent(new Event(TRADED));
}
export function onTradeDone(cb: () => void) {
  window.addEventListener(TRADED, cb);
  return () => window.removeEventListener(TRADED, cb);
}
