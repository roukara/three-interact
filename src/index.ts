import * as THREE from 'three'
import { InteractManager } from './InteractManager'
import { Interactable } from './Interactable'
import { InteractEvent } from './events/InteractEvent'
import {
  InteractEventType,
  InteractEventHandler
} from './events/EventTypes'

// Factory function
function interact(object: THREE.Object3D, manager: InteractManager): Interactable {
  return manager.add(object)
}

// Function to register multiple objects
function interactGroup(objects: THREE.Object3D[], manager: InteractManager): Interactable[] {
  return objects.map(object => manager.add(object))
}

// Exports
export {
  InteractManager,
  Interactable,
  InteractEvent
}
export type {
  InteractEventType,
  InteractEventHandler
}
export {
  interact,
  interactGroup
}
