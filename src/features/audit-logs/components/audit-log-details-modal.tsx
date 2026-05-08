'use client';

import Button from '@adanft/ui/button';
import Modal from '@adanft/ui/modal';
import { Info, X } from 'lucide-react';
import { useId, useState } from 'react';

import type { AuditLogEvent } from '@/server/api/audit-logs';

export default function AuditLogDetailsModal({ event }: { event: AuditLogEvent }) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();

  return (
    <>
      <Button
        aria-label={`View details for audit log ${event.id}`}
        className="size-8 rounded-full bg-transparent p-0 text-heading hover:bg-heading/10"
        onClick={() => setIsOpen(true)}
        title={`View details for audit log ${event.id}`}
        type="button"
      >
        <Info aria-hidden="true" className="size-4" />
      </Button>

      <Modal open={isOpen} onClose={() => setIsOpen(false)}>
        <Modal.Backdrop />
        <Modal.Panel aria-labelledby={titleId} className="max-h-[85vh] max-w-3xl overflow-auto">
          <AuditLogDetailsContent
            event={event}
            onClose={() => setIsOpen(false)}
            titleId={titleId}
          />
        </Modal.Panel>
      </Modal>
    </>
  );
}

export function AuditLogDetailsContent({
  event,
  onClose,
  titleId,
}: {
  event: AuditLogEvent;
  onClose?: () => void;
  titleId: string;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-heading" id={titleId}>
            Audit log details
          </h2>
        </div>
        {onClose ? (
          <Button
            aria-label="Close audit log details"
            className="size-8 rounded-full bg-transparent p-0 text-heading hover:bg-heading/10"
            onClick={onClose}
            title="Close audit log details"
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </Button>
        ) : null}
      </div>

      <dl className="grid gap-3 text-sm md:grid-cols-2">
        <DetailTerm label="Audit Log ID" value={event.id} />
        <DetailTerm label="Action" value={event.action} />
        <DetailTerm label="Category" value={event.category} />
        <DetailTerm label="Result" value={event.result} />
        <DetailTerm label="Actor ID" value={event.actorId ?? '—'} />
        <DetailTerm label="Actor Type" value={event.actorType} />
        <DetailTerm label="Resource" value={event.resource} />
        <DetailTerm label="Resource ID" value={event.resourceId ?? '—'} />
        <DetailTerm label="Reason" value={event.reason ?? '—'} />
        <DetailTerm label="IP" value={event.ipAddress ?? '—'} />
        <DetailTerm label="User Agent" value={event.userAgent ?? '—'} />
        <DetailTerm label="Created At" value={formatDisplayDate(event.createdAt)} />
      </dl>

      <section className="space-y-2" aria-labelledby={`${titleId}-metadata`}>
        <h3 className="font-semibold text-heading" id={`${titleId}-metadata`}>
          Metadata
        </h3>
        {hasMetadataContext(event.metadata) ? (
          <pre className="overflow-auto rounded-lg border border-border bg-background p-3 text-xs text-foreground">
            {JSON.stringify(event.metadata, null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-foreground">No extra context</p>
        )}
      </section>
    </div>
  );
}

function DetailTerm({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="font-medium text-heading">{label}</dt>
      <dd className="break-words text-foreground">{value}</dd>
    </div>
  );
}

function formatDisplayDate(value: string) {
  if (value === '—') {
    return value;
  }

  const parsedDate = new Date(value);

  return Number.isNaN(parsedDate.valueOf())
    ? value
    : new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
        hour12: false,
        timeStyle: 'short',
      }).format(parsedDate);
}

function hasMetadataContext(metadata: AuditLogEvent['metadata']) {
  if (metadata === undefined || metadata === null) return false;
  if (Array.isArray(metadata)) return metadata.length > 0;
  if (typeof metadata === 'object') return Object.keys(metadata).length > 0;
  return true;
}
