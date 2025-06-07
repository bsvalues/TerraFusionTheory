/**
 * GAMA Zoning Agent
 * 
 * Specialized agent for analyzing zoning information and its impact on property valuation.
 * Handles zoning code interpretation, permitted uses, and regulatory constraints.
 */

export interface ZoningData {
  zoneCode: string;
  zoneName: string;
  permittedUses: string[];
  restrictions: string[];
  density: number;
  heightLimits: number;
  setbackRequirements: {
    front: number;
    rear: number;
    side: number;
  };
  lotCoverage: number;
  parkingRequirements: number;
  specialOverlays: string[];
}

export interface ZoningAnalysis {
  currentCompliance: boolean;
  developmentPotential: 'high' | 'medium' | 'low';
  riskFactors: string[];
  valuationImpact: number; // percentage adjustment
  recommendations: string[];
}

export interface ParcelObservation {
  parcelId: string;
  currentUse: string;
  structureType: string;
  lotSize: number;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export class ZoningAgent {
  private id: string;
  private name: string = 'GAMA Zoning Analysis Agent';
  private capabilities: string[] = [
    'zoning-compliance-analysis',
    'development-potential-assessment',
    'regulatory-risk-evaluation',
    'use-compatibility-analysis'
  ];

  constructor(id: string) {
    this.id = id;
  }

  /**
   * Observe and analyze parcel zoning characteristics
   */
  async observe(parcel: ParcelObservation): Promise<ZoningData | null> {
    try {
      // In production, this would query actual zoning databases
      // For now, we'll analyze based on parcel characteristics
      
      const zoningData = await this.fetchZoningData(parcel);
      return zoningData;
    } catch (error) {
      console.error(`[ZoningAgent] Error observing parcel ${parcel.parcelId}:`, error);
      return null;
    }
  }

  /**
   * Suggest actions based on zoning analysis
   */
  async suggestAction(parcel: ParcelObservation, zoningData: ZoningData): Promise<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    reasoning: string;
    valuationAdjustment: number;
  }[]> {
    const suggestions = [];

    // Analyze compliance
    const compliance = await this.analyzeCompliance(parcel, zoningData);
    if (!compliance.currentCompliance) {
      suggestions.push({
        action: 'flag_compliance_issue',
        priority: 'high' as const,
        reasoning: 'Property may have zoning compliance issues that affect marketability',
        valuationAdjustment: -0.10 // 10% reduction for compliance issues
      });
    }

    // Analyze development potential
    const devPotential = await this.assessDevelopmentPotential(parcel, zoningData);
    if (devPotential.developmentPotential === 'high') {
      suggestions.push({
        action: 'add_development_premium',
        priority: 'medium' as const,
        reasoning: 'High development potential due to favorable zoning',
        valuationAdjustment: 0.15 // 15% premium for development potential
      });
    }

    // Check for special overlays
    if (zoningData.specialOverlays.length > 0) {
      const overlayImpact = this.calculateOverlayImpact(zoningData.specialOverlays);
      suggestions.push({
        action: 'apply_overlay_adjustment',
        priority: 'medium' as const,
        reasoning: `Special overlay districts may impact property value: ${zoningData.specialOverlays.join(', ')}`,
        valuationAdjustment: overlayImpact
      });
    }

    return suggestions;
  }

