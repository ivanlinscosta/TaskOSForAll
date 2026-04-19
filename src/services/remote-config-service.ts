import {
  getRemoteConfig,
  fetchAndActivate,
  getValue,
  isSupported,
} from 'firebase/remote-config';
import { app } from '../lib/firebase-config';

export interface GuidedTourRemoteConfig {
  enabled: boolean;
  activeCampaignId: string;
  forceShow: boolean;
  debugMode: boolean;
}

export interface VagasIARemoteConfig {
  enabled: boolean;
}

const DEFAULTS: GuidedTourRemoteConfig = {
  enabled: false,
  activeCampaignId: '',
  forceShow: false,
  debugMode: false,
};

const VAGAS_IA_DEFAULTS: VagasIARemoteConfig = {
  enabled: false,
};

let _rc: ReturnType<typeof getRemoteConfig> | null = null;

async function getRC() {
  if (_rc) return _rc;
  console.log('[RemoteConfig] checking isSupported...');
  const supported = await isSupported();
  console.log('[RemoteConfig] isSupported =', supported);
  if (!supported) return null;
  _rc = getRemoteConfig(app);
  _rc.settings = {
    minimumFetchIntervalMillis: import.meta.env.DEV ? 0 : 3_600_000,
    fetchTimeoutMillis: 10_000,
  };
  _rc.defaultConfig = {
    guided_tour_enabled: 'false',
    guided_tour_active_campaign_id: '',
    guided_tour_force_show: 'false',
    guided_tour_debug_mode: 'false',
    vagas_ia_enabled: 'false',
  };
  return _rc;
}

export async function fetchVagasIAConfig(): Promise<VagasIARemoteConfig> {
  try {
    const rc = await getRC();
    if (!rc) return VAGAS_IA_DEFAULTS;
    await fetchAndActivate(rc);
    return {
      enabled: getValue(rc, 'vagas_ia_enabled').asBoolean(),
    };
  } catch (e) {
    console.warn('[RemoteConfig] fetchVagasIAConfig failed, using defaults:', e);
    return VAGAS_IA_DEFAULTS;
  }
}

export async function fetchGuidedTourConfig(): Promise<GuidedTourRemoteConfig> {
  console.log('[RemoteConfig] fetchGuidedTourConfig called');
  try {
    const rc = await getRC();
    if (!rc) {
      console.log('[RemoteConfig] not supported in this environment — returning defaults');
      return DEFAULTS;
    }
    const activated = await fetchAndActivate(rc);
    console.log('[RemoteConfig] fetchAndActivate =', activated);
    const result = {
      enabled: getValue(rc, 'guided_tour_enabled').asBoolean(),
      activeCampaignId: getValue(rc, 'guided_tour_active_campaign_id').asString().trim(),
      forceShow: getValue(rc, 'guided_tour_force_show').asBoolean(),
      debugMode: getValue(rc, 'guided_tour_debug_mode').asBoolean(),
    };
    console.log('[RemoteConfig] values:', result);
    return result;
  } catch (e) {
    console.warn('[RemoteConfig] fetch failed, using defaults:', e);
    return DEFAULTS;
  }
}
