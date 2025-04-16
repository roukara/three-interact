import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as THREE from 'three'
import { Interactable } from '../src/Interactable'
import { InteractEvent } from '../src/events/InteractEvent'

describe('Interactable', () => {
  let object: THREE.Object3D
  let interactable: Interactable

  beforeEach(() => {
    object = new THREE.Mesh(
      new THREE.BoxGeometry(),
      new THREE.MeshBasicMaterial()
    )
    interactable = new Interactable(object)
  })

  it('should register click event', () => {
    const clickHandler = vi.fn()
    interactable.onClick(clickHandler)

    const event = new InteractEvent(
      'click',
      object,
      { distance: 0, point: new THREE.Vector3(), object } as THREE.Intersection,
      new MouseEvent('click')
    )

    interactable.dispatchEvent(event)

    expect(clickHandler).toHaveBeenCalledWith(event)
  })

  it('should register pointer enter event', () => {
    const enterHandler = vi.fn()
    interactable.onPointerEnter(enterHandler)

    const enterEvent = new InteractEvent(
      'pointerenter',
      object,
      { distance: 0, point: new THREE.Vector3(), object } as THREE.Intersection,
      new MouseEvent('pointerenter')
    )

    interactable.dispatchEvent(enterEvent)

    expect(enterHandler).toHaveBeenCalledWith(enterEvent)
  })

  it('should register pointer leave event', () => {
    const leaveHandler = vi.fn()
    interactable.onPointerLeave(leaveHandler)

    const leaveEvent = new InteractEvent(
      'pointerleave',
      object,
      { distance: 0, point: new THREE.Vector3(), object } as THREE.Intersection,
      new MouseEvent('pointerleave')
    )

    interactable.dispatchEvent(leaveEvent)

    expect(leaveHandler).toHaveBeenCalledWith(leaveEvent)
  })

  it('should register pointer move event', () => {
    const moveHandler = vi.fn()
    interactable.onPointerMove(moveHandler)

    const moveEvent = new InteractEvent(
      'pointermove',
      object,
      { distance: 0, point: new THREE.Vector3(), object } as THREE.Intersection,
      new MouseEvent('pointermove')
    )
    moveEvent.delta = { x: 5, y: 10 }

    interactable.dispatchEvent(moveEvent)

    expect(moveHandler).toHaveBeenCalledWith(moveEvent)
  })

  it('should handle method chaining with pointer events', () => {
    const result = interactable
      .onPointerEnter(() => {})
      .onPointerLeave(() => {})
      .onPointerMove(() => {})

    expect(result).toBe(interactable)
  })

  it('should handle method chaining', () => {
    const result = interactable
      .onClick(() => {})
      .onPointerEnter(() => {})
      .onPointerLeave(() => {})
      .onDrag(() => {})

    expect(result).toBe(interactable)
  })

  it('should remove event listeners', () => {
    const clickHandler = vi.fn()

    interactable.onClick(clickHandler)

    interactable.off('click')

    const event = new InteractEvent(
      'click',
      object,
      { distance: 0, point: new THREE.Vector3(), object } as THREE.Intersection,
      new MouseEvent('click')
    )

    interactable.dispatchEvent(event)

    expect(clickHandler).not.toHaveBeenCalled()
  })

  it('should remove all event listeners', () => {
    const clickHandler = vi.fn()
    const enterHandler = vi.fn()

    interactable
      .onClick(clickHandler)
      .onPointerEnter(enterHandler)

    interactable.removeAll()

    const clickEvent = new InteractEvent(
      'click',
      object,
      { distance: 0, point: new THREE.Vector3(), object } as THREE.Intersection,
      new MouseEvent('click')
    )

    const enterEvent = new InteractEvent(
      'pointerenter',
      object,
      { distance: 0, point: new THREE.Vector3(), object } as THREE.Intersection,
      new MouseEvent('pointerenter')
    )

    interactable.dispatchEvent(clickEvent)
    interactable.dispatchEvent(enterEvent)

    expect(clickHandler).not.toHaveBeenCalled()
    expect(enterHandler).not.toHaveBeenCalled()
  })

  it('should register drag events', () => {
    const dragHandler = vi.fn()

    interactable.onDrag(dragHandler)

    const dragEvent = new InteractEvent(
      'drag',
      object,
      { distance: 0, point: new THREE.Vector3(), object } as THREE.Intersection,
      new MouseEvent('mousemove')
    )

    interactable.dispatchEvent(dragEvent)

    expect(dragHandler).toHaveBeenCalledWith(dragEvent)
  })

  it('should return correct boolean from dispatchEvent', () => {
    const clickHandler = vi.fn()
    interactable.onClick(clickHandler)

    const clickEvent = new InteractEvent(
      'click',
      object,
      { distance: 0, point: new THREE.Vector3(), object } as THREE.Intersection,
      new MouseEvent('click')
    )

    const pointerEvent = new InteractEvent(
      'pointerenter',
      object,
      { distance: 0, point: new THREE.Vector3(), object } as THREE.Intersection,
      new MouseEvent('pointerenter')
    )

    // Returns true when event listeners exist
    expect(interactable.dispatchEvent(clickEvent)).toBe(true)

    // Returns false when no event listeners exist
    expect(interactable.dispatchEvent(pointerEvent)).toBe(false)
  })

  it('should handle multiple handlers for the same event type', () => {
    const firstHandler = vi.fn()
    const secondHandler = vi.fn()

    interactable.on('click', firstHandler)
    interactable.on('click', secondHandler)

    const event = new InteractEvent(
      'click',
      object,
      { distance: 0, point: new THREE.Vector3(), object } as THREE.Intersection,
      new MouseEvent('click')
    )

    interactable.dispatchEvent(event)

    expect(firstHandler).toHaveBeenCalledWith(event)
    expect(secondHandler).toHaveBeenCalledWith(event)
  })

  it('should respect event propagation stopping', () => {
    const firstHandler = vi.fn((e) => {
      e.stopPropagation()
    })
    const secondHandler = vi.fn()

    // Manually create a parent-child relationship for testing
    const parent = new THREE.Group()
    const child = new THREE.Mesh(
      new THREE.BoxGeometry(),
      new THREE.MeshBasicMaterial()
    )
    parent.add(child)

    const childInteractable = new Interactable(child)
    const parentInteractable = new Interactable(parent)

    childInteractable.on('click', firstHandler)
    parentInteractable.on('click', secondHandler)

    // Create a mock event manager to simulate propagation
    const mockEvent = new InteractEvent(
      'click',
      child,
      { distance: 0, point: new THREE.Vector3(), object: child } as THREE.Intersection,
      new MouseEvent('click')
    )

    // Dispatch to child first
    childInteractable.dispatchEvent(mockEvent)

    // If propagation is stopped, parent shouldn't receive the event
    if (!mockEvent.stopped) {
      parentInteractable.dispatchEvent(mockEvent)
    }

    expect(firstHandler).toHaveBeenCalled()
    expect(secondHandler).not.toHaveBeenCalled()
  })

  it('should correctly remove a specific handler when multiple exist', () => {
    const firstHandler = vi.fn()
    const secondHandler = vi.fn()

    interactable.on('click', firstHandler)
    interactable.on('click', secondHandler)

    // Remove only the first handler
    interactable.off('click', firstHandler)

    const event = new InteractEvent(
      'click',
      object,
      { distance: 0, point: new THREE.Vector3(), object } as THREE.Intersection,
      new MouseEvent('click')
    )

    interactable.dispatchEvent(event)

    // First handler should not be called, but second one should
    expect(firstHandler).not.toHaveBeenCalled()
    expect(secondHandler).toHaveBeenCalledWith(event)
  })
})
