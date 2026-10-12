"use client";

// Minimal non-custodial wallet bridge over the injected providers of Phantom,
// Solflare and Backpack. No keys ever touch our server: the wallet signs,
// we only forward the signed transaction to Jupiter.

type Provider = {
  isPhantom?: boolean;
  isSolflare?: boolean;
  isBackpack?: boolean;
  publicKey?: { toString(): string } | null;
  isConnected?: boolean;
  connect(opts?: { onlyIfTrusted?: boolean }): Promise<unknown>;
  disconnect(): Promise<void>;
  signTransaction<T>(tx: T): Promise<T>;
};

export type WalletName = "Phantom" | "Solflare" | "Backpack";

type W = Window & {
  phantom?: { solana?: Provider };
  solflare?: Provider;
  backpack?: { solana?: Provider } & Provider;
  solana?: Provider;
};

export function availableWallets(): { name: WalletName; provider: Provider }[] {
  if (typeof window === "undefined") return [];
  const w = window as W;
  const out: { name: WalletName; provider: Provider }[] = [];
  const phantom = w.phantom?.solana ?? (w.solana?.isPhantom ? w.solana : undefined);
  if (phantom) out.push({ name: "Phantom", provider: phantom });
  if (w.solflare?.isSolflare || w.solflare) out.push({ name: "Solflare", provider: w.solflare! });
  const backpack = w.backpack?.solana ?? (w.backpack?.isBackpack ? w.backpack : undefined);
  if (backpack) out.push({ name: "Backpack", provider: backpack });
  return out;
}

const KEY = "tm_wallet";
let active: { name: WalletName; provider: Provider; address: string } | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function onWalletChange(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function connectedWallet() {
  return active ? { name: active.name, address: active.address } : null;
}

export async function connect(name: WalletName) {
  const found = availableWallets().find((w) => w.name === name);
  if (!found) throw new Error(`${name} is not installed in this browser.`);
  await found.provider.connect();
  const address = found.provider.publicKey?.toString();
  if (!address) throw new Error("The wallet didn't share an address.");
  active = { name, provider: found.provider, address };
  try {
    localStorage.setItem(KEY, name);
  } catch {}
  emit();
  track(address, name);
  return address;
}

// Keep the server's wallet list in sync with the connected wallet (Positions / PnL read it).
let tracked: string | null = null;
function track(address: string, name: string) {
  if (tracked === address) return;
  tracked = address;
  fetch("/api/wallets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address, label: name }) })
    .then(() => emit())
    .catch(() => {
      tracked = null;
    });
}

/** Reconnects silently if the user approved this site before. */
export async function reconnect() {
  if (active) return;
  let name: string | null = null;
  try {
    name = localStorage.getItem(KEY);
  } catch {}
  const found = availableWallets().find((w) => w.name === name);
  if (!found) return;
  try {
    await found.provider.connect({ onlyIfTrusted: true });
    const address = found.provider.publicKey?.toString();
    if (address) {
      active = { name: found.name, provider: found.provider, address };
      emit();
      track(address, found.name);
    }
  } catch {}
}

export async function disconnect() {
  await active?.provider.disconnect().catch(() => {});
  active = null;
  try {
    localStorage.removeItem(KEY);
  } catch {}
  emit();
}

const b64ToBytes = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const bytesToB64 = (bytes: Uint8Array) => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};

/** Has the connected wallet sign a base64 v0 transaction; returns the signed one, base64. */
export async function signBase64(txB64: string) {
  if (!active) throw new Error("Connect a wallet first.");
  const { VersionedTransaction } = await import("@solana/web3.js");
  const tx = VersionedTransaction.deserialize(b64ToBytes(txB64));
  const signed = await active.provider.signTransaction(tx);
  return bytesToB64(signed.serialize());
}
