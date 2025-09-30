import { NextRequest } from "next/server";
import { vi } from "vitest";

import { GET, POST } from "../route";

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn()
}));

import { createClient } from "@/utils/supabase/server";

const mockedCreateClient = vi.mocked(createClient);

type SubmissionWindowRow = {
  is_open: boolean;
  updated_at: string | null;
  updated_by: string | null;
};

type SupabaseOptions = {
  user?: { id: string } | null;
  roleName?: string | null;
  submissionWindow?: SubmissionWindowRow;
};

const buildSupabaseStub = ({
  user = null,
  roleName = null,
  submissionWindow = { is_open: false, updated_at: null, updated_by: null }
}: SupabaseOptions = {}) => {
  const submissionWindowQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: submissionWindow, error: null }),
    update: vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({ error: null })
    }))
  };

  const userProfilesQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data:
        roleName === null
          ? null
          : {
              userid: user?.id ?? "user-profile",
              username: null,
              role: [{ rolename: roleName }]
            },
      error: null
    })
  };

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } })
    },
    from: vi.fn((table: string) => {
      if (table === "submission_window") return submissionWindowQuery;
      if (table === "user_profiles") return userProfilesQuery;
      throw new Error(`Unexpected table requested: ${table}`);
    })
  };
};

describe("submission-window API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns submission window state", async () => {
    const supabase = buildSupabaseStub({
      submissionWindow: { is_open: true, updated_at: "2024-01-01", updated_by: null }
    });
    mockedCreateClient.mockResolvedValueOnce(supabase as any);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      data: {
        open: true,
        updatedAt: "2024-01-01",
        updatedBy: null
      }
    });
  });

  it("POST returns 401 when user missing", async () => {
    const supabase = buildSupabaseStub({ user: null });
    mockedCreateClient.mockResolvedValueOnce(supabase as any);

    const request = new Request("http://localhost/api/submission-window", {
      method: "POST",
      body: JSON.stringify({ open: true }),
      headers: { "content-type": "application/json" }
    }) as unknown as NextRequest;

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: "Tidak terautentikasi" });
  });

  it("POST returns 403 when role is not admin", async () => {
    const supabase = buildSupabaseStub({
      user: { id: "user-1" },
      roleName: "teacher"
    });
    mockedCreateClient.mockResolvedValueOnce(supabase as any);

    const request = new Request("http://localhost/api/submission-window", {
      method: "POST",
      body: JSON.stringify({ open: true }),
      headers: { "content-type": "application/json" }
    }) as unknown as NextRequest;

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Tidak memiliki akses" });
  });

  it("POST validates open flag", async () => {
    const supabase = buildSupabaseStub({
      user: { id: "user-2" },
      roleName: "admin"
    });
    mockedCreateClient.mockResolvedValueOnce(supabase as any);

    const request = new Request("http://localhost/api/submission-window", {
      method: "POST",
      body: JSON.stringify({ bad: true }),
      headers: { "content-type": "application/json" }
    }) as unknown as NextRequest;

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "Parameter 'open' wajib bertipe boolean" });
  });
});
