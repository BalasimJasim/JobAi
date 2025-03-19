export interface FormatMetadata {
  font?: {
    family: string;
    size: number;
    weight: number;
    style: string;
  };
  spacing?: {
    before: number;
    after: number;
    lineHeight: number;
  };
  emphasis?: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
  };
  alignment?: 'left' | 'center' | 'right' | 'justify';
}

export interface LayoutMetadata {
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  columns?: number;
}

export interface ContentContext {
  precedingContent: string;
  followingContent: string;
  relatedSections: string[];
  hierarchyLevel: number;
  semanticRole: string;
}

export interface ContentMetadata {
  type: 'header' | 'body' | 'list' | 'table' | 'date' | 'contact';
  importance: number;
  keywords: string[];
  entities: {
    type: string;
    value: string;
    confidence: number;
  }[];
}

export interface ImpactAnalysis {
  contentChanges: {
    added: string[];
    removed: string[];
    modified: string[];
  };
  structureImpact: {
    sectionFlow: boolean;
    readability: number;
    consistency: boolean;
  };
  semanticPreservation: {
    keyMessages: boolean;
    technicalAccuracy: boolean;
    contextRetention: boolean;
  };
}

export interface EnhancedExtraction {
  content: string;
  structure: {
    sections: Array<{
      id: string;
      type: string;
      level: number;
      format: FormatMetadata;
      position: { start: number; end: number };
      content: string;
      context: ContentContext;
    }>;
    relationships: Array<{
      from: string;
      to: string;
      type: 'parent' | 'reference' | 'continuation';
    }>;
  };
  formatting: {
    emphasis: Array<{
      type: string;
      range: [number, number];
      metadata: FormatMetadata;
    }>;
    layout: LayoutMetadata;
  };
  metadata: {
    originalLanguage: string;
    processingDate: Date;
    confidence: number;
    warnings: string[];
  };
}

export interface ContextualFeedback {
  section: {
    id: string;
    type: string;
    content: string;
  };
  analysis: {
    severity: 'CRITICAL' | 'WARNING' | 'SUGGESTION';
    message: string;
    suggestion: string;
    confidence: number;
  };
  context: {
    precedingContent: string;
    followingContent: string;
    relatedSections: string[];
    formatContext: FormatMetadata;
  };
  impact: {
    dependencies: string[];
    risks: string[];
    benefits: string[];
  };
  validation: {
    factualAccuracy: boolean;
    contextPreservation: boolean;
    styleConsistency: boolean;
  };
}

export interface OptimizationStep {
  sectionId: string;
  original: {
    content: string;
    context: ContentContext;
    metadata: ContentMetadata;
  };
  proposed: {
    content: string;
    justification: string;
    impactAssessment: ImpactAnalysis;
  };
  validation: {
    contextPreservation: boolean;
    semanticIntegrity: boolean;
    formatConsistency: boolean;
    technicalAccuracy: boolean;
  };
  rollbackPlan: {
    trigger: string[];
    steps: string[];
    recoveryPoint: string;
  };
} 