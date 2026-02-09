import React, { useState, useMemo } from 'react';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, closestCorners } from '@dnd-kit/core';
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable'; // Not strictly needed for moving betwen columns but useful for reorder
import { useKanban } from '../context/KanbanContext';
import Column from './Column';
import TicketCard from './TicketCard';
import TicketDetail from './TicketDetail';
import ConfirmationModal from './ConfirmationModal';
import type { Ticket } from '../types';
import { LayoutGrid, Layers, Tag as TagIcon, Plus } from 'lucide-react';

type Grouping = 'status' | 'release' | 'type';

const Board: React.FC = () => {
    const { tickets, statuses, types, releases, updateTicket, addTicket, deleteTicket } = useKanban();
    const [grouping, setGrouping] = useState<Grouping>('status');
    const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | Partial<Ticket> | null>(null);
    const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);

    const handleCreateTicket = async () => {
        const defaultStatus = statuses[0]?.id;
        const defaultType = types[0]?.id;

        const draftTicket: Partial<Ticket> = {
            title: "New Ticket",
            description: "",
            status_id: defaultStatus || 1,
            type_id: defaultType,
        };

        setSelectedTicket(draftTicket as Ticket);
    };

    const confirmDeleteTicket = async () => {
        if (ticketToDelete) {
            await deleteTicket(ticketToDelete.id);
            setTicketToDelete(null);
            if (selectedTicket && selectedTicket.id === ticketToDelete.id) {
                setSelectedTicket(null);
            }
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    const columns = useMemo(() => {
        if (grouping === 'status') return statuses.map(s => ({ id: s.id.toString(), title: s.name, type: 'status' }));
        if (grouping === 'type') return types.map(t => ({ id: t.id.toString(), title: t.name, type: 'type' }));
        if (grouping === 'release') return releases.map(r => ({ id: r.id.toString(), title: r.name, type: 'release' }));
        return [];
    }, [grouping, statuses, types, releases]);

    const groupedTickets = useMemo(() => {
        const groups: Record<string, Ticket[]> = {};
        columns.forEach(c => groups[c.id] = []);

        tickets.forEach(t => {
            let key = '';
            if (grouping === 'status') key = t.status_id?.toString() || '0';
            if (grouping === 'type') key = t.type_id?.toString() || '0';
            if (grouping === 'release') key = t.release_id?.toString() || '0';

            if (groups[key]) {
                groups[key]?.push(t);
            } else {
                // Handling unassigned or not found keys if needed, for now ignoring or putting in first/default?
                // Or maybe create an "Unassigned" column dynamically?
            }
        });
        return groups;

    }, [tickets, columns, grouping]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveTicketId(Number(event.active.id));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTicketId(null);

        if (!over) return;

        const ticketId = Number(active.id);
        const overId = over.id; // Could be column ID or ticket ID

        // Find the destination column
        let destColumnId = overId.toString();

        // If dropped over a ticket, find that ticket's column
        // (Simplified logic: we assume over.id is column id for now if using container droppable, 
        // but SortableContext makes items droppable too. We need to check.)

        // In this implementation, Columns are Droppables. TicketCards are Sortables. 
        // If dropped on TicketCard, we need to map to its group.
        // However, our `Column` component wraps `SortableContext` around tickets.
        // `DndKit`'s `over` will be the sortable item if dropped on item.

        // Let's rely on finding which group the `over` item belongs to.
        const overTicket = tickets.find(t => t.id === Number(overId));
        if (overTicket) {
            if (grouping === 'status') destColumnId = overTicket.status_id?.toString() || '';
            if (grouping === 'type') destColumnId = overTicket.type_id?.toString() || '';
            if (grouping === 'release') destColumnId = overTicket.release_id?.toString() || '';
        }

        // Update ticket
        if (destColumnId) {
            const updates: Partial<Ticket> = {};
            if (grouping === 'status') updates.status_id = Number(destColumnId);
            if (grouping === 'type') updates.type_id = Number(destColumnId);
            if (grouping === 'release') updates.release_id = Number(destColumnId);

            updateTicket(ticketId, updates);
        }
    };

    const activeTicket = tickets.find(t => t.id === activeTicketId);

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold">Board</h2>
                    <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                        <button
                            onClick={() => setGrouping('status')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${grouping === 'status' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                        >
                            <LayoutGrid size={14} /> Status
                        </button>
                        <button
                            onClick={() => setGrouping('release')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${grouping === 'release' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                        >
                            <Layers size={14} /> Release
                        </button>
                        <button
                            onClick={() => setGrouping('type')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${grouping === 'type' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                        >
                            <TagIcon size={14} /> Type
                        </button>
                    </div>
                </div>
                <button
                    onClick={handleCreateTicket}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                >
                    <Plus size={16} /> New Ticket
                </button>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex h-full gap-6">
                        {columns.map(col => (
                            <Column
                                key={col.id}
                                id={col.id}
                                title={col.title}
                                tickets={groupedTickets[col.id] || []}
                                onTicketClick={setSelectedTicket}
                                onTicketDelete={setTicketToDelete}
                            />
                        ))}
                    </div>

                    <DragOverlay>
                        {activeTicket ? <TicketCard ticket={activeTicket} onClick={() => { }} onDelete={() => { }} /> : null}
                    </DragOverlay>
                </DndContext>
            </div>

            {selectedTicket && (
                <TicketDetail
                    ticket={selectedTicket}
                    onClose={() => setSelectedTicket(null)}
                />
            )}

            <ConfirmationModal
                isOpen={!!ticketToDelete}
                onClose={() => setTicketToDelete(null)}
                onConfirm={confirmDeleteTicket}
                title="Delete Ticket"
                message={`Are you sure you want to delete "${ticketToDelete?.title}"? This action cannot be undone.`}
                confirmText="Delete"
                isDestructive
            />
        </div>
    );
};

export default Board;
