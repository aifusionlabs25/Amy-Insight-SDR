import InteractiveAvatar from "@/components/InteractiveAvatar";
import AccessGate from "@/components/AccessGate";

export default function Home() {
  return (
    <AccessGate>
      <main className="relative flex min-h-screen flex-col items-center justify-center p-4">
        <InteractiveAvatar />
      </main>
    </AccessGate>
  );
}
