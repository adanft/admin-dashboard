// biome-ignore-all lint/nursery/noSecrets: API tests use deterministic fake tokens and URLs.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminApiError } from './client';
import {
  mapUserProfileResponse,
  mapUsersListResponse,
  normalizeUsersListQuery,
  toUsersListBackendQuery,
  toUsersListState,
  usersApi,
} from './users';

const originalAdminApiBaseUrl = process.env.ADMIN_API_BASE_URL;

describe('normalizeUsersListQuery', () => {
  it('normalizes supported URL search params into a backend query', () => {
    expect(
      normalizeUsersListQuery({
        search: '  ada  ',
        status: 'pending_password_change',
        sort: 'updated_at',
        order: 'asc',
        limit: '25',
        offset: '50',
      }),
    ).toEqual({
      search: 'ada',
      status: 'pending_password_change',
      sort: 'updated_at',
      order: 'asc',
      limit: 25,
      offset: 50,
    });
  });

  it('normalizes UI aliases and casing before sending backend query values', () => {
    expect(
      normalizeUsersListQuery({
        search: 'ana',
        status: 'ACTIVE',
        sort: 'createdAt',
        order: 'asc',
        limit: '25',
        offset: '50',
      }),
    ).toEqual({
      search: 'ana',
      status: 'active',
      sort: 'created_at',
      order: 'asc',
      limit: 25,
      offset: 50,
    });
  });

  it('falls back safely for unsupported or malformed URL search params', () => {
    expect(
      normalizeUsersListQuery({
        search: '   ',
        status: 'deleted',
        sort: 'passwordHash',
        order: 'sideways',
        limit: '999',
        offset: '-5',
      }),
    ).toEqual({
      sort: 'created_at',
      order: 'desc',
      limit: 10,
      offset: 0,
    });
  });
});

describe('toUsersListBackendQuery', () => {
  it('sends the default page size while omitting sort, order, and offset defaults', () => {
    expect(
      toUsersListBackendQuery({ sort: 'created_at', order: 'desc', limit: 10, offset: 0 }),
    ).toEqual({ limit: 10 });
  });

  it('keeps explicit filters, pagination, and non-default sort options', () => {
    expect(
      toUsersListBackendQuery({
        search: 'ada',
        status: 'active',
        sort: 'username',
        order: 'asc',
        limit: 25,
        offset: 50,
      }),
    ).toEqual({
      search: 'ada',
      status: 'active',
      sort: 'username',
      order: 'asc',
      limit: 25,
      offset: 50,
    });
  });
});

describe('mapUsersListResponse', () => {
  it('maps backend users into stable UI rows with readable fallbacks', () => {
    expect(
      mapUsersListResponse({
        items: [
          {
            id: 'user-1',
            name: 'Ada Lovelace',
            username: 'ada',
            avatar: 'https://cdn.example.com/ada.png',
            email: 'ada@example.com',
            status: 'active',
            roles: ['admin', 'user'],
            created_at: '2026-01-02T03:04:05.000Z',
            updated_at: '2026-02-03T04:05:06.000Z',
          },
          {
            id: 'user-2',
            email: 'grace@example.com',
            status: 'locked',
            created_at: '2026-03-04T05:06:07.000Z',
            updatedAt: '2026-04-05T06:07:08.000Z',
          },
        ],
        pagination: { total: 2, limit: 25, offset: 0 },
      }),
    ).toEqual({
      rows: [
        {
          id: 'user-1',
          name: 'Ada Lovelace',
          username: 'ada',
          avatar: 'https://cdn.example.com/ada.png',
          email: 'ada@example.com',
          status: 'active',
          roleSummary: 'admin, user',
          createdAt: '2026-01-02T03:04:05.000Z',
          updatedAt: '2026-02-03T04:05:06.000Z',
        },
        {
          id: 'user-2',
          name: 'Unnamed user',
          username: '—',
          email: 'grace@example.com',
          status: 'locked',
          roleSummary: '—',
          createdAt: '2026-03-04T05:06:07.000Z',
          updatedAt: '2026-04-05T06:07:08.000Z',
        },
      ],
      pagination: { total: 2, limit: 25, offset: 0 },
      total: 2,
    });
  });

  it('returns an empty list when the backend users collection is empty', () => {
    expect(mapUsersListResponse({ items: [], pagination: { total: 0 } })).toEqual({
      rows: [],
      pagination: { total: 0, limit: 10, offset: 0 },
      total: 0,
    });
  });

  it('falls back to legacy last activity fields when updated timestamps are unavailable', () => {
    expect(
      mapUsersListResponse({
        items: [
          {
            id: 'user-1',
            username: 'ada',
            email: 'ada@example.com',
            last_activity_at: '2026-05-06T07:08:09.000Z',
          },
        ],
      }).rows[0]?.updatedAt,
    ).toBe('2026-05-06T07:08:09.000Z');
  });
});

