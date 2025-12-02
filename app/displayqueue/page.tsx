"use client";
import * as React from "react";

type KursRow = { code: string; buy: string; sell: string; dotColor: string };

const ORANGE = "#F58220";
const TOSKA = "#A6DED9";
const TOSKA_LIGHT = "#A4E3DA";

const KURS: KursRow[] = [
  { code: "HKD", buy: "1.908,00", sell: "2.088,00", dotColor: ORANGE },
  { code: "JPY", buy: "104,12", sell: "110,12", dotColor: "#19C37D" },
  { code: "SAR", buy: "3.941,00", sell: "4.361,00", dotColor: ORANGE },
  { code: "MYR", buy: "3.324,00", sell: "3.744,00", dotColor: "#19C37D" },
];

const loketServices = [
  { id: 1, name: "Teller" },
  { id: 2, name: "Customer Service" },
  { id: 3, name: "Layanan Kredit / KPR" },
  { id: 4, name: "Pembukaan Rekening" },
  { id: 5, name: "Layanan ATM / Kartu" },
];

const SERVICE_PREFIX: Record<string, string> = {
  "Teller": "A",
  "Customer Service": "B",
  "Layanan Kredit / KPR": "C",
  "Pembukaan Rekening": "D",
  "Layanan ATM / Kartu": "E",
};

export default function DisplayQueue() {
  const [now, setNow] = React.useState<string>("");
  const [numbers, setNumbers] = React.useState<string[]>(
    loketServices.map(({ name }) => `${SERVICE_PREFIX[name]}001`)
  );

  React.useEffect(() => {
    const iv = setInterval(() => {
      setNow(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  React.useEffect(() => {
    let ws: WebSocket | null = null;

    async function fetchQueue() {
      try {
        const res = await fetch("/api/queue", { cache: "no-store" });
        const json = await res.json();
        const tickets: Array<{ number: string; prefix: string; service: string; createdAt?: string }> = json.tickets ?? [];

        const latestByService: Record<string, string> = {};
        for (const t of tickets) {
          latestByService[t.service] = t.number;
        }

        const mapped = loketServices.map(({ name }) => {
          const num = latestByService[name];
          if (!num) return `${SERVICE_PREFIX[name]}001`;
          if (/^[A-Za-z]\d+$/.test(num)) {
            const prefix = num[0];
            const digits = num.slice(1);
            return `${prefix}${digits.padStart(3, "0")}`;
          }
          if (/^\d+$/.test(num)) {
            return `${SERVICE_PREFIX[name]}${num.padStart(3, "0")}`;
          }
          return num;
        });
        setNumbers(mapped);
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

  return (
    <div className="min-h-screen w-full bg-white text-black">
      <main className="min-h-screen w-full max-w-[1920px] mx-auto px-4 py-6">
        <div className="flex gap-6">
          <section className="w-[68%] flex flex-col gap-4">
          <div className="rounded-2xl border border-zinc-200 bg-white shadow">
            <div className="rounded-t-2xl px-4 py-2 text-sm font-bold" style={{ backgroundColor: TOSKA_LIGHT }}>KURS Valuta Asing</div>
            <div className="grid grid-cols-3 gap-2 px-4 py-3 text-xs">
              <div className="font-semibold text-zinc-700">Mata Uang</div>
              <div className="text-center font-semibold text-zinc-700">Beli</div>
              <div className="text-center font-semibold text-zinc-700">Jual</div>
              {KURS.map((r) => (
                <React.Fragment key={r.code}>
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: r.dotColor }} />
                    <span className="text-sm font-semibold">{r.code}</span>
                  </div>
                  <div className="text-center text-sm">{r.buy}</div>
                  <div className="text-center text-sm">{r.sell}</div>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white shadow">
            <div className="rounded-t-2xl px-4 py-2 text-sm font-bold" style={{ backgroundColor: TOSKA_LIGHT }}>BNI Taplus Muda</div>
            <div className="px-4 pt-3 text-xs text-zinc-700">Tering Saldo</div>
            <div className="grid grid-cols-2 gap-y-2 px-4 pb-4 pt-2 text-xs">
              <div className="font-semibold text-zinc-700">Tiering Saldo</div>
              <div className="text-right font-semibold text-zinc-700">Suku Bunga(%)</div>
              <div>Rp 1–3 Juta</div>
              <div className="text-right font-semibold">0,075%</div>
              <div>Rp 10–50 Juta</div>
              <div className="text-right font-semibold">0,25%</div>
              <div>Rp 50–100 Juta</div>
              <div className="text-right font-semibold">0,325%</div>
              <div>&gt; Rp 100 Juta</div>
              <div className="text-right font-semibold">0,75%</div>
            </div>
          </div>
          </section>

          <section className="w-[32%] max-w-[420px] rounded-xl p-4 h-fit" style={{ backgroundColor: TOSKA }}>
            <div className="grid grid-cols-2 gap-4 justify-items-center">
            {loketServices.map((l, i) => (
              <div
                key={l.id}
                className={`${i === 4 ? "col-span-2 max-w-[350px] mx-auto" : "max-w-[350px]"} h-[220px] p-4 rounded-2xl border-[3px] border-[#F58220] bg-white flex flex-col justify-center items-center gap-3 shadow-sm`}
              >
                  <div className="text-6xl font-extrabold leading-none">{numbers[i]}</div>
                  <div className="w-full rounded-full bg-[#F58220] py-2 px-6 text-center text-white text-lg font-semibold">LOKET {l.id}</div>
                  <div className="text-sm text-gray-600 mt-1 text-center">{l.name}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-4 flex items-center">
          <div className="flex h-12 items-center rounded-lg bg-[var(--orange)] px-4 text-white" style={{ ["--orange"]: ORANGE } as React.CSSProperties}>
            <div className="text-lg font-bold" suppressHydrationWarning>{now}</div>
          </div>
        </section>
      </main>
    </div>
  );
}
