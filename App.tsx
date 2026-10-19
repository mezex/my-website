import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dices,
  Volume2,
  VolumeX,
  Trophy,
  Sparkles,
  LogIn,
  LogOut,
  Link2,
  MousePointerClick,
} from "lucide-react";
import { useRoulette, setMuted, isMuted, type Entry } from "./hooks/useRoulette";
import { sound } from "./lib/sound";
import Wheel, { type WheelHandle } from "./components/Wheel";
import WinnerModal from "./components/WinnerModal";
import ChatPanel from "./components/ChatPanel";
import EntriesPanel from "./components/EntriesPanel";
import ConnectBar from "./components/ConnectBar";

export default function App() {
  const r = useRoulette();
  const wheelRef = useRef<WheelHandle>(null);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Entry | null>(null);
  const [autoRemove, setAutoRemove] = useState(true);
  const [muted, setMutedState] = useState(isMuted());

  const doSpin = useCallback(async () => {
    if (spinning || r.entries.length < 2) return;
    setWinner(null);
    setSpinning(true);
    const win = (await wheelRef.current?.spin()) ?? null;
    setSpinning(false);
    if (win) {
      sound.win();
      r.pushWinner(win.username);
      if (autoRemove) r.removeEntry(win.key);
      setWinner(win);
    }
  }, [spinning, r, autoRemove]);

  // Spacebar spins (when not typing)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      e.preventDefault();
      void doSpin();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doSpin]);

  const toggleMute = () => {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
    if (!next) sound.join();
  };

  return (
    <div className="min-h-screen relative">
      <div className="bg-scene" />
      <div className="bg-grid" />
      <div className="bg-noise" />
      <div className="bg-vignette" />

      {/* ─────────────────── header ─────────────────── */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-md bg-black/25">
        <div className="max-w-[1500px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 grid place-items-center rounded-xl bg-gradient-to-br from-lime/25 to-lime/5 border border-lime/40 shadow-[0_0_24px_rgba(83,252,24,0.25)]">
              <Dices size={21} className="text-lime" />
            </div>
            <div className="leading-tight">
              <h1 className="font-display font-bold text-lg tracking-wide">
                دولاب <span className="text-lime text-glow" dir="ltr">KICK</span>
              </h1>
              <p className="text-[10.5px] text-dim font-bold -mt-0.5">سحب عشوائي مباشر من شات قناتك</p>
            </div>
          </div>
          <button
            onClick={toggleMute}
            className="btn-ghost rounded-xl p-2.5"
            title={muted ? "تشغيل الصوت" : "كتم الصوت"}
          >
            {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-[1500px] mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* ─────────────────── hero ─────────────────── */}
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center gap-2 text-[11px] font-bold text-lime2 bg-lime/10 border border-lime/25 rounded-full px-3.5 py-1.5 mb-4">
            <Sparkles size={12} />
            بدون تسجيل دخول — بدون بوت — مباشرة من المتصفح
          </div>
          <h2 className="font-display font-bold text-3xl md:text-5xl leading-[1.25] mb-3">
            من يكتب <span className="kbd-chip rounded-lg px-2.5 py-0.5 mx-1 inline-flex items-center gap-1"><LogIn size={18} />دخول</span>
            يدخل الدولاب
          </h2>
          <p className="text-dim text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            اربط قناتك على Kick، ودع المشاهدين يسجلّون أنفسهم بكتابة
            <span className="text-lime2 font-bold"> «دخول» </span>
            أو يغادرون بكتابة
            <span className="text-red-300 font-bold"> «خروج» </span>
            — ثم أدر الدولاب واختر الفائز أمامهم.
          </p>
        </div>

        <ConnectBar
          conn={r.conn}
          channel={r.channel}
          errorMsg={r.errorMsg}
          onConnect={r.connect}
          onDisconnect={r.disconnect}
          onDemo={r.startDemo}
        />

        {/* ─────────────────── main grid ─────────────────── */}
        <div className="mt-6 grid grid-cols-1 xl:grid-cols-[330px_minmax(0,1fr)_360px] gap-5 items-stretch">
          {/* wheel (first on mobile) */}
          <div className="xl:order-2 flex flex-col items-center gap-5">
            <div className="glass rounded-3xl w-full flex-1 flex flex-col items-center justify-center gap-6 p-5 md:p-7 min-h-[520px] relative overflow-hidden">
              <div
                className="absolute inset-0 pointer-events-none opacity-60"
                style={{
                  background:
                    "radial-gradient(420px 420px at 50% 42%, rgba(83,252,24,0.09), transparent 70%)",
                }}
              />
              <Wheel
                ref={wheelRef}
                entries={r.entries}
                className="w-full max-w-[480px] relative z-10"
              />

              <div className="relative z-10 flex flex-col items-center gap-3 w-full">
                <button
                  onClick={() => void doSpin()}
                  disabled={spinning || r.entries.length < 2}
                  className="btn-lime font-display font-bold text-lg md:text-xl rounded-2xl px-12 py-4 flex items-center gap-3"
                >
                  <Dices size={24} className={spinning ? "animate-spin" : ""} style={{ animationDuration: "1.4s" }} />
                  {spinning ? "يدور…" : "أدر الدولاب"}
                </button>
                <p className="text-[11.5px] text-dim flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                  {r.entries.length < 2 ? (
                    <>تحتاج اسمين على الأقل للدوران</>
                  ) : (
                    <>
                      <MousePointerClick size={12} />
                      جاهز للدوران — أو اضغط مسافة
                    </>
                  )}
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <span
                      className={`switch ${autoRemove ? "on" : ""} scale-[0.72] origin-center`}
                      onClick={() => setAutoRemove((v) => !v)}
                      role="checkbox"
                      aria-checked={autoRemove}
                    />
                    إخراج الفائز تلقائيًا
                  </label>
                </p>
              </div>

              {/* winners history */}
              {r.winners.length > 0 && (
                <div className="relative z-10 w-full border-t border-white/5 pt-4">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Trophy size={14} className="text-lime" />
                    <span className="font-display font-bold text-[12px] text-dim">آخر الفائزين</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {r.winners.map((w, i) => (
                      <span
                        key={`${w.username}-${w.at}`}
                        className={`pop-in font-bold text-[12px] rounded-full px-3 py-1 border ${
                          i === 0
                            ? "bg-lime/15 text-lime2 border-lime/40"
                            : "bg-white/[0.04] text-fog border-white/10"
                        }`}
                      >
                        {w.username}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* entries (right in RTL) */}
          <div className="xl:order-1 h-[540px] xl:h-auto xl:min-h-[560px]">
            <EntriesPanel
              entries={r.entries}
              spinning={spinning}
              onAdd={r.addManual}
              onRemove={r.removeEntry}
              onShuffle={r.shuffleEntries}
              onClear={r.clearEntries}
            />
          </div>

          {/* chat (left in RTL) */}
          <div className="xl:order-3 h-[540px] xl:h-auto xl:min-h-[560px]">
            <ChatPanel
              lines={r.chatLines}
              conn={r.conn}
              channelName={r.channel?.username ?? null}
            />
          </div>
        </div>

        {/* ─────────────────── steps ─────────────────── */}
        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          {[
            { icon: Link2, t: "١ · اربط قناتك", d: "اكتب اسم قناتك على Kick واضغط «اربط القناة» — يبدأ تحديث الشات فورًا." },
            { icon: LogIn, t: "٢ · المشاهدون يسجّلون", d: "من يكتب «دخول» في الشات ينضم تلقائيًا، ومن يكتب «خروج» يُزال من القائمة." },
            { icon: Dices, t: "٣ · أدر واعلن الفائز", d: "دولاب فيزيائي عادل تمامًا — الأسماء على الهواء والفائز بلا شك." },
          ].map((s) => (
            <div key={s.t} className="glass rounded-2xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-lime/12 border border-lime/30 grid place-items-center shrink-0">
                <s.icon size={17} className="text-lime" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm mb-1">{s.t}</h3>
                <p className="text-[12px] text-dim leading-relaxed">{s.d}</p>
              </div>
            </div>
          ))}
        </div>

        <footer className="mt-8 pb-4 text-center text-[11px] text-dim/70 leading-relaxed">
          أداة مستقلة غير تابعة لـ Kick — تعمل عبر قراءة الشات العام لقناتك كل بضع ثوانٍ.
          <br />
          <span className="inline-flex items-center gap-1">
            كلمات التحكم: <b className="text-lime2/90">دخول</b> للانضمام · <b className="text-red-300/90">خروج</b> للمغادرة
            <LogOut size={11} className="opacity-60" />
          </span>
        </footer>
      </main>

      <WinnerModal
        winner={winner}
        onClose={() => setWinner(null)}
        onRemove={(key) => r.removeEntry(key)}
        onRespin={() => {
          setWinner(null);
          window.setTimeout(() => void doSpin(), 350);
        }}
        canRespin={r.entries.length >= 2 && !spinning}
      />
    </div>
  );
}
