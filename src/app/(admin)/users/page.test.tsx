import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UsersListQuery, UsersListState } from '@/lib/api/users';
import { getSession } from '@/server/auth/session';
import UsersPage from './page';

const SEARCH_PLACEHOLDER = ['Search by name', 'username and email'].join(', ');

const listUsersMock = vi.hoisted(() => vi.fn<() => Promise<UsersListState>>());

vi.mock('@/server/auth/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/api/users', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/users')>('@/lib/api/users');

  return {
    ...actual,
    usersApi: {
      listUsers: listUsersMock,
    },
  };
});

vi.mock('next/navigation', () => ({
  usePathname: () => '/users',
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const getSessionMock = vi.mocked(getSession);

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({
      accessToken: 'admin-token',
      expiresAt: Date.now() + 60_000,
    });
    listUsersMock.mockResolvedValue(successState());
  });

  it('renders backend users in the requested table columns with profile-only icon actions', async () => {
    const markup = await renderUsersPage();

    expect(markup).toContain('<h1');
    expect(markup).toContain('Users');
    expect(markup).toContain('Manage the people who can access and work in the admin dashboard.');
    expect(markup).not.toContain('backend-connected admin users');
    expect(markup).toContain('<table');
    expect(markup).toMatch(/<th[^>]*scope="col"/);
    expect(markup).toContain('User');
    expect(markup).toContain('Email');
    expect(markup).toContain('Status');
    expect(markup).toContain('Role');
    expect(markup).toContain('Created');
    expect(markup).toContain('Updated');
    expect(markup).toContain('Actions');
    expect(markup).not.toContain('Identity');
    expect(markup).not.toContain('Role summary');
    expect(markup).not.toContain('Last activity');
    expect(markup).toContain('Ada Lovelace');
    expect(markup).toContain('@ada');
    expect(markup).toContain('src="https://cdn.example.com/ada.png"');
    expect(markup).toContain('alt="Avatar for Ada Lovelace"');
    expect(markup).toContain('ada@example.com');
    expect(markup).toContain('Active');
    expect(markup).toContain('admin');
    expect(markup).toContain('New User');
    expect(markup).toContain('lucide-plus');
    expect(markup).toContain('bg-brand');
    expect(markup).toContain('text-white');
    expect(markup).toContain('href="/users/new"');
    expect(markup).toContain('href="/users/user-1"');
    expect(markup).toContain('aria-label="View profile for Ada Lovelace"');
    expect(markup).toContain('text-heading');
    expect(markup).toContain('href="/users/user-1/edit"');
    expect(markup).toContain('aria-label="Edit Ada Lovelace"');
    expect(markup).toContain('text-heading');
    expect(markup).toContain('aria-label="Delete Ada Lovelace"');
    expect(markup).toContain('text-danger');
    expect(markup).toContain('rounded-full');
    expect(markup).not.toContain('Change status');
    expect(markup).not.toContain('Assign role');
    expect(markup).not.toContain('Revoke sessions');
  });

  it('renders a text avatar fallback from the user name and keeps username stacked', async () => {
    listUsersMock.mockResolvedValue({
      status: 'success',
      data: {
        rows: [
          {
            id: 'user-2',
            name: 'Grace Hopper',
            username: 'grace',
            email: 'grace@example.com',
            status: 'locked',
            roles: [],
            roleSummary: 'user',
            createdAt: '—',
            updatedAt: '—',
          },
        ],
        pagination: { total: 1, limit: 10, offset: 0 },
        total: 1,
      },
    });

    const markup = await renderUsersPage();

    expect(markup).toContain('Grace Hopper');
    expect(markup).toContain('@grace');
    expect(markup).toContain('GH');
    expect(markup).not.toContain('<img');
  });

  it('forwards normalized URL query params internally while rendering only search and status filters', async () => {
    const markup = await renderUsersPage({
      search: '  ada  ',
      status: 'pending_password_change',
      sort: 'status',
      order: 'asc',
      limit: '25',
      offset: '50',
    });

    expect(listUsersMock).toHaveBeenCalledWith(
      {
        search: 'ada',
        status: 'pending_password_change',
        sort: 'status',
        order: 'asc',
        limit: 25,
        offset: 50,
      } satisfies UsersListQuery,
      'admin-token',
    );
    expect(markup).toContain('name="search"');
    expect(markup).toContain('Search');
    expect(markup).toContain(`placeholder="${SEARCH_PLACEHOLDER}"`);
    expect(markup).toContain('value="ada"');
    expect(markup).toContain('name="status"');
    expect(markup).toContain('>All</option>');
    expect(markup).not.toContain('All statuses');
    expect(markup).toContain('data-placeholder:text-foreground');
    expect(markup).toContain('value="pending_password_change"');
    expect(markup).toMatch(/selected="">Pending password change/);
    expect(markup).toMatch(/<form[^>]*md:items-center[^>]*method="get"/);
    expect(markup).toMatch(/<button[^>]*type="submit"[^>]*>Apply<\/button>/);
    expect(markup).not.toContain('Apply filters');
    expect(markup).not.toContain('name="sort"');
    expect(markup).not.toContain('id="users-sort"');
    expect(markup).not.toContain('name="order"');
    expect(markup).not.toContain('id="users-order"');
  });

  it('keeps UI defaults when the initial users URL has no search params', async () => {
    const markup = await renderUsersPage();

    expect(listUsersMock).toHaveBeenCalledWith(
      { sort: 'created_at', order: 'desc', limit: 50, offset: 0 } satisfies UsersListQuery,
      'admin-token',
    );
    expect(markup).toContain('name="search"');
    expect(markup).toContain('name="status"');
    expect(markup).toMatch(
      /<select id="users-status" name="status" data-placeholder="" class="[^"]*data-placeholder:text-foreground[^"]*"/,
    );
    expect(markup).toMatch(/<option value="" selected="">All<\/option>/);
    expect(markup).not.toContain('name="sort"');
    expect(markup).not.toContain('name="order"');
    expect(markup).not.toContain('name="limit"');
    expect(markup).not.toContain('id="users-limit"');
    expect(markup).toContain('users per page:');
    expect(markup).toContain('Total 1 users');
  });

  it('places pagination head above the users table and pagination foot below it', async () => {
    const markup = await renderUsersPage();

    const paginationHeadIndex = markup.indexOf('users per page:');
    const tableIndex = markup.indexOf('<table');
    const paginationFootIndex = markup.indexOf('Showing 1–1 of 1 users');

    expect(paginationHeadIndex).toBeGreaterThanOrEqual(0);
    expect(tableIndex).toBeGreaterThan(paginationHeadIndex);
    expect(paginationFootIndex).toBeGreaterThan(tableIndex);
  });

  it('renders an accessible empty state for successful empty responses', async () => {
    listUsersMock.mockResolvedValue({
      status: 'success',
      data: { rows: [], pagination: { total: 0, limit: 50, offset: 0 }, total: 0 },
    });

    const markup = await renderUsersPage({ search: 'nobody' });

    expect(markup).toContain('No users found');
    expect(markup).toContain('Try adjusting the current users filters.');
    expect(markup).not.toContain('<table');
  });

  it.each([
    ['bad-request', 'Invalid user filters.', 'Review the filters and try again.'],
    ['unauthorized', 'Your session expired or is invalid.', 'Sign in again to continue.'],
    [
      'forbidden',
      'You do not have permission to view users.',
      'Ask an administrator for users.read access.',
    ],
    ['error', 'Unable to load users right now.', 'Refresh the page or try again later.'],
  ] as const)('renders the distinct %s state', async (status, message, guidance) => {
    listUsersMock.mockResolvedValue({ status, message });

    const markup = await renderUsersPage();

    expect(markup).toContain('role="alert"');
    expect(markup).toContain(message);
    expect(markup).toContain(guidance);
    expect(markup).not.toContain('<table');
  });

  it('renders the expired session state when no session token is available', async () => {
    getSessionMock.mockResolvedValue(null);

    const markup = await renderUsersPage();

    expect(markup).toContain('role="alert"');
    expect(markup).toContain('Your session expired or is invalid.');
    expect(listUsersMock).not.toHaveBeenCalled();
  });
});

async function renderUsersPage(params: Record<string, string> = {}) {
  return renderToStaticMarkup(await UsersPage({ searchParams: Promise.resolve(params) }));
}

function successState(): UsersListState {
  return {
    status: 'success',
    data: {
      rows: [
        {
          id: 'user-1',
          name: 'Ada Lovelace',
          username: 'ada',
          avatar: 'https://cdn.example.com/ada.png',
          email: 'ada@example.com',
          status: 'active',
          roles: [
            {
              id: 'role-1',
              key: 'admin',
              displayName: 'Administrator',
              status: 'active',
              isSystem: true,
            },
          ],
          roleSummary: 'admin',
          createdAt: '2026-01-02T03:04:05.000Z',
          updatedAt: '2026-02-03T04:05:06.000Z',
        },
      ],
      pagination: { total: 1, limit: 50, offset: 0 },
      total: 1,
    },
  };
}
