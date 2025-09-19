

import React from 'react';
import { ViewName, NavItemType, UserRole, GrantCategory, PrimaryCreativeCategoryDef } from './types.ts';
import {
  CheckCircleIcon as SolidCheckCircleIcon, XCircleIcon as SolidXCircleIcon, ClockIcon as SolidClockIcon,
  ArrowPathIcon as SolidArrowPathIcon, PaperClipIcon as SolidPaperClipIcon, ArrowDownCircleIcon as SolidArrowDownCircleIcon,
  PlusIcon as SolidPlusIcon, ChevronLeftIcon as SolidChevronLeftIcon, ChevronRightIcon as SolidChevronRightIcon,
  StarIcon as SolidStarIcon, SparklesIcon as SolidSparklesIcon, XMarkIcon as SolidXMarkIcon, BellIcon as SolidBellIcon,
  ArrowRightOnRectangleIcon as SolidLoginIcon, UserPlusIcon as SolidUserPlusIcon, ArrowUturnLeftIcon as SolidLogoutIcon,
  MapPinIcon as SolidMapPinIcon, CalendarDaysIcon as SolidCalendarDaysIcon,
  InformationCircleIcon as SolidInfoIcon, ArrowDownTrayIcon as SolidDownloadIcon, CloudArrowUpIcon as SolidUploadCloudIcon,
  ChartBarIcon as SolidChartBarIcon, ChatBubbleBottomCenterTextIcon as SolidChatBubbleIcon,
  ChevronDoubleLeftIcon as SolidChevronDoubleLeftIcon, ChevronDoubleRightIcon as SolidChevronDoubleRightIcon,
  Bars3Icon as SolidBars3Icon, WrenchScrewdriverIcon as SolidWrenchScrewdriverIcon,
  DevicePhoneMobileIcon as SolidDevicePhoneMobileIcon,
  CursorArrowRaysIcon as SolidCursorArrowRaysIcon,
  AdjustmentsHorizontalIcon as SolidAdjustmentsHorizontalIcon,
  MapIcon as SolidMapIcon,
} from '@heroicons/react/24/solid';

// =================================================================
// --- RE-EXPORTED HEROICONS (For consistent use) ---
// =================================================================
export const CheckCircleIcon = SolidCheckCircleIcon;
export const XCircleIcon = SolidXCircleIcon;
export const ClockIcon = SolidClockIcon;
export const ArrowPathIcon = SolidArrowPathIcon;
export const PaperClipIcon = SolidPaperClipIcon;
export const ArrowDownCircleIcon = SolidArrowDownCircleIcon;
export const PlusIcon = SolidPlusIcon;
export const ChevronLeftIcon = SolidChevronLeftIcon;
export const ChevronRightIcon = SolidChevronRightIcon;
export const StarIcon = SolidStarIcon;
export const SparklesIcon = SolidSparklesIcon;
export const XMarkIcon = SolidXMarkIcon;
export const BellIcon = SolidBellIcon;
export const LoginIcon = SolidLoginIcon;
export const UserPlusIcon = SolidUserPlusIcon;
export const LogoutIcon = SolidLogoutIcon;
export const MapPinIcon = SolidMapPinIcon;
export const ArrowUturnLeftIcon = SolidLogoutIcon;
export const InfoIcon = SolidInfoIcon;
export const DownloadIcon = SolidDownloadIcon;
export const UploadCloudIcon = SolidUploadCloudIcon;
export const EventAnalyticsIcon: React.FC<{ className?: string }> = SolidChartBarIcon;
export const ChatBubbleBottomCenterTextIcon = SolidChatBubbleIcon;
export const ChevronDoubleLeftIcon = SolidChevronDoubleLeftIcon;
export const ChevronDoubleRightIcon = SolidChevronDoubleRightIcon;
export const Bars3Icon = SolidBars3Icon;
export const WebsiteManagementIcon = SolidWrenchScrewdriverIcon;
export const DevicePhoneMobileIcon = SolidDevicePhoneMobileIcon;
export const CursorArrowRaysIcon = SolidCursorArrowRaysIcon;
export const AccessibilityIcon = SolidAdjustmentsHorizontalIcon;
export const MapIcon = SolidMapIcon;
export { SolidCalendarDaysIcon as CalendarDaysIcon };


