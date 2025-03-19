import { Types } from 'mongoose';

// Define entity types that can be extracted from resumes
export interface ResumeEntity {
  type: EntityType;
  value: string;
  confidence: number;
  position: {
    start: number;
    end: number;
  };
  metadata?: Record<string, any>;
}

export enum EntityType {
  PERSON_NAME = 'PERSON_NAME',
  COMPANY_NAME = 'COMPANY_NAME',
  JOB_TITLE = 'JOB_TITLE',
  DATE = 'DATE',
  DATE_RANGE = 'DATE_RANGE',
  LOCATION = 'LOCATION',
  EDUCATION = 'EDUCATION',
  DEGREE = 'DEGREE',
  SKILL = 'SKILL',
  CERTIFICATION = 'CERTIFICATION',
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  WEBSITE = 'WEBSITE',
  ACHIEVEMENT = 'ACHIEVEMENT',
  METRIC = 'METRIC',
}

export interface ExtractedResumeData {
  entities: ResumeEntity[];
  sections: {
    id: string;
    type: string;
    title: string;
    content: string;
    entities: ResumeEntity[];
    startPosition: number;
    endPosition: number;
  }[];
  rawText: string;
}

export class ResumeEntityService {
  /**
   * Extract structured entities from resume text
   */
  static async extractEntities(resumeText: string): Promise<ExtractedResumeData> {
    // Initialize the result structure
    const result: ExtractedResumeData = {
      entities: [],
      sections: [],
      rawText: resumeText
    };

    try {
      // Extract sections first
      const sections = this.extractSections(resumeText);
      result.sections = sections;

      // Extract entities from each section
      for (const section of sections) {
        const sectionEntities = await this.extractEntitiesFromSection(section.content, section.type);
        
        // Add section-specific context to entities
        sectionEntities.forEach(entity => {
          // Adjust position to be relative to the entire document
          entity.position.start += section.startPosition;
          entity.position.end += section.startPosition;
          
          // Add section context to metadata
          entity.metadata = {
            ...entity.metadata,
            sectionId: section.id,
            sectionType: section.type
          };
        });
        
        // Add entities to both section and global lists
        section.entities = sectionEntities as unknown as ResumeEntity[];
        result.entities.push(...sectionEntities);
      }

      return result;
    } catch (error) {
      console.error('Error extracting entities from resume:', error);
      // Return partial results if available, otherwise empty structure
      return result;
    }
  }

  /**
   * Extract sections from resume text
   */
  private static extractSections(resumeText: string) {
    const sections = [];
    
    // Common section titles in resumes
    const sectionPatterns = [
      { regex: /\b(SUMMARY|PROFILE|OBJECTIVE|ABOUT)\b/i, type: 'SUMMARY' },
      { regex: /\b(EXPERIENCE|WORK|EMPLOYMENT|HISTORY|PROFESSIONAL EXPERIENCE)\b/i, type: 'EXPERIENCE' },
      { regex: /\b(EDUCATION|ACADEMIC|QUALIFICATIONS|DEGREES)\b/i, type: 'EDUCATION' },
      { regex: /\b(SKILLS|EXPERTISE|COMPETENCIES|PROFICIENCIES)\b/i, type: 'SKILLS' },
      { regex: /\b(CERTIFICATIONS|CERTIFICATES|LICENSES)\b/i, type: 'CERTIFICATIONS' },
      { regex: /\b(PROJECTS|PORTFOLIO)\b/i, type: 'PROJECTS' },
      { regex: /\b(LANGUAGES)\b/i, type: 'LANGUAGES' },
      { regex: /\b(ACHIEVEMENTS|ACCOMPLISHMENTS|AWARDS)\b/i, type: 'ACHIEVEMENTS' },
      { regex: /\b(VOLUNTEER|COMMUNITY)\b/i, type: 'VOLUNTEER' },
      { regex: /\b(PUBLICATIONS|PAPERS|RESEARCH)\b/i, type: 'PUBLICATIONS' },
      { regex: /\b(REFERENCES)\b/i, type: 'REFERENCES' },
      { regex: /\b(CONTACT|PERSONAL INFORMATION)\b/i, type: 'CONTACT' },
    ];
    
    // Split text into lines for processing
    const lines = resumeText.split('\n');
    
    let currentSection = null;
    let currentContent = '';
    let startPosition = 0;
    
    // Process each line to identify sections
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const linePosition = resumeText.indexOf(line, startPosition);
      
      // Skip empty lines
      if (!line) continue;
      
      // Check if this line is a section header
      let isSectionHeader = false;
      let sectionType = '';
      
      for (const pattern of sectionPatterns) {
        if (pattern.regex.test(line) && line.length < 50) { // Section headers are typically short
          isSectionHeader = true;
          sectionType = pattern.type;
          break;
        }
      }
      
      // If we found a new section header
      if (isSectionHeader) {
        // Save the previous section if it exists
        if (currentSection) {
          sections.push({
            id: `section-${sections.length + 1}`,
            type: currentSection.type,
            title: currentSection.title,
            content: currentContent.trim(),
            entities: [] as ResumeEntity[],
            startPosition: currentSection.position,
            endPosition: linePosition - 1
          });
        }
        
        // Start a new section
        currentSection = {
          type: sectionType,
          title: line,
          position: linePosition
        };
        currentContent = '';
        startPosition = linePosition + line.length;
      } else if (currentSection) {
        // Add this line to the current section content
        currentContent += line + '\n';
      } else {
        // If no section has been identified yet, create a header section
        currentSection = {
          type: 'HEADER',
          title: 'Header',
          position: 0
        };
        currentContent += line + '\n';
      }
    }
    
