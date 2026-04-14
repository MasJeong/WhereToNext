"use client";

import { useEffect, useState } from "react";

import { buildApiUrl } from "@/lib/runtime/url";

type SessionPayload = {
  user: {
    id: string;
    name: string;
    email: string | null;
  };
};

type AuthResponse = {
  data?: SessionPayload;
  error?: {
    message?: string;
  };
};

type MutationResponse = {
  ok: boolean;
  status: number;
  payload: AuthResponse;
};

type AccountUpdateResponse = {
  data?: SessionPayload;
  error?: string;
  code?: string;
};

/**
 * 인증 세션을 조회하는 클라이언트 훅이다.
 * @returns 세션 데이터와 로딩 상태
 */
function useSession() {
  const [data, setData] = useState<SessionPayload | null>(null);
  const [error, setError] = useState<{ message?: string } | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const response = await fetch(buildApiUrl("/api/auth/session"), {
          cache: "no-store",
          credentials: "same-origin",
        });
        const payload = (await response.json()) as AuthResponse;

        if (cancelled) {
          return;
        }

        setData(payload.data ?? null);
        setError(payload.error ?? null);
      } catch {
        if (cancelled) {
          return;
        }

        setData(null);
        setError({ message: "세션을 확인하지 못했어요." });
      } finally {
        if (!cancelled) {
          setIsPending(false);
        }
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    data,
    error,
    isPending,
  };
}

export const authClient = {
  useSession,
  signOut: async () => {
    const response = await fetch(buildApiUrl("/api/auth/sign-out"), {
      method: "POST",
      credentials: "same-origin",
    });

    return {
      ok: response.ok,
      status: response.status,
      payload: (await response.json()) as AuthResponse,
    } satisfies MutationResponse;
  },
  deleteAccount: async () => {
    const response = await fetch(buildApiUrl("/api/me/account"), {
      method: "DELETE",
      credentials: "same-origin",
    });
    const payload = await response.json();

    return {
      ok: response.ok,
      status: response.status,
      payload,
    };
  },
  updateDisplayName: async (name: string) => {
    const response = await fetch(buildApiUrl("/api/me/account"), {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ name }),
    });

    return {
      ok: response.ok,
      status: response.status,
      payload: (await response.json()) as AccountUpdateResponse,
    };
  },
};