// =================================================================
// --- CUSTOM SVG ICONS ---
// =================================================================
export const LogoIcon: React.FC<{ className?: string }> = ({ className = "h-16 w-auto" }) => (
    <svg viewBox="0 0 110 110" className={className} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
        <defs><clipPath id="globe-clip-for-logo"><circle cx="50" cy="50" r="38"/></clipPath></defs>
        <g transform="translate(5, 5)">
            <path d="M 12,62 A 45 45 0 0 1 88,62 A 50 50 0 0 0 12,62 Z" fill="#981b1e" />
            <path d="M 12,38 A 45 45 0 0 0 88,38 A 50 50 0 0 1 12,38 Z" fill="#fcc500" />
            <g clipPath="url(#globe-clip-for-logo)">
                <circle cx="50" cy="50" r="38" fill="#b9935a"/>
                <g id="network" fill="#e4c89a" stroke="#e4c89a" strokeWidth="1.5">
                    <line x1="50" y1="28" x2="35" y2="38" /><line x1="50" y1="28" x2="65" y2="38" />
                    <line x1="35" y1="38" x2="25" y2="50" /><line x1="35" y1="38" x2="50" y2="50" />
                    <line x1="65" y1="38" x2="50" y2="50" /><line x1="65" y1="38" x2="75" y2="50" />
                    <line x1="65" y1="38" x2="80" y2="45" /><line x1="25" y1="50" x2="35" y2="62" />
                    <line x1="50" y1="50" x2="35" y2="62" /><line x1="50" y1="50" x2="65" y2="62" />
                    <line x1="75" y1="50" x2="65" y2="62" /><line x1="75" y1="50" x2="80" y2="58" />
                    <line x1="35" y1="62" x2="50" y2="72" /><line x1="65" y1="62" x2="50" y2="72" />
                    <line x1="35" y1="38" x2="45" y2="50" /><line x1="45" y1="50" x2="50" y2="50" /><line x1="45" y1="50" x2="35" y2="62" />
                    <circle cx="50" cy="28" r="4" /><circle cx="35" cy="38" r="4" /><circle cx="65" cy="38" r="4" />
                    <circle cx="25" cy="50" r="4" /><circle cx="50" cy="50" r="5" /><circle cx="75" cy="50" r="4" />
                    <circle cx="45" cy="50" r="3" /><circle cx="35" cy="62" r="4" /><circle cx="65" cy="62" r="4" />
                    <circle cx="50" cy="72" r="4" /><circle cx="80" cy="45" r="3" /><circle cx="80" y2="58" r="3" />
                </g>
            </g>
        </g>
    </svg>
);

// --- NAVIGATION ICONS ---
export const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>);
export const DashboardIcon: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>);
export const TourismClusterIcon: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M5 6h14M5 9h14m0 3H5m14 3H5m14 3H5M5 21v-5.172a2 2 0 01.586-1.414l2.828-2.828a2 2 0 012.828 0l2.828 2.828a2 2 0 01.586 1.414V21M5 21h14" /></svg>);
export const GrantApplicationsIcon: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>);
export const EventsCalendarIcon: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>);
export const UserManagementIcon: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 016-6h6a6 6 0 016 6v1h-3" /></svg>);
export const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);

// --- UI & THEME ICONS ---
export const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>);
export const SunIcon: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M12 12a4 4 0 110-8 4 4 0 010 8z" /></svg>);
export const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>);
export const FilterIcon: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>);
export const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>);
export const EyeIcon: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>);
export const PencilIcon: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>);
export const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);

