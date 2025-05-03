declare module 'react-plotly.js' {
  import * as Plotly from 'plotly.js-dist';
  import * as React from 'react';

  interface PlotParams {
    data: Plotly.Data[];
    layout?: Partial<Plotly.Layout>;
    frames?: Plotly.Frame[];
    config?: Partial<Plotly.Config>;
    onClick?: (event: Plotly.PlotMouseEvent) => void;
    onSelected?: (event: Plotly.PlotSelectionEvent) => void;
    onHover?: (event: Plotly.PlotMouseEvent) => void;
    onUnhover?: (event: Plotly.PlotMouseEvent) => void;
    onRelayout?: (event: Plotly.PlotRelayoutEvent) => void;
    onRelayouting?: (event: Plotly.PlotRelayoutEvent) => void;
    onRestyle?: (event: Plotly.PlotRestyleEvent) => void;
    onRestyling?: (event: Plotly.PlotRestyleEvent) => void;
    onRedraw?: () => void;
    onInitialized?: (figure: Plotly.Figure) => void;
    onUpdate?: (figure: Plotly.Figure) => void;
    onPurge?: () => void;
    onError?: (err: Error) => void;
    onAnimated?: () => void;
    onAnimatingFrame?: (event: Plotly.FrameAnimationEvent) => void;
    onSliderChange?: (event: Plotly.SliderChangeEvent) => void;
    onSliderEnd?: (event: Plotly.SliderEndEvent) => void;
    onSliderStart?: (event: Plotly.SliderStartEvent) => void;
    onTransitioning?: () => void;
    onTransitionInterrupted?: () => void;
    onAfterExport?: () => void;
    onAfterPlot?: () => void;
    onBeforeExport?: () => void;
    onButtonClicked?: (event: Plotly.ButtonClickEvent) => void;
    onDeselect?: () => void;
    onDoubleClick?: () => void;
    onLegendClick?: (event: Plotly.LegendClickEvent) => void;
    onLegendDoubleClick?: (event: Plotly.LegendClickEvent) => void;
    onResize?: () => void;
    onWebglContextLost?: () => void;
    style?: React.CSSProperties;
    className?: string;
    divId?: string;
    revision?: number;
    useResizeHandler?: boolean;
    debug?: boolean;
    scrollZoom?: boolean;
  }

  export default class Plot extends React.Component<PlotParams> {}
}