    // Add the last section
    if (currentSection) {
      sections.push({
        id: `section-${sections.length + 1}`,
        type: currentSection.type,
        title: currentSection.title,
        content: currentContent.trim(),
        entities: [] as ResumeEntity[],
        startPosition: currentSection.position,
        endPosition: resumeText.length - 1
      });
    }
    
    return sections;
  }

  /**
   * Extract entities from a specific section
   */
  private static async extractEntitiesFromSection(
    sectionContent: string, 
    sectionType: string
  ): Promise<ResumeEntity[]> {
    const entities: ResumeEntity[] = [];
    
    // Extract different entity types based on section type
    switch (sectionType) {
      case 'HEADER':
        entities.push(...this.extractContactInfo(sectionContent));
        break;
      case 'EXPERIENCE':
        entities.push(...this.extractExperienceEntities(sectionContent));
        break;
      case 'EDUCATION':
        entities.push(...this.extractEducationEntities(sectionContent));
        break;
      case 'SKILLS':
        entities.push(...this.extractSkillEntities(sectionContent));
        break;
      default:
        // Generic entity extraction for other sections
        entities.push(...this.extractGenericEntities(sectionContent));
    }
    
    return entities;
  }

  /**
   * Extract contact information entities
   */
  private static extractContactInfo(text: string): ResumeEntity[] {
    const entities: ResumeEntity[] = [];
    
    // Email pattern
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    let match;
    while ((match = emailRegex.exec(text)) !== null) {
      entities.push({
        type: EntityType.EMAIL,
        value: match[0],
        confidence: 0.95,
        position: {
          start: match.index,
          end: match.index + match[0].length
        }
      });
    }
    
    // Phone pattern
    const phoneRegex = /\b(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g;
    while ((match = phoneRegex.exec(text)) !== null) {
      entities.push({
        type: EntityType.PHONE,
        value: match[0],
        confidence: 0.9,
        position: {
          start: match.index,
          end: match.index + match[0].length
        }
      });
    }
    
    // Website/URL pattern
    const urlRegex = /\b(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?\b/gi;
    while ((match = urlRegex.exec(text)) !== null) {
      entities.push({
        type: EntityType.WEBSITE,
        value: match[0],
        confidence: 0.85,
        position: {
          start: match.index,
          end: match.index + match[0].length
        }
      });
    }
    
    return entities;
  }

  /**
   * Extract experience-related entities
   */
  private static extractExperienceEntities(text: string): ResumeEntity[] {
    const entities: ResumeEntity[] = [];
    
    // Job title pattern (common job titles followed by at/for/with company)
    const jobTitleRegex = /\b(Senior|Lead|Principal|Junior|Associate)?\s?(Software|Web|UI|UX|Frontend|Backend|Full Stack|DevOps|Data|Product|Project)?\s?(Engineer|Developer|Designer|Manager|Analyst|Architect|Consultant|Specialist|Director|Administrator)\b/gi;
    let match;
    while ((match = jobTitleRegex.exec(text)) !== null) {
      entities.push({
        type: EntityType.JOB_TITLE,
        value: match[0],
        confidence: 0.8,
        position: {
          start: match.index,
          end: match.index + match[0].length
        }
      });
    }
    
    // Company name pattern (often follows worked at/for or precedes Inc/LLC/Ltd)
    const companyRegex = /\b([A-Z][a-z]+\s)+(?:Inc\.?|LLC|Ltd\.?|Corporation|Corp\.?|Company|Co\.?)\b|\b(?:at|for|with)\s+([A-Z][a-z]*(?:\s[A-Z][a-z]*)*)\b/g;
    while ((match = companyRegex.exec(text)) !== null) {
      const company = match[1] || match[2];
      if (company) {
        entities.push({
          type: EntityType.COMPANY_NAME,
          value: company.trim(),
          confidence: 0.75,
          position: {
            start: match.index,
            end: match.index + match[0].length
          }
        });
      }
    }
    
    // Date range pattern
    const dateRangeRegex = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\s*(?:-|–|to)\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|Present|Current)\b/gi;
    while ((match = dateRangeRegex.exec(text)) !== null) {
      entities.push({
        type: EntityType.DATE_RANGE,
        value: match[0],
        confidence: 0.9,
        position: {
          start: match.index,
          end: match.index + match[0].length
        }
      });
    }
    
    // Achievement metrics (numbers with % or quantifiable results)
    const metricRegex = /\b(?:increased|decreased|improved|reduced|achieved|generated|managed|led|created)\b.{3,50}?\b\d+(?:\.\d+)?%|\$\d+(?:,\d+)*(?:\.\d+)?(?:\s*(?:million|billion|k))?\b/gi;
    while ((match = metricRegex.exec(text)) !== null) {
      entities.push({
        type: EntityType.METRIC,
        value: match[0],
        confidence: 0.85,
        position: {
          start: match.index,
          end: match.index + match[0].length
        }
      });
    }
    
    return entities;
  }

  /**
   * Extract education-related entities
   */
  private static extractEducationEntities(text: string): ResumeEntity[] {
    const entities: ResumeEntity[] = [];
    
    // Degree pattern
    const degreeRegex = /\b(?:Bachelor|Master|PhD|Doctorate|Associate|B\.S\.|M\.S\.|B\.A\.|M\.A\.|B\.Eng\.|M\.Eng\.|MBA|Ph\.D\.|B\.Tech|M\.Tech)\b.{1,30}?\b(?:Science|Arts|Engineering|Business|Administration|Computer|Information|Technology|Mathematics|Physics|Chemistry|Biology|Psychology|Economics|Finance|Marketing|Management|Law|Medicine|Nursing|Education|Communication|Design|Architecture)\b/gi;
    let match;
    while ((match = degreeRegex.exec(text)) !== null) {
      entities.push({
        type: EntityType.DEGREE,
        value: match[0],
        confidence: 0.9,
        position: {
          start: match.index,
          end: match.index + match[0].length
        }
      });
    }
    
    // Institution pattern
    const institutionRegex = /\b(?:University|College|Institute|School)\s+(?:of\s+)?(?:[A-Z][a-z]*\s*)+\b/g;
    while ((match = institutionRegex.exec(text)) !== null) {
      entities.push({
        type: EntityType.EDUCATION,
        value: match[0],
        confidence: 0.85,
        position: {
          start: match.index,
          end: match.index + match[0].length
        }
      });
    }
    
    // Graduation date pattern
    const gradDateRegex = /\bClass of \d{4}\b|\bGraduated:?\s+(?:in\s+)?\d{4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\b/gi;
    while ((match = gradDateRegex.exec(text)) !== null) {
      entities.push({
        type: EntityType.DATE,
        value: match[0],
        confidence: 0.9,
        position: {
          start: match.index,
          end: match.index + match[0].length
        }
      });
    }
    
    return entities;
  }

  /**
   * Extract skill entities
   */
  private static extractSkillEntities(text: string): ResumeEntity[] {
    const entities: ResumeEntity[] = [];
    
    // Common technical skills
    const technicalSkills = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Ruby', 'PHP', 'Swift', 'Kotlin',
      'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'ASP.NET',
      'HTML', 'CSS', 'SASS', 'LESS', 'Bootstrap', 'Tailwind', 'Material UI',
      'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Firebase', 'DynamoDB', 'Redis',
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Git', 'GitHub', 'GitLab',
      'REST API', 'GraphQL', 'WebSockets', 'OAuth', 'JWT',
      'TensorFlow', 'PyTorch', 'scikit-learn', 'Pandas', 'NumPy',
      'Agile', 'Scrum', 'Kanban', 'JIRA', 'Confluence'
    ];
    
    // Create a regex pattern from the skills list
    const skillsPattern = new RegExp(`\\b(${technicalSkills.join('|')})\\b`, 'gi');
    
    let match;
    while ((match = skillsPattern.exec(text)) !== null) {
      entities.push({
        type: EntityType.SKILL,
        value: match[0],
        confidence: 0.9,
        position: {
          start: match.index,
          end: match.index + match[0].length
        }
      });
    }
    
    // Look for skill lists (comma or bullet-separated items)
    const skillListRegex = /(?:^|\n)(?:\s*[•\-*]\s*|\s*\d+\.\s*)([^.,;:\n]+)(?=$|\n)/gm;
    while ((match = skillListRegex.exec(text)) !== null) {
      const potentialSkill = match[1].trim();
      // Only consider items of reasonable length as skills
      if (potentialSkill.length > 2 && potentialSkill.length < 30) {
        entities.push({
          type: EntityType.SKILL,
          value: potentialSkill,
          confidence: 0.7, // Lower confidence for pattern-matched skills
          position: {
            start: match.index,
            end: match.index + match[0].length
          }
        });
      }
    }
    
    return entities;
  }

  /**
   * Extract generic entities that might appear in any section
   */
  private static extractGenericEntities(text: string): ResumeEntity[] {
    const entities: ResumeEntity[] = [];
    
    // Dates (various formats)
    const dateRegex = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b/gi;
    let match;
    while ((match = dateRegex.exec(text)) !== null) {
      entities.push({
        type: EntityType.DATE,
        value: match[0],
        confidence: 0.85,
        position: {
          start: match.index,
          end: match.index + match[0].length
        }
      });
    }
    
    // Locations (City, State or City, Country format)
    const locationRegex = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s+(?:[A-Z]{2}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
    while ((match = locationRegex.exec(text)) !== null) {
      entities.push({
        type: EntityType.LOCATION,
        value: match[0],
        confidence: 0.8,
        position: {
          start: match.index,
          end: match.index + match[0].length
        }
      });
    }
    
    // Certifications
    const certRegex = /\b(?:Certified|Certificate|Certification|Licensed)\s+(?:[A-Z][a-z]*\s*)+\b/g;
    while ((match = certRegex.exec(text)) !== null) {
      entities.push({
        type: EntityType.CERTIFICATION,
        value: match[0],
        confidence: 0.8,
        position: {
          start: match.index,
          end: match.index + match[0].length
        }
      });
    }
    
    return entities;
  }

  /**
   * Verify that optimized content preserves all critical entities
   */
  static verifyEntityPreservation(
    originalEntities: ResumeEntity[], 
    optimizedText: string
  ): { 
    preserved: boolean; 
    missingEntities: ResumeEntity[];
    modifiedEntities: { original: ResumeEntity; modified: string }[];
  } {
    const missingEntities: ResumeEntity[] = [];
    const modifiedEntities: { original: ResumeEntity; modified: string }[] = [];
    
    // Check each critical entity type
    const criticalEntityTypes = [
      EntityType.PERSON_NAME,
      EntityType.COMPANY_NAME,
      EntityType.JOB_TITLE,
      EntityType.DATE,
      EntityType.DATE_RANGE,
      EntityType.EDUCATION,
      EntityType.DEGREE,
      EntityType.CERTIFICATION,
      EntityType.METRIC
    ];
    
    // Filter for critical entities only
    const criticalEntities = originalEntities.filter(
      entity => criticalEntityTypes.includes(entity.type)
    );
    
    for (const entity of criticalEntities) {
      // For exact matches
      if (!optimizedText.includes(entity.value)) {
        // Try to find a close match (for slightly modified entities)
        const possibleModification = this.findSimilarText(entity.value, optimizedText);
        
        if (possibleModification) {
          modifiedEntities.push({
            original: entity,
            modified: possibleModification
          });
        } else {
          missingEntities.push(entity);
        }
      }
    }
    
    return {
      preserved: missingEntities.length === 0,
      missingEntities,
      modifiedEntities
    };
  }
  
  /**
   * Find similar text in the optimized content (for detecting slight modifications)
   */
  private static findSimilarText(original: string, text: string): string | null {
    // Simple implementation - can be enhanced with more sophisticated fuzzy matching
    const words = original.split(/\s+/);
    
    // If we have multiple words, try to find a sequence containing most of them
    if (words.length > 1) {
      // Create a sliding window of text chunks to check
      const chunks = [];
      const windowSize = 50; // Characters to check at once
      const step = 25; // How much to move the window each time
      
      for (let i = 0; i < text.length - windowSize; i += step) {
        chunks.push(text.substring(i, i + windowSize));
      }
      
      // Check each chunk for similarity to our original text
      for (const chunk of chunks) {
        let matchedWords = 0;
        for (const word of words) {
          if (chunk.includes(word)) {
            matchedWords++;
          }
        }
        
        // If most words match, extract the relevant portion
        if (matchedWords >= words.length * 0.7) {
          // Find the start and end of the matching section
          const firstWord = words.find(word => chunk.includes(word)) || '';
          const lastWord = [...words].reverse().find(word => chunk.includes(word)) || '';
          
          if (firstWord && lastWord) {
            const startIndex = chunk.indexOf(firstWord);
            const endIndex = chunk.lastIndexOf(lastWord) + lastWord.length;
            
            if (startIndex >= 0 && endIndex > startIndex) {
              return chunk.substring(startIndex, endIndex);
            }
          }
        }
      }
    }
    
    return null;
  }
} 