// --- DASHBOARD STAT CARD ICONS ---
export const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 016-6h6a6 6 0 016 6v1h-3M17 14a2 2 0 100-4 2 2 0 000 4zM21 14a2 2 0 100-4 2 2 0 000 4zM19 8a2 2 0 100-4 2 2 0 000 4z" /></svg>);
export const SuitcaseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-7.527a2 2 0 01-1.789-2.894l-3.5-7A2 2 0 014.236 10H9v2H4.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 017.737 1h7.527a2 2 0 011.789 2.106L14 10z" /></svg>);
export const CheckListIcon: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>);

// --- CLUSTER CATEGORY ICONS ---
export const AssociationClusterIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 016-6h6a6 6 0 016 6v1h-3M17 14a2 2 0 100-4 2 2 0 000 4zM21 14a2 2 0 100-4 2 2 0 000 4zM19 8a2 2 0 100-4 2 2 0 000 4z" /></svg>);
export const HomestayClusterIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a.75.75 0 011.06 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 10.75C11.0211 10.75 10.25 11.5211 10.25 12.5C10.25 14.1569 12 15.5 12 15.5C12 15.5 13.75 14.1569 13.75 12.5C13.75 11.5211 12.9789 10.75 12 10.75Z" /></svg>);
export const CultureClusterIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18" /></svg>);
export const AdventureClusterIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12.75l-3.75-3.75-3.75 3.75" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 19.5h18l-9-15-9 15z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v4.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 9l3-1.5" /></svg>);
export const NatureClusterIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 8.25c0-1.24.984-2.25 2.25-2.25s2.25.984 2.25 2.25c0 1.24-.984 2.25-2.25 2.25S13.5 9.49 13.5 8.25z" /><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 15.75c0-1.24.984-2.25 2.25-2.25S15 14.51 15 15.75c0 1.24-.984 2.25-2.25 2.25S10.5 16.99 10.5 15.75z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 10.5c0-1.24.984-2.25 2.25-2.25S10.5 9.26 10.5 10.5c0 1.24-.984 2.25-2.25 2.25S6 11.74 6 10.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 15.75c0-1.24.984-2.25 2.25-2.25s2.25.984 2.25 2.25c0 1.24-.984 2.25-2.25 2.25s-2.25-1.01-2.25-2.25z" /><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5c0-1.24.984-2.25 2.25-2.25S12.75 3.26 12.75 4.5c0 1.24-.984 2.25-2.25 2.25S8.25 5.74 8.25 4.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 21V10.5" /></svg>);
export const FoodsClusterIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v18m0-18h2.25M8.25 3h-2.25m2.25 3.75H6m2.25 0h2.25m-2.25 3.75H6m2.25 0h2.25" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 3v18m0-18c1.242 0 2.25 1.008 2.25 2.25S16.992 7.5 15.75 7.5 13.5 6.492 13.5 5.25 14.508 3 15.75 3z" /></svg>);
export const FestivalsClusterIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v.01M12 6v.01M12 9v.01" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 3.75L15 4.5m1.5-1.5l.75.75" /><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3.75L9 4.5M7.5 3.75l-.75.75" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 12c-2.485 0-4.5 2.015-4.5 4.5S9.515 21 12 21s4.5-2.015 4.5-4.5S14.485 12 12 12z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 12V3" /></svg>);


// =================================================================
// --- MOCK DATA & CONFIGURATIONS ---
// =================================================================
export const MOCK_GRANT_CATEGORIES: GrantCategory[] = [
    { id: 'heritage-fund', name: 'Sarawak Heritage Facilitation Funds' },
    { id: 'film-fund', name: 'Filming, Videography & Documentary Fund' },
    { id: 'event-fund', name: 'Tourism Event Management Fund' },
    { id: 'rd-fund', name: 'Research & Development Fund' },
];
  
