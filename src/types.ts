export interface Ticket {
    id: number;
    title: string;
    description: string | null;
    status_id: number | null;
    type_id: number | null;
    release_id: number | null;
    assigned_to_user_id: number | null;
    created_at: string;
    updated_at: string;
    position: number;
}

export interface Status {
    id: number;
    name: string;
    position: number;
}

export interface Type {
    id: number;
    name: string;
}

export interface Release {
    id: number;
    name: string;
}

export interface User {
    id: number;
    name: string;
    email: string | null;
    avatar_url: string | null;
}

export interface AuditLog {
    id: number;
    ticket_id: number;
    field_changed: string;
    from_value: string | null;
    to_value: string | null;
    changed_at: string;
}
