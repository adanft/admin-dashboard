'use client';

import PaginationFoot from '@adanft/ui/pagination-foot';
import PaginationHead from '@adanft/ui/pagination-head';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type AuditLogsPaginationProps = {
  pagination: { limit: number; offset: number; total: number };
  total: number;
};

type PaginationChange = {
  pageIndex: number;
  pageSize: number;
};

const AUDIT_LOGS_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function AuditLogsPaginationHead({ pagination, total }: AuditLogsPaginationProps) {
  const { navigateToPage, pageSize, totalItems } = useAuditLogsPagination({ pagination, total });

  return (
    <PaginationHead
      label="audit logs"
      onPaginationChange={navigateToPage}
      pageSize={pageSize}
      pageSizeOptions={AUDIT_LOGS_PAGE_SIZE_OPTIONS}
      totalItems={totalItems}
    />
  );
}

export function AuditLogsPaginationFoot({ pagination, total }: AuditLogsPaginationProps) {
  const { navigateToPage, pageIndex, pageSize, totalItems, totalPages } = useAuditLogsPagination({
    pagination,
    total,
  });

  return (
    <PaginationFoot
      label="audit logs"
      onPageChange={(nextPageIndex) => navigateToPage({ pageIndex: nextPageIndex, pageSize })}
      pageIndex={pageIndex}
      pageSize={pageSize}
      totalItems={totalItems}
      totalPages={totalPages}
    />
  );
}

export function buildAuditLogsPaginationHref(
  currentSearchParams: string,
  next: PaginationChange,
  pathname = '/audit-logs',
) {
  const params = new URLSearchParams(currentSearchParams);

  params.set('limit', String(next.pageSize));
  params.set('offset', String(next.pageIndex * next.pageSize));

  return `${pathname}?${params.toString()}`;
}

function useAuditLogsPagination({ pagination, total }: AuditLogsPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageSize = normalizePageSize(pagination.limit);
  const totalItems = pagination.total || total;
  const totalPages = Math.ceil(totalItems / pageSize);
  const pageIndex = Math.min(Math.floor(pagination.offset / pageSize), Math.max(totalPages - 1, 0));

  function navigateToPage(next: PaginationChange) {
    router.push(buildAuditLogsPaginationHref(searchParams.toString(), next, pathname), {
      scroll: false,
    });
  }

  return { navigateToPage, pageIndex, pageSize, totalItems, totalPages };
}

function normalizePageSize(value: number) {
  return AUDIT_LOGS_PAGE_SIZE_OPTIONS.includes(value) ? value : 50;
}
