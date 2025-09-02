import { GoogleGenAI, Chat } from '@google/genai';
import { supabase } from '../utils/supabase/client';
import { systemInstructions, recommendPlaceFunctionDeclaration, chatbotSystemInstruction, assessmentResponseSchema } from '../utils/gemini/prompt';
import { FullAssessmentResponse, Risk } from '../types';
import { getUserData } from './userAuth';

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
  image?: string | null,
  mimeType?: string | null,
) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
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
      responseSchema: assessmentResponseSchema,
    },
  });
  
  const recommendPlaceCall = response.functionCalls?.find(
    (fn) => fn.name === 'recommendPlace'
  );
  
  const responseText = response.text.trim();
  const assessment: FullAssessmentResponse = JSON.parse(responseText);

  return { assessment, location: recommendPlaceCall?.args.location };
}


export async function triggerAIAnalysis(context: any, setters: any) {
    const { session, currentUserPlan, prompt, url, geoInputs, selectedRisks, imageBase64, imageMimeType } = context;
    const { setLoaderVisible, setDashboardStatus, setMapQuery, setAssessmentResult, setCurrentRisks, updateDashboard, setCurrentUserPlan, applyRole, showUpgradeModal, setLastAssessmentContext } = setters;
    
    if (currentUserPlan && !currentUserPlan.is_premium && currentUserPlan.assessment_count >= currentUserPlan.assessment_limit) {
      showUpgradeModal();
      return;
    }

    if (!prompt && !imageBase64) {
      alert('Please upload an image or provide a text description for the AI to analyze.');
      return;
    }
     if (selectedRisks.length === 0) {
      alert('Please select at least one risk category to analyze.');
      return;
    }

    let fullPrompt = prompt + `\n\nPlease focus the analysis on: ${selectedRisks.join(', ')}.`;

    setLoaderVisible(true);
    setDashboardStatus('Analyzing...', 'var(--Orange-500)');

    try {
        const { assessment, location } = await generateContent(fullPrompt, url, imageBase64, imageMimeType);
        
        if (location && typeof location === 'string') {
            setMapQuery(location);
        }

        if (assessment.report && assessment.risks && assessment.digitalScores && session) {
            setAssessmentResult(assessment.report);
            
            const { digitalScore, geoScore, finalScore } = calculateRiskScore({
                ...assessment.digitalScores,
                ...geoInputs
            });
            
            const newRisks = assessment.risks.map((risk: Risk) => ({ 
                ...risk, 
                user_id: session.user.id,
                risk_id: crypto.randomUUID(),
                status: 'Open',
            }));
            setCurrentRisks(newRisks);
            updateDashboard(newRisks, { digitalScore, geoScore, finalScore });

            // Save to DB
            const { error: risksSaveError } = await supabase.from('risks').insert(newRisks);
            if (risksSaveError) throw new Error(`Failed to save detailed risks: ${risksSaveError.message}`);
            
            const assessmentToSave = {
                user_id: session.user.id,
                created_at: new Date().toISOString(),
                role: context.currentUserRole,
                url,
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
            
            // Update usage count
            const { error: usageError } = await supabase.rpc('increment_assessment_count', { user_id_param: session.user.id });
            if (usageError) console.error('Failed to update usage count:', usageError);
            
            const userData = await getUserData(session.user.id);
            if (userData) {
                setCurrentUserPlan(userData.plan);
            }

            setDashboardStatus('Operational', 'var(--Green-500)');
            setLastAssessmentContext({ prompt: fullPrompt, url, timestamp: new Date().toISOString() });

        } else {
            throw new Error('Invalid JSON structure in AI response.');
        }

    } catch (error) {
        console.error('Error during content generation:', error);
        setAssessmentResult(`<p style="color: var(--Red-500);">An error occurred during AI analysis. Please try again.</p>`);
        setDashboardStatus('Error', 'var(--Red-500)');
    } finally {
        setLoaderVisible(false);
    }
}

export async function handleManualAssessmentSubmit(e: Event) {
    e.preventDefault();
}

export async function handleUpgrade(userId: string) {
    if (!userId) return false;
    await new Promise(resolve => setTimeout(resolve, 1500));
    const { error } = await supabase
        .from('usage_limits')
        .update({ is_premium: true })
        .eq('user_id', userId);
    
    if (error) {
        console.error('Failed to upgrade plan:', error.message);
        alert('There was an error upgrading your plan. Please contact support.');
        return false;
    }
    return true;
}

export async function handleStatusChange(riskId: string, newStatus: string) {
    const { error } = await supabase
        .from('risks')
        .update({ status: newStatus })
        .eq('risk_id', riskId);
    
    if (error) {
        console.error('Failed to update risk status:', error.message);
        return false;
    }
    return true;
}

export function exportToCSV(currentRisks: Risk[], lastAssessmentContext: any) {
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

  if (lastAssessmentContext) {
      csvRows.push('"Assessment Context"');
      csvRows.push(['Timestamp', lastAssessmentContext.timestamp].map(escapeCsvCell).join(','));
      csvRows.push(['Analysis Prompt', lastAssessmentContext.prompt].map(escapeCsvCell).join(','));
      csvRows.push(''); 
  }
  
  csvRows.push(headers.join(','));
  
  currentRisks.forEach(risk => {
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction: chatbotSystemInstruction }
    });
}

export async function handleChatSubmit(userMessage: string, chat: Chat, messagesContainer: Element, typingIndicator: Element) {
    const addChatMessage = (message: string, sender: 'user' | 'ai') => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender);
        messageElement.textContent = message;
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return messageElement;
    };
    
    addChatMessage(userMessage, 'user');
    typingIndicator.classList.remove('hidden');

    try {
        const responseStream = await chat.sendMessageStream({ message: userMessage });
        let aiMessage = '';
        const aiMessageElement = addChatMessage('', 'ai');

        for await (const chunk of responseStream) {
            aiMessage += chunk.text;
            aiMessageElement.textContent = aiMessage;
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    } catch (error) {
        console.error('Chatbot error:', error);
        addChatMessage('Sorry, I encountered an error. Please try again.', 'ai');
    } finally {
        typingIndicator.classList.add('hidden');
    }
}
