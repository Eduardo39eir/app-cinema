import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "br.com.cine.app",
  appName: "Cine",
  webDir: "dist",
  backgroundColor: "#08090b",
  plugins: {
    SystemBars: {
      style: "DARK",
      insetsHandling: "native",
      initialViewportFitValueHint: "cover",
    },
  },
  android: {
    backgroundColor: "#08090b",
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
};
export default config;
