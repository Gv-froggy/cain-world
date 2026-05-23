# Caine World AI

An experimental AI recreation of Caine from The Amazing Digital Circus.


!!!  Current Status

The procedural locomotion system is currently being reworked.

Previous versions allowed autonomous movement without proper leg animation synchronization.
The current goal is to create a fully procedural walking system synchronized with movement.  !!!


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
