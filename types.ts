
export interface Mockup {
  id: string;
  name: string;
  imageUrl: string;
  designAreas?: number;
}

export interface DesignProperties {
  width: number;
  height: number;
  x: number;
  y: number;
  opacity: number;
  rotation: number;
}

export interface DesignState {
  image: string;
  props: DesignProperties;
}