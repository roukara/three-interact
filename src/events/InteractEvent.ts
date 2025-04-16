import * as THREE from 'three'

export class InteractEvent {
  type: string
  target: THREE.Object3D
  intersection: THREE.Intersection
  originalEvent: MouseEvent | TouchEvent | PointerEvent
  delta: { x: number; y: number } = { x: 0, y: 0 }
  stopped: boolean = false

  constructor(
    type: string,
    target: THREE.Object3D,
    intersection: THREE.Intersection,
    originalEvent: MouseEvent | TouchEvent | PointerEvent
  ) {
    this.type = type
    this.target = target
    this.intersection = intersection
    this.originalEvent = originalEvent
  }

  stopPropagation(): void {
    this.stopped = true
  }
}
