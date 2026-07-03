import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uk.scsq.studio',
  appName: 'ScapeStudio',
  webDir: 'public',
  // Points the native shell at the live deployed app rather than bundling a
  // static copy - ScapeStudio is a normal server-capable Next.js app (SSR +
  // future API routes for the accept/pipeline flow), not something that
  // makes sense as a fully offline static bundle. This also means every
  // native build always reflects whatever's actually deployed, with no
  // separate "rebuild the wrapper" step after a web deploy.
  server: {
    url: 'https://scapestudio.vercel.app',
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
