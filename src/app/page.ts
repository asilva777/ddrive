/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Chat } from '@google/genai';
import { Session } from '@supabase/supabase-js';
import { triggerAIAnalysis, handleManualAssessmentSubmit, handleUpgrade, handleStatusChange, exportToCSV, initializeChatbot, handleChatSubmit } from '../services/riskAssessment';
import * as userAuth from '../services/userAuth';
import { Risk, UserPlan } from '../types/index';
import { t, setLanguage, translations } from '../i18n';
import { roleConfig } from '../config/roles';


// --- DOM Element Selectors ---
export const appContainer = document.querySelector('.app-container') as HTMLDivElement;
export const assessButton = document.querySelector('#assess-button') as HTMLButtonElement;
export const exportCsvButton = document.querySelector('#export-csv-button') as HTMLButtonElement;
export const exportReportButton = document.querySelector('#export-report-button') as HTMLButtonElement;
export const fileInput = document.querySelector('#file-input') as HTMLInputElement;
export const fileNameSpan = document.querySelector('#file-name') as HTMLSpanElement;
export const imagePreview = document.querySelector('#image-preview') as HTMLImageElement;
export const imagePlaceholder = document.querySelector('#image-placeholder') as HTMLParagraphElement;
export const promptInput = document.querySelector('#prompt-input') as HTMLTextAreaElement;
export const urlInput = document.querySelector('#url-input') as HTMLInputElement;
export const latInput = document.querySelector('#lat-input') as HTMLInputElement;
export const lngInput = document.querySelector('#lng-input') as HTMLInputElement;
export const elevationInput = document.querySelector('#elevation-input') as HTMLInputElement;
export const proximityInput = document.querySelector('#proximity-input') as HTMLInputElement;

export const resultDiv = document.querySelector('#assessment-result') as HTMLDivElement;
export const loader = document.querySelector('#loader') as HTMLDivElement;
export const frame = document.querySelector('#embed-map') as HTMLIFrameElement;
export const totalRisksValue = document.querySelector('#total-risks-value') as HTMLSpanElement;
export const criticalAlertsValue = document.querySelector('#critical-alerts-value') as HTMLSpanElement;
export const systemStatusValue = document.querySelector('#system-status-value') as HTMLSpanElement;
export const unifiedRiskScoreValue = document.querySelector('#unified-risk-score-value') as HTMLSpanElement;
export const digitalScoreValue = document.querySelector('#digital-score-value') as HTMLSpanElement;
export const geoScoreValue = document.querySelector('#geo-score-value') as HTMLSpanElement;

export const assessmentHistoryDisplay = document.querySelector('#assessment-history-display') as HTMLDivElement;
export const assessmentHistoryList = document.querySelector('#assessment-history-list') as HTMLUListElement;

export const bannerTitle = document.querySelector('#banner-title') as HTMLHeadingElement;
export const bannerSubtitle = document.querySelector('#banner-subtitle') as HTMLParagraphElement;
export const themeToggleButton = document.querySelector('#theme-toggle') as HTMLButtonElement;
export const limitNotification = document.querySelector('#limit-notification') as HTMLDivElement;

export const broadcastButton = document.querySelector('#broadcast-button') as HTMLButtonElement;
export const contactPoliceButton = document.querySelector('#contact-police') as HTMLButtonElement;
export const contactFireButton = document.querySelector('#contact-fire') as HTMLButtonElement;
export const contactSecurityButton = document.querySelector('#contact-security') as HTMLButtonElement;

// Onboarding & Auth Elements
export const onboardingOverlay = document.querySelector('#onboarding-overlay') as HTMLDivElement;
export const landingPage = document.querySelector('#landing-page') as HTMLDivElement;
export const getStartedButton = document.querySelector('#get-started-button') as HTMLButtonElement;
export const loginNavButton = document.querySelector('#login-nav-button') as HTMLButtonElement;
export const loginContainer = document.querySelector('#login-container') as HTMLDivElement;
export const emailInput = document.querySelector('#email-input') as HTMLInputElement;
export const passwordInput = document.querySelector('#password-input') as HTMLInputElement;
export const loginButton = document.querySelector('#login-button') as HTMLButtonElement;
export const signupButton = document.querySelector('#signup-button') as HTMLButtonElement;
export const magicLinkButton = document.querySelector('#magic-link-button') as HTMLButtonElement;
export const authError = document.querySelector('#auth-error') as HTMLParagraphElement;
export const authSuccess = document.querySelector('#auth-success') as HTMLParagraphElement;
export const authTitle = document.querySelector('#auth-title') as HTMLHeadingElement;
export const authText = document.querySelector('#auth-text') as HTMLParagraphElement;
export const userInfo = document.querySelector('#user-info') as HTMLDivElement;
export const userEmail = document.querySelector('#user-email') as HTMLSpanElement;
export const logoutButton = document.querySelector('#logout-button') as HTMLButtonElement;
export const restartTourButton = document.querySelector('#restart-tour-button') as HTMLButtonElement;
export const userProfileButton = document.querySelector('#user-profile') as HTMLButtonElement;

