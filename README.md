# Caine World

An experimental AI recreation of Caine from The Amazing Digital Circus.


# Project Status

Caine World (Three.js version) is now considered an experimental prototype.

During development, I reached several technical limitations related to procedural locomotion and inverse kinematics.

The current Three.js architecture reached several limitations regarding:

* inverse kinematics (IK),
* physical foot-ground interaction,
* procedural locomotion systems,
* stable rig resting pose handling.

Because of this, the current procedural walking system became increasingly unstable and difficult to evolve realistically.

Instead of forcing complex workarounds, the project is now moving toward a new architecture based on Babylon.js and Node.js, with a stronger focus on:

* procedural animation,
* physical interaction,
* autonomous behavior systems,
* scalable AI experimentation.

This repository remains available as an archive of the original experimental prototype.

A new repository for the Babylon.js version is currently in development.



## Features

- Autonomous movement
- Procedural body animation
- Object creation and stacking
- Episodic memory
- Vision system
- Local LLM reasoning with Ollama
- Dynamic exploration

## Requirements

- Node.js
- Ollama
- VS Code
- Live Server extension
- Prettier extension

## Setup

Install Ollama:

https://ollama.com

Install the model:

```bash
ollama pull llama3.2
```

Install dependencies:

```bash
npm install
```

## Launch

Run:

```bash
lancer-caine.bat
```

Then launch Live Server on `index.html`.

## Technologies

- Three.js
- JavaScript
- Ollama
- Local LLMs

## Disclaimer

Fan project inspired by The Amazing Digital Circus.
