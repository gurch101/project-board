import React, { useState } from 'react';
import { KanbanProvider } from "./context/KanbanContext";
import Board from "./components/Board";
import GlobalSearch from "./components/GlobalSearch";
import TimelineView from "./components/TimelineView";
import { LayoutGrid, Clock } from 'lucide-react';
import "./index.css";

export function App() {
  const [view, setView] = useState<'board' | 'timeline'>('board');

  return (
    <KanbanProvider>
      <div className="h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 overflow-hidden">
        {/* Top Navigation */}
        <header className="flex-shrink-0 h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between px-4 z-20">
          <div className="flex items-center gap-6">
            <h1 className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Kanban
            </h1>

            <nav className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
              <button
                onClick={() => setView('board')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'board' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              >
                <LayoutGrid size={16} />
                Board
              </button>
              <button
                onClick={() => setView('timeline')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'timeline' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              >
                <Clock size={16} />
                Timeline
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4 text-sm text-zinc-500">
            <div className="hidden md:flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700">
              <span className="text-xs">Search</span>
              <kbd className="font-mono text-[10px] bg-zinc-200 dark:bg-zinc-700 px-1.5 rounded border border-zinc-300 dark:border-zinc-600">Ctrl + P</kbd>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden relative">
          {view === 'board' ? <Board /> : <TimelineView />}
        </main>

        <GlobalSearch />
      </div>
    </KanbanProvider>
  );
}

export default App;
