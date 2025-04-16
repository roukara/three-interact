import * as THREE from 'three'
import { InteractEvent } from './events/InteractEvent'
import {
  InteractEventType,
  InteractEventHandler,
  PointerHandlers
} from './events/EventTypes'

export class Interactable {
  private object: THREE.Object3D
  private eventHandlers: Map<string, InteractEventHandler[]> = new Map()

  constructor(object: THREE.Object3D) {
    this.object = object
  }

  // Basic event handling
  on(type: InteractEventType, handler: InteractEventHandler): this {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, [])
    }

    this.eventHandlers.get(type)?.push(handler)
    return this
  }

  // Click event
  onClick(handler: InteractEventHandler): this {
    return this.on('click', handler)
  }

  // Drag event
  onDrag(handler: InteractEventHandler): this {
    return this.on('drag', handler)
  }

  // Dispatch event
  dispatchEvent(event: InteractEvent): boolean {
    const handlers = this.eventHandlers.get(event.type)

    if (!handlers) return false

    handlers.forEach(handler => {
      handler(event)
    })

    return handlers.length > 0
  }

  // Remove event listeners
  off(type: InteractEventType, handler?: InteractEventHandler): this {
    if (!handler) {
      // Remove all handlers of a specific type
      this.eventHandlers.delete(type)
    } else {
      // Remove only a specific handler
      const handlers = this.eventHandlers.get(type)

      if (handlers) {
        const index = handlers.indexOf(handler)
        if (index !== -1) {
          handlers.splice(index, 1)
        }

        if (handlers.length === 0) {
          this.eventHandlers.delete(type)
        }
      }
    }

    return this
  }

  // Remove all event listeners
  removeAll(): this {
    this.eventHandlers.clear()
    return this
  }

  // Pointer events (enter/leave/move)
  onPointer(handlers: PointerHandlers): this {
    if (handlers.enter) {
      this.on('pointerenter', handlers.enter)
    }

    if (handlers.leave) {
      this.on('pointerleave', handlers.leave)
    }

    if (handlers.move) {
      this.on('pointermove', handlers.move)
    }

    return this
  }

  // Pointer enter event
  onPointerEnter(handler: InteractEventHandler): this {
    return this.on('pointerenter', handler)
  }

  // Pointer leave event
  onPointerLeave(handler: InteractEventHandler): this {
    return this.on('pointerleave', handler)
  }

  // Pointer move event
  onPointerMove(handler: InteractEventHandler): this {
    return this.on('pointermove', handler)
  }

  // Get the object
  getObject(): THREE.Object3D {
    return this.object
  }
}