// Tour Elements
export const onboardingTooltip = document.querySelector('#onboarding-tooltip') as HTMLDivElement;
export const onboardingTitle = document.querySelector('#onboarding-title') as HTMLHeadingElement;
export const onboardingText = document.querySelector('#onboarding-text') as HTMLParagraphElement;
export const onboardingHelpButton = document.querySelector('#onboarding-help') as HTMLButtonElement;
export const onboardingSkipButton = document.querySelector('#onboarding-skip') as HTMLButtonElement;
export const onboardingPrevButton = document.querySelector('#onboarding-prev') as HTMLButtonElement;
export const onboardingNextButton = document.querySelector('#onboarding-next') as HTMLButtonElement;
export const onboardingProgressBar = document.querySelector('#onboarding-progress-bar') as HTMLDivElement;
export const languageSelector = document.querySelector('#language-selector') as HTMLSelectElement;

// Upgrade Modal Elements
export const upgradeModal = document.querySelector('#upgrade-modal') as HTMLDivElement;
export const closeUpgradeModalButton = document.querySelector('#close-upgrade-modal-button') as HTMLButtonElement;
export const upgradePlanButton = document.querySelector('#upgrade-plan-button') as HTMLButtonElement;
export const upgradeFromNoticeButton = document.querySelector('#upgrade-from-notice-button') as HTMLButtonElement;
export const checkoutButton = document.querySelector('#checkout-button') as HTMLButtonElement;
export const upgradeRoleDisplay = document.querySelector('#upgrade-role-display') as HTMLSpanElement;
export const upgradePriceDisplay = document.querySelector('#upgrade-price-display') as HTMLSpanElement;
export const upgradeViewMain = document.querySelector('#upgrade-view-main') as HTMLDivElement;
export const upgradeViewSuccess = document.querySelector('#upgrade-view-success') as HTMLDivElement;
export const closeSuccessModalButton = document.querySelector('#close-success-modal-button') as HTMLButtonElement;

// Chatbot Elements
export const chatbotWidget = document.querySelector('#chatbot-widget') as HTMLDivElement;
export const openChatbotButton = document.querySelector('#open-chatbot-button') as HTMLButtonElement;
export const closeChatbotButton = document.querySelector('#close-chatbot-button') as HTMLButtonElement;
export const chatbotMessages = document.querySelector('#chatbot-messages') as HTMLDivElement;
export const chatbotInputForm = document.querySelector('#chatbot-input-form') as HTMLFormElement;
export const chatbotInput = document.querySelector('#chatbot-input') as HTMLInputElement;
export const chatbotSendButton = document.querySelector('#chatbot-send-button') as HTMLButtonElement;
export const chatbotTypingIndicator = document.querySelector('#chatbot-typing-indicator') as HTMLDivElement;
export const chatbotTitle = document.querySelector('#chatbot-title') as HTMLHeadingElement;

// New Assessment Form Elements
export const assessmentFormModal = document.querySelector('#assessment-form-modal') as HTMLDivElement;
export const newAssessmentButton = document.querySelector('#new-assessment-button') as HTMLButtonElement;
export const closeAssessmentFormButton = document.querySelector('#close-assessment-form-button') as HTMLButtonElement;
export const riskAssessmentForm = document.querySelector('#risk-assessment-form') as HTMLFormElement;

// Undo Toast Elements
const undoToast = document.querySelector('#undo-toast') as HTMLDivElement;
const undoMessage = document.querySelector('#undo-message') as HTMLSpanElement;
const undoButton = document.querySelector('#undo-button') as HTMLButtonElement;

// --- State Variables ---
let session: Session | null = null;
let imageBase64: string | null = null;
let imageMimeType: string | null = null;
let currentRisks: Risk[] = [];
let currentUserPlan: UserPlan | null = null;
let currentUserRole: string | null = null;
let chat: Chat | null = null;
let lastAssessmentContext: { prompt: string; url: string; timestamp: string } | null = null;

export const state = {
    get session() { return session; },
    set session(value) { session = value; },
    get imageBase64() { return imageBase64; },
    set imageBase64(value) { imageBase64 = value; },
    get imageMimeType() { return imageMimeType; },
    set imageMimeType(value) { imageMimeType = value; },
    get currentRisks() { return currentRisks; },
    set currentRisks(value) { currentRisks = value; },
    get currentUserPlan() { return currentUserPlan; },
    set currentUserPlan(value) { currentUserPlan = value; },
    get currentUserRole() { return currentUserRole; },
    set currentUserRole(value) { currentUserRole = value; },
    get chat() { return chat; },
    set chat(value) { chat = value; },
    get lastAssessmentContext() { return lastAssessmentContext; },
    set lastAssessmentContext(value) { lastAssessmentContext = value; },
};

