import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Custom error class for OpenAI-related errors
export class OpenAIError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = 'OpenAIError';
  }
}

// Configuration and client setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
});

// Interface for the response from our AI analysis
export interface AIAnalysisResponse {
  score: number;
  feedback: {
    section: string;
    message: string;
    suggestion: string;
    severity: 'CRITICAL' | 'WARNING' | 'SUGGESTION';
  }[];
  suggestions: string[];
  keywordAnalysis: {
    found: string[];
    missing: string[];
    score: number;
  };
}

/**
 * Validates and processes the OpenAI API response
 */
const processAIResponse = (response: any): AIAnalysisResponse => {
  try {
    const parsed = JSON.parse(response);
    // Validate the structure of the response
    if (!parsed.score || !Array.isArray(parsed.feedback) || !Array.isArray(parsed.suggestions)) {
      throw new Error('Invalid response structure from OpenAI');
    }
    return parsed;
  } catch (error) {
    throw new OpenAIError('Failed to process AI response: ' + (error as Error).message);
  }
};

/**
 * Tests the OpenAI API connection with a simple prompt
 */
export const testOpenAIConnection = async (): Promise<boolean> => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new OpenAIError('OpenAI API key is not configured');
    }

    if (!process.env.OPENAI_ORG_ID) {
      throw new OpenAIError('OpenAI Organization ID is not configured');
    }

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: "Hello, are you working?" }],
      model: "gpt-4",
    });

    return completion.choices[0].message.content !== null;
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    
    // Handle specific OpenAI API errors
    if (error.response?.status === 401) {
      throw new OpenAIError('Invalid OpenAI API key or Organization ID', 401);
    }
    if (error.response?.status === 403) {
      throw new OpenAIError('Access to this model is not allowed for your account', 403);
    }
    if (error.response?.status === 429) {
      throw new OpenAIError('Rate limit exceeded or quota exceeded', 429);
    }
    
    throw new OpenAIError(
      'Failed to connect to OpenAI API: ' + 
      (error.response?.data?.error?.message || error.message || 'Unknown error')
    );
  }
};

/**
 * Analyzes a resume using the OpenAI API
 */
export const analyzeResume = async (resumeText: string, jobDescription?: string): Promise<AIAnalysisResponse> => {
  try {
    console.log('Starting OpenAI analysis...'); // Debug log
    
    const prompt = `Analyze the following resume${jobDescription ? ' for this job description' : ''}:
    
    ${resumeText}
    
    ${jobDescription ? `\nJob Description:\n${jobDescription}` : ''}
    
    Provide a detailed analysis in the following JSON format:
    {
      "score": <overall_score_0_to_100>,
      "feedback": [
        {
          "section": "<SECTION_NAME>",
          "message": "<detailed_feedback>",
          "suggestion": "<specific_improvement_suggestion>",
          "severity": "<CRITICAL | WARNING | SUGGESTION>"
        }
      ],
      "suggestions": ["<general_improvement_suggestion>"],
      "keywordAnalysis": {
        "found": ["<relevant_keyword>"],
        "missing": ["<missing_keyword>"],
        "score": <keyword_match_score_0_to_100>
      }
    }`;

    console.log('Sending request to OpenAI...'); // Debug log
    
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4",
      temperature: 0.7,
      max_tokens: 2000,
    });

    console.log('Received response from OpenAI'); // Debug log

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new OpenAIError('Empty response from OpenAI');
    }

    console.log('Processing OpenAI response...'); // Debug log
    const processedResponse = processAIResponse(response);
    console.log('Analysis completed successfully'); // Debug log
    
    return processedResponse;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    if (error instanceof OpenAIError) {
      throw error;
    }
    throw new OpenAIError('Failed to analyze resume: ' + (error as Error).message);
  }
};

/**
 * Generates improvement suggestions for a specific section of a resume
 */
export const generateSectionSuggestions = async (
  section: string,
  currentContent: string
): Promise<string[]> => {
  try {
    const prompt = `Provide specific suggestions to improve the following ${section} section of a resume:
    
    ${currentContent}
    
    Provide exactly 3 specific, actionable suggestions in a JSON array format.`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new OpenAIError('Empty response from OpenAI');
    }

    const suggestions = JSON.parse(response);
    if (!Array.isArray(suggestions)) {
      throw new OpenAIError('Invalid suggestions format from OpenAI');
    }

    return suggestions;
  } catch (error) {
    if (error instanceof OpenAIError) {
      throw error;
    }
    throw new OpenAIError('Failed to generate section suggestions: ' + (error as Error).message);
  }
};

