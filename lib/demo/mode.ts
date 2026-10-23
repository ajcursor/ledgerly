type DemoModeEnv = {
  DEMO_MODE?: string;
  NODE_ENV?: string;
};

/** Demo-only routes and chrome. Anything other than the string `true` is off. */
export function isDemoModeEnabled(env: DemoModeEnv = process.env): boolean {
  return env.DEMO_MODE === "true";
}
