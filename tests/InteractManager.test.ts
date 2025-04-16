import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as THREE from 'three'
import { InteractManager } from '../src/InteractManager'
import { Interactable } from '../src/Interactable'
import { InteractEvent } from '../src/events/InteractEvent'

// Mock for WebGLRenderer
vi.mock('three', async () => {
  const actual = await vi.importActual('three')
  return {
    ...actual as any,
    WebGLRenderer: vi.fn().mockImplementation(() => ({
      domElement: document.createElement('canvas'),
      setSize: vi.fn(),
      render: vi.fn()
    }))
  }
})

describe('InteractManager', () => {
  let renderer: THREE.WebGLRenderer
  let camera: THREE.PerspectiveCamera
  let scene: THREE.Scene
  let manager: InteractManager
  let cube: THREE.Mesh

  beforeEach(() => {
    // Setup Three.js environment
    renderer = new THREE.WebGLRenderer()
    camera = new THREE.PerspectiveCamera()
    scene = new THREE.Scene()

    document.body.appendChild(renderer.domElement)

    // Create InteractManager
    manager = new InteractManager(renderer, camera)

    // Create test object
    cube = new THREE.Mesh(
      new THREE.BoxGeometry(),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    )
    scene.add(cube)
  })

  it('should add and remove interactable objects', () => {
    const interactable = manager.add(cube)

    // Verify added object is an Interactable instance
    expect(interactable).toBeInstanceOf(Interactable)

    // Verify adding the same object returns the same Interactable
    const interactable2 = manager.add(cube)
    expect(interactable2).toBe(interactable)

    // Remove the object
    manager.remove(cube)

    // Verify adding the object again creates a new Interactable
    const interactable3 = manager.add(cube)
    expect(interactable3).not.toBe(interactable)
  })

  it('should handle click events', () => {
    const clickHandler = vi.fn()
    const interactable = manager.add(cube)
    interactable.onClick(clickHandler)

    // Simulate click event
    const event = new MouseEvent('click')

    // Position the object so it will be hit by raycasting
    cube.position.set(0, 0, -5)
    camera.position.set(0, 0, 0)
    camera.lookAt(cube.position)

    // Access event firing methods (normally private)
    const managerAny = manager as any
    managerAny.updatePointer = vi.fn().mockReturnValue({ deltaX: 0, deltaY: 0 })
    managerAny.performRaycast = vi.fn().mockReturnValue([{
      object: cube,
      distance: 5,
      point: new THREE.Vector3(0, 0, -5)
    }])

    managerAny.onClick(event)

    // Verify click handler was called
    expect(clickHandler).toHaveBeenCalled()
    expect(clickHandler.mock.calls[0][0]).toBeInstanceOf(InteractEvent)
    expect(clickHandler.mock.calls[0][0].target).toBe(cube)
  })

  it('should handle pointer enter/leave events', () => {
    const enterHandler = vi.fn()
    const leaveHandler = vi.fn()

    const interactable = manager.add(cube)
    interactable.onPointerEnter(enterHandler)
    interactable.onPointerLeave(leaveHandler)

    // Simulate mouse move event
    const event = new MouseEvent('pointermove')

    // Position the object so it will be hit by raycasting
    cube.position.set(0, 0, -5)
    camera.position.set(0, 0, 0)
    camera.lookAt(cube.position)

    // Access event firing methods
    const managerAny = manager as any
    managerAny.updatePointer = vi.fn().mockReturnValue({ deltaX: 0, deltaY: 0 })

    // Initially not hovering
    managerAny.hoveredObjects = new Map()

    // Mock raycast result: object is hit
    managerAny.performRaycast = vi.fn().mockReturnValue([{
      object: cube,
      distance: 5,
      point: new THREE.Vector3(0, 0, -5)
    }])

    // Start hover with pointer move
    managerAny.processRaycast(event)

    // Verify enter handler was called
    expect(enterHandler).toHaveBeenCalled()
    expect(enterHandler.mock.calls[0][0].type).toBe('pointerenter')

    // Next raycast doesn't hit anything
    enterHandler.mockClear()
    managerAny.performRaycast = vi.fn().mockReturnValue([])

    // End hover with pointer move
    managerAny.processRaycast(event)

    // Verify leave handler was called
    expect(leaveHandler).toHaveBeenCalled()
    expect(leaveHandler.mock.calls[0][0].type).toBe('pointerleave')
  })

  it('should handle drag events', () => {
    const dragHandler = vi.fn()

    const interactable = manager.add(cube)
    interactable.onDrag(dragHandler)

    // Simulate pointer events
    const downEvent = new MouseEvent('mousedown')
    const moveEvent = new MouseEvent('mousemove')
    const upEvent = new MouseEvent('mouseup')

    // Access event firing methods
    const managerAny = manager as any
    managerAny.updatePointer = vi.fn().mockReturnValue({ deltaX: 5, deltaY: 10 })

    // Mock raycast result: object is hit
    managerAny.performRaycast = vi.fn().mockReturnValue([{
      object: cube,
      distance: 5,
      point: new THREE.Vector3(0, 0, -5),
      face: null
    }])

    // Start drag (pointer down)
    managerAny.onPointerDown(downEvent)

    // Verify drag object is set
    expect(managerAny.dragObject).toBe(cube)

    // Drag movement
    managerAny.onPointerMove(moveEvent)

    // Verify drag handler was called
    expect(dragHandler).toHaveBeenCalled()
    expect(dragHandler.mock.calls[0][0].type).toBe('drag')
    expect(dragHandler.mock.calls[0][0].delta).toEqual({ x: 5, y: 10 })

    // End drag (pointer up)
    managerAny.onPointerUp(upEvent)

    // Verify drag object is reset
    expect(managerAny.dragObject).toBeNull()
  })

  it('should handle multiple objects correctly', () => {
    // Create second object
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    )
    sphere.position.set(2, 0, -5)
    scene.add(sphere)

    // Set up events for both objects
    const cubeClick = vi.fn()
    const sphereClick = vi.fn()

    manager.add(cube).onClick(cubeClick)
    manager.add(sphere).onClick(sphereClick)

    // Simulate click event
    const event = new MouseEvent('click')

    // Access event firing methods
    const managerAny = manager as any
    managerAny.updatePointer = vi.fn().mockReturnValue({ deltaX: 0, deltaY: 0 })

    // 1st object is hit
    managerAny.performRaycast = vi.fn().mockReturnValue([{
      object: cube,
      distance: 5,
      point: new THREE.Vector3(0, 0, -5)
    }])

    managerAny.onClick(event)

    // Verify cube click handler was called
    expect(cubeClick).toHaveBeenCalled()
    expect(sphereClick).not.toHaveBeenCalled()

    cubeClick.mockClear()

    // 2nd object is hit
    managerAny.performRaycast = vi.fn().mockReturnValue([{
      object: sphere,
      distance: 5,
      point: new THREE.Vector3(2, 0, -5)
    }])

    managerAny.onClick(event)

    // Verify sphere click handler was called
    expect(cubeClick).not.toHaveBeenCalled()
    expect(sphereClick).toHaveBeenCalled()
  })

  it('should respect event propagation stopping', () => {
    // Position two objects on top of each other
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    )
    sphere.position.copy(cube.position)
    scene.add(sphere)

    const cubeClick = vi.fn().mockImplementation((e: InteractEvent) => {
      e.stopPropagation() // Stop propagation
    })
    const sphereClick = vi.fn()

    manager.add(cube).onClick(cubeClick)
    manager.add(sphere).onClick(sphereClick)

    // Simulate click event
    const event = new MouseEvent('click')

    // Access event firing methods
    const managerAny = manager as any
    managerAny.updatePointer = vi.fn().mockReturnValue({ deltaX: 0, deltaY: 0 })

    // Both objects are hit, but cube is hit first
    managerAny.performRaycast = vi.fn().mockReturnValue([
      {
        object: cube,
        distance: 4,
        point: new THREE.Vector3(0, 0, -4)
      },
      {
        object: sphere,
        distance: 5,
        point: new THREE.Vector3(0, 0, -5)
      }
    ])

    managerAny.onClick(event)

    // Verify cube click handler was called, but propagation was stopped
    expect(cubeClick).toHaveBeenCalled()
    expect(sphereClick).not.toHaveBeenCalled()
  })

  // Pointer event tests
  it('should handle pointer enter events', () => {
    const enterSpy = vi.fn()

    const interactable = manager.add(cube).onPointerEnter(enterSpy)

    // Position the object so it will be hit by raycasting
    cube.position.set(0, 0, -5)
    camera.position.set(0, 0, 0)
    camera.lookAt(cube.position)

    // Access event firing methods
    const managerAny = manager as any
    managerAny.updatePointer = vi.fn().mockReturnValue({ deltaX: 0, deltaY: 0 })

    // Mock raycast result: object is hit
    managerAny.performRaycast = vi.fn().mockReturnValue([{
      object: cube,
      distance: 5,
      point: new THREE.Vector3(0, 0, -5)
    }])

    // Simulate pointer move event
    const event = new MouseEvent('pointermove')
    managerAny.onPointerMove(event)

    expect(enterSpy).toHaveBeenCalled()
    expect(enterSpy.mock.calls[0][0].type).toBe('pointerenter')
  })

  it('should handle pointer leave events', () => {
    const leaveSpy = vi.fn()

    const interactable = manager.add(cube).onPointerLeave(leaveSpy)

    // Position the object so it will be hit by raycasting
    cube.position.set(0, 0, -5)
    camera.position.set(0, 0, 0)
    camera.lookAt(cube.position)

    // Access event firing methods
    const managerAny = manager as any
    managerAny.updatePointer = vi.fn().mockReturnValue({ deltaX: 0, deltaY: 0 })

    // Initially not hovering
    managerAny.hoveredObjects = new Map()

    // First, bring pointer close
    // Mock raycast result: object is hit
    managerAny.performRaycast = vi.fn().mockReturnValue([{
      object: cube,
      distance: 5,
      point: new THREE.Vector3(0, 0, -5)
    }])

    const moveEvent = new MouseEvent('pointermove')
    managerAny.onPointerMove(moveEvent)

    // Next, move pointer away
    managerAny.performRaycast = vi.fn().mockReturnValue([])
    managerAny.onPointerMove(moveEvent)

    expect(leaveSpy).toHaveBeenCalled()
    expect(leaveSpy.mock.calls[0][0].type).toBe('pointerleave')
  })

  it('should handle pointer move events', () => {
    const moveSpy = vi.fn()

    const interactable = manager.add(cube).onPointerMove(moveSpy)

    // Position the object so it will be hit by raycasting
    cube.position.set(0, 0, -5)
    camera.position.set(0, 0, 0)
    camera.lookAt(cube.position)

    // Access event firing methods
    const managerAny = manager as any

    // Mock raycast result: object is hit
    managerAny.performRaycast = vi.fn().mockReturnValue([{
      object: cube,
      distance: 5,
      point: new THREE.Vector3(0, 0, -5)
    }])

    // 1st move
    managerAny.updatePointer = vi.fn().mockReturnValue({ deltaX: 0, deltaY: 0 })
    const moveEvent1 = new MouseEvent('pointermove')
    managerAny.onPointerMove(moveEvent1)

    // 2nd move
    managerAny.updatePointer = vi.fn().mockReturnValue({ deltaX: 5, deltaY: 10 })
    const moveEvent2 = new MouseEvent('pointermove')
    managerAny.onPointerMove(moveEvent2)

    expect(moveSpy).toHaveBeenCalled()
    expect(moveSpy.mock.calls[0][0].type).toBe('pointermove')
    // Verify delta is set correctly in 2nd call
    expect(moveSpy.mock.calls[1][0].delta).toEqual({ x: 5, y: 10 })
  })

  it('should handle intersected objects in the right order (closest first)', () => {
    // Create three objects, change z positions to create overlap
    const cube1 = new THREE.Mesh(
      new THREE.BoxGeometry(),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    )
    cube1.position.set(0, 0, -3) // Frontmost

    const cube2 = new THREE.Mesh(
      new THREE.BoxGeometry(),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    )
    cube2.position.set(0, 0, -5) // Middle

    const cube3 = new THREE.Mesh(
      new THREE.BoxGeometry(),
      new THREE.MeshBasicMaterial({ color: 0x0000ff })
    )
    cube3.position.set(0, 0, -7) // Backmost

    scene.add(cube1, cube2, cube3)

    // Set up event handlers
    const click1 = vi.fn().mockImplementation((e) => {
      e.stopPropagation() // Stop propagation
    })
    const click2 = vi.fn()
    const click3 = vi.fn()

    manager.add(cube1).onClick(click1)
    manager.add(cube2).onClick(click2)
    manager.add(cube3).onClick(click3)

    // Access event firing methods
    const managerAny = manager as any
    managerAny.updatePointer = vi.fn().mockReturnValue({ deltaX: 0, deltaY: 0 })

    // Return raycast results: hit all objects, but sorted by distance
    managerAny.performRaycast = vi.fn().mockReturnValue([
      {
        object: cube1,
        distance: 3,
        point: new THREE.Vector3(0, 0, -3)
      },
      {
        object: cube2,
        distance: 5,
        point: new THREE.Vector3(0, 0, -5)
      },
      {
        object: cube3,
        distance: 7,
        point: new THREE.Vector3(0, 0, -7)
      }
    ])

    // Simulate click event
    const event = new MouseEvent('click')
    managerAny.onClick(event)

    // Verify frontmost object's event was fired, propagation stopped
    expect(click1).toHaveBeenCalled()
    expect(click2).not.toHaveBeenCalled()
    expect(click3).not.toHaveBeenCalled()
  })

  it('should handle events when objects are added and removed dynamically', () => {
    // Add object
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(),
      new THREE.MeshBasicMaterial()
    )
    scene.add(sphere)

    const clickHandler = vi.fn()
    const interactable = manager.add(sphere).onClick(clickHandler)

    // Access event firing methods
    const managerAny = manager as any
    managerAny.updatePointer = vi.fn().mockReturnValue({ deltaX: 0, deltaY: 0 })

    // Initially event is fired
    managerAny.performRaycast = vi.fn().mockReturnValue([{
      object: sphere,
      distance: 5,
      point: new THREE.Vector3()
    }])

    const event = new MouseEvent('click')
    managerAny.onClick(event)

    expect(clickHandler).toHaveBeenCalled()
    clickHandler.mockClear()

    // Remove object, event should not be fired
    manager.remove(sphere)
    managerAny.onClick(event)

    expect(clickHandler).not.toHaveBeenCalled()
  })

  it('should handle edge case: no objects in the scene', () => {
    // Verify operation in empty scene
    const managerAny = manager as any
    managerAny.updatePointer = vi.fn().mockReturnValue({ deltaX: 0, deltaY: 0 })
    managerAny.performRaycast = vi.fn().mockReturnValue([])

    // Verify no error occurs
    const event = new MouseEvent('click')

    expect(() => {
      managerAny.onClick(event)
    }).not.toThrow()
  })

  it('should handle continuous movement with pointer events', () => {
    const moveHandler = vi.fn()
    manager.add(cube).onPointerMove(moveHandler)

    // Position the object so it will be hit by raycasting
    cube.position.set(0, 0, -5)
    camera.position.set(0, 0, 0)
    camera.lookAt(cube.position)

    const managerAny = manager as any

    // Simulate multiple pointer moves
    const positions = [
      { x: 100, y: 100, deltaX: 0, deltaY: 0 },
      { x: 110, y: 105, deltaX: 10, deltaY: 5 },
      { x: 115, y: 115, deltaX: 5, deltaY: 10 },
      { x: 105, y: 110, deltaX: -10, deltaY: -5 }
    ]

    // Ensure object is hit in all moves
    managerAny.performRaycast = vi.fn().mockReturnValue([{
      object: cube,
      distance: 5,
      point: new THREE.Vector3(0, 0, -5)
    }])

    // Fire multiple events
    positions.forEach((pos, index) => {
      // Mock pointer coordinates and delta values
      managerAny.updatePointer = vi.fn().mockReturnValue({
        deltaX: pos.deltaX,
        deltaY: pos.deltaY
      })

      // Set actual coordinates for internal processing
      managerAny.lastMousePosition = {
        x: index > 0 ? positions[index - 1].x : pos.x,
        y: index > 0 ? positions[index - 1].y : pos.y
      }

      const event = new MouseEvent('pointermove', {
        clientX: pos.x,
        clientY: pos.y
      })

      managerAny.onPointerMove(event)
    })

    // Verify call count and argument values
    expect(moveHandler).toHaveBeenCalledTimes(positions.length)

    // Verify delta values are set correctly in subsequent calls
    for (let i = 1; i < positions.length; i++) {
      const call = moveHandler.mock.calls[i][0]
      expect(call.delta).toEqual({
        x: positions[i].deltaX,
        y: positions[i].deltaY
      })
    }
  })
})
