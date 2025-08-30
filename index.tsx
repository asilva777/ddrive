/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Chat, FunctionDeclaration, GoogleGenAI, Type } from '@google/genai';
import { createClient, Session, SupabaseClient } from '@supabase/supabase-js';

// --- Supabase Client Initialization ---
const supabaseUrl = 'https://azvztcwtzjdaejpwouyl.supabase.co';

// FIX: The application was crashing because the SUPABASE_KEY environment variable was not set.
// A placeholder key has been added below to allow the application to load.
// IMPORTANT: You must replace 'YOUR_SUPABASE_ANON_KEY_HERE' with your actual public Supabase anon key
// for database features (like login and saving risks) to work correctly.
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY_HERE';

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// --- System Instructions and Type Definitions ---
const systemInstructions = `You are a professional security and hazard risk assessment analyst. Your task is to analyze the provided image, URL, and text description.

Respond with a single JSON object. This object must contain three keys:
1. "risks": An array of objects, where each object represents an identified vulnerability and has the following properties:
   - "title": (string) A short, descriptive title for the risk.
   - "description": (string) A detailed description of the risk.
   - "category": (string) The category of the risk (e.g., "Physical Security", "Environmental", "Operational").
   - "severity": (string) The severity level of the risk ("Critical", "High", "Medium", "Low").
   - "mitigation": (string) A detailed mitigation recommendation based on ISO 31000 and NIST risk management standards.
   - "confidence": (number) A confidence score from 0.0 to 1.0 indicating the AI's certainty about this specific risk.
2. "report": (string) A detailed assessment report in Markdown format. The report must include the severity and type for each identified risk. The report should be structured as follows:

### Risk Assessment Summary
A brief overview of the location or situation.

### Identified Vulnerabilities & Hazards
- A bulleted list of the identified risks, including their severity and type.

### Mitigation Recommendations
- A list of recommendations to mitigate each identified risk.

3. "digitalScores": An object with the following properties, each rated from 0 to 100, based on the provided inputs (URL, text prompt, image/video). If an input is not provided, estimate a score based on the context or default to a low-risk score (e.g., 0-10).
   - "urlThreatLevel": (number) How malicious or risky is the provided URL? Considers phishing, malware, etc.
   - "documentSensitivity": (number) How sensitive is the information in the provided text/document? Considers PII, confidential data.
   - "imageAnomalyScore": (number) How many anomalies, threats, or risks are visible in the image?
   - "videoIncidentScore": (number) What is the severity of incidents in the video? (Return 0 if no video is provided).

If a specific real-world location is mentioned in the prompt, call the function 'recommendPlace(location, caption)'. The caption should be a concise summary. Do not answer harmful or unsafe questions.`;

const recommendPlaceFunctionDeclaration: FunctionDeclaration = {
  name: 'recommendPlace',
  parameters: {
    type: Type.OBJECT,
    description: 'Shows the user a map of the place provided.',
    properties: {
      location: {
        type: Type.STRING,
        description: 'Give a specific place, including country name.',
      },
      caption: {
        type: Type.STRING,
        description:
          'A concise summary of the location relevant to the assessment.',
      },
    },
    required: ['location', 'caption'],
  },
};

// --- DOM Element Selectors ---
const appContainer = document.querySelector('.app-container') as HTMLDivElement;
const assessButton = document.querySelector('#assess-button') as HTMLButtonElement;
const exportCsvButton = document.querySelector('#export-csv-button') as HTMLButtonElement;
const exportReportButton = document.querySelector('#export-report-button') as HTMLButtonElement;
const fileInput = document.querySelector('#file-input') as HTMLInputElement;
const fileNameSpan = document.querySelector('#file-name') as HTMLSpanElement;
const imagePreview = document.querySelector('#image-preview') as HTMLImageElement;
const imagePlaceholder = document.querySelector('#image-placeholder') as HTMLParagraphElement;
const promptInput = document.querySelector('#prompt-input') as HTMLTextAreaElement;
const urlInput = document.querySelector('#url-input') as HTMLInputElement;
const latInput = document.querySelector('#lat-input') as HTMLInputElement;
const lngInput = document.querySelector('#lng-input') as HTMLInputElement;
const elevationInput = document.querySelector('#elevation-input') as HTMLInputElement;
const proximityInput = document.querySelector('#proximity-input') as HTMLInputElement;

const resultDiv = document.querySelector('#assessment-result') as HTMLDivElement;
const loader = document.querySelector('#loader') as HTMLDivElement;
const frame = document.querySelector('#embed-map') as HTMLIFrameElement;
const totalRisksValue = document.querySelector('#total-risks-value') as HTMLSpanElement;
const criticalAlertsValue = document.querySelector('#critical-alerts-value') as HTMLSpanElement;
const systemStatusValue = document.querySelector('#system-status-value') as HTMLSpanElement;
const unifiedRiskScoreValue = document.querySelector('#unified-risk-score-value') as HTMLSpanElement;
const digitalScoreValue = document.querySelector('#digital-score-value') as HTMLSpanElement;
const geoScoreValue = document.querySelector('#geo-score-value') as HTMLSpanElement;

const assessmentHistoryDisplay = document.querySelector('#assessment-history-display') as HTMLDivElement;
const assessmentHistoryList = document.querySelector('#assessment-history-list') as HTMLUListElement;

const bannerTitle = document.querySelector('#banner-title') as HTMLHeadingElement;
const bannerSubtitle = document.querySelector('#banner-subtitle') as HTMLParagraphElement;
const themeToggleButton = document.querySelector('#theme-toggle') as HTMLButtonElement;
const limitNotification = document.querySelector('#limit-notification') as HTMLDivElement;

const broadcastButton = document.querySelector('#broadcast-button') as HTMLButtonElement;
const contactPoliceButton = document.querySelector('#contact-police') as HTMLButtonElement;
const contactFireButton = document.querySelector('#contact-fire') as HTMLButtonElement;
const contactSecurityButton = document.querySelector('#contact-security') as HTMLButtonElement;

// Onboarding & Auth Elements
const onboardingOverlay = document.querySelector('#onboarding-overlay') as HTMLDivElement;
const loginContainer = document.querySelector('#login-container') as HTMLDivElement;
const emailInput = document.querySelector('#email-input') as HTMLInputElement;
const passwordInput = document.querySelector('#password-input') as HTMLInputElement;
const loginButton = document.querySelector('#login-button') as HTMLButtonElement;
const signupButton = document.querySelector('#signup-button') as HTMLButtonElement;
const magicLinkButton = document.querySelector('#magic-link-button') as HTMLButtonElement;
const authError = document.querySelector('#auth-error') as HTMLParagraphElement;
const authSuccess = document.querySelector('#auth-success') as HTMLParagraphElement;
const authTitle = document.querySelector('#auth-title') as HTMLHeadingElement;
const authText = document.querySelector('#auth-text') as HTMLParagraphElement;
const userInfo = document.querySelector('#user-info') as HTMLDivElement;
const userEmail = document.querySelector('#user-email') as HTMLSpanElement;
const logoutButton = document.querySelector('#logout-button') as HTMLButtonElement;
const restartTourButton = document.querySelector('#restart-tour-button') as HTMLButtonElement;

