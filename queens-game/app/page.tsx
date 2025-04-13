'use client';

import { useState } from 'react';
import Chessboard from './components/Chessboard';

export default function Home() {
  const [boardSize, setBoardSize] = useState(8);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-900">Queens Puzzle</h1>
        <div className="text-gray-900 mb-8 text-center">
          <p className="mb-4">Place {boardSize} queens on the {boardSize}x{boardSize} chessboard following these rules:</p>
          <ul className="list-disc list-inside mb-4 text-left max-w-md mx-auto">
            <li>Each <b>row</b> must contain exactly one queen</li>
            <li>Each <b>column</b> must contain exactly one queen</li>
            <li>Each <b>colored region</b> must contain exactly one queen</li>
            <li>Queens cannot be <b>adjacent</b> to each other in any way (no touching sides or corners)</li>
            <li>Queens can be on the same diagonal line if they are not directly adjacent</li>
          </ul>
          <p className="mt-4">Click once to mark 'X' (invalid), twice for queen, or right-click to clear.</p>
        </div>
        <div className="flex justify-center">
          <Chessboard onSizeChange={setBoardSize} />
        </div>
      </div>
    </main>
  );
}
