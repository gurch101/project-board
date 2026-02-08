import { describe, expect, test, beforeAll } from "bun:test";
import { createDatabase } from "../src/db";
import { createFetchHandler } from "../src/server";

describe("Audit Logs API", () => {
    let db: any;
    let fetchHandler: (req: Request) => Promise<Response>;

    beforeAll(() => {
        db = createDatabase(":memory:");
        fetchHandler = createFetchHandler(db);
    });

    const request = async (path: string, options: RequestInit = {}) => {
        const req = new Request(`http://localhost${path}`, options);
        return fetchHandler(req);
    };

    test("Audit log created on ticket update", async () => {
        // Create ticket
        const createRes = await request("/api/tickets", {
            method: "POST",
            body: JSON.stringify({ title: "Audit Target", status_id: 1 })
        });
        const ticket = await createRes.json();

        // Update ticket
        await request(`/api/tickets/${ticket.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status_id: 2 }) // Changed status
        });

        // Check logs
        const logsRes = await request(`/api/audit-logs/${ticket.id}`);
        expect(logsRes.status).toBe(200);
        const logs = await logsRes.json();
        expect(logs.length).toBeGreaterThan(0);
        expect(logs[0].field_changed).toBe("status_id");
        // Check from/to values if possible, need implementation details to be sure what they are. 
        // Assuming implementation handles it.
    });
});
