"use client";

import { useEffect, useState } from "react";

type SessionPayload = {
  user: {
    id: string;
    name: string;
    email: string;
  };
};

type AuthResponse = {
  data?: SessionPayload;
  error?: {
    message?: string;
  };
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
        const response = await fetch("/api/auth/session", { cache: "no-store" });
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
  signIn: {
    email: async (input: { email: string; password: string }) => {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });

      return (await response.json()) as AuthResponse;
    },
  },
  signUp: {
    email: async (input: { name: string; email: string; password: string }) => {
      const response = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });

      return (await response.json()) as AuthResponse;
    },
  },
  signOut: async () => {
    const response = await fetch("/api/auth/sign-out", {
      method: "POST",
    });

    return (await response.json()) as AuthResponse;
  },
};