// --- Accessibility & Focus Management ---
let openerElement: HTMLElement | null = null;
const focusableElementsSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const keydownHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
        if (!upgradeModal.classList.contains('hidden')) {
            hideUpgradeModal();
        } else if (!assessmentFormModal.classList.contains('hidden')) {
            hideAssessmentForm();
        } else if (!chatbotWidget.classList.contains('hidden')) {
            toggleChatbot(false);
        } else if (!onboardingTooltip.classList.contains('hidden')) {
            endTour();
        }
    }

    const modal = document.querySelector('[role="dialog"]:not(.hidden)') as HTMLElement;
    if (!modal) return;
    
    const focusableEls = Array.from(modal.querySelectorAll(focusableElementsSelector)) as HTMLElement[];
    if (focusableEls.length === 0) return;
    
    const firstFocusableEl = focusableEls[0];
    const lastFocusableEl = focusableEls[focusableEls.length - 1];
    
    if (e.key === 'Tab') {
      if (e.shiftKey) { /* shift + tab */
        if (document.activeElement === firstFocusableEl) {
          lastFocusableEl.focus();
          e.preventDefault();
        }
      } else { /* tab */
        if (document.activeElement === lastFocusableEl) {
          firstFocusableEl.focus();
          e.preventDefault();
        }
      }
    }
};

function openModal(modal: HTMLElement, contentSelector?: string) {
    openerElement = document.activeElement as HTMLElement;
    modal.classList.remove('hidden');

    const content = contentSelector ? modal.querySelector(contentSelector) as HTMLElement : modal;
    content.classList.remove('animate-out');
    content.classList.add('animate-in');

    const firstFocusableEl = modal.querySelector(focusableElementsSelector) as HTMLElement;
    if (firstFocusableEl) {
        firstFocusableEl.focus();
    }
    document.addEventListener('keydown', keydownHandler);
}

function closeModal(modal: HTMLElement, contentSelector?: string) {
    const content = contentSelector ? modal.querySelector(contentSelector) as HTMLElement : modal;
    content.classList.remove('animate-in');
    content.classList.add('animate-out');

    const onAnimationEnd = () => {
        modal.classList.add('hidden');
        if (openerElement) {
            openerElement.focus();
            openerElement = null;
        }
        content.removeEventListener('animationend', onAnimationEnd);
        document.removeEventListener('keydown', keydownHandler);
    };

    content.addEventListener('animationend', onAnimationEnd);
}


// --- UI & Dashboard Functions ---
export function getReportSkeleton() {
  return `
    <div class="skeleton">
        <div class="skeleton-line title"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line half"></div>
        <div class="skeleton-line second title"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line half"></div>
        <p>Your detailed risk assessment report will appear here.</p>
    </div>
  `;
}

export function resetDashboard() {
  totalRisksValue.textContent = '-';
  criticalAlertsValue.textContent = '-';
  unifiedRiskScoreValue.textContent = '-';
  digitalScoreValue.textContent = 'Digital: -';
  geoScoreValue.textContent = 'Geo: -';
  systemStatusValue.textContent = 'Operational';
  systemStatusValue.style.color = '';
  assessmentHistoryDisplay.classList.add('hidden');
  exportCsvButton.disabled = true;
  exportReportButton.disabled = true;
  assessmentHistoryList.innerHTML = '<p>Run an assessment to populate the history.</p>';
  resultDiv.innerHTML = getReportSkeleton();
}

export function updateDashboardStats(
  risks: Risk[],
  scores?: { digitalScore: number; geoScore: number; finalScore: number }
) {
  const totalRisks = risks.length;
  const criticalAlerts = risks.filter(
    (risk) => risk.severity.toLowerCase() === 'critical'
  ).length;

  totalRisksValue.textContent = totalRisks.toString();
  criticalAlertsValue.textContent = criticalAlerts.toString();

  if (scores) {
    unifiedRiskScoreValue.textContent = scores.finalScore.toString();
    digitalScoreValue.textContent = `Digital: ${Math.round(scores.digitalScore)}`;
    geoScoreValue.textContent = `Geo: ${Math.round(scores.geoScore)}`;
  }

  if (risks.length > 0) {
      assessmentHistoryDisplay.classList.remove('hidden');
  }
  updateFeatureAccess(); 
}

