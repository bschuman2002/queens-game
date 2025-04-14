# Queens Game

A logic puzzle game where you place queens on a chessboard following unique region constraints.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Game Rules

1. Place queens on the board so that no queen can attack another queen
2. Queens cannot be in the same row or column
3. Queens from the same colored region cannot be placed in the same region
4. Queens cannot be adjacent (including diagonally)

## Deployment

The game is set up for easy deployment to Vercel:

### Deploy with Vercel CLI

1. Install the Vercel CLI globally (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy the app:
   ```bash
   npm run deploy
   ```

### Deploy from GitHub

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) and sign up or log in
3. Click "New Project" and import your GitHub repository
4. Use default settings and click "Deploy"

## Technologies Used

- Next.js
- React
- TypeScript
- Tailwind CSS

## Features

- Dynamic board sizes (8x8 and up)
- Automatic invalid move detection
- Visual region highlighting
- Solution checker
- "Show Solution" option
- Right-click to remove pieces
- Responsive design

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
