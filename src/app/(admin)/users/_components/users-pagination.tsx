'use client';

import PaginationFoot from '@adanft/ui/pagination-foot';
import PaginationHead from '@adanft/ui/pagination-head';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { UsersListPagination } from '@/lib/api/users';

const USERS_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

type UsersPaginationProps = {
  pagination: UsersListPagination;
  total: number;
};

type PaginationChange = {
  pageIndex: number;
  pageSize: number;
};

export function UsersPaginationHead({ pagination, total }: UsersPaginationProps) {
  const { navigateToPage, pageSize, totalItems } = useUsersPagination({ pagination, total });

  return (
    <PaginationHead
      label="users"
      onPaginationChange={navigateToPage}
      pageSize={pageSize}
      pageSizeOptions={USERS_PAGE_SIZE_OPTIONS}
      totalItems={totalItems}
    />
  );
}

export function UsersPaginationFoot({ pagination, total }: UsersPaginationProps) {
  const { navigateToPage, pageIndex, pageSize, totalItems, totalPages } = useUsersPagination({
    pagination,
    total,
  });

  return (
    <PaginationFoot
      label="users"
      onPageChange={(nextPageIndex) => navigateToPage({ pageIndex: nextPageIndex, pageSize })}
      pageIndex={pageIndex}
      pageSize={pageSize}
      totalItems={totalItems}
      totalPages={totalPages}
    />
  );
}

function useUsersPagination({ pagination, total }: UsersPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageSize = normalizePageSize(pagination.limit);
  const totalItems = pagination.total || total;
  const totalPages = Math.ceil(totalItems / pageSize);
  const pageIndex = Math.min(Math.floor(pagination.offset / pageSize), Math.max(totalPages - 1, 0));

  function navigateToPage(next: PaginationChange) {
    router.push(buildUsersPaginationHref(searchParams.toString(), next, pathname), {
      scroll: false,
    });
  }

  return { navigateToPage, pageIndex, pageSize, totalItems, totalPages };
}

export function buildUsersPaginationHref(
  currentSearchParams: string,
  next: PaginationChange,
  pathname = '/users',
) {
  const params = new URLSearchParams(currentSearchParams);

  params.set('limit', String(next.pageSize));
  params.set('offset', String(next.pageIndex * next.pageSize));

  return `${pathname}?${params.toString()}`;
}

function normalizePageSize(value: number) {
  return USERS_PAGE_SIZE_OPTIONS.includes(value) ? value : 50;
}
