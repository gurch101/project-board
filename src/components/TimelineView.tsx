import React from 'react';
import { useKanban } from '../context/KanbanContext';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import TicketDetail from './TicketDetail';
import type { Ticket } from '../types';

const TimelineView: React.FC = () => {
    const { tickets } = useKanban();
    const [selectedTicket, setSelectedTicket] = React.useState<Ticket | null>(null);

    // Sort tickets by updated_at descending
    const sortedTickets = [...tickets].sort((a, b) => {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    return (
        <div className="h-full overflow-y-auto p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <Clock className="text-blue-500" />
                Timeline
            </h2>

            <div className="relative border-l-2 border-zinc-200 dark:border-zinc-800 ml-3 space-y-8 pb-12">
                {sortedTickets.map(ticket => (
                    <div key={ticket.id} className="relative pl-8 group" data-testid="timeline-item">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white dark:bg-zinc-900 border-2 border-zinc-300 dark:border-zinc-700 group-hover:border-blue-500 transition-colors" />

                        <div
                            onClick={() => setSelectedTicket(ticket)}
                            className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">{ticket.title}</h3>
                                <span className="text-xs text-zinc-500 whitespace-nowrap">
                                    {format(new Date(ticket.updated_at), "MMM d, h:mm a")}
                                </span>
                            </div>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3">
                                {ticket.description || "No description provided."}
                            </p>

                            <div className="flex items-center gap-2 text-xs">
                                <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-zinc-600 dark:text-zinc-400">
                                    #{ticket.id}
                                </span>
                                {/* We could show status here if we map IDs to names, 
                                    but for MVP this list is sufficient test of sorting */}
                            </div>
                        </div>
                    </div>
                ))}
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

export default TimelineView;