export function updateFeatureAccess() {
    if (!currentUserPlan || !currentUserRole) return;

    const appRole = supabaseRoleToAppRole(currentUserRole);
    const permissions = roleConfig[appRole].permissions;
    const { assessment_count, assessment_limit, is_premium } = currentUserPlan;
    const hasRisks = currentRisks.length > 0;

    // --- 1. Assessment Controls ---
    const isOverLimit = !is_premium && assessment_count >= assessment_limit;
    const canCurrentlyAssess = permissions.canAssess && !isOverLimit;

    assessButton.disabled = !canCurrentlyAssess;
    newAssessmentButton.disabled = !permissions.canAssess;
    
    // Disable all input fields if user cannot assess
    const inputsDisabled = !permissions.canAssess;
    [fileInput, urlInput, latInput, lngInput, elevationInput, proximityInput, promptInput].forEach(input => {
        (input as HTMLInputElement | HTMLTextAreaElement).disabled = inputsDisabled;
    });
    document.querySelectorAll('.risk-toggle').forEach(toggle => {
        (toggle as HTMLInputElement).disabled = inputsDisabled;
    });

    if (!permissions.canAssess) {
        const disabledTitle = 'Your role does not have permission to perform this action.';
        assessButton.title = disabledTitle;
        newAssessmentButton.title = disabledTitle;
        limitNotification.classList.add('hidden');
    } else if (isOverLimit) {
        assessButton.title = 'You have reached your assessment limit. Upgrade to continue.';
        limitNotification.classList.remove('hidden');
    } else {
        assessButton.title = 'Start the AI risk assessment based on the provided media and prompt.';
        newAssessmentButton.title = 'Manually log a new assessment without AI analysis.';
        limitNotification.classList.add('hidden');
    }

    exportCsvButton.disabled = !permissions.canExport || !hasRisks;
    exportReportButton.disabled = (!permissions.canExport || !is_premium) || !hasRisks;

    if (!permissions.canExport) {
        const exportDisabledTitle = 'Your role does not have permission to export data.';
        exportCsvButton.title = exportDisabledTitle;
        exportReportButton.title = exportDisabledTitle;
    } else if (!is_premium) {
        exportCsvButton.title = hasRisks ? 'Export risk register to CSV.' : 'Generate risks to enable export.';
        exportReportButton.title = 'Upgrade to Premium to export PDF reports.';
    } else {
        exportCsvButton.title = hasRisks ? 'Export risk register to CSV.' : 'Generate risks to enable export.';
        exportReportButton.title = hasRisks ? 'Export a detailed PDF report.' : 'Generate a report to enable export.';
    }

    upgradePlanButton.textContent = is_premium ? 'Manage Plan' : 'Upgrade Plan';
}


export function renderRiskRegister(risks: Risk[]) {
  assessmentHistoryList.innerHTML = '';
  if (risks.length === 0) {
    assessmentHistoryList.innerHTML = '<p>No risks identified in the last assessment.</p>';
    assessmentHistoryDisplay.classList.add('hidden');
    return;
  }
  assessmentHistoryDisplay.classList.remove('hidden');

  const appRole = supabaseRoleToAppRole(currentUserRole);
  const canEditStatus = roleConfig[appRole]?.permissions.canEditStatus ?? false;

  risks.forEach(risk => {
    const riskItem = document.createElement('div');
    riskItem.className = 'assessment-item';
    
    const statusOptions = ['Open', 'Mitigated', 'Closed']
        .map(status => `<option value="${status}" ${risk.status === status ? 'selected' : ''}>${status}</option>`)
        .join('');

    riskItem.innerHTML = `
      <span class="risk-title" title="${risk.title}">${risk.title}</span>
      <span class="risk-category">${risk.category}</span>
      <span class="risk-severity">${risk.severity}</span>
      <div class="status-select-wrapper">
        <select class="status-select" data-risk-id="${risk.risk_id}" aria-label="Set status for ${risk.title}" ${!canEditStatus ? 'disabled' : ''}>
          ${statusOptions}
        </select>
      </div>
    `;
    assessmentHistoryList.appendChild(riskItem);
  });
  
  if (canEditStatus) {
      document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', handleStatusChange);
      });
  }
}

export function renderMap(location: string | null | undefined) {
  const API_KEY = 'AIzaSyC4WK3O4Qkdo-_fXGIK-FzMt7cVwHZJfvI';
  const query = location || 'World';
  frame.src = `https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=${encodeURIComponent(query)}`;
}

// --- Undo Toast Logic ---
let undoTimer: number | null = null;
let onUndo: (() => Promise<void>) | null = null;

function hideUndoToast() {
    if (undoTimer) {
        clearTimeout(undoTimer);
        undoTimer = null;
    }
    undoToast.classList.remove('fade-in');
    undoToast.classList.add('fade-out');
    // Set a timeout to add 'hidden' after the fade-out animation completes
    setTimeout(() => {
        undoToast.classList.add('hidden');
        onUndo = null;
    }, 300); // Duration should match the CSS animation
}

export function showUndoToast(message: string, undoCallback: () => Promise<void>) {
    if (undoTimer) {
        clearTimeout(undoTimer); // Cancel any existing toast timeout
    }
    
    onUndo = undoCallback;
    undoMessage.textContent = message;
    undoToast.classList.remove('hidden', 'fade-out');
    undoToast.classList.add('fade-in');

    // Automatically hide the toast after 7 seconds
    undoTimer = window.setTimeout(hideUndoToast, 7000);
}

