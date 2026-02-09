import React, { useState, useEffect } from 'react';
import type { Ticket, Status, Type, User, Release, AuditLog } from '../types';
import { useKanban } from '../context/KanbanContext';
import { X, Calendar, Tag, User as UserIcon, Activity, Trash } from 'lucide-react';
import { format } from 'date-fns';
import ConfirmationModal from './ConfirmationModal';

interface TicketDetailProps {
    ticket: Ticket | Partial<Ticket>;
    onClose: () => void;
}

const TicketDetail: React.FC<TicketDetailProps> = ({ ticket: initialTicket, onClose }) => {
    const { updateTicket, addTicket, deleteTicket, statuses, types, releases, users } = useKanban();
    const [ticket, setTicket] = useState<Partial<Ticket>>(initialTicket);
    const [title, setTitle] = useState(initialTicket.title || "");
    const [description, setDescription] = useState(initialTicket.description || "");
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // If ticket has an ID, it's an existing ticket. Otherwise, it's new.
    const isNew = !ticket.id;

    useEffect(() => {
        if (!isNew && ticket.id) {
            // Fetch audit logs for existing ticket
            fetch(`/api/audit-logs/${ticket.id}`)
                .then(res => res.json())
                .then(data => setAuditLogs(data))
                .catch(err => console.error("Failed to fetch audit logs", err));
        }
    }, [ticket.id, isNew]);

    const handleSave = () => {
        if (isNew) return; // Don't auto-save new tickets
        if (ticket.id && (title !== ticket.title || description !== (ticket.description || ""))) {
            updateTicket(ticket.id, { title, description });
        }
    };

    const handleCreate = async () => {
        if (!title.trim()) return; // Validation

        const newTicket = await addTicket({
            ...ticket,
            title,
            description
        });

        if (newTicket) {
            setTicket(newTicket); // Switch to "existing" mode
            // Alternatively, we could close the modal: onClose();
            // But usually it's nice to keep it open to add more details? 
            // The user said "add the ticket to the board", implying it's done.
            // Let's close it to be safe and simple, matching the test expectation "click Create -> ticket added".
            onClose();
        }
    };

    const handleMetadataChange = (field: keyof Ticket, value: any) => {
        if (isNew) {
            // Update local state only
            setTicket(prev => ({ ...prev, [field]: value }));
        } else if (ticket.id) {
            updateTicket(ticket.id, { [field]: value });
            setTicket(prev => ({ ...prev, [field]: value })); // Optimistic local update for UI
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800">
                {/* Header */}
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-start bg-zinc-50 dark:bg-zinc-900/50">
                    <input
                        className="text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 w-full mr-8 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleSave}
                        placeholder="Ticket Title"
                    />
                    <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                        <X size={20} className="text-zinc-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-auto flex flex-col md:flex-row">
                    {/* Main Content */}
                    <div className="flex-1 p-6 space-y-8">
                        <div>
                            <h3 className="text-sm font-medium text-zinc-500 mb-2 uppercase tracking-wider">Description</h3>
                            <textarea
                                className="w-full min-h-[150px] bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-zinc-700 dark:text-zinc-300"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                onBlur={handleSave}
                                placeholder="Add a more detailed description..."
                            />
                        </div>

                        {/* Audit Log (Hide if new) */}
                        {!isNew && (
                            <div>
                                <div className="flex items-center gap-2 mb-4 text-zinc-500">
                                    <Activity size={16} />
                                    <h3 className="text-sm font-medium uppercase tracking-wider">Activity</h3>
                                </div>
                                <div className="space-y-4">
                                    {auditLogs.length === 0 ? (
                                        <p className="text-sm text-zinc-400 italic">No activity yet.</p>
                                    ) : (
                                        auditLogs.map(log => (
                                            <div key={log.id} className="text-sm text-zinc-600 dark:text-zinc-400 flex gap-2 items-start">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                                <div>
                                                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{log.field_changed}</span> changed
                                                    from <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">{log.from_value || 'empty'}</span>
                                                    to <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">{log.to_value || 'empty'}</span>
                                                    <div className="text-xs text-zinc-400 mt-1">
                                                        {format(new Date(log.changed_at), "MMM d, yyyy 'at' h:mm a")}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="w-full md:w-80 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-6 space-y-6 flex flex-col">

                        {/* Status */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-zinc-500 uppercase">Status</label>
                            <select
                                className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={ticket.status_id || ""}
                                onChange={(e) => handleMetadataChange('status_id', Number(e.target.value))}
                            >
                                {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        {/* Type */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-zinc-500 uppercase">Type</label>
                            <div className="flex items-center gap-2">
                                <Tag size={16} className="text-zinc-400" />
                                <select
                                    className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={ticket.type_id || ""}
                                    onChange={(e) => handleMetadataChange('type_id', Number(e.target.value))}
                                >
                                    <option value="">None</option>
                                    {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Release */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-zinc-500 uppercase">Release</label>
                            <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-zinc-400" />
                                <select
                                    className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={ticket.release_id || ""}
                                    onChange={(e) => handleMetadataChange('release_id', Number(e.target.value))}
                                >
                                    <option value="">None</option>
                                    {releases.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Assignee */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-zinc-500 uppercase">Assignee</label>
                            <div className="flex items-center gap-2">
                                <UserIcon size={16} className="text-zinc-400" />
                                <select
                                    className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={ticket.assigned_to_user_id || ""}
                                    onChange={(e) => handleMetadataChange('assigned_to_user_id', Number(e.target.value))}
                                >
                                    <option value="">Unassigned</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                        </div>

                        {isNew ? (
                            <div className="pt-6 mt-auto">
                                <button
                                    onClick={handleCreate}
                                    disabled={!title.trim()}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Create Ticket
                                </button>
                            </div>
                        ) : (
                            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 mt-auto space-y-4">
                                <button
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors bg-transparent border border-red-200 dark:border-red-900/30"
                                >
                                    <Trash size={16} />
                                    Delete Ticket
                                </button>

                                <div className="text-xs text-zinc-400">
                                    <p>Created {format(new Date(ticket.created_at || new Date()), "MMM d, yyyy")}</p>
                                    <p>Updated {format(new Date(ticket.updated_at || new Date()), "MMM d, yyyy")}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={async () => {
                    if (ticket.id) {
                        await deleteTicket(ticket.id);
                        onClose();
                    }
                }}
                title="Delete Ticket"
                message={`Are you sure you want to delete "${ticket.title}"? This action cannot be undone.`}
                confirmText="Delete"
                isDestructive
            />
        </div>
    );
};

export default TicketDetail;
