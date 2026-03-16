"use client";

import { useMemo, useState, type ReactNode } from "react";
import { WagmiProvider, useAccount } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";

import { config } from "@/lib/wagmi";
import { ThemeProvider, useTheme } from "./theme-provider";

const buttonDisconnected = {
  "--ck-connectbutton-color": "#1a1a1a",
  "--ck-connectbutton-background": "#FBC687",
  "--ck-connectbutton-hover-color": "#1a1a1a",
  "--ck-connectbutton-hover-background": "#fdd9a5",
  "--ck-connectbutton-active-color": "#1a1a1a",
  "--ck-connectbutton-active-background": "#f5b86a",
};

const buttonDark = {
  "--ck-connectbutton-color": "#f5f5f5",
  "--ck-connectbutton-background": "#1a1a1a",
  "--ck-connectbutton-hover-color": "#ffffff",
  "--ck-connectbutton-hover-background": "#2a2a2a",
  "--ck-connectbutton-active-color": "#ffffff",
  "--ck-connectbutton-active-background": "#333333",
};

const buttonLight = {
  "--ck-connectbutton-color": "#1a1a1a",
  "--ck-connectbutton-background": "#e8e8e8",
  "--ck-connectbutton-hover-color": "#000000",
  "--ck-connectbutton-hover-background": "#f0f0f0",
  "--ck-connectbutton-active-color": "#000000",
  "--ck-connectbutton-active-background": "#ffffff",
};

const sharedButton = {
  "--ck-connectbutton-font-size": "14px",
  "--ck-connectbutton-border-radius": "10px",
  "--ck-connectbutton-box-shadow": "none",
};

const lightModal = {
  "--ck-overlay-background": "rgba(0, 0, 0, 0.4)",
  "--ck-overlay-backdrop-filter": "blur(4px)",
  "--ck-border-radius": "16px",
  "--ck-body-background": "#f0f0f0",
  "--ck-body-background-secondary": "#e4e4e4",
  "--ck-body-background-tertiary": "#d9d9d9",
  "--ck-body-color": "#1a1a1a",
  "--ck-body-color-muted": "#666666",
  "--ck-body-color-muted-hover": "#333333",
  "--ck-body-divider": "#d4d4d4",
  "--ck-primary-button-color": "#f5f5f5",
  "--ck-primary-button-background": "#1a1a1a",
  "--ck-primary-button-border-radius": "10px",
  "--ck-primary-button-hover-background": "#2a2a2a",
  "--ck-secondary-button-color": "#1a1a1a",
  "--ck-secondary-button-background": "#e4e4e4",
  "--ck-secondary-button-border-radius": "10px",
  "--ck-secondary-button-hover-background": "#d4d4d4",
  "--ck-focus-color": "#888888",
  "--ck-spinner-color": "#1a1a1a",
  "--ck-qr-dot-color": "#1a1a1a",
  "--ck-qr-border-color": "#d4d4d4",
  "--ck-tooltip-color": "#f5f5f5",
  "--ck-tooltip-background": "#1a1a1a",
};

const darkModal = {
  "--ck-overlay-background": "rgba(0, 0, 0, 0.55)",
  "--ck-overlay-backdrop-filter": "blur(4px)",
  "--ck-border-radius": "16px",
  "--ck-body-background": "#2a2a2a",
  "--ck-body-background-secondary": "#333333",
  "--ck-body-background-tertiary": "#3d3d3d",
  "--ck-body-color": "#ebebeb",
  "--ck-body-color-muted": "#999999",
  "--ck-body-color-muted-hover": "#cccccc",
  "--ck-body-divider": "#444444",
  "--ck-primary-button-color": "#1a1a1a",
  "--ck-primary-button-background": "#e8e8e8",
  "--ck-primary-button-border-radius": "10px",
  "--ck-primary-button-hover-background": "#f0f0f0",
  "--ck-secondary-button-color": "#ebebeb",
  "--ck-secondary-button-background": "#333333",
  "--ck-secondary-button-border-radius": "10px",
  "--ck-secondary-button-hover-background": "#444444",
  "--ck-focus-color": "#666666",
  "--ck-spinner-color": "#e8e8e8",
  "--ck-qr-dot-color": "#e8e8e8",
  "--ck-qr-border-color": "#444444",
  "--ck-tooltip-color": "#1a1a1a",
  "--ck-tooltip-background": "#e8e8e8",
};

function ConnectKitWrapper({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const { isConnected } = useAccount();

  const customTheme = useMemo(() => {
    const isLight = theme === "light";
    const modal = isLight ? lightModal : darkModal;

    const button = isConnected
      ? isLight
        ? buttonLight
        : buttonDark
      : buttonDisconnected;

    return { ...sharedButton, ...button, ...modal };
  }, [theme, isConnected]);

  return (
    <ConnectKitProvider customTheme={customTheme}>
      {children}
    </ConnectKitProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ConnectKitWrapper>{children}</ConnectKitWrapper>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
