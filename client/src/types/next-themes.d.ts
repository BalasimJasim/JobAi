import { ReactNode } from 'react';

declare module 'next-themes' {
  interface ThemeProviderProps {
    children: ReactNode;
    attribute?: 'class' | 'data-theme';
    defaultTheme?: string;
    enableSystem?: boolean;
    disableTransitionOnChange?: boolean;
  }

  export function ThemeProvider(props: ThemeProviderProps): JSX.Element;
} 