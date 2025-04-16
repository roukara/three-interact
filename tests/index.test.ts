import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as THREE from 'three'
import { InteractManager, Interactable, interact, interactGroup } from '../src/index'

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

describe('index.ts exports', () => {
  let renderer: THREE.WebGLRenderer
  let camera: THREE.PerspectiveCamera
  let manager: InteractManager

  beforeEach(() => {
    // Setup Three.js environment
    renderer = new THREE.WebGLRenderer()
    camera = new THREE.PerspectiveCamera()

    // Create InteractManager
    manager = new InteractManager(renderer, camera)
  })

  it('should export InteractManager class', () => {
    expect(InteractManager).toBeDefined()
    expect(manager).toBeInstanceOf(InteractManager)
  })

  it('should export Interactable class', () => {
    expect(Interactable).toBeDefined()

    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(),
      new THREE.MeshBasicMaterial()
    )

    const interactable = new Interactable(cube)
    expect(interactable).toBeInstanceOf(Interactable)
  })

  it('interact function should add object to manager and return Interactable', () => {
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(),
      new THREE.MeshBasicMaterial()
    )

    // Create mock function
    manager.add = vi.fn().mockImplementation(() => new Interactable(cube))

    const interactable = interact(cube, manager)

    // Verify manager's add method was called
    expect(manager.add).toHaveBeenCalledWith(cube)

    // Verify return value is an Interactable
    expect(interactable).toBeInstanceOf(Interactable)
  })

  it('interactGroup function should add multiple objects to manager', () => {
    // Create multiple objects
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(),
      new THREE.MeshBasicMaterial()
    )

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(),
      new THREE.MeshBasicMaterial()
    )

    const objects = [cube, sphere]

    // Create mock function
    manager.add = vi.fn().mockImplementation((obj) => new Interactable(obj))

    const interactables = interactGroup(objects, manager)

    // Verify manager's add method was called for each object
    expect(manager.add).toHaveBeenCalledTimes(2)
    expect(manager.add).toHaveBeenCalledWith(cube)
    expect(manager.add).toHaveBeenCalledWith(sphere)

    // Verify return value is an array, and each element is an Interactable
    expect(Array.isArray(interactables)).toBe(true)
    expect(interactables.length).toBe(2)
    expect(interactables[0]).toBeInstanceOf(Interactable)
    expect(interactables[1]).toBeInstanceOf(Interactable)
  })
})
