import { Database } from "bun:sqlite";

export function createFetchHandler(db: Database) {
    return async (req: Request): Promise<Response> => {
        const url = new URL(req.url);
        const path = url.pathname;
        const method = req.method;

        // Middleware to parse JSON body safely
        const json = async () => {
            try {
                return await req.json();
            } catch (e) {
                return null;
            }
        };

        // --- Tickets API ---

        // GET /api/tickets
        if (path === "/api/tickets" && method === "GET") {
            const stmt = db.prepare("SELECT * FROM tickets ORDER BY position ASC, created_at DESC");
            const tickets = stmt.all();
            return Response.json(tickets);
        }

        // POST /api/tickets
        if (path === "/api/tickets" && method === "POST") {
            const body = await json();
            if (!body || !body.title) {
                return new Response("Missing title", { status: 400 });
            }

            const stmt = db.prepare(`
                INSERT INTO tickets (title, description, status_id, type_id, release_id, assigned_to_user_id)
                VALUES ($title, $description, $status_id, $type_id, $release_id, $assigned_to_user_id)
                RETURNING *
            `);

            try {
                const ticket = stmt.get({
                    $title: body.title,
                    $description: body.description || null,
                    $status_id: body.status_id || null,
                    $type_id: body.type_id || null,
                    $release_id: body.release_id || null,
                    $assigned_to_user_id: body.assigned_to_user_id || null
                });
                return Response.json(ticket, { status: 201 });
            } catch (e) {
                return new Response(String(e), { status: 500 });
            }
        }

        // PUT /api/tickets/:id
        if (path.match(/^\/api\/tickets\/\d+$/) && method === "PUT") {
            const id = path.split("/").pop();
            const body = await json();
            if (!body) return new Response("Invalid JSON", { status: 400 });

            const currentTicket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(id as string) as any;
            if (!currentTicket) return new Response("Ticket not found", { status: 404 });

            // Audit Logging & Dynamic Update
            const fields = Object.keys(body).filter(k =>
                ['title', 'description', 'status_id', 'type_id', 'release_id', 'assigned_to_user_id', 'position'].includes(k)
            );

            if (fields.length === 0) return Response.json(currentTicket);

            const updates = fields.map(f => `${f} = $${f}`).join(", ");
            const params: any = { $id: id };
            const auditLogs: any[] = [];

            fields.forEach(f => {
                params[`$${f}`] = body[f];
                if (String(currentTicket[f]) !== String(body[f])) { // Simple string comparison for changes
                    auditLogs.push({
                        $ticket_id: id,
                        $field_changed: f,
                        $from_value: String(currentTicket[f] || ""),
                        $to_value: String(body[f] || "")
                    });
                }
            });

            // Update updated_at
            const updateStmt = db.prepare(`UPDATE tickets SET ${updates}, updated_at = CURRENT_TIMESTAMP WHERE id = $id RETURNING *`);

            const transaction = db.transaction(() => {
                const updatedTicket = updateStmt.get(params);
                const logStmt = db.prepare(`
                    INSERT INTO audit_logs (ticket_id, field_changed, from_value, to_value)
                    VALUES ($ticket_id, $field_changed, $from_value, $to_value)
                `);
                for (const log of auditLogs) {
                    logStmt.run(log);
                }
                return updatedTicket;
            });

            const result = transaction();
            return Response.json(result);
        }

        // DELETE /api/tickets/:id
        if (path.match(/^\/api\/tickets\/\d+$/) && method === "DELETE") {
            const id = path.split("/").pop();
            const stmt = db.prepare("DELETE FROM tickets WHERE id = ?");
            const result = stmt.run(id as string);
            if (result.changes === 0) return new Response("Ticket not found", { status: 404 });
            return new Response("Deleted", { status: 200 });
        }


        // --- Metadata API ---
        const metaMatch = path.match(/^\/api\/metadata\/(\w+)$/);
        if (metaMatch) {
            const type = metaMatch[1];
            // Safe-list tables to query
            const validTables = ["statuses", "types", "releases", "users"];
            if (!type || !validTables.includes(type)) return new Response("Invalid metadata type", { status: 400 });

            if (method === "GET") {
                const stmt = db.prepare(`SELECT * FROM ${type}`);
                return Response.json(stmt.all());
            }

            if (method === "POST") {
                const body = await json();
                if (!body || !body.name) return new Response("Missing name", { status: 400 });

                try {
                    let stmt;
                    if (type === 'users') {
                        stmt = db.prepare(`INSERT INTO users (name, email, avatar_url) VALUES ($name, $email, $avatar_url) RETURNING *`);
                        const result = stmt.get({
                            $name: body.name,
                            $email: body.email || null,
                            $avatar_url: body.avatar_url || null
                        });
                        return Response.json(result, { status: 201 });
                    } else {
                        stmt = db.prepare(`INSERT INTO ${type} (name) VALUES ($name) RETURNING *`);
                        const result = stmt.get({ $name: body.name });
                        return Response.json(result, { status: 201 });
                    }
                } catch (e) {
                    return new Response(String(e), { status: 400 }); // Likely constraint violation
                }
            }
        }

        // --- Audit Logs API ---
        // GET /api/audit-logs/:ticketId
        const auditMatch = path.match(/^\/api\/audit-logs\/(\d+)$/);
        if (auditMatch && method === "GET") {
            const ticketId = auditMatch[1];
            const stmt = db.prepare("SELECT * FROM audit_logs WHERE ticket_id = ? ORDER BY changed_at DESC");
            return Response.json(stmt.all(ticketId as string));
        }

        return new Response("Not Found", { status: 404 });
    };
}
