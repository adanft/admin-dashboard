import {
  IdCard,
  KeyRound,
  type LucideIcon,
  ScrollText,
  ShieldCheck,
  UserRound,
  UsersRound,
} from 'lucide-react';

export type DashboardNavigationHref =
  | '/account'
  | '/users'
  | '/roles'
  | '/permissions'
  | '/audit-logs';

export type DashboardNavigationItem = {
  label: string;
  href: DashboardNavigationHref;
  icon: LucideIcon;
};

export type DashboardNavigationSection = {
  label: 'Account' | 'Administration';
  icon: LucideIcon;
  items: readonly DashboardNavigationItem[];
};

export const dashboardNavigation = [
  {
    label: 'Account',
    icon: UserRound,
    items: [{ label: 'My Account', href: '/account', icon: IdCard }],
  },
  {
    // biome-ignore lint/nursery/noSecrets: Static navigation label is user-facing copy, not a secret.
    label: 'Administration',
    icon: ShieldCheck,
    items: [
      { label: 'Users', href: '/users', icon: UsersRound },
      { label: 'Roles', href: '/roles', icon: ShieldCheck },
      { label: 'Permissions', href: '/permissions', icon: KeyRound },
      { label: 'Audit Logs', href: '/audit-logs', icon: ScrollText },
    ],
  },
] as const satisfies readonly DashboardNavigationSection[];

export function isDashboardNavigationItemActive(pathname: string, href: DashboardNavigationHref) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
