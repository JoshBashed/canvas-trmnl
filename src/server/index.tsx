import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serveStatic } from "hono/serve-static";
import React from "react";
import { renderToString } from "react-dom/server";
import { createAppApiRoutes } from "@/server/api/index.ts";
import { createTrmnlRoutes } from "@/server/trmnl/index.ts";
import { ServerApp } from "@/shared/pages/App.tsx";
import { createLogger } from "@/shared/utilities/loggingUtilities.ts";
import { appEnv } from "@/server/appEnv.ts";

const logger = createLogger("@/server/index");

const main = async () => {
    // Get the static directory.
    const dirname = path.dirname(fileURLToPath(import.meta.url));
    const staticDir = path.join(dirname, "static");

    logger.info("Starting server...");
    const app = new Hono();

    app.get("/", async (c) => {
        return c.redirect("/app");
    });

    // Serve the app.
    app.get("/app/*", async (c) => {
        // Render the react app.
        const html = renderToString(
            <ServerApp pageName="App" url={c.req.path} />,
        );

        return c.html(html, {
            headers: {
                "Content-Type": "text/html",
            },
        });
    });

    // Serve static files
    app.get(
        "/static/*",
        serveStatic({
            getContent: async (pathData) => {
                const pathNormalized = path.normalize(pathData);
                const finalPath = path.resolve(
                    path.join(dirname, pathNormalized),
                );
                if (
                    !finalPath.startsWith(staticDir) ||
                    !fs.existsSync(finalPath)
                )
                    return null;
                return fsPromises.readFile(finalPath);
            },
            root: "/",
        }),
    );

    app.route("/trmnl", createTrmnlRoutes());
    app.route("/api", createAppApiRoutes());

    serve({
        fetch: app.fetch,
        port: appEnv.port,
    });

    logger.info(`Server started on http://127.0.0.1:${appEnv.port}/.`);
};

main();
