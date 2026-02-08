import { describe, expect, test, mock, beforeAll, afterAll } from "bun:test";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { KanbanProvider } from "../src/context/KanbanContext";
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

describe("TicketDetail", () => {
    // Mock global fetch for context
    let originalFetch: typeof global.fetch;

    beforeAll(() => {
        originalFetch = global.fetch;
        global.fetch = mock(async (url, options: any) => {
            // Return success for updates
            if (options?.method === "PUT") {
                const body = JSON.parse(options.body);
                return new Response(JSON.stringify({ ...mockTicket, ...body }), { status: 200 });
            }
            return new Response(JSON.stringify([]));
        }) as any;
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    test("renders ticket details and allows inline editing", async () => {
        // We need a way to pass the ticket to the component or context.
        // Assuming TicketDetail takes a ticket prop and onClose prop
        const onClose = mock(() => { });

        render(
            <KanbanProvider>
                <TicketDetail ticket={mockTicket} onClose={onClose} />
            </KanbanProvider>
        );

        expect(screen.getByDisplayValue("Test Ticket")).toBeInTheDocument();

        // Simulate title edit
        const titleInput = screen.getByDisplayValue("Test Ticket");
        fireEvent.change(titleInput, { target: { value: "Updated Title" } });
        fireEvent.blur(titleInput); // Trigger save on blur

        await waitFor(() => {
            // Check if fetch was called (mock tracking would be ideal, but we can check if UI reflects fetch success if wired up)
            // Ideally we check if the input value persists or success message appears
            expect(screen.getByDisplayValue("Updated Title")).toBeInTheDocument();
        });
    });
});
