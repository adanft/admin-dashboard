'use client';

import PaginationFoot from '@adanft/ui/pagination-foot';
import PaginationHead from '@adanft/ui/pagination-head';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type RolesPaginationProps = {
  pagination: { limit: number; offset: number; total: number };
  total: number;
};

type PaginationChange = {
  pageIndex: number;
  pageSize: number;
};

const ROLES_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function RolesPaginationHead({ pagination, total }: RolesPaginationProps) {
  const { navigateToPage, pageSize, totalItems } = useRolesPagination({ pagination, total });

  return (
    <PaginationHead
      label="roles"
      onPaginationChange={navigateToPage}
      pageSize={pageSize}
      pageSizeOptions={ROLES_PAGE_SIZE_OPTIONS}
      totalItems={totalItems}
    />
  );
}

export function RolesPaginationFoot({ pagination, total }: RolesPaginationProps) {
  const { navigateToPage, pageIndex, pageSize, totalItems, totalPages } = useRolesPagination({
    pagination,
    total,
  });

  return (
    <PaginationFoot
      label="roles"
      onPageChange={(nextPageIndex) => navigateToPage({ pageIndex: nextPageIndex, pageSize })}
      pageIndex={pageIndex}
      pageSize={pageSize}
      totalItems={totalItems}
      totalPages={totalPages}
    />
  );
}

export function buildRolesPaginationHref(
  currentSearchParams: string,
  next: PaginationChange,
  pathname = '/roles',
) {
  const params = new URLSearchParams(currentSearchParams);

  params.set('limit', String(next.pageSize));
  params.set('offset', String(next.pageIndex * next.pageSize));

  return `${pathname}?${params.toString()}`;
}

function useRolesPagination({ pagination, total }: RolesPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageSize = normalizePageSize(pagination.limit);
  const totalItems = pagination.total || total;
  const totalPages = Math.ceil(totalItems / pageSize);
  const pageIndex = Math.min(Math.floor(pagination.offset / pageSize), Math.max(totalPages - 1, 0));

  function navigateToPage(next: PaginationChange) {
    router.push(buildRolesPaginationHref(searchParams.toString(), next, pathname), {
      scroll: false,
    });
  }

  return { navigateToPage, pageIndex, pageSize, totalItems, totalPages };
}

function normalizePageSize(value: number) {
  return ROLES_PAGE_SIZE_OPTIONS.includes(value) ? value : 50;
}
