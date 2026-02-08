import { describe, expect, test, beforeAll } from "bun:test";
import { createDatabase } from "../src/db";
import { createFetchHandler } from "../src/server";

describe("Metadata API", () => {
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

    test("GET /api/metadata/statuses should return default statuses", async () => {
        const res = await request("/api/metadata/statuses");
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);
        expect(data.some((s: any) => s.name === "Todo")).toBe(true);
    });

    test("POST /api/metadata/types should add a new type", async () => {
        const payload = { name: "hotfix" };
        const res = await request("/api/metadata/types", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.name).toBe("hotfix");
    });

    test("POST /api/metadata/users should add a new user with email", async () => {
        const payload = { name: "Alice", email: "alice@example.com" };
        const res = await request("/api/metadata/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.name).toBe("Alice");
        expect(data.email).toBe("alice@example.com");
    });
});
