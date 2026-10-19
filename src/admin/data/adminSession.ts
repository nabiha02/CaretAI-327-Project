export type DemoAdminSession = {
  version: 1;
  name: string;
  email: string;
  role: "admin";
  sessionActive: true;
};

const adminStorageKey = "caretai-demo-admin";

export function startDemoAdminSession(): DemoAdminSession {
  const session: DemoAdminSession = {
    version: 1,
    name: "Farzana Ahmed",
    email: "admin.demo@caretai.local",
    role: "admin",
    sessionActive: true,
  };
  window.sessionStorage.setItem(adminStorageKey, JSON.stringify(session));
  return session;
}

export function getDemoAdminSession(): DemoAdminSession | null {
  try {
    const stored = JSON.parse(
      window.sessionStorage.getItem(adminStorageKey) ?? "null",
    ) as Partial<DemoAdminSession> | null;
    if (
      stored?.version !== 1 ||
      stored.role !== "admin" ||
      stored.sessionActive !== true ||
      typeof stored.name !== "string" ||
      typeof stored.email !== "string"
    ) {
      return null;
    }
    return stored as DemoAdminSession;
  } catch {
    return null;
  }
}

export function clearDemoAdminSession() {
  window.sessionStorage.removeItem(adminStorageKey);
}
