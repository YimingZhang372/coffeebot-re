import { createContext, useContext, useState } from "react";

const KEY = "cbre_session_v1";
const Ctx = createContext(null);

export function SessionProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "null");
    } catch {
      return null;
    }
  });

  const signIn = (payload) => {
    const next = { ...payload, signedInAt: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(next));
    setSession(next);
    return next;
  };

  const signOut = () => {
    localStorage.removeItem(KEY);
    setSession(null);
  };

  return <Ctx.Provider value={{ session, signIn, signOut }}>{children}</Ctx.Provider>;
}

export function useSession() {
  return useContext(Ctx) || { session: null, signIn: () => {}, signOut: () => {} };
}