export const MOCK_CREATIVE_CATEGORIES: PrimaryCreativeCategoryDef[] = [
    {
      id: 'performing-arts',
      name: 'Performing Arts',
      subcategories: [
        { id: 'pa-music', name: 'Music' },
        { id: 'pa-dance', name: 'Dance' },
        { id: 'pa-theatre', name: 'Theatre' },
      ],
    },
    {
      id: 'visual-arts',
      name: 'Visual Arts',
      subcategories: [
        { id: 'va-painting', name: 'Painting' },
        { id: 'va-sculpture', name: 'Sculpture' },
        { id: 'va-photography', name: 'Photography' },
      ],
    },
    {
      id: 'crafts',
      name: 'Crafts',
      subcategories: [],
    },
];

export const MOCK_ROI_DATA = [
    { name: '2020', Revenue: 400, Income: 240 },
    { name: '2021', Revenue: 300, Income: 139 },
    { name: '2022', Revenue: 2000, Income: 980 },
    { name: '2023', Revenue: 2780, Income: 3908 },
    { name: '2024', Revenue: 1890, Income: 4800 },
];
  
/** Defines which internal views can be linked to from a promotion. */
export const PROMOTION_CTA_VIEWS: ViewName[] = [
  ViewName.Dashboard, ViewName.TourismCluster, ViewName.GrantApplications,
  ViewName.TourismStatistics, ViewName.EventsCalendar,
];

// --- APP CONFIGURATION CONSTANTS ---
export const USER_ROLES: UserRole[] = ['Admin', 'Editor', 'User', 'Tourism Player'];

/** Main navigation items for authenticated users. */
export const NAV_ITEMS: NavItemType[] = [
  { name: ViewName.MainMenu, icon: HomeIcon },
  { name: ViewName.Dashboard, icon: DashboardIcon },
  { name: ViewName.AIPlanner, icon: SparklesIcon },
  { name: ViewName.TourismCluster, icon: TourismClusterIcon },
  { name: ViewName.TourismMapping, icon: MapIcon },
  { name: ViewName.ManageMyClusters, icon: CursorArrowRaysIcon },
  { name: ViewName.GrantApplications, icon: GrantApplicationsIcon },
  { name: ViewName.TourismStatistics, icon: EventAnalyticsIcon },
  { name: ViewName.EventsCalendar, icon: EventsCalendarIcon },
  { name: ViewName.UserManagement, icon: UserManagementIcon },
  { name: ViewName.WebsiteManagement, icon: WebsiteManagementIcon },
  { name: ViewName.SystemFeedback, icon: ChatBubbleBottomCenterTextIcon },
  { name: ViewName.Settings, icon: SettingsIcon },
];

/** Navigation items for guest users. */
export const GUEST_NAV_ITEMS: NavItemType[] = [
  { name: ViewName.Dashboard, icon: DashboardIcon },
  { name: ViewName.AIPlanner, icon: SparklesIcon },
  { name: ViewName.TourismCluster, icon: TourismClusterIcon },
  { name: ViewName.TourismMapping, icon: MapIcon },
  { name: ViewName.EventsCalendar, icon: EventsCalendarIcon },
  { name: ViewName.TourismStatistics, icon: EventAnalyticsIcon },
];

export const CLUSTER_CATEGORIES = [
    { id: 'Association', name: 'Association', icon: AssociationClusterIcon },
    { id: 'Homestay', name: 'Homestay', icon: HomestayClusterIcon },
    { id: 'Culture', name: 'Culture', icon: CultureClusterIcon },
    { id: 'Adventure', name: 'Adventure', icon: AdventureClusterIcon },
    { id: 'Nature', name: 'Nature', icon: NatureClusterIcon },
    { id: 'Foods', name: 'Foods', icon: FoodsClusterIcon },
    { id: 'Festivals', name: 'Festivals', icon: FestivalsClusterIcon },
];