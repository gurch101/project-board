import { describe, expect, test, beforeAll, afterAll, mock } from "bun:test";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { KanbanProvider } from "../src/context/KanbanContext";
import Board from "../src/components/Board";
import type { Ticket } from "../src/types";

const mockTickets: Ticket[] = [
    { id: 1, title: "Feature 1", status_id: 1, type_id: 1, release_id: 1, position: 0, description: "", assigned_to_user_id: null, created_at: "", updated_at: "" },
    { id: 2, title: "Bug 1", status_id: 2, type_id: 2, release_id: 2, position: 0, description: "", assigned_to_user_id: null, created_at: "", updated_at: "" },
];

const mockStatuses = [{ id: 1, name: "Todo", position: 1 }, { id: 2, name: "Done", position: 2 }];
const mockTypes = [{ id: 1, name: "Feat" }, { id: 2, name: "Bug" }];
const mockReleases = [{ id: 1, name: "R1" }, { id: 2, name: "R2" }];

describe("Board Grouping", () => {
    let originalFetch: typeof global.fetch;

    beforeAll(() => {
        originalFetch = global.fetch;
        global.fetch = mock(async (url) => {
            const urlStr = url.toString();
            if (urlStr.endsWith("/api/tickets")) return new Response(JSON.stringify(mockTickets));
            if (urlStr.endsWith("/api/metadata/statuses")) return new Response(JSON.stringify(mockStatuses));
            if (urlStr.endsWith("/api/metadata/types")) return new Response(JSON.stringify(mockTypes));
            if (urlStr.endsWith("/api/metadata/releases")) return new Response(JSON.stringify(mockReleases));
            return new Response(JSON.stringify([]));
        }) as any;
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    test("groups by status by default", async () => {
        render(
            <KanbanProvider>
                <Board />
            </KanbanProvider>
        );

        await waitFor(() => {
            expect(screen.getByText("Todo")).toBeInTheDocument();
            expect(screen.getByText("Done")).toBeInTheDocument();
            expect(screen.getByText("Feature 1")).toBeInTheDocument();
        });
    });

    // Note: To test switching grouping, we'd need to simulate the UI interaction to change grouping
    // or expose a prop on Board to set initial grouping. Assuming a prop `groupBy` for testability 
    // or a control within Board we can click.
});
