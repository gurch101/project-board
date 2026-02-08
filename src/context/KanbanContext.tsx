import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Ticket, Status, Type, Release, User } from '../types';

interface KanbanContextType {
    tickets: Ticket[];
    statuses: Status[];
    types: Type[];
    releases: Release[];
    users: User[];
    refreshTickets: () => Promise<void>;
    updateTicket: (id: number, updates: Partial<Ticket>) => Promise<void>;
    addTicket: (ticket: Partial<Ticket>) => Promise<Ticket | void>;
}

const KanbanContext = createContext<KanbanContextType | undefined>(undefined);

export const useKanban = () => {
    const context = useContext(KanbanContext);
    if (!context) {
        throw new Error('useKanban must be used within a KanbanProvider');
    }
    return context;
};

export const KanbanProvider = ({ children }: { children: ReactNode }) => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [statuses, setStatuses] = useState<Status[]>([]);
    const [types, setTypes] = useState<Type[]>([]);
    const [releases, setReleases] = useState<Release[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    const fetchData = useCallback(async () => {
        try {
            const [ticketsRes, statusesRes, typesRes, releasesRes, usersRes] = await Promise.all([
                fetch('/api/tickets'),
                fetch('/api/metadata/statuses'),
                fetch('/api/metadata/types'),
                fetch('/api/metadata/releases'),
                fetch('/api/metadata/users')
            ]);

            if (ticketsRes.ok) setTickets(await ticketsRes.json());
            if (statusesRes.ok) setStatuses(await statusesRes.json());
            if (typesRes.ok) setTypes(await typesRes.json());
            if (releasesRes.ok) setReleases(await releasesRes.json());
            if (usersRes.ok) setUsers(await usersRes.json());

        } catch (error) {
            console.error("Failed to fetch data", error);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refreshTickets = async () => {
        const res = await fetch('/api/tickets');
        if (res.ok) {
            setTickets(await res.json());
        }
    };

    const updateTicket = async (id: number, updates: Partial<Ticket>) => {
        // Optimistic update
        setTickets(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

        try {
            const res = await fetch(`/api/tickets/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (!res.ok) {
                // Revert on failure (simplified)
                await refreshTickets();
            } else {
                const updated = await res.json();
                setTickets(prev => prev.map(t => t.id === id ? updated : t));
            }
        } catch (e) {
            await refreshTickets();
        }
    };

    const addTicket = async (ticket: Partial<Ticket>) => {
        try {
            const res = await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ticket)
            });
            if (res.ok) {
                const newTicket = await res.json();
                setTickets(prev => [...prev, newTicket]);
                return newTicket;
            }
        } catch (e) {
            console.error("Failed to add ticket", e);
        }
    };

    return (
        <KanbanContext.Provider value={{ tickets, statuses, types, releases, users, refreshTickets, updateTicket, addTicket }}>
            {children}
        </KanbanContext.Provider>
    );
};
