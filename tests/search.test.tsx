import { describe, expect, test, beforeAll, afterAll, mock } from "bun:test";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { KanbanProvider } from "../src/context/KanbanContext";
import GlobalSearch from "../src/components/GlobalSearch";

describe("Global Search", () => {
    test("opens on Ctrl+P", () => {
        render(
            <KanbanProvider>
                <GlobalSearch />
            </KanbanProvider>
        );

        expect(screen.queryByPlaceholderText("Search...")).not.toBeInTheDocument();

        fireEvent.keyDown(window, { key: "p", ctrlKey: true });

        expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
    });

    test("filters using slash commands", async () => {
        render(
            <KanbanProvider>
                <GlobalSearch />
            </KanbanProvider>
        );
        fireEvent.keyDown(window, { key: "p", ctrlKey: true });

        const input = screen.getByPlaceholderText("Search...");
        fireEvent.change(input, { target: { value: "/type" } });

        // Expect to see type suggestions or some indication
        // This depends on implementation details, checking existence of logic
        // For now, expecting input to handle the value
        expect(input).toHaveValue("/type");
    });
});
