"use client";
import * as React from "react";
import { toast } from "sonner";
import {
  Battery,
  Wifi,
  SignalHigh,
  Bell,
  Bookmark,
  Eye,
  Send,
  CreditCard,
  ReceiptText,
  WalletCards,
  SquarePlus,
  ShoppingBag,
  Grid3x3,
  Wallet,
  Building,
  User,
} from "lucide-react";
import Link from "next/link";
import { Toaster } from "../components/ui/sonner";

type Ticket = {
  number: string;
  prefix: string;
  service: string;
  branch: string;
  status: "waiting" | "called";
  createdAt: string;
};

const SERVICE_PREFIX: Record<string, string> = {
  "Teller": "A",
  "Customer Service": "B",
  "Layanan Kredit / KPR": "C",
  "Pembukaan Rekening": "D",
  "Layanan ATM / Kartu": "E",
};

export default function Home() {
  const [myTicket, setMyTicket] = React.useState<Ticket | null>(null);
  const [currentCalled, setCurrentCalled] = React.useState<string | null>(null);
  const [estimateMinutes, setEstimateMinutes] = React.useState<number | null>(null);
  const lastDiffRef = React.useRef<number | null>(null);
  

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("myQueueTicket");
      if (raw) setMyTicket(JSON.parse(raw));
    } catch {}
  }, []);

  React.useEffect(() => {
    try {
      const key = "toastDebugShown";
      const shown = localStorage.getItem(key) === "1";
      if (!shown) {
        toast("Notifikasi aktif");
        localStorage.setItem(key, "1");
      }
    } catch {}
  }, []);

  React.useEffect(() => {
    let ws: WebSocket | null = null;
    let bc: BroadcastChannel | null = null;
    let poll: number | null = null;

    async function fetchQueue() {
      if (!myTicket) return;
      try {
        const res = await fetch("/api/queue", { cache: "no-store" });
        const json = await res.json();
        const tickets: Array<Ticket> = json.tickets ?? [];
        const latestByService: Record<string, string> = {};
        for (const t of tickets) {
          if (t.status === "called") latestByService[t.service] = t.number;
        }
        const latest = latestByService[myTicket.service];
        const prefix = SERVICE_PREFIX[myTicket.service] ?? myTicket.number[0];
        let normalized: string | null = null;
        if (!latest) normalized = `${prefix}025`;
        else if (/^[A-Za-z]\d+$/.test(latest)) {
          const d = latest.slice(1);
          normalized = `${latest[0]}${d.padStart(3, "0")}`;
        } else if (/^\d+$/.test(latest)) {
          normalized = `${prefix}${latest.padStart(3, "0")}`;
        } else normalized = latest;

        const myN = parseInt(myTicket.number.slice(1), 10);
        const curN = normalized ? parseInt(normalized.slice(1), 10) : 25;
        const samePrefix = (normalized?.[0] ?? prefix) === myTicket.number[0];
        if (samePrefix && !isNaN(myN) && !isNaN(curN) && curN >= myN) {
          try { localStorage.removeItem("myQueueTicket"); } catch {}
          setMyTicket(null);
          setCurrentCalled(null);
          setEstimateMinutes(null);
          return;
        }

        setCurrentCalled(normalized);
        const diff = isNaN(myN) || isNaN(curN) ? 0 : Math.max(myN - curN, 0);
        setEstimateMinutes(diff * 2);

        try {
          const prev = lastDiffRef.current;
          if (prev !== 3 && diff === 3) {
            toast.custom((t) => (
              <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#ff8a00] to-[#00c2a8] p-3 text-white shadow-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <Bell size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold">Sisa antrean aktif 3</div>
                  <div className="text-xs opacity-90">Silahkan datang ke {myTicket.branch}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/displayqueue" className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30">Lihat Layar</Link>
                  <button onClick={() => toast.dismiss(t)} className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30">Oke</button>
                </div>
              </div>
            ), { duration: 6000, position: "top-center" });
          }
          lastDiffRef.current = diff;
        } catch {}
      } catch {}
    }

    fetchQueue();

    poll = window.setInterval(() => {
      fetchQueue();
    }, 5000);

    try {
      ws = new WebSocket("ws://localhost:8080");
      ws.addEventListener("message", (ev) => {
        if (typeof ev.data === "string" && ev.data.includes("UPDATED")) {
          fetchQueue();
        }
      });
    } catch {}

    try {
      bc = new BroadcastChannel("queue");
      bc.onmessage = (ev) => {
        if (typeof ev.data === "string" && ev.data.includes("UPDATED")) {
          fetchQueue();
        }
      };
    } catch {}

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) ws.close();
      try { bc?.close(); } catch {}
      if (poll != null) clearInterval(poll);
    };
  }, [myTicket]);
  
  return (
    <div className="min-h-screen w-full bg-black text-black">
      <Toaster position="top-center" richColors />
      <main className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-white">
        <div className="relative w-full">
          <div className="flex items-center justify-between px-6 pt-6">
            <span className="text-[18px] font-semibold">21.13</span>
            <div className="flex items-center gap-2 text-black">
              <SignalHigh size={16} />
              <Wifi size={16} />
              <div className="flex items-center gap-1">
                <Battery size={18} />
                <span className="text-[11px] font-semibold">18%</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between px-6 pt-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-extrabold tracking-tight">
                <span className="text-[#ff8a00]">won</span>
                <span className="text-[#00c2a8]">dr</span>
              </div>
              <span className="text-xs text-zinc-500">by BNI</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-[#ff8a00] px-3 py-1 text-sm">
                <span className="text-[#ff8a00]">Poin</span>
              </div>
              <div className="h-8 w-8 rounded-full border border-zinc-300" />
            </div>
          </div>
          <div className="flex items-center justify-between px-6 pt-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200">
                <User size={20} className="text-black" />
              </div>
              <div className="text-[20px] font-semibold">Hi, Kelvin!</div>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative flex flex-col items-center text-center">
                <Bell size={22} className="text-black" />
                <span className="mt-1 text-xs text-zinc-600">Notifikasi</span>
                <div className="absolute right-0 top-0 h-2 w-2 rounded-full bg-orange-400" />
              </div>
              <div className="flex flex-col items-center text-center">
                {/* pengganti: tidak ada ikon spesifik "Bukti Transaksi" di Lucide, gunakan Bookmark */}
                <Bookmark size={22} className="text-black" />
                <span className="mt-1 text-xs text-zinc-600">Bukti Transaksi</span>
              </div>
            </div>
          </div>
          <div className="px-6 pt-5">
            <div className="flex w-full items-center justify-between rounded-full bg-zinc-100 p-2">
              <div className="flex h-10 flex-1 items-center justify-center rounded-full text-sm">Insight</div>
              <div className="flex h-10 flex-1 items-center justify-center rounded-full bg-[#d7f05b] text-sm font-semibold">Transaksi</div>
              <div className="flex h-10 flex-1 items-center justify-center rounded-full text-sm">Growth</div>
            </div>
          </div>
        </div>
        <section className="mt-6 w-full px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Rekening transaksi kamu</h2>
            <button className="text-sm font-semibold text-[#ff8a00]">Lihat Semua</button>
          </div>
          <div className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3">
            <div className="snap-center shrink-0 rounded-2xl bg-gradient-to-br from-[#ff8a00] to-[#ffb46b] p-4 text-white shadow-md w-[300px]">
              <div className="flex items-center justify-between">
                <div className="text-xs">TAPLUS MUDA</div>
                <div className="rounded-full bg-white/80 px-2 py-1 text-xs font-semibold text-black">UTAMA</div>
              </div>
              <div className="mt-1 text-2xl font-extrabold tracking-wide">1957619606</div>
              <div className="mt-5 text-sm text-white/90">Saldo efektif</div>
              <div className="mt-1 flex items-center gap-2 text-xl font-bold">Rp********** <Eye size={18} className="text-white" /></div>
            </div>
            <div className="snap-center shrink-0 rounded-2xl bg-gradient-to-br from-[#00c2a8] to-[#8ee3d5] p-4 text-black shadow-md w-[300px]">
              <div className="flex items-center justify-between">
                <div className="text-xs">TAPLUS</div>
                <div className="rounded-full bg-black/10 px-2 py-1 text-xs font-semibold">LAINNYA</div>
              </div>
              <div className="mt-1 text-2xl font-extrabold tracking-wide">1234567890</div>
              <div className="mt-5 text-sm text-black/70">Saldo efektif</div>
              <div className="mt-1 flex items-center gap-2 text-xl font-bold">Rp********** <Eye size={18} className="text-black/70" /></div>
            </div>
            
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="h-2 w-2 rounded-full bg-black" />
            <div className="h-2 w-2 rounded-full bg-zinc-300" />
            <div className="h-2 w-2 rounded-full bg-zinc-300" />
            <div className="h-2 w-2 rounded-full bg-zinc-300" />
            <div className="h-2 w-2 rounded-full bg-zinc-300" />
          </div>
        </section>
        {myTicket && (
          <section className="mt-6 w-full px-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Antrean cabang</h2>
            </div>
            <div className="mt-4">
              <div className="rounded-2xl bg-gradient-to-br from-[#e7f486] to-[#c8ece9] p-4 text-black shadow-md w-full">
                <div className="flex items-center justify-between">
                  <div className="text-xs">ANTREAN CABANG</div>
                  <div className="rounded-full bg-black/10 px-2 py-1 text-xs font-semibold">{myTicket.service}</div>
                </div>
                <div className="mt-2 text-2xl font-extrabold tracking-wider">Nomor Anda: {myTicket.number}</div>
                <div className="mt-4 text-sm text-black/70">Antrian aktif</div>
                <div className="mt-1 text-xl font-bold">{currentCalled ?? `${SERVICE_PREFIX[myTicket.service]}025`}</div>
                <div className="mt-4 text-sm text-black/70">Estimasi dipanggil</div>
                <div className="mt-1 text-xl font-bold">{estimateMinutes != null ? `~${estimateMinutes} menit` : "-"}</div>
                <div className="mt-4">
                  <Link href="/displayqueue" className="inline-flex items-center justify-center rounded-full bg-[#ff8a00] px-4 py-2 text-sm font-semibold text-white">Lihat Layar Antrean</Link>
                </div>
              </div>
            </div>
          </section>
        )}
        <section className="mt-6 w-full px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Fitur pilihan kamu</h2>
            <button className="text-sm font-semibold text-[#ff8a00]">Atur</button>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-4">
            {[
              { label: "Transfer", color: "#9ee6da", Icon: Send },
              { label: "TapCash", color: "#ff8a00", Icon: CreditCard }, // pengganti: gunakan CreditCard untuk TapCash
              { label: "Bayar & Beli", color: "#bfc9ff", Icon: ReceiptText },
              { label: "E-Wallet", color: "#9ee6da", Icon: WalletCards },
              { label: "Virtual\nAccount", color: "#9ee6da", Icon: SquarePlus }, // pengganti: gunakan SquarePlus untuk VA+
              { label: "Antrean\nCabang", color: "#9ee6da", Icon: Building, href: "/antrean-cabang" },
              { label: "Lifestyle", color: "#cbb7ff", Icon: ShoppingBag },
              { label: "Lihat Semua", color: "#ffffff", border: true, Icon: Grid3x3 },
            ].map((item, i) => (
              <Link key={i} href={item.href ?? "#"} className="flex flex-col items-center gap-2">
                <div
                  className={`${item.border ? "border border-zinc-300" : ""} flex h-16 w-16 items-center justify-center rounded-2xl`}
                  style={{ backgroundColor: item.color }}
                >
                  {item.Icon ? (
                    <item.Icon size={28} className="text-black" />
                  ) : (
                    <div className="h-8 w-8 rounded-md bg-black/80" />
                  )}
                </div>
                <div className="text-center text-xs text-black whitespace-pre-line">{item.label}</div>
              </Link>
            ))}
          </div>
        </section>
        <section className="mt-6 w-full px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Promo buat kamu</h2>
            <button className="text-sm font-semibold text-[#ff8a00]">Lihat Semua</button>
          </div>
          <div className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3">
            <div className="snap-center w-[300px] shrink-0 rounded-2xl bg-[#e7f486] p-4 shadow">
              <div className="text-xs">Hingga 31 Des 2025</div>
              <div className="mt-2 text-xl font-bold">Ajak Teman Kamu, Dapatkan Reward Hingga Rp50 Juta</div>
              <div className="mt-2 text-sm text-zinc-600">dengan wondr by BNI</div>
              <div className="mt-4 h-24 rounded-2xl bg-purple-500" />
            </div>
            <div className="snap-center w-[300px] shrink-0 rounded-2xl bg-[#c8ece9] p-4 shadow">
              <div className="text-xs">5 Nov</div>
              <div className="mt-2 text-xl font-bold">Ubah Kartu Tanpa Biaya</div>
              <div className="mt-4 h-24 rounded-2xl bg-cyan-400" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="h-2 w-2 rounded-full bg-black" />
            <div className="h-2 w-2 rounded-full bg-zinc-300" />
            <div className="h-2 w-2 rounded-full bg-zinc-300" />
            <div className="h-2 w-2 rounded-full bg-zinc-300" />
          </div>
        </section>
        <section className="mt-6 w-full px-6 pb-24">
          <h2 className="text-lg font-bold">Top-up kamu</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-[#9ee6da] p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-600">
                    <Wallet size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="font-semibold">GoPay</div>
                    <div className="text-sm text-zinc-700">Saldo:</div>
                    <div className="text-sm font-bold">Rp2.029</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border-2 border-dashed border-[#9ee6da] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500">
                    {/* pengganti: gunakan WalletCards untuk merepresentasikan e-wallet LinkAja */}
                    <WalletCards size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="font-semibold">Top-up LinkAja kamu di sini!</div>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-center">
                <button className="rounded-full bg-[#9ee6da] px-6 py-2 text-sm font-semibold">Sambungin</button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