// Tour Elements
const onboardingTooltip = document.querySelector('#onboarding-tooltip') as HTMLDivElement;
const onboardingTitle = document.querySelector('#onboarding-title') as HTMLHeadingElement;
const onboardingText = document.querySelector('#onboarding-text') as HTMLParagraphElement;
const onboardingHelpButton = document.querySelector('#onboarding-help') as HTMLButtonElement;
const onboardingSkipButton = document.querySelector('#onboarding-skip') as HTMLButtonElement;
const onboardingPrevButton = document.querySelector('#onboarding-prev') as HTMLButtonElement;
const onboardingNextButton = document.querySelector('#onboarding-next') as HTMLButtonElement;
const onboardingProgressBar = document.querySelector('#onboarding-progress-bar') as HTMLDivElement;
const languageSelector = document.querySelector('#language-selector') as HTMLSelectElement;

// Upgrade Modal Elements
const upgradeModal = document.querySelector('#upgrade-modal') as HTMLDivElement;
const closeUpgradeModalButton = document.querySelector('#close-upgrade-modal-button') as HTMLButtonElement;
const upgradePlanButton = document.querySelector('#upgrade-plan-button') as HTMLButtonElement;
const upgradeFromNoticeButton = document.querySelector('#upgrade-from-notice-button') as HTMLButtonElement;
const checkoutButton = document.querySelector('#checkout-button') as HTMLButtonElement;
const upgradeRoleDisplay = document.querySelector('#upgrade-role-display') as HTMLSpanElement;
const upgradePriceDisplay = document.querySelector('#upgrade-price-display') as HTMLSpanElement;
const upgradeViewMain = document.querySelector('#upgrade-view-main') as HTMLDivElement;
const upgradeViewSuccess = document.querySelector('#upgrade-view-success') as HTMLDivElement;
const closeSuccessModalButton = document.querySelector('#close-success-modal-button') as HTMLButtonElement;

// Chatbot Elements
const chatbotWidget = document.querySelector('#chatbot-widget') as HTMLDivElement;
const openChatbotButton = document.querySelector('#open-chatbot-button') as HTMLButtonElement;
const closeChatbotButton = document.querySelector('#close-chatbot-button') as HTMLButtonElement;
const chatbotMessages = document.querySelector('#chatbot-messages') as HTMLDivElement;
const chatbotInputForm = document.querySelector('#chatbot-input-form') as HTMLFormElement;
const chatbotInput = document.querySelector('#chatbot-input') as HTMLInputElement;
const chatbotSendButton = document.querySelector('#chatbot-send-button') as HTMLButtonElement;
const chatbotTypingIndicator = document.querySelector('#chatbot-typing-indicator') as HTMLDivElement;
const chatbotTitle = document.querySelector('#chatbot-title') as HTMLHeadingElement;

// New Assessment Form Elements
const assessmentFormModal = document.querySelector('#assessment-form-modal') as HTMLDivElement;
const newAssessmentButton = document.querySelector('#new-assessment-button') as HTMLButtonElement;
const closeAssessmentFormButton = document.querySelector('#close-assessment-form-button') as HTMLButtonElement;
const riskAssessmentForm = document.querySelector('#risk-assessment-form') as HTMLFormElement;
const formUrlInput = document.querySelector('#form-url') as HTMLInputElement;
const formLatInput = document.querySelector('#form-lat') as HTMLInputElement;
const formLngInput = document.querySelector('#form-lng') as HTMLInputElement;
const formElevationInput = document.querySelector('#form-elevation') as HTMLInputElement;
const formProximityInput = document.querySelector('#form-proximity') as HTMLInputElement;
const formFileInput = document.querySelector('#form-file-input') as HTMLInputElement;
const formFileNameSpan = document.querySelector('#form-file-name') as HTMLSpanElement;
const formUrlThreatSlider = document.querySelector('#form-url-threat') as HTMLInputElement;
const formDocSensitivitySlider = document.querySelector('#form-doc-sensitivity') as HTMLInputElement;
const formImageAnomalySlider = document.querySelector('#form-image-anomaly') as HTMLInputElement;
const formVideoIncidentSlider = document.querySelector('#form-video-incident') as HTMLInputElement;
const formUrlThreatValue = document.querySelector('#form-url-threat-value') as HTMLSpanElement;
const formDocSensitivityValue = document.querySelector('#form-doc-sensitivity-value') as HTMLSpanElement;
const formImageAnomalyValue = document.querySelector('#form-image-anomaly-value') as HTMLSpanElement;
const formVideoIncidentValue = document.querySelector('#form-video-incident-value') as HTMLSpanElement;
const simulatedScoreValue = document.querySelector('#simulated-score-value') as HTMLSpanElement;
const submitAssessmentButton = document.querySelector('#submit-assessment-button') as HTMLButtonElement;
const assessmentFormLoader = document.querySelector('#assessment-form-loader') as HTMLDivElement;


// --- State Variables ---
let session: Session | null = null;
let imageBase64: string | null = null;
let imageMimeType: string | null = null;
let currentRisks: Risk[] = [];
let currentUserPlan: UserPlan | null = null;
let currentUserRole: string | null = null;
let chat: Chat | null = null;
let assessmentFormFile: File | null = null;
let lastAssessmentContext: { prompt: string; url: string; timestamp: string } | null = null;

// --- Configurations & Type Definitions ---
// FIX: Added 'color' property to each role object to fix TypeScript error in `applyRole` function.
const roleConfig = {
  manager: {
    title: 'Risk Manager Dashboard',
    description: 'Monitor vulnerabilities, generate mitigation plans, and track compliance.',
    icon: '📊',
    supabaseRole: 'RiskManager',
    color: '#007bff',
  },
  operator: {
    title: 'Field Operator Dashboard',
    description: 'Scan perimeter threats using drone imagery and receive real-time alerts.',
    icon: '🛰️',
    supabaseRole: 'FieldOperator',
    color: '#fd7e14',
  },
  analyst: {
    title: 'Environmental Analyst Dashboard',
    description: 'Analyze flood zones, erosion risks, and meteorological threats.',
    icon: '🌍',
    supabaseRole: 'EnvironmentalAnalyst',
    color: '#28a745',
  },
  security: {
    title: 'IT Security Dashboard',
    description: 'Detect digital vulnerabilities and simulate breach scenarios.',
    icon: '🔐',
    supabaseRole: 'ITSecurityLead',
    color: '#dc3545',
  },
  compliance: {
    title: 'Compliance Dashboard',
    description: 'Audit mitigation strategies and ensure regulatory alignment.',
    icon: '📁',
    supabaseRole: 'ComplianceOfficer',
    color: '#6c757d',
  },
  intern: {
    title: 'Learning Dashboard',
    description: 'Practice with simulations and chat with AI DDRiVER anytime.',
    icon: '🎓',
    supabaseRole: 'Intern',
    color: '#17a2b8',
  },
};

const rolePricing: { [key: string]: number } = {
  RiskManager: 499,
  FieldOperator: 199,
  EnvironmentalAnalyst: 299,
  ITSecurityLead: 399,
  ComplianceOfficer: 599,
  Intern: 99,
};

interface Risk {
  id?: number;
  risk_id?: string;
  user_id?: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  mitigation: string;
  confidence: number;
  status?: string;
}

interface DigitalScores {
    urlThreatLevel: number;
    documentSensitivity: number;
    imageAnomalyScore: number;
    videoIncidentScore: number;
}

interface FullAssessmentResponse {
  risks: Risk[];
  report: string;
  digitalScores: DigitalScores;
}

