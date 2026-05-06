'use client';

import ThemeSwitch from '@adanft/ui/theme-switch';
import type { ComponentPropsWithoutRef, ComponentType } from 'react';

type DashboardThemeSwitchProps = {
  initialDark: boolean;
};

type CompatibleThemeSwitchProps = ComponentPropsWithoutRef<'label'> & {
  initialDark?: boolean;
  onCheckedChange?: (isDark: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
};

const CompatibleThemeSwitch = ThemeSwitch as ComponentType<CompatibleThemeSwitchProps>;

export default function DashboardThemeSwitch({ initialDark }: DashboardThemeSwitchProps) {
  return <CompatibleThemeSwitch size="sm" initialDark={initialDark} />;
}