/**
 * Generate optimized content for a resume section
 * @param sectionTitle The title of the section
 * @param originalContent The original content of the section
 * @param feedback Feedback for the section
 * @returns Optimized content
 */
export async function generateOptimizedSection(
  sectionTitle: string,
  originalContent: string,
  feedback: string
): Promise<string> {
  try {
    // Create a system prompt that emphasizes factual preservation
    const systemPrompt = `
      You are an expert resume optimizer. Your task is to improve a resume section while preserving all factual information.
      
      CRITICAL CONSTRAINTS:
      1. DO NOT change any dates, company names, job titles, or educational institutions
      2. DO NOT alter any metrics, numbers, or quantifiable achievements
      3. DO NOT remove or change any factual information about the person's experience
      4. DO NOT add fictional experiences, skills, or qualifications
      5. PRESERVE the chronology and timeline of experiences
      
      FOCUS ON:
      1. Improving language clarity and impact
      2. Enhancing structure and readability
      3. Highlighting achievements more effectively
      4. Using stronger action verbs and professional language
      5. Optimizing for keywords while maintaining factual accuracy
    `;

    // Create a user prompt with the section content and feedback
    const userPrompt = `
      SECTION: ${sectionTitle}
      
      ORIGINAL CONTENT:
      ${originalContent}
      
      FEEDBACK TO ADDRESS:
      ${feedback}
      
      Improve this section while strictly preserving all factual information.
      Return ONLY the improved content without explanations or additional text.
    `;

    // Make the API call
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.5,
      max_tokens: 1000
    });

    // Return the optimized content
    return response.choices[0].message.content?.trim() || originalContent;
  } catch (error) {
    console.error('Error generating optimized section:', error);
    return originalContent;
  }
}

/**
 * Improve a specific section with AI while preserving factual accuracy
 * @param sectionTitle The title of the section
 * @param originalContent The original content of the section
 * @param criticalEntities List of critical entities that must be preserved
 * @returns Improved content
 */
export async function improveSectionWithConstraints(
  sectionTitle: string,
  originalContent: string,
  criticalEntities: string[]
): Promise<string> {
  try {
    // Create a system prompt with explicit entity preservation
    const systemPrompt = `
      You are an expert resume editor. Your task is to improve a resume section while strictly preserving specific factual entities.
      
      CRITICAL ENTITIES TO PRESERVE:
      ${criticalEntities.map(entity => `- "${entity}"`).join('\n')}
      
      CRITICAL CONSTRAINTS:
      1. All listed entities MUST appear in your output exactly as provided
      2. DO NOT change the meaning or context of any preserved entity
      3. DO NOT add fictional experiences or qualifications
      4. MAINTAIN the chronological order of events
      5. PRESERVE all metrics, achievements, and quantifiable results
      
      FOCUS ON:
      1. Improving language clarity and impact
      2. Enhancing structure and readability
      3. Using stronger action verbs and professional language
    `;

    // Create a user prompt with the section content
    const userPrompt = `
      SECTION: ${sectionTitle}
      
      ORIGINAL CONTENT:
      ${originalContent}
      
      Improve this section while strictly preserving all critical entities listed above.
      Return ONLY the improved content without explanations or additional text.
    `;

    // Make the API call
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3, // Lower temperature for more conservative changes
      max_tokens: 1000
    });

    // Return the improved content
    return response.choices[0].message.content?.trim() || originalContent;
  } catch (error) {
    console.error('Error improving section with constraints:', error);
    return originalContent;
  }
}

/**
 * Context-aware resume optimization parameters
 */
export interface ContextAwareOptimizationParams {
  resumeText: string;
  jobDescription?: string;
  industryContext?: string;
  careerLevel?: 'entry' | 'mid' | 'senior' | 'executive';
  targetRole?: string;
  targetCompany?: string;
  preserveEntities?: boolean;
}

/**
 * Generate a context-aware optimized resume
 * This function enhances the resume optimization process by considering:
 * 1. Industry-specific terminology and expectations
 * 2. Career level appropriate language and achievements
 * 3. Target role requirements and responsibilities
 * 4. Company culture and values (if available)
 */
