import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Ticket } from '../types';
import { GripVertical, Trash2 } from 'lucide-react';

interface TicketCardProps {
    ticket: Ticket;
    onClick: () => void;
    onDelete: () => void;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket, onClick, onDelete }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: ticket.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className="bg-white dark:bg-zinc-800 p-3 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 hover:shadow-md transition-shadow group relative"
        >
            <div
                {...listeners}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-zinc-400"
            >
                <GripVertical size={16} />
            </div>

            <div onClick={onClick} className="cursor-pointer">
                <h4 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 pr-6">{ticket.title}</h4>
                <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                    <span className="bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded">#{ticket.id}</span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-400 hover:text-red-500 transition-all"
                        aria-label="Delete ticket"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TicketCard;