  /**
   * Score this agent's contribution to the valuation
   */
  async scoreContribution(analysis: ZoningAnalysis): Promise<number> {
    let score = 0.5; // Base contribution

    // Increase score based on significant findings
    if (!analysis.currentCompliance) {
      score += 0.3; // High impact for compliance issues
    }

    if (analysis.developmentPotential === 'high') {
      score += 0.2; // Moderate impact for development potential
    }

    if (analysis.riskFactors.length > 2) {
      score += 0.2; // Risk factors are important
    }

    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Generate comprehensive zoning analysis
   */
  async analyzeZoning(parcel: ParcelObservation): Promise<ZoningAnalysis> {
    const zoningData = await this.observe(parcel);
    if (!zoningData) {
      throw new Error('Unable to retrieve zoning data');
    }

    const compliance = await this.analyzeCompliance(parcel, zoningData);
    const devPotential = await this.assessDevelopmentPotential(parcel, zoningData);
    const riskFactors = await this.identifyRiskFactors(parcel, zoningData);
    const valuationImpact = await this.calculateValuationImpact(parcel, zoningData);

    return {
      currentCompliance: compliance.currentCompliance,
      developmentPotential: devPotential.developmentPotential,
      riskFactors,
      valuationImpact,
      recommendations: await this.generateRecommendations(parcel, zoningData)
    };
  }

  /**
   * Private helper methods
   */
  private async fetchZoningData(parcel: ParcelObservation): Promise<ZoningData> {
    // This would integrate with actual zoning databases in production
    // For now, we'll simulate based on parcel characteristics
    
    const baseZoning: ZoningData = {
      zoneCode: this.inferZoneCode(parcel),
      zoneName: this.inferZoneName(parcel),
      permittedUses: this.inferPermittedUses(parcel),
      restrictions: this.inferRestrictions(parcel),
      density: this.inferDensity(parcel),
      heightLimits: this.inferHeightLimits(parcel),
      setbackRequirements: {
        front: 25,
        rear: 20,
        side: 10
      },
      lotCoverage: 0.4,
      parkingRequirements: 2,
      specialOverlays: this.inferSpecialOverlays(parcel)
    };

    return baseZoning;
  }

  private inferZoneCode(parcel: ParcelObservation): string {
    // Basic inference based on current use and structure type
    if (parcel.currentUse.toLowerCase().includes('residential')) {
      return parcel.lotSize > 10000 ? 'R-1' : 'R-2';
    }
    if (parcel.currentUse.toLowerCase().includes('commercial')) {
      return 'C-1';
    }
    if (parcel.currentUse.toLowerCase().includes('industrial')) {
      return 'I-1';
    }
    return 'R-1'; // Default to residential
  }

  private inferZoneName(parcel: ParcelObservation): string {
    const zoneCode = this.inferZoneCode(parcel);
    const zoneNames: Record<string, string> = {
      'R-1': 'Single Family Residential',
      'R-2': 'Medium Density Residential',
      'C-1': 'General Commercial',
      'I-1': 'Light Industrial'
    };
    return zoneNames[zoneCode] || 'Mixed Use';
  }

  private inferPermittedUses(parcel: ParcelObservation): string[] {
    const zoneCode = this.inferZoneCode(parcel);
    const usesMap: Record<string, string[]> = {
      'R-1': ['Single Family Dwelling', 'Home Office', 'Accessory Dwelling Unit'],
      'R-2': ['Single Family Dwelling', 'Duplex', 'Townhouse', 'Small Apartment'],
      'C-1': ['Retail', 'Office', 'Restaurant', 'Personal Services'],
      'I-1': ['Light Manufacturing', 'Warehouse', 'Office', 'Research & Development']
    };
    return usesMap[zoneCode] || ['Mixed Use'];
  }

  private inferRestrictions(parcel: ParcelObservation): string[] {
    const restrictions = [];
    
    if (parcel.lotSize < 5000) {
      restrictions.push('Minimum lot size requirements');
    }
    
    if (parcel.currentUse.toLowerCase().includes('residential')) {
      restrictions.push('No commercial vehicles overnight');
      restrictions.push('Quiet hours 10 PM - 7 AM');
    }
    
    return restrictions;
  }

  private inferDensity(parcel: ParcelObservation): number {
    // Units per acre based on zone type
    const zoneCode = this.inferZoneCode(parcel);
    const densityMap: Record<string, number> = {
      'R-1': 4,   // 4 units per acre
      'R-2': 12,  // 12 units per acre
      'C-1': 20,  // 20 units per acre
      'I-1': 15   // 15 units per acre
    };
    return densityMap[zoneCode] || 8;
  }

  private inferHeightLimits(parcel: ParcelObservation): number {
    // Height in feet
    const zoneCode = this.inferZoneCode(parcel);
    const heightMap: Record<string, number> = {
      'R-1': 35,  // 35 feet
      'R-2': 45,  // 45 feet
      'C-1': 60,  // 60 feet
      'I-1': 50   // 50 feet
    };
    return heightMap[zoneCode] || 35;
  }

  private inferSpecialOverlays(parcel: ParcelObservation): string[] {
    const overlays = [];
    
    // Check for potential historic districts based on location patterns
    if (parcel.coordinates.lat && parcel.coordinates.lng) {
      // This would use actual GIS data in production
      if (parcel.structureType.toLowerCase().includes('historic')) {
        overlays.push('Historic District');
      }
    }
    
    return overlays;
  }

  private async analyzeCompliance(parcel: ParcelObservation, zoning: ZoningData): Promise<{ currentCompliance: boolean }> {
    // Check if current use is permitted
    const currentUsePermitted = zoning.permittedUses.some(use => 
      parcel.currentUse.toLowerCase().includes(use.toLowerCase())
    );
    
    return { currentCompliance: currentUsePermitted };
  }

  private async assessDevelopmentPotential(parcel: ParcelObservation, zoning: ZoningData): Promise<{ developmentPotential: 'high' | 'medium' | 'low' }> {
    let score = 0;
    
    // Higher density zoning = higher development potential
    if (zoning.density > 15) score += 3;
    else if (zoning.density > 8) score += 2;
    else score += 1;
    
    // Higher height limits = more development potential
    if (zoning.heightLimits > 50) score += 2;
    else if (zoning.heightLimits > 35) score += 1;
    
    // Larger lots = more development potential
    if (parcel.lotSize > 20000) score += 2;
    else if (parcel.lotSize > 10000) score += 1;
    
    if (score >= 6) return { developmentPotential: 'high' };
    if (score >= 4) return { developmentPotential: 'medium' };
    return { developmentPotential: 'low' };
  }

  private async identifyRiskFactors(parcel: ParcelObservation, zoning: ZoningData): Promise<string[]> {
    const risks = [];
    
    if (zoning.specialOverlays.includes('Historic District')) {
      risks.push('Historic district restrictions may limit modifications');
    }
    
    if (zoning.restrictions.length > 3) {
      risks.push('Multiple zoning restrictions may limit property use');
    }
    
    if (parcel.lotSize < 5000 && zoning.density < 8) {
      risks.push('Small lot size may limit development options');
    }
    
    return risks;
  }

  private async calculateValuationImpact(parcel: ParcelObservation, zoning: ZoningData): Promise<number> {
    let adjustment = 0;
    
    // Development potential adjustment
    const devPotential = await this.assessDevelopmentPotential(parcel, zoning);
    if (devPotential.developmentPotential === 'high') adjustment += 0.10;
    else if (devPotential.developmentPotential === 'low') adjustment -= 0.05;
    
    // Compliance adjustment
    const compliance = await this.analyzeCompliance(parcel, zoning);
    if (!compliance.currentCompliance) adjustment -= 0.15;
    
    // Special overlay adjustment
    if (zoning.specialOverlays.includes('Historic District')) {
      adjustment -= 0.05; // Historic restrictions typically reduce value
    }
    
    return adjustment;
  }

  private async generateRecommendations(parcel: ParcelObservation, zoning: ZoningData): Promise<string[]> {
    const recommendations = [];
    
    const compliance = await this.analyzeCompliance(parcel, zoning);
    if (!compliance.currentCompliance) {
      recommendations.push('Investigate zoning compliance issues and potential remediation costs');
    }
    
    const devPotential = await this.assessDevelopmentPotential(parcel, zoning);
    if (devPotential.developmentPotential === 'high') {
      recommendations.push('Consider development potential premium in valuation');
    }
    
    if (zoning.specialOverlays.length > 0) {
      recommendations.push(`Review special overlay requirements: ${zoning.specialOverlays.join(', ')}`);
    }
    
    return recommendations;
  }

  private calculateOverlayImpact(overlays: string[]): number {
    let impact = 0;
    
    for (const overlay of overlays) {
      switch (overlay.toLowerCase()) {
        case 'historic district':
          impact -= 0.05; // Historic restrictions typically reduce flexibility
          break;
        case 'flood zone':
          impact -= 0.10; // Flood zones reduce value
          break;
        case 'scenic overlay':
          impact += 0.02; // Scenic areas may add value
          break;
        case 'downtown overlay':
          impact += 0.05; // Downtown areas often have value premiums
          break;
        default:
          impact -= 0.01; // Unknown overlays assumed to add restrictions
          break;
      }
    }
    
    return impact;
  }

  // Public getters
  getId(): string { return this.id; }
  getName(): string { return this.name; }
  getCapabilities(): string[] { return [...this.capabilities]; }
}