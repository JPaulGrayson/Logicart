/**
 * LogiGo Feature Flags
 * 
 * Controls access to premium features.
 * In production, these will be tied to user subscriptions via Voyai auth.
 */

export interface FeatureFlags {
  // Premium Features
  executionController: boolean;  // Checkpoint-based speed governor
  ghostDiff: boolean;            // Code change visualization
  overlay: boolean;              // Floating control overlay
  naturalLanguageSearch: boolean; // Natural language query search
  
  // Future Premium Features
  timeTravel: boolean;           // Rewind/replay execution
  multiFile: boolean;            // Multi-file visualization
  collaboration: boolean;        // Real-time multiplayer
}

export interface UserTier {
  name: 'free' | 'premium' | 'pro';
  features: FeatureFlags;
}

// Feature tier definitions
export const TIERS: Record<UserTier['name'], UserTier> = {
  free: {
    name: 'free',
    features: {
      executionController: false,
      ghostDiff: false,
      overlay: false,
      naturalLanguageSearch: false,
      timeTravel: false,
      multiFile: false,
      collaboration: false,
    },
  },
  premium: {
    name: 'premium',
    features: {
      executionController: true,  // ✓ Speed governor
      ghostDiff: true,            // ✓ Ghost diff
      overlay: true,              // ✓ Floating overlay
      naturalLanguageSearch: true, // ✓ NL search
      timeTravel: false,
      multiFile: false,
      collaboration: false,
    },
  },
  pro: {
    name: 'pro',
    features: {
      executionController: true,
      ghostDiff: true,
      overlay: true,
      naturalLanguageSearch: true,
      timeTravel: true,           // ✓ All features
      multiFile: true,
      collaboration: true,
    },
  },
};

/**
 * Feature Manager
 * 
 * Manages feature access based on user tier.
 * For now, defaults to 'premium' for development/testing.
 * Will integrate with Voyai auth later.
 */
export class FeatureManager {
  private currentTier: UserTier;

  constructor(tier: UserTier['name'] = 'premium') {
    this.currentTier = TIERS[tier];
  }

  /**
   * Check if a feature is enabled
   */
  hasFeature(feature: keyof FeatureFlags): boolean {
    return this.currentTier.features[feature];
  }

  /**
   * Get all enabled features
   */
  getEnabledFeatures(): Partial<FeatureFlags> {
    const enabled: Partial<FeatureFlags> = {};
    
    Object.entries(this.currentTier.features).forEach(([key, value]) => {
      if (value) {
        enabled[key as keyof FeatureFlags] = true;
      }
    });

    return enabled;
  }

  /**
   * Get current tier name
   */
  getTier(): UserTier['name'] {
    return this.currentTier.name;
  }

  /**
   * Set user tier (for testing or after auth check)
   */
  setTier(tier: UserTier['name']): void {
    this.currentTier = TIERS[tier];
  }

  /**
   * Get feature description for UI
   */
  getFeatureDescription(feature: keyof FeatureFlags): string {
    const descriptions: Record<keyof FeatureFlags, string> = {
      executionController: 'Fine-grained speed control with checkpoint system',
      ghostDiff: 'Visualize code changes as ghost nodes in flowchart',
      overlay: 'Floating toolbar for execution control',
      naturalLanguageSearch: 'Search flowchart nodes using natural language queries',
      timeTravel: 'Rewind and replay code execution',
      multiFile: 'Visualize multiple files simultaneously',
      collaboration: 'Real-time collaboration with teammates',
    };

    return descriptions[feature];
  }
}

// Default instance for development (premium tier enabled)
export const features = new FeatureManager('premium');
