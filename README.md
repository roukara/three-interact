# three-interact

A declarative library for managing Three.js object interactions with a simple method-chaining API.

## Installation

```bash
npm install three-interact
# or
yarn add three-interact
# or
pnpm add three-interact
```

## Features

- Simple, declarative API with method chaining
- Event handling for pointer, click, and drag interactions
- Easy integration with existing Three.js projects
- Lightweight with minimal dependencies
- TypeScript support

## Requirements

- Three.js (>=0.130.0)

## Basic Usage

```javascript
import * as THREE from 'three'
import { InteractManager, interact } from 'three-interact'

// Create a basic Three.js setup
const renderer = new THREE.WebGLRenderer()
const camera = new THREE.PerspectiveCamera()
const scene = new THREE.Scene()

// Initialize the interaction manager
const manager = new InteractManager(renderer, camera)

// Create an object
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(),
  new THREE.MeshBasicMaterial({ color: 0x3080ff })
)
scene.add(cube)

// Add interaction with method chaining
interact(cube, manager)
  .onPointerEnter(() => {
    cube.material.color.set(0xff0000)
    document.body.style.cursor = 'pointer'
  })
  .onPointerLeave(() => {
    cube.material.color.set(0x3080ff)
    document.body.style.cursor = 'default'
  })
  .onPointerMove((e) => {
    console.log('Pointer moving over cube', e.delta)
  })
  .onClick(() => {
    console.log('Cube clicked')
  })
  .onDrag((e) => {
    // Access e.delta.x and e.delta.y for drag movement amount
    cube.position.x += e.delta.x * 0.01
    cube.position.y -= e.delta.y * 0.01
  })

// Don't forget to update the manager in your animation loop
function animate() {
  requestAnimationFrame(animate)
  manager.update()
  renderer.render(scene, camera)
}
animate()
```

## API Reference

### InteractManager

The main controller for handling interactions.

```javascript
const manager = new InteractManager(renderer, camera);
```

### interact(object, manager)

Factory function that creates an Interactable instance for a Three.js object.

```javascript
const interactable = interact(myObject, manager);
```

### interactGroup(objects, manager)

Factory function for creating multiple Interactable instances.

```javascript
const interactables = interactGroup([object1, object2], manager);
```

### Interactable Methods

Each interactable object provides methods for different interaction types:

- `.onPointerEnter(handler)` - Handle pointer enter events
- `.onPointerLeave(handler)` - Handle pointer leave events
- `.onPointerMove(handler)` - Handle pointer move events over the object
- `.onClick(handler)` - Handle click events
- `.onDrag(handler)` - Handle drag events with delta movement values

## License

MIT 