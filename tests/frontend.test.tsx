import { describe, expect, test, mock, beforeAll, afterAll } from "bun:test";
import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import { KanbanProvider, useKanban } from "../src/context/KanbanContext";
import type { Ticket } from "../src/types";

// Helper component to consume context
const TestComponent = () => {
    const { tickets, addTicket, updateTicket } = useKanban();
    return (
        <div>
            <div data-testid="ticket-count">{tickets.length}</div>
            {tickets.map(t => (
                <div key={t.id} data-testid={`ticket-${t.id}`}>{t.title}</div>
            ))}
            <button onClick={() => addTicket({ title: "New Ticket", status_id: 1 })}>Add</button>
            <button onClick={() => updateTicket(1, { title: "Updated Ticket" })}>Update</button>
        </div>
    );
};

describe("KanbanContext", () => {
    // Mock global fetch
    let originalFetch: typeof global.fetch;

    beforeAll(() => {
        originalFetch = global.fetch;
        global.fetch = mock(async (url, options: any) => {
            const urlStr = url.toString();
            const method = options?.method || "GET";

            if (urlStr.endsWith("/api/tickets") && method === "POST") {
                return new Response(JSON.stringify({
                    id: 1,
                    title: "New Ticket",
                    status_id: 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    position: 0
                }), { status: 201 });
            }
            if (urlStr.match(/\/api\/tickets\/\d+/) && method === "PUT") {
                return new Response(JSON.stringify({
                    id: 1,
                    title: "Updated Ticket",
                    status_id: 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    position: 0
                }), { status: 200 });
            }
            // Return empty array for all other GET requests (tickets, metadata)
            return new Response(JSON.stringify([]), { status: 200 });
        }) as any;
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    test("provides initial state and updates tickets", async () => {
        render(
            <KanbanProvider>
                <TestComponent />
            </KanbanProvider>
        );

        // Initial count might be 0, but we should wait for any effects
        await waitFor(() => {
            expect(screen.getByTestId("ticket-count")).toBeInTheDocument();
        });

        // Add ticket
        const addButton = screen.getByText("Add");
        await act(async () => {
            addButton.click();
        });

        // Wait for update
        await waitFor(() => {
            expect(screen.getByTestId("ticket-count").textContent).toBe("1");
            expect(screen.getByTestId("ticket-1")).toBeDefined();
        }, { timeout: 3000 });

        // Update ticket
        const updateButton = screen.getByText("Update");
        await act(async () => {
            updateButton.click();
        });

        await waitFor(() => {
            expect(screen.getByTestId("ticket-1").textContent).toBe("Updated Ticket");
        });
    });
});
