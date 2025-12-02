"use client";
import * as React from "react";
import { ChevronLeft, ReceiptText, User, Building, CreditCard, WalletCards } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Ticket = {
  number: string;
  prefix: string;
  service: string;
  branch: string;
  status: "waiting";
  createdAt: string;
};

function getPrefixByService(service: string): string {
  switch (service) {
    case "Teller":
      return "A";
    case "Customer Service":
      return "B";
    case "Layanan Kredit / KPR":
      return "C";
    case "Pembukaan Rekening":
      return "D";
    case "Layanan ATM / Kartu":
      return "E";
    default:
      return "Z";
  }
}

function generateNextNumber(prefix: string, tickets: Ticket[]): string {
  const filtered = tickets.filter((t) => t.prefix === prefix);
  if (filtered.length === 0) return `${prefix}001`;
  const last = filtered[filtered.length - 1].number;
  const num = parseInt(last.slice(1)) + 1;
  return prefix + num.toString().padStart(3, "0");
}

export default function AntreanCabang() {
  const router = useRouter();
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [selectedBranch, setSelectedBranch] = React.useState<string>("");
  const [selectedService, setSelectedService] = React.useState<string>("");
  const [serverTickets, setServerTickets] = React.useState<Ticket[]>([]);
  const [currentTicket, setCurrentTicket] = React.useState<Ticket | null>(null);

  const branches = ["BNI Harmoni", "BNI Daan Mogot", "BNI Menteng", "BNI Jakarta Kota"];

  const services: { name: string; Icon: React.ComponentType<{ size?: number; className?: string }>; }[] = [
    { name: "Teller", Icon: ReceiptText },
    { name: "Customer Service", Icon: User },
    { name: "Layanan Kredit / KPR", Icon: Building },
    { name: "Pembukaan Rekening", Icon: CreditCard },
    { name: "Layanan ATM / Kartu", Icon: WalletCards },
  ];

  React.useEffect(() => {
    let ws: WebSocket | null = null;

    async function fetchQueue() {
      try {
        const res = await fetch("/api/queue", { cache: "no-store" });
        const json = await res.json();
        setServerTickets(Array.isArray(json.tickets) ? json.tickets : []);
      } catch {}
    }

    fetchQueue();

    try {
      ws = new WebSocket("ws://localhost:8080");
      ws.addEventListener("message", (ev) => {
        if (typeof ev.data === "string" && ev.data.includes("UPDATED")) {
          fetchQueue();
        }
      });
    } catch {}

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, []);

  const latestByService: Record<string, string> = React.useMemo(() => {
    const m: Record<string, string> = {};
    for (const t of serverTickets) m[t.service] = t.number;
    return m;
  }, [serverTickets]);

  function normalizeLatest(service: string): string {
    const latest = latestByService[service];
    const prefix = getPrefixByService(service);
    if (!latest) return `${prefix}001`;
    if (/^[A-Za-z]\d+$/.test(latest)) {
      const d = latest.slice(1);
      return `${latest[0]}${d.padStart(3, "0")}`;
    }
    if (/^\d+$/.test(latest)) return `${prefix}${latest.padStart(3, "0")}`;
    return latest;
  }

  function estimateNext(service: string): string {
    const prefix = getPrefixByService(service);
    const latest = latestByService[service];
    if (!latest) return `${prefix}002`;
    const n = parseInt(latest.slice(1), 10);
    const next = isNaN(n) ? 2 : n + 1;
    return `${prefix}${next.toString().padStart(3, "0")}`;
  }

  async function onGenerateTicket() {
      const prefix = getPrefixByService(selectedService);
      const number = generateNextNumber(prefix, serverTickets as Ticket[]);

      const newTicket: Ticket = {
        number,
        prefix,
        service: selectedService,
        branch: selectedBranch,
        status: "waiting",
        createdAt: new Date().toISOString(),
      };

      // simpan ke JSON via API
      await fetch("/api/queue", {
        method: "POST",
        body: JSON.stringify(newTicket),
      });

      // update state internal (hp biar bisa lihat tiketnya)
      setServerTickets((prev) => [...prev, newTicket]);
      setCurrentTicket(newTicket);
      setStep(3);
  }


  return (
    <div className="min-h-screen w-full bg-white text-black">
      <main className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-white">
        <header className="flex items-center gap-3 px-6 pt-6">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200"
            aria-label="Kembali"
          >
            <ChevronLeft size={20} className="text-black" />
          </button>
          <h1 className="text-[20px] font-semibold">Antrean Cabang</h1>
        </header>

        {step === 1 && (
          <section className="px-6 pt-6">
            <div className="rounded-2xl bg-white p-4 shadow">
              <div className="text-lg font-bold">Ambil Nomor Antrian</div>
              <div className="mt-1 text-sm text-zinc-600">Silakan pilih cabang bank yang ingin Anda kunjungi.</div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {branches.map((b) => (
                <button
                  key={b}
                  className="rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow hover:border-[#00c2a8]"
                  onClick={() => {
                    setSelectedBranch(b);
                    setStep(2);
                  }}
                >
                  <div className="text-sm font-semibold">{b}</div>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="px-6 pt-6">
            <div className="rounded-2xl bg-white p-4 shadow">
              <div className="text-lg font-bold">Pilih Layanan di {selectedBranch}</div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {services.map(({ name, Icon }) => (
                <button
                  key={name}
                  className={`flex flex-col items-center gap-2 rounded-2xl border p-4 shadow ${selectedService === name ? "border-[#ff8a00]" : "border-zinc-200"}`}
                  onClick={() => setSelectedService(name)}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#9ee6da]">
                    <Icon size={28} className="text-black" />
                  </div>
                  <div className="text-center text-sm font-semibold">{name}</div>
                  <div className="mt-1 w-full text-xs text-zinc-600">
                    <div className="flex justify-between"><span>Antrian Aktif</span><span className="font-semibold">{normalizeLatest(name)}</span></div>
                    <div className="flex justify-between"><span>Nomor Estimasi Anda</span><span className="font-semibold">{estimateNext(name)}</span></div>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-6">
              <button
                className={`w-full rounded-full px-6 py-3 text-sm font-semibold ${selectedService ? "bg-[#d7f05b]" : "bg-zinc-200"}`}
                disabled={!selectedService}
                onClick={onGenerateTicket}
              >
                Ambil Nomor Antrian
              </button>
            </div>
          </section>
        )}

        {step === 3 && currentTicket && (
          <section className="px-6 pt-6">
            <div className="rounded-2xl bg-white p-6 shadow">
              <div className="text-lg font-bold">Nomor Antrian Anda</div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="text-zinc-600">Cabang</div>
                <div className="text-right font-semibold">{currentTicket.branch}</div>
                <div className="text-zinc-600">Layanan</div>
                <div className="text-right font-semibold">{currentTicket.service}</div>
                <div className="text-zinc-600">Tanggal & waktu</div>
                <div className="text-right font-semibold">{new Date(currentTicket.createdAt).toLocaleString()}</div>
              </div>
              <div className="mt-6 text-center text-5xl font-extrabold tracking-wider">
                {`${currentTicket.number[0]}-${currentTicket.number.slice(1)}`}
              </div>
              <div className="mt-3 text-center text-sm text-zinc-600">Silakan menunggu panggilan di layar antrian cabang.</div>
              <div className="mt-6 h-32 w-full rounded-lg bg-[repeating-linear-gradient(90deg,#000_0,#000_6px,#fff_6px,#fff_12px)]" />
              <div className="mt-6">
                <Link href="/" className="block w-full">
                  <span className="inline-flex w-full items-center justify-center rounded-full bg-[#ff8a00] px-6 py-3 text-sm font-semibold text-white">Kembali ke Beranda</span>
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
