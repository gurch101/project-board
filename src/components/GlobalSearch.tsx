import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, X } from 'lucide-react';
import { useKanban } from '../context/KanbanContext';
import type { Ticket } from '../types';
import TicketDetail from './TicketDetail';

const GlobalSearch: React.FC = () => {
    const { tickets, statuses, types, releases, users } = useKanban();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'p' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const filteredTickets = tickets.filter(ticket => {
        const lowerQuery = query.toLowerCase();

        // Parse slash commands
        if (lowerQuery.startsWith('/')) {
            const parts = lowerQuery.split(' ');
            const command = parts[0];
            const arg = parts.slice(1).join(' ');

            if (command === '/type') {
                if (!arg) return true; // Show all if just typing command? or filter nothing?
                const type = types.find(t => t.name.toLowerCase().includes(arg));
                return type ? ticket.type_id === type.id : false;
            }
            if (command === '/status') {
                const status = statuses.find(s => s.name.toLowerCase().includes(arg));
                return status ? ticket.status_id === status.id : false;
            }
            if (command === '/release') {
                const release = releases.find(r => r.name.toLowerCase().includes(arg));
                return release ? ticket.release_id === release.id : false;
            }
            if (command === '/assigned') {
                const user = users.find(u => u.name.toLowerCase().includes(arg));
                return user ? ticket.assigned_to_user_id === user.id : false;
            }
            // default fallthrough if command not recognized or handled
        }

        return (
            ticket.title.toLowerCase().includes(lowerQuery) ||
            (ticket.description || "").toLowerCase().includes(lowerQuery)
        );
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-start justify-center pt-[10vh]">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                    <Search className="text-zinc-400" size={20} />
                    <input
                        ref={inputRef}
                        className="flex-1 bg-transparent border-none focus:outline-none text-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
                        placeholder="Search..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">ESC</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {filteredTickets.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500">
                            No tickets found.
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredTickets.map(ticket => (
                                <button
                                    key={ticket.id}
                                    onClick={() => setSelectedTicket(ticket)}
                                    className="w-full text-left p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg flex items-center justify-between group transition-colors"
                                >
                                    <div>
                                        <div className="font-medium text-zinc-900 dark:text-zinc-100">{ticket.title}</div>
                                        <div className="text-xs text-zinc-500 truncate max-w-md">{ticket.description}</div>
                                    </div>
                                    <span className="text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-900 px-2 py-1 rounded group-hover:bg-white dark:group-hover:bg-zinc-700 transition-colors">
                                        #{ticket.id}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-2 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400 flex gap-4">
                    <span>Type <strong>/</strong> for commands</span>
                    <div className="flex gap-2">
                        {['/type', '/status', '/release', '/assigned'].map(cmd => (
                            <span key={cmd} className="bg-zinc-200 dark:bg-zinc-800 px-1.5 rounded">{cmd}</span>
                        ))}
                    </div>
                </div>
            </div>

            {selectedTicket && (
                <TicketDetail
                    ticket={selectedTicket}
                    onClose={() => setSelectedTicket(null)}
                />
            )}
        </div>
    );
};

export default GlobalSearch;
