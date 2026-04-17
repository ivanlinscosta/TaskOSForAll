import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { fetchGuidedTourConfig } from '../../../services/remote-config-service';
import {
  fetchCampaignById,
  fetchUserTourState,
  saveUserTourState,
  isCampaignEligible,
  type GuidedTourCampaign,
} from '../../../services/guided-tour-service';
import { GuidedTourModal } from './GuidedTourModal';

export function GuidedTourLauncher() {
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<GuidedTourCampaign | null>(null);
  const [initialStep, setInitialStep] = useState(0);
  const [open, setOpen] = useState(false);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!user?.uid || checkedRef.current) return;
    checkedRef.current = true;

    console.log('[GuidedTour] user authenticated, scheduling check for uid:', user.uid);
    let cancelled = false;

    const timer = setTimeout(async () => {
      console.log('[GuidedTour] timer fired, fetching config...');
      try {
        const config = await fetchGuidedTourConfig();
        console.log('[GuidedTour] config:', config);

        // Remote Config disabled and no override — bail out
        if (!config.enabled && !config.forceShow) {
          console.log('[GuidedTour] disabled by Remote Config');
          return;
        }
        if (!config.activeCampaignId) {
          console.log('[GuidedTour] no activeCampaignId in Remote Config');
          return;
        }

        const [camp, state] = await Promise.all([
          fetchCampaignById(config.activeCampaignId),
          fetchUserTourState(config.activeCampaignId),
        ]);

        console.log('[GuidedTour] campaign:', camp, '| state:', state);

        if (!camp) { console.log('[GuidedTour] campaign not found'); return; }
        if (camp.triggerPage !== 'dashboard') { console.log('[GuidedTour] wrong triggerPage'); return; }

        const eligible = isCampaignEligible(camp, state, config.forceShow);
        console.log('[GuidedTour] eligible:', eligible, '| state.status:', state?.status ?? 'null');
        if (!eligible) return;

        if (cancelled) return;

        setCampaign(camp);
        setInitialStep(state?.currentStep ?? 0);

        // fire-and-forget — don't block modal opening on Firestore write
        saveUserTourState(config.activeCampaignId, {
          status: 'seen',
          lastSeenAt: new Date(),
          source: 'dashboard_auto_open',
        }).catch((e) => console.warn('[GuidedTour] saveState failed:', e));

        console.log('[GuidedTour] opening modal...');
        setOpen(true);
      } catch (e) {
        console.warn('[GuidedTour] Failed to load campaign:', e);
      }
    }, 200);

    return () => {
      console.log('[GuidedTour] cleanup — timer cancelled');
      checkedRef.current = false;
      cancelled = true;
      clearTimeout(timer);
    };
  }, [user?.uid]);

  const handleStepChange = async (step: number) => {
    if (!campaign) return;
    await saveUserTourState(campaign.id, {
      currentStep: step,
      lastSeenAt: new Date(),
    }).catch(() => {});
  };

  const handleComplete = async () => {
    if (!campaign) return;
    setOpen(false);
    setCampaign(null);
    await saveUserTourState(campaign.id, {
      status: 'completed',
      currentStep: campaign.steps.length - 1,
      completedAt: new Date(),
      lastSeenAt: new Date(),
    }).catch(() => {});
  };

  const handleDismiss = async () => {
    if (!campaign) return;
    setOpen(false);
    setCampaign(null);
    await saveUserTourState(campaign.id, {
      status: 'dismissed',
      dismissedAt: new Date(),
      lastSeenAt: new Date(),
    }).catch(() => {});
  };

  if (!open || !campaign) return null;

  return (
    <GuidedTourModal
      campaign={campaign}
      initialStep={initialStep}
      onComplete={handleComplete}
      onDismiss={handleDismiss}
      onStepChange={handleStepChange}
    />
  );
}