describe('mapUserProfileResponse', () => {
  it('maps backend profile fields into an editable profile model', () => {
    expect(
      mapUserProfileResponse({
        id: 'user-1',
        name: 'Ada',
        lastName: 'Lovelace',
        username: 'ada',
        email: 'ada@example.com',
        avatar: 'https://cdn.example.com/ada.png',
        status: 'active',
        created_at: '2026-01-02T03:04:05.000Z',
        updated_at: '2026-02-03T04:05:06.000Z',
      }),
    ).toEqual({
      id: 'user-1',
      name: 'Ada',
      lastName: 'Lovelace',
      username: 'ada',
      email: 'ada@example.com',
      avatar: 'https://cdn.example.com/ada.png',
      status: 'active',
      createdAt: '2026-01-02T03:04:05.000Z',
      updatedAt: '2026-02-03T04:05:06.000Z',
    });
  });

  it('uses safe fallbacks without exposing role or session fields', () => {
    expect(
      mapUserProfileResponse({
        id: 'user-2',
        name: 'Grace',
        username: 'grace',
        email: 'grace@example.com',
        roles: ['owner'],
        sessions: [{ id: 'session-1' }],
        status: 'root',
      }),
    ).toEqual({
      id: 'user-2',
      name: 'Grace',
      lastName: '',
      username: 'grace',
      email: 'grace@example.com',
      status: 'disabled',
      createdAt: '—',
      updatedAt: '—',
    });
  });
});

describe('toUsersListState', () => {
  it.each([
    [400, 'bad-request', 'Invalid user filters.'],
    [401, 'unauthorized', 'Your session expired or is invalid.'],
    [403, 'forbidden', 'You do not have permission to view users.'],
    [500, 'error', 'Unable to load users right now.'],
  ] as const)('maps API status %i to %s list state', (status, expectedStatus, expectedMessage) => {
    expect(toUsersListState(new AdminApiError({ message: 'backend detail', status }))).toEqual({
      status: expectedStatus,
      message: expectedMessage,
    });
  });
});

describe('usersApi.listUsers contract', () => {
  beforeEach(() => {
    process.env.ADMIN_API_BASE_URL = 'https://admin-api.test/';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.ADMIN_API_BASE_URL = originalAdminApiBaseUrl;
  });

  it('returns mapped success state from the authenticated backend response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            items: [
              {
                id: 'user-1',
                name: 'Ada Lovelace',
                username: 'ada',
                avatar: 'https://cdn.example.com/ada.png',
                email: 'ada@example.com',
                status: 'disabled',
                roles: ['admin'],
                created_at: '2026-01-02T03:04:05.000Z',
              },
            ],
            pagination: { total: 1, limit: 50, offset: 100 },
          },
          status: 200,
        }),
        { status: 200 },
      ),
    );

    await expect(
      usersApi.listUsers(
        { search: 'ada', sort: 'username', order: 'asc', limit: 50, offset: 100 },
        'access-token',
      ),
    ).resolves.toEqual({
      status: 'success',
      data: {
        rows: [
          {
            id: 'user-1',
            name: 'Ada Lovelace',
            username: 'ada',
            avatar: 'https://cdn.example.com/ada.png',
            email: 'ada@example.com',
            status: 'disabled',
            roleSummary: 'admin',
            createdAt: '2026-01-02T03:04:05.000Z',
            updatedAt: '—',
          },
        ],
        pagination: { total: 1, limit: 50, offset: 100 },
        total: 1,
      },
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://admin-api.test/users?search=ada&sort=username&order=asc&limit=50&offset=100',
      expect.objectContaining({
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer access-token',
        },
      }),
    );
  });

  it('requests the initial users list with only the default page size', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { items: [], pagination: { total: 0 } },
          status: 200,
        }),
        { status: 200 },
      ),
    );

    await usersApi.listUsers({ sort: 'created_at', order: 'desc', limit: 10, offset: 0 }, 'token');

    expect(fetch).toHaveBeenCalledWith(
      'https://admin-api.test/users?limit=10',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('returns forbidden state instead of throwing when the backend denies access', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          code: 'FORBIDDEN',
          error: 'missing users.read',
          status: 403,
        }),
        { status: 403 },
      ),
    );

    await expect(
      usersApi.listUsers(
        { sort: 'created_at', order: 'desc', limit: 10, offset: 0 },
        'access-token',
      ),
    ).resolves.toEqual({
      status: 'forbidden',
      message: 'You do not have permission to view users.',
    });
  });
});

