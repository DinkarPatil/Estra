declare module 'react-simple-maps' {
  import type { ReactNode, CSSProperties, SVGProps, MouseEventHandler } from 'react';

  export interface ComposableMapProps {
    projection?: string;
    projectionConfig?: {
      scale?: number;
      center?: [number, number];
      rotate?: [number, number, number];
      parallels?: [number, number];
    };
    width?: number;
    height?: number;
    style?: CSSProperties;
    children?: ReactNode;
  }

  export function ComposableMap(props: ComposableMapProps): JSX.Element;

  export interface GeographiesProps {
    geography: string | object;
    children: (args: { geographies: Geography[] }) => ReactNode;
  }

  export interface Geography {
    rsmKey: string;
    geometry: object;
    properties: Record<string, unknown>;
    type: string;
  }

  export function Geographies(props: GeographiesProps): JSX.Element;

  export interface GeographyProps extends SVGProps<SVGPathElement> {
    geography: Geography;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: {
      default?: CSSProperties;
      hover?: CSSProperties;
      pressed?: CSSProperties;
    };
  }

  export function Geography(props: GeographyProps): JSX.Element;

  export interface MarkerProps {
    coordinates: [number, number];
    children?: ReactNode;
    style?: CSSProperties;
    onMouseEnter?: MouseEventHandler<SVGGElement>;
    onMouseLeave?: MouseEventHandler<SVGGElement>;
    onClick?: MouseEventHandler<SVGGElement>;
  }

  export function Marker(props: MarkerProps): JSX.Element;
}