export async function generateContextAwareOptimizedResume(
  params: ContextAwareOptimizationParams
): Promise<{
  optimizedSections: { title: string; content: string; metadata: any }[];
  fullText: string;
  contextualMetadata: {
    industryRelevance: number;
    careerLevelAppropriate: boolean;
    roleAlignment: number;
    companyFit?: number;
  };
}> {
  try {
    // Build a comprehensive system prompt that includes contextual awareness
    let systemPrompt = `You are an expert resume optimizer with deep knowledge of various industries, career levels, and hiring practices.
Your task is to optimize a resume while maintaining factual accuracy and enhancing its relevance to the specific context.

Follow these guidelines:
1. Preserve all factual information including dates, company names, job titles, and quantifiable achievements.
2. Use industry-appropriate terminology and highlight relevant skills.
3. Adjust language and emphasis based on career level (${params.careerLevel || 'not specified'}).
4. Align content with the target role requirements.
5. Format content professionally and consistently.
6. Maintain the original structure of sections.
7. Enhance clarity and impact of achievements.`;

    // Add industry-specific instructions if available
    if (params.industryContext) {
      systemPrompt += `\n\nIndustry Context: ${params.industryContext}
- Use terminology common in this industry
- Emphasize skills and achievements most valued in this field
- Highlight relevant certifications or specialized knowledge`;
    }

    // Add career level specific instructions
    if (params.careerLevel) {
      switch (params.careerLevel) {
        case 'entry':
          systemPrompt += `\n\nEntry-Level Focus:
- Emphasize education, internships, and transferable skills
- Highlight potential and eagerness to learn
- Focus on academic achievements and relevant coursework`;
          break;
        case 'mid':
          systemPrompt += `\n\nMid-Career Focus:
- Balance between skills and growing leadership abilities
- Emphasize measurable achievements and impact
- Highlight progression and increased responsibilities`;
          break;
        case 'senior':
          systemPrompt += `\n\nSenior-Level Focus:
- Emphasize leadership, strategic thinking, and vision
- Highlight cross-functional collaboration and influence
- Focus on business impact and organizational contributions`;
          break;
        case 'executive':
          systemPrompt += `\n\nExecutive-Level Focus:
- Emphasize strategic leadership and organizational impact
- Highlight business transformation and growth metrics
- Focus on vision, innovation, and executive presence`;
          break;
      }
    }

    // Add target role specific instructions
    if (params.targetRole) {
      systemPrompt += `\n\nTarget Role: ${params.targetRole}
- Align experience with key requirements for this role
- Emphasize transferable skills relevant to this position
- Use terminology from the job description where appropriate`;
    }

    // Add target company specific instructions if available
    if (params.targetCompany) {
      systemPrompt += `\n\nTarget Company: ${params.targetCompany}
- Consider company culture and values in language choice
- Align achievements with company mission where relevant`;
    }

    // Add job description specific instructions if available
    if (params.jobDescription) {
      systemPrompt += `\n\nJob Description Context:
${params.jobDescription}

- Align resume content with the requirements in this job description
- Use similar terminology where appropriate
- Highlight experiences most relevant to these requirements`;
    }

    // Parse the resume into sections
    const sections = parseResumeIntoSections(params.resumeText);
    const optimizedSections = [];
    let fullOptimizedText = '';

    // Process each section with contextual awareness
    for (const section of sections) {
      const optimizedContent = await optimizeSectionWithContext(
        section.title,
        section.content,
        systemPrompt
      );
      
      optimizedSections.push({
        title: section.title,
        content: optimizedContent,
        metadata: {
          originalLength: section.content.length,
          optimizedLength: optimizedContent.length,
          improvementAreas: identifyImprovementAreas(section.title)
        }
      });
      
      fullOptimizedText += `${section.title}\n${optimizedContent}\n\n`;
    }

    // Generate contextual metadata about the optimization
    const contextualMetadata = {
      industryRelevance: calculateIndustryRelevance(fullOptimizedText, params.industryContext),
      careerLevelAppropriate: assessCareerLevelAppropriateness(fullOptimizedText, params.careerLevel),
      roleAlignment: calculateRoleAlignment(fullOptimizedText, params.targetRole, params.jobDescription),
      companyFit: params.targetCompany ? calculateCompanyFit(fullOptimizedText, params.targetCompany) : undefined
    };

    return {
      optimizedSections,
      fullText: fullOptimizedText,
      contextualMetadata
    };
  } catch (error) {
    console.error('Error in context-aware resume optimization:', error);
    throw new OpenAIError('Failed to generate context-aware optimized resume', 500);
  }
}

/**
 * Helper function to parse resume text into sections
 */
function parseResumeIntoSections(resumeText: string): { title: string; content: string }[] {
  // Simple section detection - this could be enhanced with more sophisticated parsing
  // Using a regex without the 's' flag for compatibility with earlier ECMAScript versions
  const sectionRegex = /^([A-Z][A-Z\s]+)(?:\r?\n|\r)([\s\S]+?)(?=^[A-Z][A-Z\s]+|\Z)/gm;
  const sections = [];
  let match;

  while ((match = sectionRegex.exec(resumeText + '\n\nEND')) !== null) {
    if (match[1] !== 'END') {
      sections.push({
        title: match[1].trim(),
        content: match[2].trim()
      });
    }
  }

  // If no sections were detected, treat the entire resume as one section
  if (sections.length === 0) {
    sections.push({
      title: 'RESUME',
      content: resumeText.trim()
    });
  }

  return sections;
}

