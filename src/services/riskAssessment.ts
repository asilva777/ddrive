import { GoogleGenAI, Chat } from '@google/genai';
import { supabase } from '../utils/supabase/client';
import { systemInstructions, recommendPlaceFunctionDeclaration, chatbotSystemInstruction } from '../utils/gemini/prompt';
import { FullAssessmentResponse } from '../types';
import * as ui from '../app/page';
import { state, showUndoToast } from '../app/page';
import { getUserData } from './userAuth';
import { roleConfig } from '../config/roles';

/**
 * Calculates a unified risk score from digital and geospatial inputs.
 */
export function calculateRiskScore({
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
  ui.loader.classList.remove('hidden');
  ui.assessButton.disabled = true;
  ui.systemStatusValue.textContent = 'Analyzing...';
  ui.systemStatusValue.style.color = 'var(--Orange-500)';

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

    const recommendPlaceCall = response.functionCalls?.find(
      (fn) => fn.name === 'recommendPlace'
    );
    if (recommendPlaceCall) {
      const location = recommendPlaceCall.args.location;
      if (typeof location === 'string') {
        ui.renderMap(location);
      }
    }
    
    const responseText = response.text.trim();
    const jsonString = responseText.replace(/^```json\n?/, '').replace(/```$/, '');
    const assessment: FullAssessmentResponse = JSON.parse(jsonString);

    if (assessment.report && assessment.risks && assessment.digitalScores && state.session) {
      ui.resultDiv.innerHTML = assessment.report;
      ui.resultDiv.focus(); // Accessibility: Move focus to the new content
      
      const { digitalScore, geoScore, finalScore } = calculateRiskScore({
          ...assessment.digitalScores,
          ...geoInputs
      });
      
      state.currentRisks = assessment.risks.map(risk => ({ 
        ...risk, 
        user_id: state.session!.user.id,
        risk_id: crypto.randomUUID(),
        status: 'Open',
      }));
      ui.updateDashboardStats(state.currentRisks, { digitalScore, geoScore, finalScore });
      ui.renderRiskRegister(state.currentRisks);

      // --- Save to Supabase ---
      const { error: risksSaveError } = await supabase.from('risks').insert(state.currentRisks);
      if (risksSaveError) throw new Error(`Failed to save detailed risks: ${risksSaveError.message}`);

      const assessmentToSave = {
          user_id: state.session.user.id,
          created_at: new Date().toISOString(),
          role: state.currentUserRole,
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

      const { error: usageError } = await supabase.rpc('increment_assessment_count', { user_id_param: state.session.user.id });
      if (usageError) console.error('Failed to update usage count:', usageError);
      
      const userData = await getUserData(state.session.user.id);
      if (userData) {
          state.currentUserPlan = userData.plan;
          const appRole = ui.supabaseRoleToAppRole(userData.role);
          ui.applyRole(appRole);
          ui.updateFeatureAccess();
      }

      ui.systemStatusValue.textContent = 'Operational';
      ui.systemStatusValue.style.color = 'var(--Green-500)';
    } else {
      throw new Error('Invalid JSON structure in AI response or user not logged in.');
    }

  } catch (error) {
    console.error('Error during content generation:', error);
    let errorMessage = 'An unexpected error occurred during AI analysis. Please try again.';
    
    if (error instanceof Error) {
        const lowerCaseMessage = error.message.toLowerCase();
        if (lowerCaseMessage.includes('api key not valid') || lowerCaseMessage.includes('api_key_invalid')) {
            errorMessage = 'The AI API key is invalid. Please check the application configuration and ensure it is correct.';
        } 
        else if (lowerCaseMessage.includes('rate limit') || lowerCaseMessage.includes('quota') || lowerCaseMessage.includes('resource has been exhausted')) {
            errorMessage = 'The AI service is currently busy or rate limits have been exceeded. Please try again in a few moments.';
        }
        else if (error instanceof SyntaxError || lowerCaseMessage.includes('json')) {
            errorMessage = 'The AI response was not in a valid format. Please try rephrasing your request or simplifying the input.';
        }
    }

    ui.resultDiv.innerHTML = `<p style="color: var(--Red-500);">${errorMessage}</p>`;
    ui.systemStatusValue.textContent = 'Error';
    ui.systemStatusValue.style.color = 'var(--Red-500)';
  } finally {
    ui.loader.classList.add('hidden');
    ui.updateFeatureAccess();
  }
}

export async function triggerAIAnalysis() {
    if (!state.session) {
        alert('You must be logged in to assess risks.');
        return;
    }

    const appRole = ui.supabaseRoleToAppRole(state.currentUserRole);
    if (!roleConfig[appRole].permissions.canAssess) {
        alert('Your role does not have permission to perform new assessments.');
        return;
    }
    
    if (state.currentUserPlan && !state.currentUserPlan.is_premium && state.currentUserPlan.assessment_count >= state.currentUserPlan.assessment_limit) {
      ui.showUpgradeModal();
      return;
    }

    let prompt = ui.promptInput.value;
    if (!prompt && !state.imageBase64) {
      alert('Please upload an image or provide a text description for the AI to analyze.');
      return;
    }
    
    const geoInputs = {
        latitude: parseFloat(ui.latInput.value) || 0,
        longitude: parseFloat(ui.lngInput.value) || 0,
        elevation: parseFloat(ui.elevationInput.value) || 0,
        proximityToHazard: parseFloat(ui.proximityInput.value) || 0
    };

    const selectedRisks: string[] = Array.from(document.querySelectorAll('.risk-toggle:checked'))
                                         .map(toggle => (toggle as HTMLInputElement).value);

    if (selectedRisks.length === 0) {
      alert('Please select at least one risk category to analyze.');
      return;
    }
    prompt += `\n\nPlease focus the analysis on: ${selectedRisks.join(', ')}.`;
    
    state.lastAssessmentContext = {
        prompt: prompt,
        url: ui.urlInput.value,
        timestamp: new Date().toISOString(),
    };

    await generateContent(prompt, ui.urlInput.value, geoInputs, state.imageBase64, state.imageMimeType);
}

export async function handleManualAssessmentSubmit(e: Event) {
    e.preventDefault();
}

export async function handleUpgrade() {
    if (!state.session) return;
    
    ui.loader.classList.remove('hidden');
    ui.checkoutButton.disabled = true;

    await new Promise(resolve => setTimeout(resolve, 1500));

    const { error } = await supabase
        .from('usage_limits')
        .update({ is_premium: true })
        .eq('user_id', state.session.user.id);
    
    if (error) {
        console.error('Failed to upgrade plan:', error.message);
        alert('There was an error upgrading your plan. Please contact support.');
    } else {
        const userData = await getUserData(state.session.user.id);
        if (userData) {
            state.currentUserPlan = userData.plan;
            ui.updateFeatureAccess();
        }
        ui.upgradeViewMain.classList.add('hidden');
        ui.upgradeViewSuccess.classList.remove('hidden');
    }
    ui.loader.classList.add('hidden');
    ui.checkoutButton.disabled = false;
}

export async function handleStatusChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const riskId = selectElement.dataset.riskId;
    const newStatus = selectElement.value;

    if (!riskId) return;

    const riskToUpdate = state.currentRisks.find(r => r.risk_id === riskId);
    if (!riskToUpdate) return;
    
    const originalStatus = riskToUpdate.status || 'Open';
    riskToUpdate.status = newStatus;
    selectElement.disabled = true;

    const { error } = await supabase
        .from('risks')
        .update({ status: newStatus })
        .eq('risk_id', riskId);
    
    selectElement.disabled = false;

    if (error) {
        console.error('Failed to update risk status:', error.message);
        riskToUpdate.status = originalStatus;
        selectElement.value = originalStatus;
        alert('Failed to update risk status. Please try again.');
    } else {
        showUndoToast(`Status updated to ${newStatus}.`, async () => {
            selectElement.disabled = true;
            const { error: undoError } = await supabase
                .from('risks')
                .update({ status: originalStatus })
                .eq('risk_id', riskId);

            if (undoError) {
                alert('Failed to revert action.');
            } else {
                riskToUpdate.status = originalStatus;
                selectElement.value = originalStatus;
            }
            selectElement.disabled = false;
        });
    }
}

