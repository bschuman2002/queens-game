# Queens Game

A challenging puzzle game based on chess queens and colored regions. Built with Next.js and Tailwind CSS.

## Game Rules

1. Place queens on the board so that:
   - Each colored region contains exactly one queen
   - No queen can attack another queen (horizontally, vertically, or diagonally)
   - Queens cannot be placed on diagonally adjacent squares
   - Each row and column must contain exactly one queen

## Features

- Dynamic board sizes (8x8 and up)
- Automatic invalid move detection
- Visual region highlighting
- Solution checker
- "Show Solution" option
- Right-click to remove pieces
- Responsive design

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play the game.

## Technical Details

- Built with Next.js 14 and React
- Styled using Tailwind CSS
- Uses TypeScript for type safety
- Implements efficient backtracking algorithms for puzzle generation
- Features region connectivity validation

## Development

The main game logic is in `app/components/Chessboard.tsx`. Key features include:
- Puzzle generation with guaranteed solutions
- Region generation with connectivity checks
- Real-time move validation
- Interactive UI with keyboard support

## Contributing

Feel free to open issues or submit pull requests for:
- New features
- Bug fixes
- Performance improvements
- UI/UX enhancements
