'use client';

import { Sidebar, SidebarBody, SidebarHead, SidebarLink, SidebarSection } from '@adanft/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { dashboardNavigation, isDashboardNavigationItemActive } from '../_lib/dashboard-navigation';

export default function DashboardSidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  return (
    <Sidebar aria-label="Dashboard navigation" state={isExpanded} action={setIsExpanded}>
      <SidebarHead href="/" logoSrc="/logo.png" title="Admin dashboard" />
      <SidebarBody>
        {dashboardNavigation.map((section) => {
          const activeItems = section.items.map((item) => ({
            ...item,
            active: isDashboardNavigationItemActive(pathname, item.href),
          }));

          return (
            <section aria-label={section.label} key={section.label}>
              <SidebarSection text={section.label} />
              {activeItems.map((item) => (
                <SidebarLink
                  active={item.active}
                  asChild
                  icon={item.icon}
                  key={item.href}
                  text={item.label}
                >
                  <Link href={item.href}>{item.label}</Link>
                </SidebarLink>
              ))}
            </section>
          );
        })}
      </SidebarBody>
    </Sidebar>
  );
}
