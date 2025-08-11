"use strict";

import http from "http";
import { readFile, writeFile } from "fs/promises";
import { join, extname } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_FILE = join(__dirname, "workouts.json");

function getMimeType(filePath) {
    const ext = extname(filePath).toLowerCase();
    return {
        ".html": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".ico": "image/x-icon"
    }[ext] || "application/octet-stream";
}

async function handleApi(req, res) {
    if (req.url === "/api/workouts" && req.method === "GET") {
        try {
            const data = await readFile(DB_FILE, "utf8");
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(data);
        } catch {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end("[]");
        }
        return true;
    }

    if (req.url === "/api/workouts" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => body += chunk);
        req.on("end", async () => {
            try {
                const workout = JSON.parse(body);
                let data = [];
                try {
                    data = JSON.parse(await readFile(DB_FILE, "utf8"));
                } catch { }
                data.push(workout);
                await writeFile(DB_FILE, JSON.stringify(data, null, 2));
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ status: "ok" }));
            } catch {
                res.writeHead(400);
                res.end("Invalid JSON");
            }
        });
        return true;
    }

    return false;
}

const server = http.createServer(async (req, res) => {
    // API routes
    if (req.url.startsWith("/api/")) {
        const handled = await handleApi(req, res);
        if (handled) return;
    }

    // Static file serving
    let filePath = req.url === "/" ? "index.html" : req.url.slice(1);
    filePath = join(__dirname, filePath);
    try {
        const data = await readFile(filePath);
        res.writeHead(200, { "Content-Type": getMimeType(filePath) });
        res.end(data);
    } catch {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
    }
});

server.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