interface UserPlan {
  user_id: string;
  assessment_count: number;
  assessment_limit: number;
  is_premium: boolean;
}


// --- UI & Dashboard Functions ---
function getReportSkeleton() {
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

function resetDashboard() {
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

function updateDashboardStats(
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
      exportCsvButton.disabled = false;
  } else {
      exportCsvButton.disabled = true;
  }
  checkUsageAndToggleFeatures(); 
}

function checkUsageAndToggleFeatures() {
  if (!currentUserPlan) return;
  
  const { assessment_count, assessment_limit, is_premium } = currentUserPlan;
  const hasRisks = currentRisks.length > 0;
  
  if (is_premium) {
      assessButton.disabled = false;
      limitNotification.classList.add('hidden');
      assessButton.title = 'Start the AI risk assessment based on the provided media and prompt.';
      upgradePlanButton.textContent = 'Manage Plan';
      exportReportButton.disabled = !hasRisks;
      exportReportButton.title = hasRisks ? 'Export a detailed PDF report.' : 'Generate a report to enable export.';

  } else {
      if (assessment_count >= assessment_limit) {
          assessButton.disabled = true;
          assessButton.title = 'You have reached your assessment limit. Upgrade to continue.';
          limitNotification.classList.remove('hidden');
      } else {
          assessButton.disabled = false;
          assessButton.title = 'Start the AI risk assessment based on the provided media and prompt.';
          limitNotification.classList.add('hidden');
      }
      upgradePlanButton.textContent = 'Upgrade Plan';
      exportReportButton.disabled = true;
      exportReportButton.title = 'Upgrade to Premium to export PDF reports.';
  }
}

async function handleStatusChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const riskId = selectElement.dataset.riskId;
    const newStatus = selectElement.value;

    if (!riskId) {
        console.error('Risk ID not found on element.');
        return;
    }

    selectElement.disabled = true;

    const { error } = await supabase
        .from('risks')
        .update({ status: newStatus })
        .eq('risk_id', riskId);

    if (error) {
        console.error('Failed to update risk status:', error.message);
        // Optionally, revert the select value and show an error to the user
        const originalRisk = currentRisks.find(r => r.risk_id === riskId);
        if(originalRisk) selectElement.value = originalRisk.status || 'Open';
    } else {
        // Update local state to match
        const riskToUpdate = currentRisks.find(r => r.risk_id === riskId);
        if (riskToUpdate) {
            riskToUpdate.status = newStatus;
        }
    }

    selectElement.disabled = false;
}


