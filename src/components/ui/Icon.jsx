import React from 'react';
import { 
  LucideDumbbell, LucideClipboardList, LucideUser, LucideLoader2, LucideSparkles, 
  LucideArrowLeft, LucideDatabase, LucideMessageSquareText, LucideCheckCircle, 
  LucideTarget, LucideUpload, LucideDownload, LucideX, LucideCopy, LucideClipboard,
  LucideMoon, LucideCalendarDays, LucideClock, LucideRefreshCw, LucideCheck, LucideAlertTriangle,
  LucideStar, LucideRuler, LucideWeight, LucideActivity, LucideFlame,
  LucidePlay, LucideSave, LucideSettings, LucideLogOut, LucideChevronRight, LucideInfo,
  LucideLayers, LucideLink, LucidePlus, LucideTimer, LucideToggleLeft, LucideToggleRight,
  LucideLanguages, LucideChevronDown, LucideChevronUp, LucideHeartPulse, LucideShieldAlert,
  LucideBrainCircuit, LucideStethoscope, LucideScanEye, LucideFileJson, LucideLink2, LucideDna,
  LucideHeart, LucideHourglass, LucideArrowRight, LucideZap, LucideTrophy, LucideMaximize2,
  LucideYoutube, LucideFastForward, LucideThumbsUp, LucideThumbsDown, LucideMinus, LucidePause, LucideWind,
  LucideInfo as LucideInfoCircle
} from 'lucide-react'; 

export const Icon = ({ name, className = "" }) => {
  if (name === 'youtube') {
    return (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
        <path d="m10 15 5-3-5-3z" />
      </svg>
    );
  }

  const icons = {
    dumbbell: LucideDumbbell, list: LucideClipboardList, user: LucideUser, loader: LucideLoader2,
    sparkles: LucideSparkles, arrowLeft: LucideArrowLeft, database: LucideDatabase, feedback: LucideMessageSquareText,
    check: LucideCheckCircle, checkSimple: LucideCheck, target: LucideTarget, upload: LucideUpload,
    download: LucideDownload, close: LucideX, copy: LucideCopy, clipboard: LucideClipboard,
    moon: LucideMoon, calendar: LucideCalendarDays, clock: LucideClock, refresh: LucideRefreshCw,
    alert: LucideAlertTriangle, star: LucideStar, biceps: LucideDumbbell,
    ruler: LucideRuler, weight: LucideWeight, activity: LucideActivity, flame: LucideFlame,
    play: LucidePlay, save: LucideSave, settings: LucideSettings, logout: LucideLogOut, 
    chevronRight: LucideChevronRight, info: LucideInfoCircle, layers: LucideLayers, link: LucideLink,
    plus: LucidePlus, timer: LucideTimer, toggleOn: LucideToggleRight, toggleOff: LucideToggleLeft,
    lang: LucideLanguages, chevronDown: LucideChevronDown, chevronUp: LucideChevronUp,
    heartPulse: LucideHeartPulse, shieldAlert: LucideShieldAlert, brain: LucideBrainCircuit,
    stethoscope: LucideStethoscope, scanEye: LucideScanEye, fileJson: LucideFileJson, link2: LucideLink2,
    dna: LucideDna, flower: LucideHeart, calendarHeart: LucideCalendarDays, hourglass: LucideHourglass, coffee: LucideClock,
    arrowRight: LucideArrowRight, zap: LucideZap, trophy: LucideTrophy, max: LucideMaximize2, youtube: LucideYoutube,
    fastForward: LucideFastForward, thumbsUp: LucideThumbsUp, thumbsDown: LucideThumbsDown, minus: LucideMinus,
    pause: LucidePause, wind: LucideWind
  };
  
  const LucideIcon = icons[name];
  if (!LucideIcon) return null; 
  return <LucideIcon className={`${className}`} strokeWidth={2} />;
};

export default Icon;