// --- Onboarding Tour Logic ---
let currentTourStep = 0;
let currentTourSteps: any[] = [];
const tourStepDefinitions = {
  welcome: { element: '.banner', titleKey: 'welcome_title', textKey: 'welcome_text', icon: '👋' },
  dashboard: { element: '#dashboard', titleKey: 'dashboard_title', textKey: 'dashboard_text', icon: '📊' },
  mediaUpload: { element: '#assessment-input', titleKey: 'media_upload_title', textKey: 'media_upload_text', icon: '🛰️' },
  analysisControls: { element: '#analysis-controls', titleKey: 'analysis_controls_title', textKey: 'analysis_controls_text', icon: '⚙️' },
  assessButton: { element: '#assess-button', titleKey: 'assess_button_title', textKey: 'assess_button_text', icon: '🚀' },
  riskRegister: {
    element: '#assessment-history-display', titleKey: 'risk_register_title', textKey: 'risk_register_text', icon: '📋',
    preAction: () => {
      assessmentHistoryDisplay.classList.remove('hidden');
      assessmentHistoryList.innerHTML = `<div class="assessment-item"><span class="risk-title">Sample Risk: Unlocked Gate</span><span class="risk-category">Physical</span><span class="risk-severity">High</span><div class="status-select-wrapper"><select class="status-select"><option>Open</option></select></div></div>`;
      exportCsvButton.disabled = false;
    },
    postAction: () => resetDashboard()
  },
  reports: { element: '#report-display', titleKey: 'reports_title', textKey: 'reports_text', icon: '📈' },
  teamHub: { element: '#resilience-team', titleKey: 'team_comm_title', textKey: 'team_comm_text', icon: '📣' },
  profile: { element: '#user-profile', titleKey: 'profile_title', textKey: 'profile_text', icon: '👤' },
};

// Define paths for each role
const tourPaths: Record<string, any[]> = {
  manager: [
    tourStepDefinitions.welcome,
    tourStepDefinitions.dashboard,
    tourStepDefinitions.riskRegister, // Focus 1
    tourStepDefinitions.reports,      // Focus 2
    tourStepDefinitions.teamHub,
    tourStepDefinitions.mediaUpload,
    tourStepDefinitions.profile,
  ],
  operator: [
    tourStepDefinitions.welcome,
    tourStepDefinitions.mediaUpload,  // Focus 1
    tourStepDefinitions.assessButton,
    tourStepDefinitions.teamHub,        // Focus 2
    tourStepDefinitions.dashboard,
    tourStepDefinitions.profile,
  ],
  // A default path for all other roles
  default: [
    tourStepDefinitions.welcome,
    tourStepDefinitions.dashboard,
    tourStepDefinitions.mediaUpload,
    tourStepDefinitions.analysisControls,
    tourStepDefinitions.assessButton,
    tourStepDefinitions.riskRegister,
    tourStepDefinitions.reports,
    tourStepDefinitions.teamHub,
    tourStepDefinitions.profile,
  ],
};


function positionTooltip(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const tooltipRect = onboardingTooltip.getBoundingClientRect();
  let top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
  let left = rect.right + 15;
  // If tooltip goes off-screen to the right, position it on the left
  if (left + tooltipRect.width > window.innerWidth) {
    left = rect.left - tooltipRect.width - 15;
  }
  // If it still goes off-screen to the left (e.g., narrow screen), position it below
  if (left < 0) {
    left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    top = rect.bottom + 15;
  }
  // Clamp position to be within viewport
  top = Math.max(10, Math.min(top, window.innerHeight - tooltipRect.height - 10));
  onboardingTooltip.style.top = `${top}px`;
  onboardingTooltip.style.left = `${left}px`;
}

let highlightedElement: HTMLElement | null = null;

export function showTourStep(index: number) {
  if (currentTourStep > 0 && currentTourSteps[currentTourStep - 1]?.postAction) {
    currentTourSteps[currentTourStep - 1].postAction!();
  }
  if (highlightedElement) {
    highlightedElement.classList.remove('onboarding-highlight');
  }

  currentTourStep = index;
  onboardingProgressBar.setAttribute('aria-valuenow', index.toString());

  if (index > currentTourSteps.length) {
    endTour();
    return;
  }

  const step = currentTourSteps[index - 1];
  const element = document.querySelector(step.element) as HTMLElement;
  if (!element) {
    console.warn('Onboarding element not found:', step.element);
    endTour();
    return;
  }
  
  if (step.preAction) step.preAction();
  
  const appRole = supabaseRoleToAppRole(currentUserRole);
  const lang = localStorage.getItem('ddrive-language') || 'en';
  
  // Logic to find the best translation key (role-specific or default)
  const getTranslationKey = (baseKey: string, role: string, language: string) => {
      const roleSpecificKey = `${baseKey}_${role}`;
      const langTranslations = translations[language as keyof typeof translations] || translations.en;
      return langTranslations[roleSpecificKey as keyof typeof langTranslations] ? roleSpecificKey : baseKey;
  };

  const titleKey = getTranslationKey(step.titleKey, appRole, lang);
  const textKey = getTranslationKey(step.textKey, appRole, lang);

  if (index === 1 && currentUserRole) {
      const roleInfo = roleConfig[appRole];
      const friendlyRoleName = currentUserRole.replace(/([A-Z])/g, ' $1').trim();
      onboardingTitle.textContent = t('welcome_title', { role: friendlyRoleName });
      onboardingText.innerHTML = t(textKey, { description: roleInfo.description });
  } else {
      onboardingTitle.textContent = t(titleKey);
      onboardingText.innerHTML = t(textKey);
  }
  
  onboardingPrevButton.disabled = index === 1;
  onboardingNextButton.textContent = index === currentTourSteps.length ? t('finish_button') : t('next_button');
  onboardingPrevButton.textContent = t('prev_button');
  onboardingSkipButton.textContent = t('skip_button');
  onboardingHelpButton.textContent = t('help_button');
  
  highlightedElement = element;
  highlightedElement.classList.add('onboarding-highlight');
  positionTooltip(element);
  
  document.querySelectorAll('.progress-step').forEach((stepEl, i) => {
    stepEl.classList.toggle('active', i < index);
  });
}

