import type {
  AuthResponse,
  CreateMeetingInput,
  CreateMeetingResponse,
  GuestAdmissionResponse,
  GuestAdmissionStatusResponse,
  HostMeetingResponse,
  HostAdmissionListResponse,
  LoginInput,
  MeetingSettingsResponse,
  MeetingTranslationResponse,
  MyMeetingsResponse,
  PublicMeetingResponse,
  RegisterInput,
  RoomSessionResponse,
  UpdateMeetingSettingsInput,
  UpdateMeetingTranslationInput,
} from "@voice/shared";

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? "The request could not be completed");
  return body;
}

export async function createMeeting(input: CreateMeetingInput): Promise<CreateMeetingResponse> {
  const response = await fetch("/api/meetings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  return readJson<CreateMeetingResponse>(response);
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  return readJson<AuthResponse>(await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  }));
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  return readJson<AuthResponse>(await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  }));
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
}

export async function getCurrentUser(): Promise<AuthResponse | null> {
  const response = await fetch("/api/auth/me", { credentials: "include" });
  if (response.status === 401) return null;
  return readJson<AuthResponse>(response);
}

export async function getMyMeetings(): Promise<MyMeetingsResponse> {
  return readJson<MyMeetingsResponse>(await fetch("/api/meetings", { credentials: "include" }));
}

export async function deleteMeeting(meetingId: string): Promise<void> {
  const response = await fetch(`/api/meetings/${encodeURIComponent(meetingId)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) await readJson<never>(response);
}

export async function getHostMeeting(meetingId: string): Promise<HostMeetingResponse> {
  return readJson<HostMeetingResponse>(
    await fetch(`/api/meetings/${encodeURIComponent(meetingId)}/host`, { credentials: "include" }),
  );
}

export async function createHostRoomSession(meetingId: string): Promise<RoomSessionResponse> {
  return readJson<RoomSessionResponse>(
    await fetch(`/api/meetings/${encodeURIComponent(meetingId)}/host-session`, {
      method: "POST",
      credentials: "include",
    }),
  );
}

export async function updateMeetingSettings(
  meetingId: string,
  settings: UpdateMeetingSettingsInput,
): Promise<MeetingSettingsResponse> {
  return readJson<MeetingSettingsResponse>(
    await fetch(`/api/meetings/${encodeURIComponent(meetingId)}/settings`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    }),
  );
}

export async function getMeetingTranslation(
  meetingId: string,
): Promise<MeetingTranslationResponse> {
  return readJson<MeetingTranslationResponse>(
    await fetch(`/api/meetings/${encodeURIComponent(meetingId)}/translation`, {
      credentials: "include",
    }),
  );
}

export async function updateMeetingTranslation(
  meetingId: string,
  settings: UpdateMeetingTranslationInput,
): Promise<MeetingTranslationResponse> {
  return readJson<MeetingTranslationResponse>(
    await fetch(`/api/meetings/${encodeURIComponent(meetingId)}/translation`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    }),
  );
}

export async function endMeeting(meetingId: string): Promise<void> {
  const response = await fetch(`/api/meetings/${encodeURIComponent(meetingId)}/end`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) await readJson<never>(response);
}

export async function createGuestRoomSession(
  joinCode: string,
  admissionId: string,
  admissionToken: string,
): Promise<RoomSessionResponse> {
  return readJson<RoomSessionResponse>(
    await fetch(`/api/join/${encodeURIComponent(joinCode)}/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${admissionToken}`,
      },
      body: JSON.stringify({ admissionId }),
    }),
  );
}

export async function requestGuestAdmission(
  joinCode: string,
  displayName: string,
): Promise<GuestAdmissionResponse> {
  return readJson<GuestAdmissionResponse>(
    await fetch(`/api/join/${encodeURIComponent(joinCode)}/admissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName }),
    }),
  );
}

export async function getGuestAdmissionStatus(
  joinCode: string,
  admissionId: string,
  admissionToken: string,
): Promise<GuestAdmissionStatusResponse> {
  return readJson<GuestAdmissionStatusResponse>(
    await fetch(
      `/api/join/${encodeURIComponent(joinCode)}/admissions/${encodeURIComponent(admissionId)}`,
      { headers: { Authorization: `Bearer ${admissionToken}` } },
    ),
  );
}

export async function getPendingAdmissions(meetingId: string): Promise<HostAdmissionListResponse> {
  return readJson<HostAdmissionListResponse>(
    await fetch(`/api/meetings/${encodeURIComponent(meetingId)}/admissions`, {
      credentials: "include",
    }),
  );
}

export async function decideAdmission(
  meetingId: string,
  admissionId: string,
  decision: "admitted" | "denied",
): Promise<void> {
  await readJson<{ status: string }>(
    await fetch(
      `/api/meetings/${encodeURIComponent(meetingId)}/admissions/${encodeURIComponent(admissionId)}`,
      {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      },
    ),
  );
}

export async function getPublicMeeting(joinCode: string): Promise<PublicMeetingResponse> {
  return readJson<PublicMeetingResponse>(
    await fetch(`/api/join/${encodeURIComponent(joinCode)}`),
  );
}
