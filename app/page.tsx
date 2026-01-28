import InteractiveAvatar from "@/components/InteractiveAvatar";
import AccessGate from "@/components/AccessGate";

export default function Home() {
  return (
    <AccessGate>
      <main className="relative flex min-h-screen flex-col items-center justify-center p-4">
        <InteractiveAvatar />

        {/* AI Disclaimer Footer */}
        <footer className="absolute bottom-[15%] text-center max-w-3xl px-4 pointer-events-none">
          <p className="text-[10px] text-black/70 uppercase tracking-widest">
            Insight Public Sector • SDR X-Agent (Amy v1.0) • Internal Demo Only
          </p>
        </footer>
      </main>
    </AccessGate>
  );
}