function startTour() {
  onboardingOverlay.classList.remove('hidden', 'is-login-screen');
  loginContainer.classList.add('hidden');
  landingPage.classList.add('hidden');
  
  const appRole = supabaseRoleToAppRole(state.currentUserRole);
  currentTourSteps = tourPaths[appRole] || tourPaths.default;
  onboardingProgressBar.setAttribute('aria-valuemax', currentTourSteps.length.toString());

  onboardingProgressBar.innerHTML = '';
  currentTourSteps.forEach(step => {
      const stepEl = document.createElement('div');
      stepEl.className = 'progress-step';
      stepEl.innerHTML = `<span>${step.icon}</span>`;
      stepEl.setAttribute('aria-label', t(step.titleKey));
      onboardingProgressBar.appendChild(stepEl);
  });
  
  openModal(onboardingTooltip);
  showTourStep(1);
}

function endTour() {
  onboardingOverlay.classList.add('hidden');
  if (highlightedElement) {
    highlightedElement.classList.remove('onboarding-highlight');
    highlightedElement = null;
  }
  const lastStep = currentTourSteps[currentTourStep - 1];
  if (lastStep && lastStep.postAction) {
    lastStep.postAction();
  }
  if (session) {
      userAuth.updateUserMetadata({ tour_completed: true });
  }
  closeModal(onboardingTooltip);
}

// --- Theme & Role Management ---
function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('ddrive-theme', theme);
  const label = `Switch to ${theme === 'light' ? 'dark' : 'light'} theme`;
  themeToggleButton.setAttribute('aria-label', label);
  themeToggleButton.setAttribute('title', label);
}

function toggleTheme() {
  const newTheme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
  if (currentUserRole) {
    applyRole(supabaseRoleToAppRole(currentUserRole));
  }
}

function loadInitialTheme() {
  const savedTheme = localStorage.getItem('ddrive-theme') as 'light' | 'dark' | null;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
}

export function supabaseRoleToAppRole(supabaseRole?: string | null): keyof typeof roleConfig {
    if (!supabaseRole) return 'intern';
    const matchingRole = Object.entries(roleConfig).find(
        ([_key, value]) => value.supabaseRole === supabaseRole
    );
    return (matchingRole ? matchingRole[0] : 'intern') as keyof typeof roleConfig;
}

export function applyRole(role: keyof typeof roleConfig) {
    const config = roleConfig[role];
    if (config && bannerTitle && bannerSubtitle) {
        currentUserRole = config.supabaseRole;
        bannerTitle.innerHTML = `${config.icon} ${config.title}`;
        bannerSubtitle.textContent = config.description;
        const isLightTheme = document.documentElement.dataset.theme === 'light';
        const roleColor = isLightTheme ? config.colorLight : config.color;
        document.documentElement.style.setProperty('--role-color', roleColor);
    }
}

// --- Authentication & Data Loading ---
export function showAuthMessage(message: string, type: 'error' | 'success') {
    if (type === 'error') {
        authSuccess.classList.add('hidden');
        authSuccess.textContent = '';
        authError.textContent = message;
        authError.classList.remove('hidden');
    } else {
        authError.classList.add('hidden');
        authError.textContent = '';
        authSuccess.textContent = message;
        authSuccess.classList.remove('hidden');
    }
}

export function hideAuthMessages() {
    authError.classList.add('hidden');
    authError.textContent = '';
    authSuccess.classList.add('hidden');
    authSuccess.textContent = '';
}

// --- Freemium/Upgrade Modal Logic ---
export function showUpgradeModal() {
  if (!currentUserRole) return;
  const price = roleConfig[supabaseRoleToAppRole(currentUserRole)].price || 0;
  upgradeRoleDisplay.textContent = currentUserRole;
  upgradePriceDisplay.textContent = `$${price.toFixed(2)}`;
  
  upgradeViewMain.classList.remove('hidden');
  upgradeViewSuccess.classList.add('hidden');
  
  openModal(upgradeModal, '.upgrade-modal-content');
}

function hideUpgradeModal() {
    closeModal(upgradeModal, '.upgrade-modal-content');
}

