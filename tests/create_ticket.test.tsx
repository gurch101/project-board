import { expect, test, describe, mock, beforeEach } from "bun:test";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import React from "react";
import Board from "../src/components/Board";
import { KanbanProvider } from "../src/context/KanbanContext";
import '@testing-library/jest-dom';

// Mock fetch
const mockFetch = mock() as unknown as typeof fetch;
global.fetch = mockFetch;

const mockTickets: any[] = [];
const mockStatuses = [{ id: 1, name: "Todo" }];
const mockTypes = [{ id: 1, name: "Task" }];
const mockReleases = [{ id: 1, name: "v1.0" }];
const mockUsers = [{ id: 1, name: "Alice" }];

describe("Create Ticket Flow", () => {
    beforeEach(() => {
        (mockFetch as any).mockReset();
        // Default mocks
        (mockFetch as any).mockImplementation(async (url: string, options: any) => {
            if (url.endsWith("/api/tickets") && options?.method === "POST") {
                const body = JSON.parse(options.body);
                return Response.json({ ...body, id: 123, created_at: new Date(), updated_at: new Date() });
            }
            if (url.endsWith("/api/tickets") && !options) return Response.json(mockTickets);
            if (url.includes("/metadata/statuses")) return Response.json(mockStatuses);
            if (url.includes("/metadata/types")) return Response.json(mockTypes);
            if (url.includes("/metadata/releases")) return Response.json(mockReleases);
            if (url.includes("/metadata/users")) return Response.json(mockUsers);
            if (url.includes("/audit-logs")) return Response.json([]);
            return Response.json({});
        });
    });

    test("full create ticket flow", async () => {
        render(
            <KanbanProvider>
                <Board />
            </KanbanProvider>
        );

        // Wait for initial load
        await waitFor(() => expect(screen.getByText("Board")).toBeInTheDocument());

        // Click New Ticket
        const newTicketBtn = screen.getByText("New Ticket");
        fireEvent.click(newTicketBtn);

        // Expect modal to be open (TicketDetail)
        const titleInput = await waitFor(() => screen.getByPlaceholderText("Ticket Title"));
        expect(titleInput).toBeInTheDocument();

        // Verify POST /api/tickets was NOT called yet
        const postCalls = (mockFetch as any).mock.calls.filter((call: any[]) =>
            call[0].endsWith("/api/tickets") && call[1]?.method === "POST"
        );
        expect(postCalls.length).toBe(0);

        // Fill in details
        fireEvent.change(titleInput, { target: { value: "Feature X" } });
        fireEvent.change(screen.getByPlaceholderText("Add a more detailed description..."), { target: { value: "Description of Feature X" } });

        // Find and click "Create Ticket" button
        const createBtn = screen.getByText("Create Ticket");
        expect(createBtn).toBeInTheDocument();
        fireEvent.click(createBtn);

        // Now verify POST was called
        await waitFor(() => {
            const postCallsAfter = (mockFetch as any).mock.calls.filter((call: any[]) =>
                call[0].endsWith("/api/tickets") && call[1]?.method === "POST"
            );
            expect(postCallsAfter.length).toBe(1);
            const call = postCallsAfter[0];
            const options = call[1];
            expect(options).toBeDefined();
            const body = JSON.parse(options.body);
            expect(body.title).toBe("Feature X");
            expect(body.description).toBe("Description of Feature X");
        });
    });
});
