import { injectCliCy } from './plugin/inject';

export default {
  setupNodeEvents(on: any, config: any) {
    return injectCliCy(on, config);
  },
};