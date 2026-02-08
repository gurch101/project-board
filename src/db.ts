import { Database } from "bun:sqlite";
import { join } from "path";
import { readFileSync } from "fs";

export function createDatabase(filename: string = "kanban.sqlite"): Database {
    const db = new Database(filename, { create: true });

    // Read schema and initialize tables
    // We assume schema.sql is in the same directory as this file (src/schema.sql)
    const schemaPath = join(import.meta.dir, "schema.sql");
    const schema = readFileSync(schemaPath, "utf-8");

    // Split schema by semicolons to execute statements individually
    const statements = schema
        .split(";")
        .map(s => s.trim())
        .filter(s => s.length > 0);

    for (const statement of statements) {
        db.run(statement);
    }

    return db;
}

const db = createDatabase();
export default db;
