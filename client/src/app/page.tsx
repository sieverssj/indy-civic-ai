import Chat from "@/components/chat/chat";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex h-dvh flex-col items-center justify-between p-24">
      <div className="z-10 w-full h-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <Chat />
      </div>
    </main>
  );
}