describe('usersApi CRUD contract', () => {
  beforeEach(() => {
    process.env.ADMIN_API_BASE_URL = 'https://admin-api.test/';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.ADMIN_API_BASE_URL = originalAdminApiBaseUrl;
  });

  it('creates a user with a temporary password and maps the created profile', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            id: 'user-1',
            name: 'Ada',
            lastName: 'Lovelace',
            username: 'ada',
            email: 'ada@example.com',
            status: 'pending_password_change',
          },
          status: 201,
        }),
        { status: 201 },
      ),
    );

    await expect(
      usersApi.createUser(
        {
          name: 'Ada',
          lastName: 'Lovelace',
          username: 'ada',
          email: 'ada@example.com',
          temporaryPassword: 'temporary-secret',
        },
        'access-token',
      ),
    ).resolves.toEqual({
      id: 'user-1',
      name: 'Ada',
      lastName: 'Lovelace',
      username: 'ada',
      email: 'ada@example.com',
      status: 'pending_password_change',
      createdAt: '—',
      updatedAt: '—',
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://admin-api.test/users',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'Ada',
          lastName: 'Lovelace',
          username: 'ada',
          email: 'ada@example.com',
          temporaryPassword: 'temporary-secret',
        }),
        headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
      }),
    );
  });

  it('loads a user profile by id through the authenticated API', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            id: 'user/with/slash',
            name: 'Ada',
            lastName: 'Lovelace',
            username: 'ada',
            email: 'ada@example.com',
            status: 'active',
          },
          status: 200,
        }),
        { status: 200 },
      ),
    );

    await expect(usersApi.getUser('user/with/slash', 'access-token')).resolves.toMatchObject({
      id: 'user/with/slash',
      email: 'ada@example.com',
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://admin-api.test/users/user%2Fwith%2Fslash',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('updates only profile fields for an existing user', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            id: 'user-2',
            name: 'Grace',
            lastName: 'Hopper',
            username: 'grace',
            email: 'grace@example.com',
            status: 'active',
          },
          status: 200,
        }),
        { status: 200 },
      ),
    );

    await expect(
      usersApi.updateUser(
        'user-2',
        {
          name: 'Grace',
          lastName: 'Hopper',
          username: 'grace',
          email: 'grace@example.com',
          avatar: 'https://cdn.example.com/grace.png',
        },
        'access-token',
      ),
    ).resolves.toMatchObject({ id: 'user-2', email: 'grace@example.com' });

    expect(fetch).toHaveBeenCalledWith(
      'https://admin-api.test/users/user-2',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          name: 'Grace',
          lastName: 'Hopper',
          username: 'grace',
          email: 'grace@example.com',
          avatar: 'https://cdn.example.com/grace.png',
        }),
      }),
    );
  });

  it('deletes a user through the authenticated API without requiring a response body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

    await expect(usersApi.deleteUser('user-3', 'access-token')).resolves.toBeUndefined();

    expect(fetch).toHaveBeenCalledWith(
      'https://admin-api.test/users/user-3',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('preserves unauthorized and forbidden API errors for Server Action mapping', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: false, error: 'missing users.delete', status: 403 }), {
        status: 403,
      }),
    );

    await expect(usersApi.deleteUser('user-4', 'access-token')).rejects.toMatchObject({
      status: 403,
      message: 'missing users.delete',
    });
  });
});
