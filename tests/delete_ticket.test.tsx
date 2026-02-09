import { describe, expect, test, mock, beforeAll, afterAll } from "bun:test";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { KanbanProvider } from "../src/context/KanbanContext";
import Board from "../src/components/Board";
import TicketDetail from "../src/components/TicketDetail";
import type { Ticket } from "../src/types";

// Mock ticket data
const mockTicket: Ticket = {
    id: 1,
    title: "Test Ticket",
    description: "Description",
    status_id: 1,
    type_id: 1,
    release_id: null,
    assigned_to_user_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    position: 0
};

describe("Delete Ticket Functionality", () => {
    let originalFetch: typeof global.fetch;

    beforeAll(() => {
        originalFetch = global.fetch;
        global.fetch = mock(async (url, options: any) => {
            const path = url.toString();

            // Mock GET /api/tickets
            if (path.endsWith("/api/tickets") && options?.method !== "POST") {
                return new Response(JSON.stringify([mockTicket]), { status: 200 });
            }

            // Mock DELETE /api/tickets/1
            if (path.endsWith("/api/tickets/1") && options?.method === "DELETE") {
                return new Response("Deleted", { status: 200 });
            }

            // Mock Metadata endpoints
            if (path.includes("/api/metadata")) {
                return new Response(JSON.stringify([{ id: 1, name: "Status 1" }]), { status: 200 });
            }

            return new Response(JSON.stringify([]));
        }) as any;
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    test("Mock delete ticket from Board view", async () => {
        render(
            <KanbanProvider>
                <Board />
            </KanbanProvider>
        );

        // Wait for ticket to load
        await waitFor(() => {
            expect(screen.getByText("Test Ticket")).toBeInTheDocument();
        });

        // Find the specific delete button for this ticket
        // Since the delete button is hidden until hover/group-hover and screen.getByRole might be tricky with multiple cards,
        // we can find the button by label.
        const deleteButtons = screen.getAllByLabelText("Delete ticket");
        const deleteButton = deleteButtons[0];
        if (!deleteButton) throw new Error("Delete button not found");

        // Click delete
        fireEvent.click(deleteButton);

        // Expect confirmation modal
        await waitFor(() => {
            expect(screen.getByText("Delete Ticket")).toBeInTheDocument();
            expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
        });

        // Click Confirm
        const confirmButton = screen.getByText("Delete", { selector: "button" });
        fireEvent.click(confirmButton);

        // Wait for removal
        await waitFor(() => {
            expect(screen.queryByText("Test Ticket")).not.toBeInTheDocument();
        });
    });

    test("Mock delete ticket from TicketDetail view", async () => {
        const onClose = mock(() => { });
        render(
            <KanbanProvider>
                <TicketDetail ticket={mockTicket} onClose={onClose} />
            </KanbanProvider>
        );

        // Click Delete Ticket button
        // The button has "Delete Ticket" text.
        const deleteTrigger = screen.getByRole('button', { name: "Delete Ticket" });
        fireEvent.click(deleteTrigger);

        // Expect confirmation modal
        await waitFor(() => {
            // Modal title
            expect(screen.getByRole('heading', { name: "Delete Ticket" })).toBeInTheDocument();
            expect(screen.getByText(/Are you sure/)).toBeInTheDocument();
        });

        // Click Confirm
        // The modal confirm button has text "Delete"
        const confirmButton = screen.getByRole('button', { name: "Delete" });
        fireEvent.click(confirmButton);

        // Wait for close to be called
        await waitFor(() => {
            expect(onClose).toHaveBeenCalled();
        });
    });
});