// --- AI Chatbot Logic ---
export function toggleChatbot(forceOpen?: boolean) {
    const isCurrentlyOpen = !chatbotWidget.classList.contains('hidden');
    const shouldOpen = forceOpen === true || (forceOpen === undefined && !isCurrentlyOpen);

    if (shouldOpen && !isCurrentlyOpen) {
        openChatbotButton.classList.add('hidden');
        chatbotWidget.classList.remove('hidden');
        chatbotWidget.classList.remove('animate-out');
        chatbotWidget.classList.add('animate-in');
        chatbotWidget.addEventListener('animationend', () => chatbotInput.focus(), { once: true });
    } else if (!shouldOpen && isCurrentlyOpen) {
        chatbotWidget.classList.remove('animate-in');
        chatbotWidget.classList.add('animate-out');
        chatbotWidget.addEventListener('animationend', () => {
            chatbotWidget.classList.add('hidden');
            openChatbotButton.classList.remove('hidden');
            openChatbotButton.focus();
        }, { once: true });
    }
}


export function addChatMessage(message: string, sender: 'user' | 'ai') {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', sender);
    messageElement.textContent = message;
    chatbotMessages.appendChild(messageElement);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    return messageElement;
}

// --- Assessment Form Modal Logic ---
function showAssessmentForm() {
    openModal(assessmentFormModal, '.assessment-form-content');
}

function hideAssessmentForm() {
    closeModal(assessmentFormModal, '.assessment-form-content');
    riskAssessmentForm.reset(); 
}

function showLoginScreen() {
    landingPage.classList.add('fade-out');
    landingPage.addEventListener('animationend', () => {
        landingPage.classList.add('hidden');
        landingPage.classList.remove('fade-out');
        loginContainer.classList.remove('hidden');
        loginContainer.classList.add('fade-in');
        emailInput.focus();
    }, { once: true });
}


