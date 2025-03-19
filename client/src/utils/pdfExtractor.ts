import * as pdfjs from 'pdfjs-dist';
import { EnhancedExtraction, FormatMetadata, ContentContext } from '../../../server/src/types/resume.types';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;
}

interface TextItem {
  str: string;
  dir: string;
  transform: number[];
  fontName: string;
  fontSize: number;
  hasEOL: boolean;
}

interface StructureNode {
  type: string;
  content: string;
  children: StructureNode[];
  format: FormatMetadata;
  position: { start: number; end: number };
}

export async function extractEnhancedPDF(pdfFile: File): Promise<EnhancedExtraction> {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    
    let fullContent = '';
    const sections: StructureNode[] = [];
    const relationships: { from: string; to: string; type: string }[] = [];
    const emphasisRanges: { type: string; range: [number, number]; metadata: FormatMetadata }[] = [];
    
    // Process each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const structContent = await page.getStructTree();
      
      // Extract text with formatting
      let pageText = '';
      let currentFormat: FormatMetadata | null = null;
      let sectionStart = fullContent.length;
      
      for (const item of textContent.items as TextItem[]) {
        const format = extractFormatting(item);
        
        // Detect format changes
        if (!currentFormat || isFormatDifferent(format, currentFormat)) {
          if (pageText.length > 0) {
            sections.push({
              type: detectSectionType(pageText),
              content: pageText,
              children: [],
              format: currentFormat || format,
              position: { start: sectionStart, end: sectionStart + pageText.length }
            });
            sectionStart = fullContent.length + pageText.length;
          }
          currentFormat = format;
        }
        
        pageText += item.str + (item.hasEOL ? '\n' : ' ');
        
        // Track emphasis
        if (format.emphasis?.bold || format.emphasis?.italic) {
          emphasisRanges.push({
            type: format.emphasis.bold ? 'bold' : 'italic',
            range: [fullContent.length + pageText.length - item.str.length, fullContent.length + pageText.length],
            metadata: format
          });
        }
      }
      
      // Process structure tree
      if (structContent) {
        processStructureTree(structContent, sections, relationships);
      }
      
      fullContent += pageText;
    }
    
    // Build the enhanced extraction object
    const enhancedExtraction: EnhancedExtraction = {
      content: fullContent,
      structure: {
        sections: sections.map((section, index) => ({
          id: `section-${index}`,
          type: section.type,
          level: calculateHierarchyLevel(section, sections),
          format: section.format,
          position: section.position,
          content: section.content,
          context: buildContext(section, sections)
        })),
        relationships
      },
      formatting: {
        emphasis: emphasisRanges,
        layout: detectLayout(sections)
      },
      metadata: {
        originalLanguage: detectLanguage(fullContent),
        processingDate: new Date(),
        confidence: calculateConfidence(sections),
        warnings: []
      }
    };
    
    return enhancedExtraction;
  } catch (error) {
    console.error('Enhanced PDF extraction failed:', error);
    throw new Error('Failed to extract enhanced PDF content');
  }
}

function extractFormatting(item: TextItem): FormatMetadata {
  return {
    font: {
      family: item.fontName,
      size: item.fontSize,
      weight: detectFontWeight(item.fontName),
      style: detectFontStyle(item.fontName)
    },
    spacing: {
      before: 0,
      after: item.hasEOL ? 1 : 0,
      lineHeight: calculateLineHeight(item.transform)
    },
    emphasis: {
      bold: isBoldFont(item.fontName),
      italic: isItalicFont(item.fontName),
      underline: false
    },
    alignment: detectAlignment(item.transform)
  };
}

function isFormatDifferent(a: FormatMetadata, b: FormatMetadata): boolean {
  return (
    a.font?.family !== b.font?.family ||
    a.font?.size !== b.font?.size ||
    a.font?.weight !== b.font?.weight ||
    a.emphasis?.bold !== b.emphasis?.bold ||
    a.emphasis?.italic !== b.emphasis?.italic
  );
}

function detectSectionType(content: string): string {
  // Implement section type detection logic based on content and format
  if (/^(EDUCATION|EXPERIENCE|SKILLS|PROJECTS)/i.test(content)) return 'header';
  if (/^\d{4}[-–]\d{4}|^\d{4}[-–]present/i.test(content)) return 'date';
  if (/^[•·]/.test(content)) return 'list';
  if (/^[A-Z\s]{2,}$/.test(content)) return 'section-title';
  return 'body';
}

function calculateHierarchyLevel(section: StructureNode, allSections: StructureNode[]): number {
  // Implement hierarchy level calculation based on formatting and position
  if (section.format.font?.size && section.format.font.size > 14) return 1;
  if (section.format.font?.size && section.format.font.size > 12) return 2;
  return 3;
}

function buildContext(section: StructureNode, allSections: StructureNode[]): ContentContext {
  const sectionIndex = allSections.indexOf(section);
  return {
    precedingContent: sectionIndex > 0 ? allSections[sectionIndex - 1].content : '',
    followingContent: sectionIndex < allSections.length - 1 ? allSections[sectionIndex + 1].content : '',
    relatedSections: findRelatedSections(section, allSections),
    hierarchyLevel: calculateHierarchyLevel(section, allSections),
    semanticRole: detectSemanticRole(section)
  };
}

function findRelatedSections(section: StructureNode, allSections: StructureNode[]): string[] {
  // Implement related sections detection logic
  return allSections
    .filter(s => s !== section && isRelated(s, section))
    .map((_, index) => `section-${index}`);
}

function isRelated(section1: StructureNode, section2: StructureNode): boolean {
  // Implement section relationship detection logic
  return (
    section1.type === section2.type ||
    Math.abs(section1.position.start - section2.position.end) < 100
  );
}

function detectSemanticRole(section: StructureNode): string {
  // Implement semantic role detection based on content and format
  if (section.type === 'header') return 'section-title';
  if (section.type === 'list') return 'bullet-point';
  if (section.type === 'date') return 'temporal-marker';
  return 'content';
}

function processStructureTree(
  tree: any,
  sections: StructureNode[],
  relationships: { from: string; to: string; type: string }[]
) {
  // Implement structure tree processing logic
  // This would build the document hierarchy and relationships
}

function detectLayout(sections: StructureNode[]): any {
  // Implement layout detection logic
  return {
    position: { x: 0, y: 0, width: 612, height: 792 }, // Standard US Letter size
    margins: { top: 72, right: 72, bottom: 72, left: 72 }, // 1-inch margins
    columns: 1
  };
}

function detectLanguage(content: string): string {
  // Implement language detection logic
  return 'en';
}

function calculateConfidence(sections: StructureNode[]): number {
  // Implement confidence calculation logic
  return 0.95;
}

// Font-related utility functions
function detectFontWeight(fontName: string): number {
  return fontName.toLowerCase().includes('bold') ? 700 : 400;
}

function detectFontStyle(fontName: string): string {
  return fontName.toLowerCase().includes('italic') ? 'italic' : 'normal';
}

function isBoldFont(fontName: string): boolean {
  return fontName.toLowerCase().includes('bold');
}

function isItalicFont(fontName: string): boolean {
  return fontName.toLowerCase().includes('italic');
}

function calculateLineHeight(transform: number[]): number {
  return Math.abs(transform[4] || 1.2);
}

function detectAlignment(transform: number[]): 'left' | 'center' | 'right' | 'justify' {
  const x = transform[4] || 0;
  if (x < 72) return 'left';
  if (x > 400) return 'right';
  return 'left';
} 