export function exportToCSV() {
  if (state.currentRisks.length === 0) {
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

  if (state.lastAssessmentContext) {
      csvRows.push('"Assessment Context"');
      csvRows.push(['Timestamp', state.lastAssessmentContext.timestamp].map(escapeCsvCell).join(','));
      csvRows.push(['Analysis Prompt', state.lastAssessmentContext.prompt].map(escapeCsvCell).join(','));
      csvRows.push(''); 
  }
  
  csvRows.push(headers.join(','));
  
  state.currentRisks.forEach(risk => {
    const row = [
      risk.risk_id, risk.title, risk.category, risk.severity,
      risk.confidence, risk.status || 'Open', risk.description, risk.mitigation
    ].map(escapeCsvCell);
    csvRows.push(row.join(','));
  });

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  const url = URL.createObjectURL(blob);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  link.setAttribute('href', url);
  link.setAttribute('download', `risk_register_${timestamp}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// --- AI Chatbot Logic ---

export function initializeChatbot(): Chat {
    const ai = new GoogleGenAI({ apiKey: (process.env as any).API_KEY });
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction: chatbotSystemInstruction }
    });
}

export async function handleChatSubmit(e: Event) {
    e.preventDefault();
    if (!state.chat) return;

    const userMessage = ui.chatbotInput.value.trim();
    if (!userMessage) return;

    ui.addChatMessage(userMessage, 'user');
    ui.chatbotInput.value = '';
    ui.chatbotInput.disabled = true;
    ui.chatbotSendButton.disabled = true;
    ui.chatbotTypingIndicator.classList.remove('hidden');

    try {
        const responseStream = await state.chat.sendMessageStream({ message: userMessage });
        let aiMessage = '';
        const aiMessageElement = ui.addChatMessage('', 'ai');

        for await (const chunk of responseStream) {
            aiMessage += chunk.text;
            aiMessageElement.textContent = aiMessage;
            ui.chatbotMessages.scrollTop = ui.chatbotMessages.scrollHeight;
        }
    } catch (error) {
        console.error('Chatbot error:', error);
        let errorMessage = 'Sorry, I encountered an error. Please try again.';
        if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('API_KEY_INVALID'))) {
            errorMessage = 'The AI chat is unavailable due to an invalid API key. Please contact support.';
        }
        ui.addChatMessage(errorMessage, 'ai');
    } finally {
        ui.chatbotInput.disabled = false;
        ui.chatbotSendButton.disabled = false;
        ui.chatbotTypingIndicator.classList.add('hidden');
        ui.chatbotInput.focus();
    }
}
