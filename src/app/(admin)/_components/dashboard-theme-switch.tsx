'use client';

import ThemeSwitch from '@adanft/ui/theme-switch';

type DashboardThemeSwitchProps = {
  initialDark: boolean;
};

export default function DashboardThemeSwitch({ initialDark }: DashboardThemeSwitchProps) {
  return <ThemeSwitch size="sm" initialDark={initialDark} />;
}
