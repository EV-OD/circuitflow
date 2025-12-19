
import { supabase } from '../lib/supabase';
import { ComponentDefinition, CircuitState } from '../types';

export const supabaseService = {
  /**
   * Fetches all verified components + components created by the user (if logged in)
   */
  async fetchSharedComponents(): Promise<ComponentDefinition[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('component_library')
        .select('definition')
        .or('is_verified.eq.true'); 
        // Logic to also fetch user's own components can be added here if we implement Auth

      if (error) throw error;

      return data.map((row: any) => row.definition as ComponentDefinition);
    } catch (e) {
      console.error("Failed to fetch shared components:", e);
      return [];
    }
  },

  /**
   * Uploads a new component to the library (Unverified by default)
   */
  async shareComponent(component: ComponentDefinition): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('component_library')
        .insert({
          type: component.type,
          label: component.label,
          category: component.category,
          definition: component,
          is_verified: false
        });

      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Failed to share component:", e);
      return false;
    }
  },

  /**
   * Save a circuit to the cloud
   */
  async saveCircuit(state: CircuitState): Promise<boolean> {
      if (!supabase) return false;
      
      // Need Auth Context to save effectively
      // This is a placeholder for when Auth is implemented
      console.warn("Cloud save requires authentication setup");
      return false;
  }
};
