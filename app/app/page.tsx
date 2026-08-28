import { Board } from "./components/board/board";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-[1500px]">
        <Board />
      </div>
    </main>
  );
}
