// Type definitions for leaflet.heat
// Allows using the leaflet.heat plugin with TypeScript

import * as L from 'leaflet';

declare module 'leaflet' {
  namespace HeatLayer {
    interface HeatLayerOptions {
      minOpacity?: number;
      maxZoom?: number;
      radius?: number;
      blur?: number;
      max?: number;
      gradient?: {[key: number]: string};
    }
  }
  
  /**
   * A Leaflet plugin for heat maps using WebGL.
   */
  function heatLayer(
    latlngs: Array<[number, number, number?]>, 
    options?: HeatLayer.HeatLayerOptions
  ): L.Layer;
}