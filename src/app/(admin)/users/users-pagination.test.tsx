// biome-ignore-all lint/nursery/noSecrets: URL and label assertions use deterministic test strings.
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import {
  buildUsersPaginationHref,
  UsersPagination,
  UsersPaginationFoot,
  UsersPaginationHead,
} from './users-pagination';

vi.mock('next/navigation', () => ({
  usePathname: () => '/users',
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams('search=ada&status=active&sort=email&order=asc'),
}));

describe('UsersPagination', () => {
  it('renders design-system pagination labels from backend pagination totals', () => {
    const markup = renderToStaticMarkup(
      <UsersPagination pagination={{ total: 42, limit: 25, offset: 25 }} total={42} />,
    );

    expect(markup).toContain('users per page:');
    expect(markup).toContain('Total 42 users');
    expect(markup).toContain('Showing 26–42 of 42 users');
    expect(markup).toContain('aria-label="Previous page"');
    expect(markup).toContain('aria-label="Next page"');
  });

  it('allows the pagination head and foot to render as separate client islands', () => {
    const headMarkup = renderToStaticMarkup(
      <UsersPaginationHead pagination={{ total: 42, limit: 25, offset: 25 }} total={42} />,
    );
    const footMarkup = renderToStaticMarkup(
      <UsersPaginationFoot pagination={{ total: 42, limit: 25, offset: 25 }} total={42} />,
    );

    expect(headMarkup).toContain('users per page:');
    expect(headMarkup).not.toContain('Showing 26–42 of 42 users');
    expect(footMarkup).toContain('Showing 26–42 of 42 users');
    expect(footMarkup).toContain('aria-label="Previous page"');
  });

  it('defaults the pagination head page size to 10 when the backend omits a limit', () => {
    const headMarkup = renderToStaticMarkup(
      <UsersPaginationHead pagination={{ total: 42, limit: 0, offset: 0 }} total={42} />,
    );

    expect(headMarkup).toContain('users per page:');
    expect(headMarkup).toContain('<option value="10" selected="">10</option>');
  });
});

describe('buildUsersPaginationHref', () => {
  it('preserves existing users filters while setting explicit page size and offset', () => {
    expect(
      buildUsersPaginationHref('search=ada&status=active&sort=email&order=asc', {
        pageIndex: 2,
        pageSize: 25,
      }),
    ).toBe('/users?search=ada&status=active&sort=email&order=asc&limit=25&offset=50');
  });

  it('sets only pagination params when the initial users URL had no query string', () => {
    expect(buildUsersPaginationHref('', { pageIndex: 1, pageSize: 10 })).toBe(
      '/users?limit=10&offset=10',
    );
  });

  it('resets offset to 0 when the pagination head changes page size', () => {
    expect(
      buildUsersPaginationHref('search=ada&limit=10&offset=30', { pageIndex: 0, pageSize: 25 }),
    ).toBe('/users?search=ada&limit=25&offset=0');
  });
});
