import { describe, expect, test, beforeAll, afterAll, mock } from "bun:test";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { KanbanProvider } from "../src/context/KanbanContext";
import TimelineView from "../src/components/TimelineView";
import type { Ticket } from "../src/types";

const mockTickets: Ticket[] = [
    { id: 1, title: "Old Ticket", updated_at: "2023-01-01T00:00:00Z", created_at: "", description: "", status_id: 1, type_id: 1, release_id: 1, assigned_to_user_id: null, position: 0 },
    { id: 2, title: "New Ticket", updated_at: "2024-01-01T00:00:00Z", created_at: "", description: "", status_id: 1, type_id: 1, release_id: 1, assigned_to_user_id: null, position: 0 },
];

describe("Timeline View", () => {
    let originalFetch: typeof global.fetch;

    beforeAll(() => {
        originalFetch = global.fetch;
        global.fetch = mock(async (url) => {
            return new Response(JSON.stringify(mockTickets));
        }) as any;
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    test("renders tickets in descending order of updated_at", async () => {
        render(
            <KanbanProvider>
                <TimelineView />
            </KanbanProvider>
        );

        await waitFor(() => {
            const items = screen.getAllByTestId("timeline-item");
            expect(items.length).toBe(2);
            expect(items[0]).toHaveTextContent("New Ticket");
            expect(items[1]).toHaveTextContent("Old Ticket");
        });
    });
});
