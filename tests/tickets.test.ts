import { describe, expect, test, beforeAll } from "bun:test";
import { createDatabase } from "../src/db";
import { createFetchHandler } from "../src/server";

describe("Tickets API", () => {
    let db: any;
    let fetchHandler: (req: Request) => Promise<Response>;

    beforeAll(() => {
        db = createDatabase(":memory:");
        fetchHandler = createFetchHandler(db);
    });

    // Helper to make requests
    const request = async (path: string, options: RequestInit = {}) => {
        const req = new Request(`http://localhost${path}`, options);
        return fetchHandler(req);
    };

    test("GET /api/tickets should return empty list initially", async () => {
        const res = await request("/api/tickets");
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(0);
    });

    test("POST /api/tickets should create a new ticket", async () => {
        const payload = {
            title: "New Feature",
            description: "Implement login",
            status_id: 1,
            type_id: 1
        };
        const res = await request("/api/tickets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.id).toBeDefined();
        expect(data.title).toBe(payload.title);
    });

    test("PUT /api/tickets/:id should update a ticket", async () => {
        // Create a ticket first
        const createRes = await request("/api/tickets", {
            method: "POST",
            body: JSON.stringify({ title: "To Edit", status_id: 1 })
        });
        const ticket = await createRes.json();

        // Update it
        const updateRes = await request(`/api/tickets/${ticket.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "Edited Title" })
        });
        expect(updateRes.status).toBe(200);
        const updatedTicket = await updateRes.json();
        expect(updatedTicket.title).toBe("Edited Title");
    });

    test("DELETE /api/tickets/:id should delete a ticket", async () => {
        // Create a ticket
        const createRes = await request("/api/tickets", {
            method: "POST",
            body: JSON.stringify({ title: "To Delete", status_id: 1 })
        });
        const ticket = await createRes.json();

        // Delete it
        const deleteRes = await request(`/api/tickets/${ticket.id}`, {
            method: "DELETE"
        });
        expect(deleteRes.status).toBe(200);

        // Verify it's gone
        const getRes = await request(`/api/tickets/${ticket.id}`);
        expect(getRes.status).toBe(404);
    });
});