function renderRiskRegister(risks: Risk[]) {
  assessmentHistoryList.innerHTML = '';
  if (risks.length === 0) {
    assessmentHistoryList.innerHTML = '<p>No risks identified in the last assessment.</p>';
    assessmentHistoryDisplay.classList.add('hidden');
    return;
  }
  assessmentHistoryDisplay.classList.remove('hidden');

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
        <select class="status-select" data-risk-id="${risk.risk_id}">
          ${statusOptions}
        </select>
      </div>
    `;
    assessmentHistoryList.appendChild(riskItem);
  });
  
  // Add event listeners after elements are in the DOM
  document.querySelectorAll('.status-select').forEach(select => {
    select.addEventListener('change', handleStatusChange);
  });
}


function exportToCSV() {
  if (currentRisks.length === 0) {
    alert('No risks from the last assessment to export.');
    return;
  }

  const headers = ['Risk ID', 'Title', 'Category', 'Severity', 'Confidence', 'Status', 'Description', 'Mitigation'];
  
  const escapeCsvCell = (cell: string | number | undefined) => {
    if (cell === undefined || cell === null) return '';
    const cellStr = String(cell);
    if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
      return `"${cellStr.replace(/"/g, '""')}"`;
    }
    return cellStr;
  };
  
  const csvRows: string[] = [];

  // Add context block
  if (lastAssessmentContext) {
      csvRows.push('"Assessment Context"');
      csvRows.push(['Timestamp', lastAssessmentContext.timestamp].map(escapeCsvCell).join(','));
      csvRows.push(['Analysis Prompt', lastAssessmentContext.prompt].map(escapeCsvCell).join(','));
      csvRows.push(''); // Blank separator row
  }
  
  csvRows.push(headers.join(','));
  
  currentRisks.forEach(risk => {
    const row = [
      risk.risk_id,
      risk.title,
      risk.category,
      risk.severity,
      risk.confidence,
      risk.status || 'Open',
      risk.description,
      risk.mitigation
    ].map(escapeCsvCell);
    csvRows.push(row.join(','));
  });

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.setAttribute('href', url);
    link.setAttribute('download', `risk_register_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// --- Core AI and Data Functions ---

/**
 * Calculates a unified risk score from digital and geospatial inputs.
 */
function calculateRiskScore({
  urlThreatLevel,
  documentSensitivity,
  imageAnomalyScore,
  videoIncidentScore,
  proximityToHazard,
  elevation,
}: {
  urlThreatLevel: number;
  documentSensitivity: number;
  imageAnomalyScore: number;
  videoIncidentScore: number;
  proximityToHazard: number;
  elevation: number;
}) {
  const digitalScore = (
    urlThreatLevel +
    documentSensitivity +
    imageAnomalyScore +
    videoIncidentScore
  ) / 4;

  const geoScore = Math.max(
    100 - proximityToHazard * 5 + (elevation < 10 ? 20 : 0),
    0
  );

  const finalScore = Math.round((digitalScore * 0.6 + geoScore * 0.4));
  
  return { digitalScore, geoScore, finalScore };
}

async function generateContent(
  prompt: string,
  url: string,
  geoInputs: { latitude: number; longitude: number; elevation: number; proximityToHazard: number; },
  image?: string | null,
  mimeType?: string | null,
) {
  loader.classList.remove('hidden');
  assessButton.disabled = true;
  systemStatusValue.textContent = 'Analyzing...';
  systemStatusValue.style.color = 'var(--Orange-500)';

  try {
    const ai = new GoogleGenAI({ apiKey: (process.env as any).API_KEY });
    const textPart = { text: `URL: ${url || 'Not provided'}\n\nPrompt: ${prompt}` };
    const parts: any[] = [textPart];

    if (image && mimeType) {
      parts.unshift({ inlineData: { data: image, mimeType } });
    } else if (!prompt) {
      parts[0].text = 'Describe the image and assess it for any potential risks.';
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: parts },
      config: {
        systemInstruction: systemInstructions,
        temperature: 0.2,
        tools: [{ functionDeclarations: [recommendPlaceFunctionDeclaration] }],
        responseMimeType: 'application/json',
      },
    });

    // FIX: The 'location' argument from a function call is not guaranteed to be a string.
    // Added a type check to safely handle the argument before passing it to renderMap.
    // Also, optimized the logic to use a single 'find' operation.
    const recommendPlaceCall = response.functionCalls?.find(
      (fn) => fn.name === 'recommendPlace'
    );
    if (recommendPlaceCall) {
      const location = recommendPlaceCall.args.location;
      if (typeof location === 'string') {
        renderMap(location);
      }
    }
    
    const responseText = response.text.trim();
    const jsonString = responseText.replace(/^```json\n?/, '').replace(/```$/, '');
    const assessment: FullAssessmentResponse = JSON.parse(jsonString);

    if (assessment.report && assessment.risks && assessment.digitalScores && session) {
      resultDiv.innerHTML = assessment.report;
      
      const { digitalScore, geoScore, finalScore } = calculateRiskScore({
          ...assessment.digitalScores,
          ...geoInputs
      });
      
      currentRisks = assessment.risks.map(risk => ({ 
        ...risk, 
        user_id: session!.user.id,
        risk_id: crypto.randomUUID(),
        status: 'Open',
      }));
      updateDashboardStats(currentRisks, { digitalScore, geoScore, finalScore });
      renderRiskRegister(currentRisks);

      // --- Save to Supabase ---
      // 1. Save detailed risks to 'risks' table
      const { error: risksSaveError } = await supabase.from('risks').insert(currentRisks);
      if (risksSaveError) throw new Error(`Failed to save detailed risks: ${risksSaveError.message}`);

      // 2. Save summary to 'risk_assessments' table
      const assessmentToSave = {
          user_id: session.user.id,
          created_at: new Date().toISOString(),
          role: currentUserRole,
          url: url,
          latitude: geoInputs.latitude,
          longitude: geoInputs.longitude,
          elevation: geoInputs.elevation,
          proximity_to_hazard: geoInputs.proximityToHazard,
          url_threat_level: assessment.digitalScores.urlThreatLevel,
          document_sensitivity: assessment.digitalScores.documentSensitivity,
          image_anomaly_score: assessment.digitalScores.imageAnomalyScore,
          video_incident_score: assessment.digitalScores.videoIncidentScore,
          final_score: finalScore,
      };
      const { error: summarySaveError } = await supabase.from('risk_assessments').insert(assessmentToSave);
      if (summarySaveError) throw new Error(`Failed to save assessment summary: ${summarySaveError.message}`);

      // 3. Increment usage count and refresh all user data
      const { error: usageError } = await supabase.rpc('increment_assessment_count', { user_id_param: session.user.id });
      if (usageError) console.error('Failed to update usage count:', usageError);
      await fetchUserRoleAndData(); 

      systemStatusValue.textContent = 'Operational';
      systemStatusValue.style.color = 'var(--Green-500)';
    } else {
      throw new Error('Invalid JSON structure in AI response or user not logged in.');
    }

  } catch (error) {
    console.error('Error during content generation:', error);
    let errorMessage = 'An unexpected error occurred. Please try again.';
    if (error instanceof SyntaxError || (error instanceof Error && error.message.includes('JSON'))) {
        errorMessage = 'The AI response was not in a valid format. Please try rephrasing your request.';
    }
    resultDiv.innerHTML = `<p style="color: var(--Red-500);">${errorMessage}</p>`;
    systemStatusValue.textContent = 'Error';
    systemStatusValue.style.color = 'var(--Red-500)';
  } finally {
    loader.classList.add('hidden');
    checkUsageAndToggleFeatures();
  }
}

async function triggerAIAnalysis() {
    if (!session) {
        alert('You must be logged in to assess risks.');
        return;
    }
    
    if (currentUserPlan && !currentUserPlan.is_premium && currentUserPlan.assessment_count >= currentUserPlan.assessment_limit) {
      showUpgradeModal();
      return;
    }

    let prompt = promptInput.value;
    if (!prompt && !imageBase64) {
      alert('Please upload an image or provide a text description for the AI to analyze.');
      return;
    }
    
    const geoInputs = {
        latitude: parseFloat(latInput.value) || 0,
        longitude: parseFloat(lngInput.value) || 0,
        elevation: parseFloat(elevationInput.value) || 0,
        proximityToHazard: parseFloat(proximityInput.value) || 0
    };

    const selectedRisks: string[] = Array.from(document.querySelectorAll('.risk-toggle:checked'))
                                         .map(toggle => (toggle as HTMLInputElement).value);

    if (selectedRisks.length === 0) {
      alert('Please select at least one risk category to analyze.');
      return;
    }
    prompt += `\n\nPlease focus the analysis on: ${selectedRisks.join(', ')}.`;
    
    lastAssessmentContext = {
        prompt: prompt,
        url: urlInput.value,
        timestamp: new Date().toISOString(),
    };

    await generateContent(prompt, urlInput.value, geoInputs, imageBase64, imageMimeType);
}

function renderMap(location: string | null | undefined) {
  const API_KEY = 'AIzaSyC4WK3O4Qkdo-_fXGIK-FzMt7cVwHZJfvI';
  const query = location || 'World';
  frame.src = `https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=${encodeURIComponent(query)}`;
}

// --- Localization (i18n) ---
const translations = {
    en: {
        welcome_title: "Welcome, {{role}}!",
        welcome_text: "{{description}}<br><br>Let's take a quick look around your personalized dashboard.",
        dashboard_title: "Dashboard Overview",
        dashboard_text: "At a glance, see total risks, open issues, critical alerts, and system status.",
        media_upload_title: "Upload Media & Analyze",
        media_upload_text: "Start your analysis by uploading drone footage or an image and providing context to the AI.",
        risk_register_title: "The Risk Register",
        risk_register_text: "All identified risks are logged here. View details, mitigation strategies, and export your findings.",
        team_comm_title: "Team Communication Hub",
        team_comm_text: "Broadcast emergency alerts and view the status of your resilience team.",
        reports_title: "Resilience Reports",
        reports_text: "The AI provides a detailed narrative report here, which can be visualized and exported.",
        profile_title: "Profile & Notifications",
        profile_text: "Manage your account, set alerts, and chat with AI DDRiVER for support.",
        simulation_title: "Simulation Mode",
        simulation_text: "You can practice with sample data or non-critical scenarios to get familiar with the platform's capabilities.",
        next_button: "Next",
        prev_button: "Previous",
        skip_button: "Skip",
        finish_button: "Finish",
        help_button: "Need Help?",
        chatbot_title: "AI DDRiVER",
        chatbot_greeting: "Hello! I'm AI DDRiVER, your assistant for the DDRiVE platform. How can I help you today?",
        chatbot_placeholder: "Ask about DDRiVE features..."
    },
    fil: {
        welcome_title: "Maligayang pagdating, {{role}}!",
        welcome_text: "{{description}}<br><br>Tingnan natin sandali ang iyong personalized na dashboard.",
        dashboard_title: "Pangkalahatang-ideya ng Dashboard",
        dashboard_text: "Tingnan ang status ng sistema, bukas na isyu, at mga kritikal na alerto.",
        media_upload_title: "Mag-upload ng Media at Suriin",
        media_upload_text: "Simulan ang iyong pagsusuri sa pamamagitan ng pag-upload ng drone footage o larawan at pagbibigay ng konteksto sa AI.",
        risk_register_title: "Rehistro ng Panganib",
        risk_register_text: "Lahat ng natukoy na panganib ay naka-log dito. Tingnan ang mga detalye, estratehiya sa pag-iwas, at i-export ang iyong mga natuklasan.",
        team_comm_title: "Sentro ng Komunikasyon ng Koponan",
        team_comm_text: "Mag-broadcast ng mga emergency alert at tingnan ang status ng iyong resilience team.",
        reports_title: "Mga Ulat sa Katatagan",
        reports_text: "Nagbibigay ang AI ng detalyadong ulat dito, na maaaring i-visualize at i-export.",
        profile_title: "Profile at Mga Abiso",
        profile_text: "Pamahalaan ang iyong account, magtakda ng mga alerto, at makipag-chat sa AI DDRiVER para sa suporta.",
        simulation_title: "Mode ng Simulasyon",
        simulation_text: "Maaari kang magsanay gamit ang sample data o mga di-kritikal na sitwasyon upang maging pamilyar sa mga kakayahan ng platform.",
        next_button: "Susunod",
        prev_button: "Nakaraan",
        skip_button: "Laktawan",
        finish_button: "Tapusin",
        help_button: "Kailangan ng Tulong?",
        chatbot_title: "AI DDRiVER",
        chatbot_greeting: "Kamusta! Ako si AI DDRiVER, ang iyong katulong para sa DDRiVE platform. Ano ang maitutulong ko sa iyo ngayon?",
        chatbot_placeholder: "Magtanong tungkol sa mga feature..."
    },
    ceb: {
        welcome_title: "Maayong pag-abot, {{role}}!",
        welcome_text: "{{description}}<br><br>Atong tan-awon kadiyot ang imong personalized nga dashboard.",
        dashboard_title: "Kinatibuk-ang Paglantaw sa Dashboard",
        dashboard_text: "Sa usa ka pagtan-aw, tan-awa ang kinatibuk-ang risgo, bukas nga mga isyu, kritikal nga mga alerto, ug status sa sistema.",
        media_upload_title: "Pag-upload og Media ug Analisa",
        media_upload_text: "Sugdi ang imong pag-analisa pinaagi sa pag-upload og drone footage o hulagway ug paghatag og konteksto sa AI.",
        risk_register_title: "Ang Rehistro sa Peligro",
        risk_register_text: "Ang tanan nga naila nga mga peligro gi-log dinhi. Tan-awa ang mga detalye, mga estratehiya sa pagpaminus, ug i-export ang imong mga nakit-an.",
        team_comm_title: "Sentro sa Komunikasyon sa Team",
        team_comm_text: "Pag-broadcast og mga alerto sa emerhensya ug tan-awa ang kahimtang sa imong resilience team.",
        reports_title: "Mga Report sa Kalig-on",
        reports_text: "Ang AI naghatag og detalyadong report dinhi, nga mahimong i-visualize ug i-export.",
        profile_title: "Profile ug Mga Notipikasyon",
        profile_text: "Pagdumala sa imong account, pag-set og mga alerto, ug pakig-chat sa AI DDRiVER alang sa suporta.",
        simulation_title: "Mode sa Simulasyon",
        simulation_text: "Mahimo kang magpraktis gamit ang sample data o dili kritikal nga mga senaryo aron mapamilyar sa mga kapabilidad sa plataporma.",
        next_button: "Sunod",
        prev_button: "Kaniadto",
        skip_button: "Laktaw",
        finish_button: "Humanon",
        help_button: "Nanginahanglan og Tabang?",
        chatbot_title: "AI DDRiVER",
        chatbot_greeting: "Maayong adlaw! Ako si AI DDRiVER, ang imong katabang alang sa DDRiVE platform. Unsa may akong ikatabang kanimo?",
        chatbot_placeholder: "Pangutana bahin sa mga feature..."
    },
    war: {
        welcome_title: "Maupay nga pag-abot, {{role}}!",
        welcome_text: "{{description}}<br><br>Ato tan-awon kadiyot an imo personalized nga dashboard.",
        dashboard_title: "Pangkabilugan nga Paglantaw han Dashboard",
        dashboard_text: "Ha usa ka pagtan-aw, kitaa an kabug-usan nga mga peligro, mga bukas nga isyu, mga kritikal nga alerto, ug an kahimtang han sistema.",
        media_upload_title: "Pag-upload hin Media ngan Pag-analisar",
        media_upload_text: "Tikangi an imo pag-analisar pinaagi han pag-upload hin drone footage o hulagway ngan paghatag hin konteksto ha AI.",
        risk_register_title: "An Rehistro han Peligro",
        risk_register_text: "Ngatanan nga naila nga mga peligro naka-log dinhi. Kitaa an mga detalye, mga estratehiya ha pagpaminus, ngan i-export an imo mga nabilngan.",
        team_comm_title: "Hub han Komunikasyon han Team",
        team_comm_text: "Pag-broadcast hin mga alerto ha emerhensya ngan kitaa an kahimtang han imo resilience team.",
        reports_title: "Mga Report han Kalig-on",
        reports_text: "An AI naghahatag hin detalyado nga report dinhi, nga puyde i-visualize ngan i-export.",
        profile_title: "Profile ngan Mga Notipikasyon",
        profile_text: "Pagdumara han imo account, pag-set hin mga alerto, ngan pakig-chat ha AI DDRiVER para hin suporta.",
        simulation_title: "Mode han Simulasyon",
        simulation_text: "Puyde ka magpraktis gamit an sample data o diri kritikal nga mga senaryo para maging pamilyar ha mga kapabilidad han plataporma.",
        next_button: "Sunod",
        prev_button: "Nahiuna",
        skip_button: "Laktaw",
        finish_button: "Tapuson",
        help_button: "Kinahanglan hin Bulig?",
        chatbot_title: "AI DDRiVER",
        chatbot_greeting: "Maupay nga adlaw! Ako hi AI DDRiVER, an imo kabulig para han DDRiVE platform. Ano an akon mahihimo para ha imo?",
        chatbot_placeholder: "Pangutana bahin sa mga feature..."
    }
};

let currentLanguage = 'en';

function t(key: string, replacements?: { [key: string]: string }): string {
    const lang = translations[currentLanguage as keyof typeof translations] || translations.en;
    let text = lang[key as keyof typeof lang] || key;
    if (replacements) {
        Object.entries(replacements).forEach(([key, value]) => {
            text = text.replace(`{{${key}}}`, value);
        });
    }
    return text;
}

function setLanguage(lang: string) {
    currentLanguage = translations[lang as keyof typeof translations] ? lang : 'en';
    localStorage.setItem('ddrive-language', currentLanguage);
    // Refresh tour if visible
    if (!onboardingTooltip.classList.contains('hidden')) {
        showTourStep(currentTourStep);
    }
    // Refresh chatbot UI
    chatbotTitle.textContent = t('chatbot_title');
    chatbotInput.placeholder = t('chatbot_placeholder');
}

// --- Onboarding Tour Logic ---
let currentTourStep = 0;
const tourSteps = [
  { element: '.banner', titleKey: 'welcome_title', textKey: 'welcome_text', icon: '👋' },
  { element: '#dashboard', titleKey: 'dashboard_title', textKey: 'dashboard_text', icon: '📊' },
  { element: '.file-label', titleKey: 'media_upload_title', textKey: 'media_upload_text', icon: '🛰️' },
  { element: '#assessment-history-display', titleKey: 'risk_register_title', textKey: 'risk_register_text', icon: '📋',
    preAction: () => {
      assessmentHistoryDisplay.classList.remove('hidden');
      assessmentHistoryList.innerHTML = `<div class="assessment-item"><span class="risk-title">Sample Risk: Unlocked Gate</span><span class="risk-category">Physical</span><span class="risk-severity">High</span><div class="status-select-wrapper"><select class="status-select"><option>Open</option></select></div></div>`;
      exportCsvButton.disabled = false;
    },
    postAction: () => resetDashboard()
  },
  { element: '#resilience-team', titleKey: 'team_comm_title', textKey: 'team_comm_text', icon: '📣' },
  { element: '#report-display', titleKey: 'reports_title', textKey: 'reports_text', icon: '📈' },
  { element: '#user-profile', titleKey: 'profile_title', textKey: 'profile_text', icon: '👤' },
  { element: '#analysis-controls', titleKey: 'simulation_title', textKey: 'simulation_text', icon: '🔥' },
];

function positionTooltip(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const tooltipRect = onboardingTooltip.getBoundingClientRect();
  let top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
  let left = rect.right + 15;
  if (left + tooltipRect.width > window.innerWidth) left = rect.left - tooltipRect.width - 15;
  if (left < 0) {
    left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    top = rect.bottom + 15;
  }
  top = Math.max(10, Math.min(top, window.innerHeight - tooltipRect.height - 10));
  onboardingTooltip.style.top = `${top}px`;
  onboardingTooltip.style.left = `${left}px`;
}

let highlightedElement: HTMLElement | null = null;

function showTourStep(index: number) {
  if (currentTourStep > 0 && tourSteps[currentTourStep - 1].postAction) {
    tourSteps[currentTourStep - 1].postAction!();
  }
  if (highlightedElement) {
    highlightedElement.classList.remove('onboarding-highlight');
  }

  currentTourStep = index;
  if (index > tourSteps.length) {
    endTour();
    return;
  }

  const step = tourSteps[index - 1];
  const element = document.querySelector(step.element) as HTMLElement;
  if (!element) {
    console.warn('Onboarding element not found:', step.element);
    endTour();
    return;
  }
  
  if (step.preAction) step.preAction();

  // Personalize the first step
  if (index === 1 && currentUserRole) {
      const appRole = supabaseRoleToAppRole(currentUserRole);
      const roleInfo = roleConfig[appRole];
      const friendlyRoleName = currentUserRole.replace(/([A-Z])/g, ' $1').trim();
      onboardingTitle.textContent = t('welcome_title', { role: friendlyRoleName });
      onboardingText.innerHTML = t('welcome_text', { description: roleInfo.description });
  } else {
      onboardingTitle.textContent = t(step.titleKey);
      onboardingText.innerHTML = t(step.textKey);
  }
  
  onboardingPrevButton.disabled = index === 1;
  onboardingNextButton.textContent = index === tourSteps.length ? t('finish_button') : t('next_button');
  onboardingPrevButton.textContent = t('prev_button');
  onboardingSkipButton.textContent = t('skip_button');
  onboardingHelpButton.textContent = t('help_button');
  onboardingTooltip.classList.remove('hidden');
  
  highlightedElement = element;
  highlightedElement.classList.add('onboarding-highlight');
  positionTooltip(element);
  
  // Update Progress Bar
  document.querySelectorAll('.progress-step').forEach((stepEl, i) => {
    stepEl.classList.toggle('active', i < index);
  });
}

function startTour() {
  onboardingOverlay.classList.remove('hidden', 'is-login-screen');
  loginContainer.classList.add('hidden'); // Hide auth modal during tour
  
  // Build progress bar
  onboardingProgressBar.innerHTML = '';
  tourSteps.forEach(step => {
      const stepEl = document.createElement('div');
      stepEl.className = 'progress-step';
      stepEl.innerHTML = `<span>${step.icon}</span>`;
      stepEl.setAttribute('aria-label', t(step.titleKey));
      onboardingProgressBar.appendChild(stepEl);
  });
  
  showTourStep(1);
  onboardingTooltip.focus(); // Set focus for accessibility
}

function endTour() {
  onboardingOverlay.classList.add('hidden');
  onboardingTooltip.classList.add('hidden');
  if (highlightedElement) {
    highlightedElement.classList.remove('onboarding-highlight');
  }
  const lastStep = tourSteps[tourSteps.length - 1];
  if (lastStep && lastStep.postAction) {
    lastStep.postAction();
  }
  if (session) {
      supabase.auth.updateUser({ data: { tour_completed: true } });
  }
}

function handleTourKeydown(e: KeyboardEvent) {
    if (onboardingTooltip.classList.contains('hidden')) return;
    
    if (e.key === 'Escape') {
        endTour();
    }
    
    if (e.key === 'Tab') {
        const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const focusable = Array.from(onboardingTooltip.querySelectorAll(focusableElements)) as HTMLElement[];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        
        if (e.shiftKey && document.activeElement === first) {
            last.focus();
            e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
            first.focus();
            e.preventDefault();
        }
    }
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
}

function loadInitialTheme() {
  const savedTheme = localStorage.getItem('ddrive-theme') as 'light' | 'dark' | null;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
}

function supabaseRoleToAppRole(supabaseRole?: string): keyof typeof roleConfig {
    const matchingRole = Object.entries(roleConfig).find(
        ([_key, value]) => value.supabaseRole === supabaseRole
    );
    return (matchingRole ? matchingRole[0] : 'intern') as keyof typeof roleConfig;
}

function applyRole(role: keyof typeof roleConfig) {
    const config = roleConfig[role];
    if (config && bannerTitle && bannerSubtitle) {
        currentUserRole = config.supabaseRole;
        bannerTitle.innerHTML = `${config.icon} ${config.title}`;
        bannerSubtitle.textContent = config.description;
        document.documentElement.style.setProperty('--role-color', config.color);
    }
}

// --- Authentication & Data Loading ---

/**
 * Shows a message in the authentication modal.
 * @param message The message to display.
 * @param type The type of message ('error' or 'success').
 */
function showAuthMessage(message: string, type: 'error' | 'success') {
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

/**
 * Hides all messages in the authentication modal.
 */
function hideAuthMessages() {
    authError.classList.add('hidden');
    authError.textContent = '';
    authSuccess.classList.add('hidden');
    authSuccess.textContent = '';
}


/**
 * Fetches the role for a given user from the Supabase 'user_roles' table.
 * @param userId - The UUID of the user.
 * @returns The user's role as a string, or 'Intern' as a default if not found or on error.
 */
async function getUserRole(userId: string): Promise<string> {
    if (!userId) {
        console.warn('getUserRole called without a userId.');
        return 'Intern';
    }

    const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

    if (error) {
        // It's common for a new user not to have a role immediately, so we don't need to log every "not found" error.
        if (error.code !== 'PGRST116') { // PGRST116 is "exact one row not found"
            console.error("Error fetching user role:", error.message);
        }
        return 'Intern'; // Default role on error or if no role is found
    }

    return data?.role || 'Intern';
}

async function fetchUserRoleAndData() {
    if (!session) return;
    
    // Fetch Role
    const userRole = await getUserRole(session.user.id);
    const appRole = supabaseRoleToAppRole(userRole);
    applyRole(appRole);

    // Fetch Usage Plan
    const { data: planData, error: planError } = await supabase
      .from('usage_limits')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    
    if (planError) {
      console.error("Error fetching user plan:", planError.message);
    } else {
      currentUserPlan = planData;
    }

    checkUsageAndToggleFeatures();
}

// --- Freemium/Upgrade Modal Logic ---
function showUpgradeModal() {
  if (!currentUserRole) return;
  const price = rolePricing[currentUserRole] || 0;
  upgradeRoleDisplay.textContent = currentUserRole;
  upgradePriceDisplay.textContent = `$${price.toFixed(2)}`;
  
  // Reset view to default
  upgradeViewMain.classList.remove('hidden');
  upgradeViewSuccess.classList.add('hidden');
  
  upgradeModal.classList.remove('hidden');
}

function hideUpgradeModal() {
    upgradeModal.classList.add('hidden');
}

async function handleUpgrade() {
    if (!session) return;
    
    // This simulates a call to a backend endpoint which would create a Xendit invoice.
    // The webhook from Xendit would then securely update the database.
    // For this client-side proof-of-concept, we update Supabase directly.
    loader.classList.remove('hidden');
    checkoutButton.disabled = true;

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const { error } = await supabase
        .from('usage_limits')
        .update({ is_premium: true })
        .eq('user_id', session.user.id);
    
    if (error) {
        console.error('Failed to upgrade plan:', error.message);
        alert('There was an error upgrading your plan. Please contact support.');
    } else {
        console.log('User upgraded to premium.');
        await fetchUserRoleAndData(); // Refresh all data to reflect the new plan
        
        // Show success view
        upgradeViewMain.classList.add('hidden');
        upgradeViewSuccess.classList.remove('hidden');
    }
    loader.classList.add('hidden');
    checkoutButton.disabled = false;
}

// --- AI Chatbot Logic ---

function toggleChatbot(forceOpen?: boolean) {
    const isHidden = chatbotWidget.classList.contains('hidden');
    if (forceOpen === true) {
        if (isHidden) { // Only open if it's not already open
            chatbotWidget.classList.remove('hidden');
            openChatbotButton.classList.add('hidden');
            chatbotInput.focus();
        }
    } else if (forceOpen === false) {
        if (!isHidden) { // Only close if it's not already closed
            chatbotWidget.classList.add('hidden');
            openChatbotButton.classList.remove('hidden');
        }
    } else { // Toggle
        chatbotWidget.classList.toggle('hidden');
        openChatbotButton.classList.toggle('hidden');
        if (!chatbotWidget.classList.contains('hidden')) {
            chatbotInput.focus();
        }
    }
}

function addChatMessage(message: string, sender: 'user' | 'ai') {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', sender);
    messageElement.textContent = message;
    chatbotMessages.appendChild(messageElement);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    return messageElement;
}

async function initializeChatbot() {
    const ai = new GoogleGenAI({ apiKey: (process.env as any).API_KEY });
    const chatbotSystemInstruction = `You are AI DDRiVER, a helpful assistant for the DDRiVE (Data-Driven Risk and Vulnerability Evaluation) platform. Your purpose is to assist users with their questions about the application's features and help them with risk assessment tasks.

DDRiVE features include:
- A dashboard with stats on Total Risks, Open Issues, Critical Alerts, and System Status.
- Media upload (images/video) for analysis.
- AI-powered risk assessment based on prompts and media.
- A Risk Register to log, view, and manage identified risks (including title, category, severity, confidence, description, and mitigation).
- Exporting the risk register to CSV.
- A team communication hub for broadcasting alerts.
- User roles (Risk Manager, Field Operator, etc.) which customize the dashboard view.
- Premium plans that unlock features like unlimited assessments and PDF report exports.

When a user asks for help:
- Be friendly, clear, and concise.
- Refer to features by their names (e.g., "Risk Register", "Resilience Team Hub").
- If a user asks about a risk assessment query, you can help them formulate a better prompt for the main AI. For example, if they ask "check this photo", you can suggest they write a more specific prompt like "Assess perimeter security in this photo of a construction site."
- Do not generate risk assessments yourself. Instead, guide the user on how to use the main "Assess Risks" feature.
- If you don't know the answer, state that you are an AI assistant and can't answer that question, but you can help with questions about DDRiVE.
- Keep the conversation in the language the user is writing in.`;

    chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction: chatbotSystemInstruction }
    });
    addChatMessage(t('chatbot_greeting'), 'ai');
}

async function handleChatSubmit(e: Event) {
    e.preventDefault();
    if (!chat) return;

    const userMessage = chatbotInput.value.trim();
    if (!userMessage) return;

    addChatMessage(userMessage, 'user');
    chatbotInput.value = '';
    chatbotInput.disabled = true;
    chatbotSendButton.disabled = true;
    chatbotTypingIndicator.classList.remove('hidden');

    try {
        const responseStream = await chat.sendMessageStream({ message: userMessage });
        let aiMessage = '';
        const aiMessageElement = addChatMessage('', 'ai');

        for await (const chunk of responseStream) {
            aiMessage += chunk.text;
            aiMessageElement.textContent = aiMessage;
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        }
    } catch (error) {
        console.error('Chatbot error:', error);
        addChatMessage('Sorry, I encountered an error. Please try again.', 'ai');
    } finally {
        chatbotInput.disabled = false;
        chatbotSendButton.disabled = false;
        chatbotTypingIndicator.classList.add('hidden');
        chatbotInput.focus();
    }
}

// --- Assessment Form Modal Logic ---
function showAssessmentForm() {
    assessmentFormModal.classList.remove('hidden');
    updateSimulatedScore(); // Calculate initial score
}

function hideAssessmentForm() {
    assessmentFormModal.classList.add('hidden');
    riskAssessmentForm.reset(); // Reset form fields on close
    assessmentFormFile = null;
    formFileNameSpan.textContent = 'No file selected';
}

function updateSimulatedScore() {
    const formData = {
        urlThreatLevel: parseInt(formUrlThreatSlider.value),
        documentSensitivity: parseInt(formDocSensitivitySlider.value),
        imageAnomalyScore: parseInt(formImageAnomalySlider.value),
        videoIncidentScore: parseInt(formVideoIncidentSlider.value),
        proximityToHazard: parseFloat(formProximityInput.value) || 0,
        elevation: parseFloat(formElevationInput.value) || 0,
    };
    
    const { finalScore } = calculateRiskScore(formData);
    simulatedScoreValue.textContent = finalScore.toString();
}

async function handleAssessmentFormSubmit(e: Event) {
    e.preventDefault();
    if (!session) {
        alert('You must be logged in to submit an assessment.');
        return;
    }

    assessmentFormLoader.classList.remove('hidden');
    submitAssessmentButton.disabled = true;

    try {
        let fileUrl = '';
        if (assessmentFormFile) {
            const filePath = `uploads/${session.user.id}/${Date.now()}_${assessmentFormFile.name}`;
            const { data, error: uploadError } = await supabase.storage
                .from('risk-files')
                .upload(filePath, assessmentFormFile);

            if (uploadError) {
                throw new Error(`File upload error: ${uploadError.message}`);
            }
            
            // Get public URL for the uploaded file
            const { data: urlData } = supabase.storage.from('risk-files').getPublicUrl(data.path);
            fileUrl = urlData.publicUrl;
        }
        
        const { finalScore } = calculateRiskScore({
            urlThreatLevel: parseInt(formUrlThreatSlider.value),
            documentSensitivity: parseInt(formDocSensitivitySlider.value),
            imageAnomalyScore: parseInt(formImageAnomalySlider.value),
            videoIncidentScore: parseInt(formVideoIncidentSlider.value),
            proximityToHazard: parseFloat(formProximityInput.value) || 0,
            elevation: parseFloat(formElevationInput.value) || 0,
        });

        const assessmentData = {
            user_id: session.user.id,
            url: formUrlInput.value || null,
            latitude: parseFloat(formLatInput.value) || null,
            longitude: parseFloat(formLngInput.value) || null,
            elevation: parseFloat(formElevationInput.value) || null,
            proximity_to_hazard: parseFloat(formProximityInput.value) || null,
            url_threat_level: parseInt(formUrlThreatSlider.value),
            document_sensitivity: parseInt(formDocSensitivitySlider.value),
            image_anomaly_score: parseInt(formImageAnomalySlider.value),
            video_incident_score: parseInt(formVideoIncidentSlider.value),
            final_score: finalScore,
            file_url: fileUrl || null,
        };

        const { error: insertError } = await supabase.from('risk_assessments').insert(assessmentData);
        if (insertError) {
            throw new Error(`Database insert error: ${insertError.message}`);
        }
        
        // Success
        alert('Risk assessment submitted successfully!');
        hideAssessmentForm();
        await fetchUserRoleAndData(); // Refresh history

    } catch (error) {
        console.error('Assessment submission failed:', error);
        alert(`Error: ${(error as Error).message}`);
    } finally {
        assessmentFormLoader.classList.add('hidden');
        submitAssessmentButton.disabled = false;
    }
}


// --- Main Application Logic ---
async function main() {
  loadInitialTheme();
  
  const savedLang = localStorage.getItem('ddrive-language');
  const browserLang = navigator.language.split('-')[0];
  const initialLang = savedLang || (['en', 'fil', 'ceb', 'war'].includes(browserLang) ? browserLang : 'en');
  languageSelector.value = initialLang;
  setLanguage(initialLang);
  
  supabase.auth.onAuthStateChange(async (_event, newSession) => {
    session = newSession;
    if (session) {
      await fetchUserRoleAndData();
      
      // Show app, prepare UI for logged-in user
      appContainer.classList.remove('hidden');
      userInfo.classList.remove('hidden');
      userEmail.textContent = session.user.email ?? 'No email';
      openChatbotButton.classList.remove('hidden');
      if (!chat) {
          initializeChatbot();
      }

      const tourCompleted = session.user.user_metadata?.tour_completed;
      if (!tourCompleted) {
         startTour();
      } else {
         onboardingOverlay.classList.add('hidden');
      }

    } else {
      onboardingOverlay.classList.remove('hidden');
      onboardingOverlay.classList.add('is-login-screen');
      loginContainer.classList.remove('hidden');
      appContainer.classList.add('hidden');
      userInfo.classList.add('hidden');
      openChatbotButton.classList.add('hidden');
      chatbotWidget.classList.add('hidden');
      resetDashboard();
      currentRisks = [];
      currentUserPlan = null;
      currentUserRole = null;
      chat = null;
      // Reset auth form for next login
      hideAuthMessages();
      emailInput.value = '';
      passwordInput.value = '';
    }
  });

  loginButton.addEventListener('click', async () => {
      hideAuthMessages();
      const { error } = await supabase.auth.signInWithPassword({
          email: emailInput.value,
          password: passwordInput.value,
      });
      if (error) {
          showAuthMessage(error.message, 'error');
      }
  });

  signupButton.addEventListener('click', async () => {
      hideAuthMessages();
      authTitle.textContent = "Sign Up for DDRiVE";
      authText.textContent = "Please check your email to verify your account after signing up."
      const { data, error } = await supabase.auth.signUp({
          email: emailInput.value,
          password: passwordInput.value,
      });
      if (error) {
          showAuthMessage(error.message, 'error');
      } else {
          if (data.user) {
              // This should ideally be a DB trigger, but we do it here for simplicity.
              // 1. Assign default role
              await supabase.from('user_roles').insert({ user_id: data.user.id, role: 'Intern' });
              // 2. Create usage limit entry
              await supabase.from('usage_limits').insert({ user_id: data.user.id });
          }
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
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) {
          showAuthMessage(error.message, 'error');
      } else {
          showAuthMessage('Magic link sent! Please check your email to log in.', 'success');
      }
  });


  logoutButton.addEventListener('click', () => supabase.auth.signOut());
  restartTourButton.addEventListener('click', startTour);
  
  themeToggleButton.addEventListener('click', toggleTheme);

  onboardingSkipButton.addEventListener('click', endTour);
  onboardingNextButton.addEventListener('click', () => showTourStep(currentTourStep + 1));
  onboardingPrevButton.addEventListener('click', () => showTourStep(currentTourStep - 1));
  onboardingHelpButton.addEventListener('click', () => toggleChatbot(true));
  languageSelector.addEventListener('change', (e) => setLanguage((e.target as HTMLSelectElement).value));
  document.addEventListener('keydown', handleTourKeydown);

  
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
      imageBase64 = null;
      imageMimeType = null;
      imagePreview.src = '#';
      imagePreview.classList.add('hidden');
      imagePlaceholder.classList.remove('hidden');
      fileNameSpan.textContent = 'No file selected';
      return;
    }
    imageMimeType = file.type;
    fileNameSpan.textContent = file.name;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      imageBase64 = result.split(',')[1];
      imagePreview.src = result;
      imagePreview.classList.remove('hidden');
      imagePlaceholder.classList.add('hidden');
    };
    reader.readAsDataURL(file);
  });

  assessButton.addEventListener('click', triggerAIAnalysis);
  
  exportCsvButton.addEventListener('click', exportToCSV);
  
  exportReportButton.addEventListener('click', () => {
    if (currentUserPlan?.is_premium) {
      alert('Premium Feature: Report export functionality is coming soon!');
    } else {
      showUpgradeModal();
    }
  });

  // Upgrade Modal Listeners
  upgradePlanButton.addEventListener('click', showUpgradeModal);
  upgradeFromNoticeButton.addEventListener('click', showUpgradeModal);
  closeUpgradeModalButton.addEventListener('click', hideUpgradeModal);
  closeSuccessModalButton.addEventListener('click', hideUpgradeModal);
  checkoutButton.addEventListener('click', handleUpgrade);
  
  // Chatbot Listeners
  openChatbotButton.addEventListener('click', () => toggleChatbot());
  closeChatbotButton.addEventListener('click', () => toggleChatbot());
  chatbotInputForm.addEventListener('submit', handleChatSubmit);

  // New Assessment Form Listeners
  newAssessmentButton.addEventListener('click', showAssessmentForm);
  closeAssessmentFormButton.addEventListener('click', hideAssessmentForm);
  riskAssessmentForm.addEventListener('submit', handleAssessmentFormSubmit);
  
  formFileInput.addEventListener('change', () => {
    const file = formFileInput.files?.[0];
    if (file) {
      assessmentFormFile = file;
      formFileNameSpan.textContent = file.name;
    } else {
      assessmentFormFile = null;
      formFileNameSpan.textContent = 'No file selected';
    }
  });

  // Real-time score update listeners
  [formUrlInput, formLatInput, formLngInput, formElevationInput, formProximityInput, formUrlThreatSlider, formDocSensitivitySlider, formImageAnomalySlider, formVideoIncidentSlider].forEach(el => {
      el.addEventListener('input', updateSimulatedScore);
  });
  
  // Update slider value displays
  formUrlThreatSlider.addEventListener('input', () => formUrlThreatValue.textContent = formUrlThreatSlider.value);
  formDocSensitivitySlider.addEventListener('input', () => formDocSensitivityValue.textContent = formDocSensitivitySlider.value);
  formImageAnomalySlider.addEventListener('input', () => formImageAnomalyValue.textContent = formImageAnomalySlider.value);
  formVideoIncidentSlider.addEventListener('input', () => formVideoIncidentValue.textContent = formVideoIncidentSlider.value);

  renderMap('World');
  resetDashboard();
}

document.addEventListener('DOMContentLoaded', main);