// --- Main Application Logic ---
async function main() {
  const geminiApiKey = (process.env as any).API_KEY;
  if (!geminiApiKey || geminiApiKey === 'undefined') {
      const errorMessage = 'CRITICAL ERROR: Gemini API key (GEMINI_API_KEY) is not set. The application cannot function without it. Please check your .env configuration.';
      document.body.innerHTML = `<div style="padding: 2rem; text-align: center; font-family: sans-serif; background: #111; color: #ff8a80; height: 100vh; display: flex; align-items: center; justify-content: center;"><div><h1>Configuration Error</h1><p style="line-height: 1.6;">${errorMessage}</p></div></div>`;
      return;
  }

  loadInitialTheme();
  
  const savedLang = localStorage.getItem('ddrive-language');
  const browserLang = navigator.language.split('-')[0];
  const initialLang = savedLang || (['en', 'fil', 'ceb', 'war'].includes(browserLang) ? browserLang : 'en');
  languageSelector.value = initialLang;
  setLanguage(initialLang, { showTourStep: () => showTourStep(currentTourStep), chatbotTitle, chatbotInput });
  
  userAuth.auth.onAuthStateChange(async (_event, newSession) => {
    state.session = newSession;
    if (state.session) {
      const userData = await userAuth.getUserData(state.session.user.id);
      if (userData) {
          state.currentUserPlan = userData.plan;
          state.currentUserRole = userData.role;
          const appRole = supabaseRoleToAppRole(userData.role);
          applyRole(appRole);
          updateFeatureAccess();
      }
      
      appContainer.classList.remove('hidden');
      onboardingOverlay.classList.add('hidden');
      userInfo.classList.add('hidden');
      userEmail.textContent = state.session.user.email ?? 'No email';
      openChatbotButton.classList.remove('hidden');
      if (!chat) {
          state.chat = initializeChatbot();
          addChatMessage(t('chatbot_greeting'), 'ai');
      }

      const tourCompleted = state.session.user.user_metadata?.tour_completed;
      if (!tourCompleted) {
         startTour();
      }

    } else {
      // 1. Reset all application state for a logged-out user.
      state.currentRisks = [];
      state.currentUserPlan = null;
      state.currentUserRole = null;
      state.chat = null;
      resetDashboard();
      
      // 2. Explicitly hide all major UI containers to ensure a clean slate.
      appContainer.classList.add('hidden');
      userInfo.classList.add('hidden');
      openChatbotButton.classList.add('hidden');
      chatbotWidget.classList.add('hidden');
      onboardingOverlay.classList.add('hidden');
      
      // 3. Prepare the authentication view.
      loginContainer.classList.add('hidden');
      loginContainer.classList.remove('fade-in'); // Ensure no lingering animations
      landingPage.classList.remove('hidden', 'fade-out'); // Ensure landing is ready
      hideAuthMessages();
      (loginContainer.querySelector('form') as HTMLFormElement).reset();

      // 4. Show the main overlay with the correct screen visible.
      onboardingOverlay.classList.add('is-login-screen');
      onboardingOverlay.classList.remove('hidden');
    }
  });

  getStartedButton.addEventListener('click', showLoginScreen);
  loginNavButton.addEventListener('click', showLoginScreen);

  loginButton.addEventListener('click', async () => {
      hideAuthMessages();
      const { error } = await userAuth.auth.signInWithPassword({
          email: emailInput.value,
          password: passwordInput.value,
      });
      if (error) showAuthMessage(error.message, 'error');
  });

  signupButton.addEventListener('click', async () => {
      hideAuthMessages();
      authTitle.textContent = "Sign Up for DDRiVE";
      authText.textContent = "Please check your email to verify your account after signing up."
      const { error } = await userAuth.signUpAndCreateUser(emailInput.value, passwordInput.value);
      if (error) {
          showAuthMessage(error.message, 'error');
      } else {
          showAuthMessage('Signup successful! Please check your email for a confirmation link.', 'success');
      }
  });

  magicLinkButton.addEventListener('click', async () => {
      hideAuthMessages();
      const email = emailInput.value;
      if (!email) {
          showAuthMessage('Please enter your email to receive a magic link.', 'error');
          return;
      }
      const { error } = await userAuth.auth.signInWithOtp({ email });
      if (error) {
          showAuthMessage(error.message, 'error');
      } else {
          showAuthMessage('Magic link sent! Please check your email to log in.', 'success');
      }
  });

  logoutButton.addEventListener('click', () => userAuth.auth.signOut());
  restartTourButton.addEventListener('click', startTour);
  themeToggleButton.addEventListener('click', toggleTheme);
  
  userProfileButton.addEventListener('click', () => {
    const isExpanded = userProfileButton.getAttribute('aria-expanded') === 'true';
    userInfo.classList.toggle('hidden', isExpanded);
    userProfileButton.setAttribute('aria-expanded', String(!isExpanded));
    if (!isExpanded) (userInfo.querySelector('button') as HTMLElement).focus();
  });

  document.addEventListener('click', (event) => {
      if (!userProfileButton.contains(event.target as Node) && !userInfo.contains(event.target as Node)) {
          userInfo.classList.add('hidden');
          userProfileButton.setAttribute('aria-expanded', 'false');
      }
  });

  onboardingSkipButton.addEventListener('click', endTour);
  onboardingNextButton.addEventListener('click', () => showTourStep(currentTourStep + 1));
  onboardingPrevButton.addEventListener('click', () => showTourStep(currentTourStep - 1));
  onboardingHelpButton.addEventListener('click', () => toggleChatbot(true));
  languageSelector.addEventListener('change', (e) => setLanguage((e.target as HTMLSelectElement).value, { showTourStep: () => showTourStep(currentTourStep), chatbotTitle, chatbotInput }));
  
  window.addEventListener('resize', () => {
    if (!onboardingTooltip.classList.contains('hidden') && highlightedElement) {
      positionTooltip(highlightedElement);
    }
  });
  
  broadcastButton.addEventListener('click', () => alert(`Broadcast sent.`));
  contactPoliceButton.addEventListener('click', () => alert('Contacting Local Police Department...'));
  contactFireButton.addEventListener('click', () => alert('Contacting Local Fire Department...'));
  contactSecurityButton.addEventListener('click', () => alert('Contacting Security Team...'));

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) {
      state.imageBase64 = null;
      state.imageMimeType = null;
      imagePreview.src = '#';
      imagePreview.classList.add('hidden');
      imagePlaceholder.classList.remove('hidden');
      fileNameSpan.textContent = 'No file selected';
      return;
    }
    state.imageMimeType = file.type;
    fileNameSpan.textContent = file.name;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      state.imageBase64 = result.split(',')[1];
      imagePreview.src = result;
      imagePreview.classList.remove('hidden');
      imagePlaceholder.classList.add('hidden');
    };
    reader.readAsDataURL(file);
  });

  assessButton.addEventListener('click', triggerAIAnalysis);
  exportCsvButton.addEventListener('click', exportToCSV);
  exportReportButton.addEventListener('click', () => {
    if (!currentUserPlan?.is_premium) showUpgradeModal();
    else alert('Premium Feature: Report export functionality is coming soon!');
  });

  upgradePlanButton.addEventListener('click', showUpgradeModal);
  upgradeFromNoticeButton.addEventListener('click', showUpgradeModal);
  closeUpgradeModalButton.addEventListener('click', hideUpgradeModal);
  closeSuccessModalButton.addEventListener('click', hideUpgradeModal);
  checkoutButton.addEventListener('click', handleUpgrade);
  
  openChatbotButton.addEventListener('click', () => toggleChatbot());
  closeChatbotButton.addEventListener('click', () => toggleChatbot());
  chatbotInputForm.addEventListener('submit', handleChatSubmit);

  newAssessmentButton.addEventListener('click', showAssessmentForm);
  closeAssessmentFormButton.addEventListener('click', hideAssessmentForm);
  riskAssessmentForm.addEventListener('submit', handleManualAssessmentSubmit);

  undoButton.addEventListener('click', async () => {
    if (onUndo) await onUndo();
    hideUndoToast();
  });

  renderMap('World');
  resetDashboard();
}

document.addEventListener('DOMContentLoaded', main);
