import type { Configuration, RuleSetRule } from 'webpack';
import grafanaConfig, { type Env } from './.config/webpack/webpack.config';

/**
 * Extends the Grafana plugin webpack config so the Disaster siren is inlined
 * as a data URL. Playback then does not depend on `/public/plugins/...` being served.
 */
const config = async (env: Env): Promise<Configuration> => {
  const baseConfig = await grafanaConfig(env);
  const rules = (baseConfig.module?.rules ?? []) as RuleSetRule[];
  rules.push({
    test: /\.mp3$/,
    type: 'asset/inline',
  });
  return baseConfig;
};

export default config;
