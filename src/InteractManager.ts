import * as THREE from 'three'
import { Interactable } from './Interactable'
import { InteractEvent } from './events/InteractEvent'

export class InteractManager {
  private camera: THREE.Camera
  private domElement: HTMLElement
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  private interactables: Map<THREE.Object3D, Interactable> = new Map()

  private hoveredObjects: Map<THREE.Object3D, boolean> = new Map()
  private activeObject: THREE.Object3D | null = null
  private dragObject: THREE.Object3D | null = null
  private lastMousePosition = { x: 0, y: 0 }

  constructor(
    renderer: THREE.WebGLRenderer,
    camera: THREE.Camera,
    domElement?: HTMLElement
  ) {
    this.camera = camera
    this.domElement = domElement || renderer.domElement
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()

    // Setup event listeners
    this.addEventListeners()
  }

  // Register an interactive object
  add(object: THREE.Object3D): Interactable {
    if (this.interactables.has(object)) {
      return this.interactables.get(object)!
    }

    const interactable = new Interactable(object)
    this.interactables.set(object, interactable)

    return interactable
  }

  // Remove an interactive object
  remove(object: THREE.Object3D): void {
    this.interactables.delete(object)
    this.hoveredObjects.delete(object)

    if (this.activeObject === object) {
      this.activeObject = null
    }

    if (this.dragObject === object) {
      this.dragObject = null
    }
  }

  // Add event listeners
  private addEventListeners(): void {
    this.domElement.addEventListener('pointermove', this.onPointerMove.bind(this))
    this.domElement.addEventListener('click', this.onClick.bind(this))
    this.domElement.addEventListener('pointerdown', this.onPointerDown.bind(this))
    this.domElement.addEventListener('pointerup', this.onPointerUp.bind(this))
  }

  // Update pointer coordinates
  private updatePointer(event: PointerEvent): { deltaX: number, deltaY: number } {
    const rect = this.domElement.getBoundingClientRect()

    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    const deltaX = event.clientX - this.lastMousePosition.x
    const deltaY = event.clientY - this.lastMousePosition.y

    this.lastMousePosition.x = event.clientX
    this.lastMousePosition.y = event.clientY

    return { deltaX, deltaY }
  }

  // Pointer move event handler
  private onPointerMove(event: PointerEvent): void {
    const { deltaX, deltaY } = this.updatePointer(event)

    // Drag processing
    if (this.dragObject) {
      const interactable = this.interactables.get(this.dragObject)

      if (interactable) {
        const interactEvent = new InteractEvent(
          'drag',
          this.dragObject,
          this.getIntersection(this.dragObject),
          event
        )

        interactEvent.delta.x = deltaX
        interactEvent.delta.y = deltaY

        interactable.dispatchEvent(interactEvent)
      }
    }

    // Pointer move event processing
    const intersections = this.performRaycast()
    for (const intersection of intersections) {
      const object = intersection.object
      const interactable = this.interactables.get(object)

      if (!interactable) continue

      const moveEvent = new InteractEvent('pointermove', object, intersection, event)
      moveEvent.delta.x = deltaX
      moveEvent.delta.y = deltaY

      interactable.dispatchEvent(moveEvent)

      if (moveEvent.stopped) break
    }

    // Raycast processing
    this.processRaycast(event)
  }

  // Click event handler
  private onClick(event: MouseEvent): void {
    this.updatePointer(event as PointerEvent)
    const intersections = this.performRaycast()

    for (const intersection of intersections) {
      const object = intersection.object
      const interactable = this.interactables.get(object)

      if (!interactable) continue

      const interactEvent = new InteractEvent('click', object, intersection, event)

      interactable.dispatchEvent(interactEvent)

      if (interactEvent.stopped) break
    }
  }

  // Pointer down event handler
  private onPointerDown(event: PointerEvent): void {
    this.updatePointer(event)
    const intersections = this.performRaycast()

    for (const intersection of intersections) {
      const object = intersection.object
      const interactable = this.interactables.get(object)

      if (!interactable) continue

      const interactEvent = new InteractEvent('pointerdown', object, intersection, event)

      interactable.dispatchEvent(interactEvent)

      // Record as drag target
      this.dragObject = object
      this.activeObject = object

      if (interactEvent.stopped) break
    }
  }

  // Pointer up event handler
  private onPointerUp(event: PointerEvent): void {
    this.updatePointer(event)

    // End drag processing
    this.dragObject = null

    // Pointer up event
    const intersections = this.performRaycast()

    for (const intersection of intersections) {
      const object = intersection.object
      const interactable = this.interactables.get(object)

      if (!interactable) continue

      const interactEvent = new InteractEvent('pointerup', object, intersection, event)

      interactable.dispatchEvent(interactEvent)

      if (interactEvent.stopped) break
    }

    this.activeObject = null
  }

  // Raycast processing
  private processRaycast(event: PointerEvent): void {
    const intersections = this.performRaycast()
    const intersectedObjects = new Set(intersections.map(i => i.object))

    // Objects newly hovered
    for (const intersection of intersections) {
      const object = intersection.object
      const interactable = this.interactables.get(object)

      if (!interactable) continue

      // If not already hovered
      if (!this.hoveredObjects.has(object)) {
        this.hoveredObjects.set(object, true)

        const pointerEvent = new InteractEvent('pointerenter', object, intersection, event)
        if (interactable.dispatchEvent(pointerEvent)) {
          if (pointerEvent.stopped) break
        }
      }
    }

    // Objects no longer hovered
    for (const [object, _] of this.hoveredObjects) {
      if (!intersectedObjects.has(object)) {
        this.hoveredObjects.delete(object)

        const interactable = this.interactables.get(object)

        if (interactable) {
          const intersection = this.getIntersection(object)

          const pointerEvent = new InteractEvent('pointerleave', object, intersection, event)
          interactable.dispatchEvent(pointerEvent)
        }
      }
    }
  }

  // Execute raycast
  private performRaycast(): THREE.Intersection[] {
    this.raycaster.setFromCamera(this.mouse, this.camera)

    const objects = Array.from(this.interactables.keys())
    return this.raycaster.intersectObjects(objects, false)
  }

  // Get intersection with an object
  private getIntersection(object: THREE.Object3D): THREE.Intersection {
    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersections = this.raycaster.intersectObject(object, false)

    return intersections[0] || {
      distance: 0,
      point: new THREE.Vector3(),
      object,
      face: null,
      faceIndex: undefined,
      uv: undefined,
      uv2: undefined,
      instanceId: undefined
    }
  }

  // Update processing
  update(): void {
    // Update processing called in rendering loop
    // Add any additional processing needed here
  }
}
