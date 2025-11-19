# Excalidraw Plus

Enhanced version of Excalidraw with additional features like cloud sync, collaboration, and voice input.

## Features

- 🎤 **Voice Input**: Create text elements using voice recognition
- ☁️ **Cloud Sync**: Save and sync your drawings across devices
- 👥 **Real-time Collaboration**: Work together with your team
- 🎨 **All Excalidraw Features**: Full compatibility with the original Excalidraw

## Development

### Prerequisites

- Node.js 18.0.0 or higher
- Yarn package manager

### Getting Started

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Start the development server:
   ```bash
   yarn start
   ```

3. Open your browser and navigate to `http://localhost:4417`

### Available Scripts

- `yarn start` - Start development server on port 4417
- `yarn build` - Build for production
- `yarn preview` - Preview production build

## Project Structure

```
src/
├── components/
│   ├── Dashboard/     # Main dashboard page
│   ├── Editor/        # Drawing editor with Excalidraw
│   └── Auth/          # Authentication components
├── hooks/             # Custom React hooks
├── stores/            # State management
├── services/          # API services
└── styles/            # CSS styles
```

## License

Same as Excalidraw - MIT License
