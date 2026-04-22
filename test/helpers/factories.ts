export function fakeUser(params: Partial<{ id: string; role: string; email: string; name: string }> = {}) {
  return {
    id: params.id ?? "user-1",
    role: params.role ?? "common",
    email: params.email ?? "user@example.com",
    name: params.name ?? "Test User",
  };
}

