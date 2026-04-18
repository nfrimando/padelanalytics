export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800 font-sans px-4">
      <div className="max-w-2xl w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-10 flex flex-col items-center">
        <h1 className="text-4xl font-extrabold text-indigo-700 dark:text-indigo-300 mb-4 text-center">
          Padel Analytics
        </h1>
        <p className="text-lg text-zinc-700 dark:text-zinc-200 mb-8 text-center">
          Padel Analytics helps you analyze and review your padel matches using
          YouTube videos. Log every point, error, and highlight as you watch,
          then review detailed stats and event timelines to improve your game.
        </p>
        <a
          href="/session/new"
          className="mt-4 px-8 py-4 text-2xl font-bold rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-all focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-800"
        >
          Start Analyzing
        </a>
      </div>
    </div>
  );
}
