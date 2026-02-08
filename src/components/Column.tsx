import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TicketCard from './TicketCard';
import type { Ticket } from '../types';

interface ColumnProps {
    id: string; // Group ID (status_id, release_id, etc.)
    title: string;
    tickets: Ticket[];
    onTicketClick: (ticket: Ticket) => void;
}

const Column: React.FC<ColumnProps> = ({ id, title, tickets, onTicketClick }) => {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div className="flex-shrink-0 w-80 flex flex-col max-h-full">
            <div className="flex items-center justify-between p-3 font-semibold text-zinc-700 dark:text-zinc-300">
                <h3>{title}</h3>
                <span className="text-xs bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 rounded-full text-zinc-600 dark:text-zinc-400">
                    {tickets.length}
                </span>
            </div>

            <div ref={setNodeRef} className="flex-1 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-xl p-2 overflow-y-auto space-y-2 min-h-[150px]">
                <SortableContext
                    id={id}
                    items={tickets.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {tickets.map(ticket => (
                        <TicketCard
                            key={ticket.id}
                            ticket={ticket}
                            onClick={() => onTicketClick(ticket)}
                        />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
};

export default Column;