/**
 * Optimize a specific section with contextual awareness
 */
async function optimizeSectionWithContext(
  sectionTitle: string,
  originalContent: string,
  systemPrompt: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `Please optimize the following ${sectionTitle} section of a resume while maintaining factual accuracy and enhancing its relevance to the specified context:\n\n${originalContent}`
        }
      ],
      temperature: 0.5,
      max_tokens: 1000
    });

    return response.choices[0].message.content?.trim() || originalContent;
  } catch (error) {
    console.error(`Error optimizing section ${sectionTitle}:`, error);
    return originalContent; // Return original content if optimization fails
  }
}

/**
 * Calculate industry relevance score based on terminology and focus
 */
function calculateIndustryRelevance(optimizedText: string, industryContext?: string): number {
  // This would ideally use a more sophisticated algorithm or ML model
  // For now, we'll use a placeholder implementation
  if (!industryContext) return 0.7; // Default moderate relevance
  
  // Simple keyword matching for industry relevance
  const industryKeywords = getIndustryKeywords(industryContext);
  let matchCount = 0;
  
  for (const keyword of industryKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(optimizedText)) {
      matchCount++;
    }
  }
  
  return Math.min(1, matchCount / (industryKeywords.length * 0.7));
}

/**
 * Get industry-specific keywords
 */
function getIndustryKeywords(industry: string): string[] {
  // This would ideally be a comprehensive database of industry-specific terms
  // For now, we'll use a simple mapping of common industries to keywords
  const industryKeywordMap: { [key: string]: string[] } = {
    'technology': ['software', 'development', 'programming', 'agile', 'scrum', 'cloud', 'API', 'frontend', 'backend', 'full-stack', 'DevOps'],
    'finance': ['analysis', 'portfolio', 'investment', 'banking', 'trading', 'financial', 'assets', 'equity', 'risk', 'compliance'],
    'healthcare': ['patient', 'clinical', 'medical', 'health', 'care', 'treatment', 'diagnosis', 'therapy', 'hospital', 'physician'],
    'marketing': ['campaign', 'brand', 'strategy', 'digital', 'content', 'social media', 'SEO', 'analytics', 'audience', 'conversion'],
    'education': ['teaching', 'curriculum', 'student', 'learning', 'instruction', 'assessment', 'education', 'classroom', 'pedagogy', 'academic'],
    // Add more industries as needed
  };
  
  // Find the closest matching industry or return generic business terms
  const matchedIndustry = Object.keys(industryKeywordMap).find(key => 
    industry.toLowerCase().includes(key.toLowerCase())
  );
  
  return matchedIndustry 
    ? industryKeywordMap[matchedIndustry]
    : ['management', 'leadership', 'project', 'team', 'strategy', 'analysis', 'communication', 'collaboration'];
}

/**
 * Assess if the resume language is appropriate for the career level
 */
function assessCareerLevelAppropriateness(optimizedText: string, careerLevel?: string): boolean {
  if (!careerLevel) return true; // Default to appropriate if no level specified
  
  // This would ideally use NLP to analyze language patterns
  // For now, we'll use a simple keyword-based approach
  const careerLevelIndicators: { [key: string]: { appropriate: string[], inappropriate: string[] } } = {
    'entry': {
      appropriate: ['assisted', 'supported', 'learned', 'trained', 'participated', 'contributed'],
      inappropriate: ['directed', 'led', 'managed', 'oversaw', 'executive', 'chief', 'head']
    },
    'mid': {
      appropriate: ['coordinated', 'managed', 'implemented', 'developed', 'led', 'trained'],
      inappropriate: ['executive', 'chief', 'head', 'directed', 'transformed', 'pioneered']
    },
    'senior': {
      appropriate: ['led', 'managed', 'directed', 'oversaw', 'developed', 'implemented', 'strategic'],
      inappropriate: ['assisted', 'supported', 'helped', 'entry-level']
    },
    'executive': {
      appropriate: ['directed', 'led', 'strategic', 'executive', 'vision', 'transformed', 'pioneered'],
      inappropriate: ['assisted', 'supported', 'entry-level', 'junior']
    }
  };
  
  const indicators = careerLevelIndicators[careerLevel];
  if (!indicators) return true;
  
  let appropriateCount = 0;
  let inappropriateCount = 0;
  
  for (const term of indicators.appropriate) {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    if (regex.test(optimizedText)) {
      appropriateCount++;
    }
  }
  
  for (const term of indicators.inappropriate) {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    if (regex.test(optimizedText)) {
      inappropriateCount++;
    }
  }
  
  // Resume is appropriate if it has more appropriate terms than inappropriate ones
  return appropriateCount > inappropriateCount;
}

