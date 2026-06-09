import { distance } from '../utils/math';

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

export function circlesOverlap(a: Circle, b: Circle): boolean {
  return distance(a.x, a.y, b.x, b.y) < a.radius + b.radius;
}
