import { useState } from "react";
import { useSession } from "next-auth/react";
import { ProxyRequestBody, ProxyResponseBody } from '../types/proxyTypes';
import { useToast } from "./useToast";

export function useProxy() {
    const { data: session } = useSession();
    const { addToast } = useToast();
    const [data, setData] = useState<ProxyResponseBody | null>(null);
    const [loading, setLoading] = useState(false);

    const callProxy = async (requests: ProxyRequestBody) => {
        setLoading(true);

        try {
            const headers: HeadersInit = { "Content-Type": "application/json" };
            if (session?.accessToken) {
                headers["Authorization"] = `Bearer ${session.accessToken}`;
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_GATEWAY_BASE_URL || "http://localhost:8080"}/api/gateway/proxy`, {
                method: "POST",
                headers,
                body: JSON.stringify(requests),
            });

            if (!res.ok) {
                addToast({ message: `Erreur proxy globale: ${res.status}`, type: "error" });
                setLoading(false);
                return;
            }

            const json: ProxyResponseBody = await res.json();
            setData(json);

            const errors = Object.entries(json)
                .filter(([_, v]) => !v.success)
                .map(([key, v]) => {
                    const errMsg = v.error ? v.error : "Erreur inconnue";
                    const errStr = typeof errMsg === "object" ? JSON.stringify(errMsg) : errMsg;
                    return `${key}: ${errStr}`;
                });

            if (errors.length > 0) {
                addToast({ message: errors.join("\n"), type: "error" });
            }
        } catch (err: any) {
            console.error(err);
            addToast({ message: "Erreur réseau proxy", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    return { data, loading, callProxy };
}