/**
 * Calculate alignment with target role based on job description and role title
 */
function calculateRoleAlignment(optimizedText: string, targetRole?: string, jobDescription?: string): number {
  if (!targetRole && !jobDescription) return 0.5; // Default moderate alignment
  
  let alignmentScore = 0.5; // Start with neutral alignment
  
  // Check alignment with target role
  if (targetRole) {
    const roleKeywords = getRoleKeywords(targetRole);
    let matchCount = 0;
    
    for (const keyword of roleKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(optimizedText)) {
        matchCount++;
      }
    }
    
    // Adjust alignment based on role keyword matches
    alignmentScore += (matchCount / roleKeywords.length) * 0.25;
  }
  
  // Check alignment with job description
  if (jobDescription) {
    // Extract key terms from job description (simplified approach)
    const jobTerms = jobDescription
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(term => term.length > 3) // Filter out short words
      .filter(term => !['and', 'the', 'for', 'with', 'that', 'this', 'have', 'from'].includes(term));
    
    const uniqueJobTerms = [...new Set(jobTerms)];
    let matchCount = 0;
    
    for (const term of uniqueJobTerms) {
      const regex = new RegExp(`\\b${term}\\b`, 'i');
      if (regex.test(optimizedText)) {
        matchCount++;
      }
    }
    
    // Adjust alignment based on job description term matches
    alignmentScore += (matchCount / Math.min(uniqueJobTerms.length, 50)) * 0.25; // Cap at 50 terms
  }
  
  return Math.min(1, alignmentScore); // Cap at 1.0
}

/**
 * Get role-specific keywords
 */
function getRoleKeywords(role: string): string[] {
  // This would ideally be a comprehensive database of role-specific terms
  // For now, we'll use a simple mapping of common roles to keywords
  const roleKeywordMap: { [key: string]: string[] } = {
    'software engineer': ['coding', 'programming', 'development', 'software', 'engineering', 'algorithms', 'debugging', 'testing'],
    'product manager': ['product', 'roadmap', 'requirements', 'stakeholders', 'prioritization', 'user', 'market', 'features'],
    'data scientist': ['data', 'analysis', 'statistics', 'machine learning', 'modeling', 'algorithms', 'visualization', 'insights'],
    'marketing manager': ['marketing', 'campaigns', 'strategy', 'brand', 'audience', 'metrics', 'content', 'promotion'],
    'sales representative': ['sales', 'clients', 'revenue', 'pipeline', 'prospects', 'closing', 'targets', 'customer'],
    // Add more roles as needed
  };
  
  // Find the closest matching role or return generic professional terms
  const matchedRole = Object.keys(roleKeywordMap).find(key => 
    role.toLowerCase().includes(key.toLowerCase())
  );
  
  return matchedRole 
    ? roleKeywordMap[matchedRole]
    : ['professional', 'experienced', 'skilled', 'knowledgeable', 'proficient', 'competent', 'qualified'];
}

/**
 * Calculate company fit based on company name and values
 */
function calculateCompanyFit(optimizedText: string, targetCompany: string): number {
  // This would ideally use company-specific data from a database or API
  // For now, we'll use a placeholder implementation
  return 0.7; // Default moderate fit
}

/**
 * Identify improvement areas for a section
 */
function identifyImprovementAreas(sectionTitle: string): string[] {
  // This would ideally be based on the actual content analysis
  // For now, we'll return generic improvement areas based on section type
  const sectionType = sectionTitle.toLowerCase();
  
  if (sectionType.includes('experience') || sectionType.includes('work')) {
    return ['Use action verbs', 'Quantify achievements', 'Show impact'];
  } else if (sectionType.includes('education')) {
    return ['Highlight relevant coursework', 'Show academic achievements'];
  } else if (sectionType.includes('skills')) {
    return ['Organize by category', 'Prioritize relevant skills'];
  } else if (sectionType.includes('summary') || sectionType.includes('objective')) {
    return ['Be concise', 'Highlight unique value', 'Target specific role'];
  } else {
    return ['Ensure relevance', 'Be concise', 'Use professional language'];
  }
}

export default openai; 