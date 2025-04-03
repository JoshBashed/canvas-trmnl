import { LoadingIcon } from "@/shared/components/LoadingIcon.tsx";
import { preformUpdateCanvasData } from "@/shared/utilities/apiClient.ts";
import React, { useState, type FC } from "react";
import { useParams } from "react-router";

export const Manage: FC = () => {
    const [canvasServer, setCanvasServer] = useState("");
    const [canvasToken, setCanvasToken] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [trmnlSettingsId, setTrmnlSettingsId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const params = useParams();

    return (
        <div className="min-h-screen bg-radial-[circle_at_bottom] bg-zinc-950 from-indigo-800 to-80% p-8 text-white md:p-16">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
                <div className="flex flex-col gap-2">
                    <h1 className="font-bold font-display text-4xl tracking-tight">
                        manage plugin
                    </h1>
                    <p className="text-sm text-zinc-400">
                        update your canvas connection settings.
                    </p>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="canvas-server"
                            className="text-sm text-zinc-400"
                        >
                            canvas server domain
                        </label>
                        <input
                            type="text"
                            id="canvas-server"
                            placeholder="canvas.instructure.com"
                            disabled={isLoading}
                            value={canvasServer}
                            onChange={(e) => setCanvasServer(e.target.value)}
                            className="rounded border border-zinc-700 bg-zinc-900 px-4 py-2 text-white placeholder-zinc-500 transition disabled:bg-zinc-800/50"
                        />
                    </div>

                    {canvasServer !== "" && (
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="canvas-token"
                                className="text-sm text-zinc-400"
                            >
                                canvas token
                            </label>
                            <input
                                type="text"
                                id="canvas-token"
                                placeholder="your_canvas_token"
                                disabled={isLoading}
                                value={canvasToken}
                                onChange={(e) => setCanvasToken(e.target.value)}
                                className="rounded border border-zinc-700 bg-zinc-900 px-4 py-2 text-white placeholder-zinc-500 transition disabled:bg-zinc-800/50"
                            />
                            <p className="text-sm text-zinc-400">
                                find your token{" "}
                                <a
                                    href={`https://${canvasServer}/profile/settings`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline"
                                >
                                    here
                                </a>
                                . then select <b>New Access Token</b>.{" "}
                                <span className="text-red-500">
                                    do not share your token with anyone.
                                </span>
                            </p>
                        </div>
                    )}

                    {success && (
                        <div className="text-right text-green-500 text-sm">
                            settings updated successfully.
                        </div>
                    )}
                    {error && (
                        <div className="text-right text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-2">
                        {trmnlSettingsId && (
                            <button
                                type="button"
                                className="cursor-pointer rounded-full px-6 py-2 font-semibold text-zinc-50 transition hover:underline disabled:cursor-not-allowed disabled:bg-zinc-300"
                                onClick={() => {
                                    window.open(
                                        `https://usetrmnl.com/plugin_settings/${encodeURIComponent(trmnlSettingsId)}/edit`,
                                        "_self",
                                    );
                                }}
                            >
                                return to trmnl
                            </button>
                        )}
                        {isLoading && <LoadingIcon />}
                        <button
                            type="button"
                            className="cursor-pointer rounded-full bg-white px-6 py-2 font-semibold text-black transition hover:underline disabled:cursor-not-allowed disabled:bg-zinc-300"
                            disabled={isLoading}
                            onClick={async () => {
                                if (isLoading) return;
                                setIsLoading(true);
                                setError(null);
                                setSuccess(false);

                                let url: URL;
                                try {
                                    url = new URL(`https://${canvasServer}`);
                                } catch {
                                    setIsLoading(false);
                                    setError("invalid canvas server domain.");
                                    return;
                                }

                                const [success, data] =
                                    await preformUpdateCanvasData({
                                        canvasServer: url.toString(),
                                        canvasAccessToken: canvasToken,
                                        trmnlId: params.id ?? "",
                                    });
                                setIsLoading(false);
                                if (!success) {
                                    setError(`request failed: ${data}.`);
                                    return;
                                }
                                if (data.type === "globalError") {
                                    setError(
                                        `request failed (api error): ${data.error}.`,
                                    );
                                    return;
                                }
                                if (data.type === "error") {
                                    setError(
                                        `request failed (procedure error): ${data.error}.`,
                                    );
                                    return;
                                }
                                if (data.type === "success") {
                                    setSuccess(true);
                                    setTrmnlSettingsId(
                                        data.trmnlSettingsId.toString(),
                                    );
                                    return;
                                }
                            }}
                        >
                            save settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
