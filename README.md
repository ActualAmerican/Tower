/project-root
├── index.html                     # Main HTML entry point
├── style.css                      # Global styles
├── game.js                        # Main game loop and state handling
├── player.js                      # Player movement, input, inventory, tools
├── enemy.js                       # Enemy AI, vision, patrols, states
├── dungeon.js                     # Procedural generation logic
├── ui.js                          # UI rendering and HUD logic
├── audio.js                       # Sound/music system
├── util.js                        # Utility functions (math, collision, helpers)
├── stateManager.js                # Game state machine (FSM controller)
├── assets/                        # All image, audio, and visual assets
│   ├── sprites/
│   │   ├── player.png             # Placeholder player sprite
│   │   ├── enemy.png              # Placeholder enemy sprite
│   │   ├── tileset.png            # Placeholder tileset
│   │   ├── fov-mask.png           # Optional FOV mask image
│   │   └── .gitkeep               # Keeps folder tracked in Git
│   └── audio/
│       ├── footsteps.wav          # Placeholder footstep SFX
│       ├── alert.wav              # Placeholder alert SFX
│       ├── background.mp3         # Placeholder dungeon BGM
│       └── .gitkeep
├── README.md                      # Project overview and setup guide
├── .gitignore                     # Ignore node_modules, DS_Store, etc.
└── /docs                          # (Optional) For future documentation or exports
