import dashboardSvg from '../../../assets/trabalho_dashboard.svg';
import financeSvg from '../../../assets/pessoal_gestao_financeira.svg';
import careerSvg from '../../../assets/trabalho_gestao_carreira.svg';
import tasksSvg from '../../../assets/trabalho_tarefas.svg';
import creditcardSvg from '../../../assets/pessoal_cartao_credito.svg';
import onboardingSvg from '../../../assets/onboarding.svg';
import helpSvg from '../../../assets/ajuda.svg';
import profileSvg from '../../../assets/perfil.svg';
import welcomeOverviewSvg from '../../../assets/tour_welcome_overview.svg';
import welcomeCareerSvg from '../../../assets/tour_welcome_career.svg';
import welcomeGamificationSvg from '../../../assets/tour_welcome_gamification.svg';
import welcomeFinanceSvg from '../../../assets/tour_welcome_finance.svg';
import welcomeAiSvg from '../../../assets/tour_welcome_ai.svg';

export const TOUR_ASSET_REGISTRY: Record<string, string> = {
  dashboard: dashboardSvg,
  finance: financeSvg,
  career: careerSvg,
  tasks: tasksSvg,
  creditcard: creditcardSvg,
  onboarding: onboardingSvg,
  help: helpSvg,
  profile: profileSvg,
  // welcome campaign assets
  welcome_overview: welcomeOverviewSvg,
  welcome_career: welcomeCareerSvg,
  welcome_gamification: welcomeGamificationSvg,
  welcome_finance: welcomeFinanceSvg,
  welcome_ai: welcomeAiSvg,
  // semantic aliases
  launch: onboardingSvg,
  update: dashboardSvg,
  success: careerSvg,
  feature: tasksSvg,
  development: careerSvg,
};

interface Props {
  asset: string;
  accentColor: string;
  className?: string;
}

export function GuidedTourIllustration({ asset, accentColor, className = '' }: Props) {
  const src = TOUR_ASSET_REGISTRY[asset] ?? TOUR_ASSET_REGISTRY['dashboard'];
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(135deg, ${accentColor}22 0%, ${accentColor}08 100%)`,
      }}
    >
      <div
        className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-[0.07]"
        style={{ background: accentColor }}
      />
      <div
        className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full opacity-[0.06]"
        style={{ background: accentColor }}
      />
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="relative z-10 h-full w-auto object-contain"
        style={{ maxWidth: '75%', maxHeight: '85%' }}
      />
    </div>
  );
}
