'use client';

import PaginationFoot from '@adanft/ui/pagination-foot';
import PaginationHead from '@adanft/ui/pagination-head';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type PermissionsPaginationProps = {
  pagination: { limit: number; offset: number; total: number };
  total: number;
};

type PaginationChange = {
  pageIndex: number;
  pageSize: number;
};

const PERMISSIONS_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function PermissionsPaginationHead({ pagination, total }: PermissionsPaginationProps) {
  const { navigateToPage, pageSize, totalItems } = usePermissionsPagination({ pagination, total });

  return (
    <PaginationHead
      label="permissions"
      onPaginationChange={navigateToPage}
      pageSize={pageSize}
      pageSizeOptions={PERMISSIONS_PAGE_SIZE_OPTIONS}
      totalItems={totalItems}
    />
  );
}

export function PermissionsPaginationFoot({ pagination, total }: PermissionsPaginationProps) {
  const { navigateToPage, pageIndex, pageSize, totalItems, totalPages } = usePermissionsPagination({
    pagination,
    total,
  });

  return (
    <PaginationFoot
      label="permissions"
      onPageChange={(nextPageIndex) => navigateToPage({ pageIndex: nextPageIndex, pageSize })}
      pageIndex={pageIndex}
      pageSize={pageSize}
      totalItems={totalItems}
      totalPages={totalPages}
    />
  );
}

export function buildPermissionsPaginationHref(
  currentSearchParams: string,
  next: PaginationChange,
  pathname = '/permissions',
) {
  const params = new URLSearchParams(currentSearchParams);

  params.set('limit', String(next.pageSize));
  params.set('offset', String(next.pageIndex * next.pageSize));

  return `${pathname}?${params.toString()}`;
}

function usePermissionsPagination({ pagination, total }: PermissionsPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageSize = normalizePageSize(pagination.limit);
  const totalItems = pagination.total || total;
  const totalPages = Math.ceil(totalItems / pageSize);
  const pageIndex = Math.min(Math.floor(pagination.offset / pageSize), Math.max(totalPages - 1, 0));

  function navigateToPage(next: PaginationChange) {
    router.push(buildPermissionsPaginationHref(searchParams.toString(), next, pathname), {
      scroll: false,
    });
  }

  return { navigateToPage, pageIndex, pageSize, totalItems, totalPages };
}

function normalizePageSize(value: number) {
  return PERMISSIONS_PAGE_SIZE_OPTIONS.includes(value) ? value : 50;
}
