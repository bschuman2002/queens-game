'use client';

import React, { useState, useCallback, useEffect } from 'react';

interface ChessboardProps {
  size?: number;
  onSizeChange?: (size: number) => void;
}

interface Square {
  row: number;
  col: number;
  region: string;
}

type SquareState = 'empty' | 'x' | 'queen' | null;
type RegionColor = 'purple' | 'blue' | 'green' | 'yellow' | 'orange' | 'red' | 'gray' | 'brown' | 'teal' | 'pink' | 'indigo' | 'lime' | 'cyan' | 'rose' | 'emerald' | 'amber';

// Base regions template
const BASE_REGIONS: RegionColor[][] = [
  ['purple', 'purple', 'purple', 'purple', 'purple', 'purple', 'purple', 'orange'],
  ['purple', 'blue', 'blue', 'gray', 'gray', 'gray', 'gray', 'orange'],
  ['purple', 'blue', 'green', 'green', 'gray', 'orange', 'orange', 'orange'],
  ['purple', 'blue', 'green', 'gray', 'gray', 'gray', 'orange', 'orange'],
  ['purple', 'red', 'red', 'yellow', 'yellow', 'gray', 'orange', 'orange'],
  ['purple', 'red', 'yellow', 'yellow', 'gray', 'gray', 'orange', 'orange'],
  ['purple', 'red', 'red', 'yellow', 'gray', 'gray', 'brown', 'orange'],
  ['purple', 'gray', 'gray', 'gray', 'gray', 'gray', 'orange', 'orange'],
];

const REGION_COLORS: Record<RegionColor, string> = {
  purple: 'bg-purple-700',
  blue: 'bg-blue-700',
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  orange: 'bg-orange-500',
  red: 'bg-red-700',
  gray: 'bg-gray-500',
  brown: 'bg-amber-900',
  teal: 'bg-teal-700',
  pink: 'bg-pink-500',
  indigo: 'bg-indigo-800',
  lime: 'bg-lime-500',
  cyan: 'bg-cyan-600',
  rose: 'bg-rose-600',
  emerald: 'bg-emerald-700',
  amber: 'bg-amber-500',
};

interface ConflictInfo {
  type: 'row' | 'column' | 'region' | 'adjacent';
  positions: number[];
}

const borderClasses = 'border border-black';

export default function Chessboard({ size: initialSize = Math.floor(Math.random() * 5) + 8, onSizeChange }: ChessboardProps) {
  const [size, setSize] = useState<number>(initialSize);
  const [regions, setRegions] = useState<RegionColor[][]>([]);
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [showingSolution, setShowingSolution] = useState<boolean>(false);
  const [squares, setSquares] = useState<SquareState[]>(Array(initialSize * initialSize).fill(null));
  const [autoPlaceXs, setAutoPlaceXs] = useState(false);
  const [solution, setSolution] = useState<SquareState[]>([]);
  const [message, setMessage] = useState('');
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);

  // Initialize board on mount
  useEffect(() => {
    if (onSizeChange) {
      onSizeChange(initialSize);
    }
  }, [initialSize, onSizeChange]);

  const generatePuzzle = useCallback((): [RegionColor[][], SquareState[]] => {
    // STEP 1: Place queens with controlled randomness
    const queens: [number, number][] = [];
    const usedRows = new Set<number>();
    const usedCols = new Set<number>();

    // Create shuffled column order for variety
    const shuffledCols = Array.from({ length: size }, (_, i) => i);
    for (let i = shuffledCols.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledCols[i], shuffledCols[j]] = [shuffledCols[j], shuffledCols[i]];
    }

    // Use backtracking with randomized column order
    const placeQueens = (index: number): boolean => {
      if (index === size) return true;

      // Try columns in random order
      for (const col of shuffledCols) {
        const row = index;
        
        if (usedCols.has(col)) continue;
        
        // Check for adjacent queens
        let hasAdjacentQueen = false;
        for (const [qRow, qCol] of queens) {
          if (Math.abs(row - qRow) <= 1 && Math.abs(col - qCol) <= 1) {
            hasAdjacentQueen = true;
            break;
          }
        }
        
        if (hasAdjacentQueen) continue;
        
        queens.push([row, col]);
        usedCols.add(col);
        
        if (placeQueens(index + 1)) return true;
        
        queens.pop();
        usedCols.delete(col);
      }
      
      return false;
    };

    if (!placeQueens(0)) {
      throw new Error('Failed to place queens');
    }

    // Create the solution array first
    const solutionArray: SquareState[] = Array(size * size).fill(null);
    queens.forEach(([row, col]) => {
      solutionArray[row * size + col] = 'queen';
    });

    // STEP 2: Generate regions with controlled randomness
    const regions: RegionColor[][] = Array(size)
      .fill(null)
      .map(() => Array(size).fill(null as unknown as RegionColor));
    
    // Shuffle available colors
    const availableColors: RegionColor[] = [
      'blue', 'yellow', 'red', 'lime', 
      'purple', 'cyan', 'brown', 'green',
      'indigo', 'orange', 'emerald', 'pink',
      'gray', 'amber', 'teal', 'rose'
    ];
    
    for (let i = availableColors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableColors[i], availableColors[j]] = [availableColors[j], availableColors[i]];
    }

    // Assign random colors to queens
    queens.forEach(([row, col], index) => {
      regions[row][col] = availableColors[index % availableColors.length];
    });

    // Grow regions with controlled randomness
    const processed = Array(size).fill(false).map(() => Array(size).fill(false));
    queens.forEach(([row, col]) => {
      processed[row][col] = true;
    });

    // Create a list of unprocessed cells and shuffle it
    const unprocessedCells: [number, number][] = [];
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (!processed[row][col]) {
          unprocessedCells.push([row, col]);
        }
      }
    }
    
    // Shuffle unprocessed cells
    for (let i = unprocessedCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unprocessedCells[i], unprocessedCells[j]] = [unprocessedCells[j], unprocessedCells[i]];
    }

    // Process cells in random order
    while (unprocessedCells.length > 0) {
      let madeProgress = false;
      
      for (let i = unprocessedCells.length - 1; i >= 0; i--) {
        const [row, col] = unprocessedCells[i];
        
        // Find adjacent colors
        const adjacentColors = new Set<RegionColor>();
        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        
        for (const [dr, dc] of directions) {
          const newRow = row + dr;
          const newCol = col + dc;
          
          if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size && processed[newRow][newCol]) {
            adjacentColors.add(regions[newRow][newCol]);
          }
        }

        // If we found adjacent colors, randomly choose one
        if (adjacentColors.size > 0) {
          const colorArray = Array.from(adjacentColors);
          const randomColor = colorArray[Math.floor(Math.random() * colorArray.length)];
          regions[row][col] = randomColor;
          processed[row][col] = true;
          unprocessedCells.splice(i, 1);
          madeProgress = true;
        }
      }

      // If we can't make progress, assign the first available adjacent color
      if (!madeProgress && unprocessedCells.length > 0) {
        const [row, col] = unprocessedCells[0];
        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        
        for (const [dr, dc] of directions) {
          const newRow = row + dr;
          const newCol = col + dc;
          
          if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size && processed[newRow][newCol]) {
            regions[row][col] = regions[newRow][newCol];
            processed[row][col] = true;
            unprocessedCells.shift();
            break;
          }
        }
      }
    }

    return [regions, solutionArray];
  }, [size]);

  // Initialize board when size changes
  useEffect(() => {
    const generateValidPuzzle = () => {
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          const [newRegions, newSolution] = generatePuzzle();
          // Verify the puzzle is valid (not all purple and has valid regions)
          const isValid = newRegions.some(row => 
            row.some(color => color !== 'purple') && 
            row.every(color => color !== null)
          );
          
          if (isValid) {
            setRegions(newRegions);
            setSolution(newSolution);
            setShowingSolution(false);
            setIsSolved(false);
            setSquares(Array(size * size).fill(null));
            setMessage('');
            return true;
          }
        } catch (error) {
          console.error('Attempt failed:', error);
          retryCount++;
        }
      }
      return false;
    };

    const success = generateValidPuzzle();
    if (!success) {
      // If all retries failed, reduce the board size and try again
      const newSize = Math.max(8, size - 1);
      setSize(newSize);
      if (onSizeChange) {
        onSizeChange(newSize);
      }
      setMessage('Had trouble generating a puzzle. Trying a smaller size...');
    }
  }, [size, generatePuzzle, onSizeChange]);

  // Function to randomly select a new board size
  const generateRandomSize = useCallback(() => {
    setShowingSolution(false);
    const newSize = Math.floor(Math.random() * 5) + 8; // Random size between 8 and 12
    setSize(newSize);
    setSquares(Array(newSize * newSize).fill(null));
    if (onSizeChange) {
      onSizeChange(newSize);
    }
  }, [onSizeChange]);

  const isValidPosition = (board: SquareState[], row: number, col: number): boolean => {
    // If regions is not properly initialized, return false
    if (!regions || !Array.isArray(regions) || !regions[row] || !regions[row][col]) {
      return false;
    }

    const position = row * size + col;
    const region = regions[row][col];

    // Check row
    for (let c = 0; c < size; c++) {
      if (c !== col && board[row * size + c] === 'queen') return false;
    }

    // Check column
    for (let r = 0; r < size; r++) {
      if (r !== row && board[r * size + col] === 'queen') return false;
    }

    // Check region
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if ((r !== row || c !== col) && 
            regions[r][c] === region && 
            board[r * size + c] === 'queen') {
          return false;
        }
      }
    }

    // Check diagonal adjacency (only direct diagonals)
    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = col - 1; c <= col + 1; c++) {
        if (r >= 0 && r < size && c >= 0 && c < size &&
            (r !== row || c !== col) &&
            Math.abs(r - row) === 1 && Math.abs(c - col) === 1 &&
            board[r * size + c] === 'queen') {
          return false;
        }
      }
    }

    return true;
  };

  const showSolution = useCallback(() => {
    if (showingSolution) {
      setSquares(Array(size * size).fill(null));
      setShowingSolution(false);
      setMessage('');
    } else {
      setShowingSolution(true);
      setSquares([...solution]);
      setMessage('Solution shown! Queens are now placed in valid positions.');
    }
  }, [showingSolution, size, solution]);

  const findConflicts = (squares: SquareState[]): ConflictInfo[] => {
    const conflicts: ConflictInfo[] = [];
    const queenPositions: [number, number][] = [];
    
    // Get all queen positions
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (squares[r * size + c] === 'queen') {
          queenPositions.push([r, c]);
        }
      }
    }

    // Check row conflicts
    for (let r = 0; r < size; r++) {
      const queensInRow = queenPositions.filter(([qr]) => qr === r);
      if (queensInRow.length > 1) {
        conflicts.push({
          type: 'row',
          positions: queensInRow.map(([qr, qc]) => qr * size + qc)
        });
      }
    }

    // Check column conflicts
    for (let c = 0; c < size; c++) {
      const queensInCol = queenPositions.filter(([_, qc]) => qc === c);
      if (queensInCol.length > 1) {
        conflicts.push({
          type: 'column',
          positions: queensInCol.map(([qr, qc]) => qr * size + qc)
        });
      }
    }

    // Check region conflicts
    const regionQueens = new Map<RegionColor, number[]>();
    for (const [r, c] of queenPositions) {
      const region = regions[r][c];
      if (!regionQueens.has(region)) {
        regionQueens.set(region, []);
      }
      regionQueens.get(region)?.push(r * size + c);
    }
    for (const positions of regionQueens.values()) {
      if (positions.length > 1) {
        conflicts.push({
          type: 'region',
          positions
        });
      }
    }

    // Check adjacent queens
    for (let i = 0; i < queenPositions.length; i++) {
      for (let j = i + 1; j < queenPositions.length; j++) {
        const [r1, c1] = queenPositions[i];
        const [r2, c2] = queenPositions[j];
        if (Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1) {
          conflicts.push({
            type: 'adjacent',
            positions: [r1 * size + c1, r2 * size + c2]
          });
        }
      }
    }

    return conflicts;
  };

  const handleSquareClick = (row: number, col: number) => {
    if (showingSolution || isSolved) return;
    
    const index = row * size + col;
    const newSquares = [...squares];
    
    if (newSquares[index] === null) {
      newSquares[index] = 'x';
      setMessage('X placed to mark an invalid position.');
      setConflicts([]);
    } else if (newSquares[index] === 'x') {
      newSquares[index] = 'queen';
      setMessage('Queen placed. Checking for conflicts...');
      
      // Check for conflicts after placing queen
      const newConflicts = findConflicts(newSquares);
      setConflicts(newConflicts);
      
      if (newConflicts.length > 0) {
        const conflictMessages = {
          row: 'Queens in same row',
          column: 'Queens in same column',
          region: 'Multiple queens in same region',
          adjacent: 'Queens are touching'
        };
        setMessage(newConflicts.map(c => conflictMessages[c.type]).join(', '));
      }
      
      // Auto-place X's if enabled
      if (autoPlaceXs) {
        // Mark invalid positions in the same row
        for (let c = 0; c < size; c++) {
          if (c !== col && newSquares[row * size + c] === null) {
            newSquares[row * size + c] = 'x';
          }
        }
        
        // Mark invalid positions in the same column
        for (let r = 0; r < size; r++) {
          if (r !== row && newSquares[r * size + col] === null) {
            newSquares[r * size + col] = 'x';
          }
        }
        
        // Mark invalid positions in the same region
        const region = regions[row][col];
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if ((r !== row || c !== col) && regions[r][c] === region && newSquares[r * size + c] === null) {
              newSquares[r * size + c] = 'x';
            }
          }
        }
        
        // Mark only directly adjacent diagonal squares
        for (let r = Math.max(0, row - 1); r <= Math.min(size - 1, row + 1); r++) {
          for (let c = Math.max(0, col - 1); c <= Math.min(size - 1, col + 1); c++) {
            if ((r !== row || c !== col) && Math.abs(r - row) === 1 && Math.abs(c - col) === 1 && newSquares[r * size + c] === null) {
              newSquares[r * size + c] = 'x';
            }
          }
        }
      }
    } else {
      newSquares[index] = null;
      setMessage('Square cleared.');
      setConflicts([]);
      
      // Remove auto-placed X's if needed
      if (autoPlaceXs) {
        // Create a temporary board with all queens except the removed one
        const tempSquares = [...newSquares];
        
        // Clear all X's first
        for (let i = 0; i < tempSquares.length; i++) {
          if (tempSquares[i] === 'x') {
            tempSquares[i] = null;
          }
        }
        
        // Re-place X's based on remaining queens
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (tempSquares[r * size + c] === 'queen') {
              const queenRow = r;
              const queenCol = c;
              
              // Mark invalid positions in the same row
              for (let c2 = 0; c2 < size; c2++) {
                if (c2 !== queenCol && tempSquares[queenRow * size + c2] === null) {
                  tempSquares[queenRow * size + c2] = 'x';
                }
              }
              
              // Mark invalid positions in the same column
              for (let r2 = 0; r2 < size; r2++) {
                if (r2 !== queenRow && tempSquares[r2 * size + queenCol] === null) {
                  tempSquares[r2 * size + queenCol] = 'x';
                }
              }
              
              // Mark invalid positions in the same region
              const region = regions[queenRow][queenCol];
              for (let r2 = 0; r2 < size; r2++) {
                for (let c2 = 0; c2 < size; c2++) {
                  if ((r2 !== queenRow || c2 !== queenCol) && regions[r2][c2] === region && tempSquares[r2 * size + c2] === null) {
                    tempSquares[r2 * size + c2] = 'x';
                  }
                }
              }
              
              // Mark only directly adjacent diagonal squares
              for (let r2 = Math.max(0, queenRow - 1); r2 <= Math.min(size - 1, queenRow + 1); r2++) {
                for (let c2 = Math.max(0, queenCol - 1); c2 <= Math.min(size - 1, queenCol + 1); c2++) {
                  if ((r2 !== queenRow || c2 !== queenCol) && Math.abs(r2 - queenRow) === 1 && Math.abs(c2 - queenCol) === 1 && tempSquares[r2 * size + c2] === null) {
                    tempSquares[r2 * size + c2] = 'x';
                  }
                }
              }
            }
          }
        }
        
        // Apply all the changes
        setSquares(tempSquares);
        return;
      }
    }
    
    setSquares(newSquares);
    
    // Check if the puzzle is solved
    const queens = newSquares.filter(square => square === 'queen');
    if (queens.length === size && isSolutionValid(newSquares)) {
      setMessage('Congratulations! You solved the puzzle!');
      setIsSolved(true);
      setConflicts([]);
    }
  };
  
  const isValidQueenPlacement = (row: number, col: number, currentSquares: SquareState[]) => {
    // Check if there's already a queen in this row
    for (let c = 0; c < size; c++) {
      if (c !== col && currentSquares[row * size + c] === 'queen') {
        return false;
      }
    }
    
    // Check if there's already a queen in this column
    for (let r = 0; r < size; r++) {
      if (r !== row && currentSquares[r * size + col] === 'queen') {
        return false;
      }
    }
    
    // Check if there's already a queen in this region
    const region = regions[row][col];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if ((r !== row || c !== col) && 
            regions[r][c] === region && 
            currentSquares[r * size + c] === 'queen') {
          return false;
        }
      }
    }
    
    // Check for any adjacent queens (both diagonal and orthogonal)
    for (let r = Math.max(0, row - 1); r <= Math.min(size - 1, row + 1); r++) {
      for (let c = Math.max(0, col - 1); c <= Math.min(size - 1, col + 1); c++) {
        if ((r !== row || c !== col) && currentSquares[r * size + c] === 'queen') {
          return false;
        }
      }
    }
    
    return true;
  };
  
  const isSolutionValid = (currentSquares: SquareState[]) => {
    // Check that there are exactly N queens
    const queens = currentSquares.filter(square => square === 'queen');
    if (queens.length !== size) {
      return false;
    }
    
    // Create an array of queen positions
    const queenPositions: [number, number][] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (currentSquares[r * size + c] === 'queen') {
          queenPositions.push([r, c]);
        }
      }
    }
    
    // Check for row and column conflicts
    const rows = new Set<number>();
    const cols = new Set<number>();
    for (const [r, c] of queenPositions) {
      if (rows.has(r) || cols.has(c)) return false;
      rows.add(r);
      cols.add(c);
    }
    
    // Check for region conflicts
    const regionQueens = new Map<RegionColor, number>();
    for (const [r, c] of queenPositions) {
      const region = regions[r][c];
      regionQueens.set(region, (regionQueens.get(region) || 0) + 1);
    }
    for (const count of regionQueens.values()) {
      if (count > 1) return false;
    }
    
    // Check for direct diagonal adjacency
    for (let i = 0; i < queenPositions.length; i++) {
      for (let j = i + 1; j < queenPositions.length; j++) {
        const [r1, c1] = queenPositions[i];
        const [r2, c2] = queenPositions[j];
        
        // Check if queens are directly adjacent diagonally
        if (Math.abs(r1 - r2) === 1 && Math.abs(c1 - c2) === 1) {
          return false;
        }
      }
    }
    
    return true;
  };

  const handleRightClick = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    if (showingSolution || isSolved) return;
    
    const position = row * size + col;
    if (squares[position] === 'queen' || squares[position] === 'x') {
      const newSquares = [...squares];
      newSquares[position] = null;
      setSquares(newSquares);
      setMessage('Square cleared.');
      setConflicts([]);
    }
  };

  const renderSquare = (row: number, col: number) => {
    const position = row * size + col;
    const state = squares[position];
    const region = regions?.[row]?.[col] || 'purple';

    // Check if this square is involved in any conflicts
    const isConflicting = conflicts.some(conflict => conflict.positions.includes(position));
    const conflictTypes = conflicts
      .filter(conflict => conflict.positions.includes(position))
      .map(conflict => conflict.type);

    // Determine conflict highlight classes
    let conflictClass = '';
    if (isConflicting) {
      conflictClass = 'ring-4 ring-red-500';
    }

    // Add solved state classes
    const solvedClass = isSolved ? 'opacity-90 cursor-not-allowed' : '';

    return (
      <div
        key={`${row}-${col}`}
        className={`w-12 h-12 flex items-center justify-center relative outline-none focus:outline-none active:outline-none
          ${REGION_COLORS[region]}
          ${borderClasses}
          ${conflictClass}
          ${solvedClass}
          ${!isSolved ? 'cursor-pointer' : ''}`}
        onClick={() => !isSolved && handleSquareClick(row, col)}
        onContextMenu={(e) => !isSolved && handleRightClick(e, row, col)}
        onKeyDown={(e) => {
          if (!isSolved && (e.key === 'Enter' || e.key === ' ')) {
            handleSquareClick(row, col);
            e.preventDefault();
          }
        }}
        role="button"
        tabIndex={isSolved ? -1 : 0}
        title={conflictTypes.length > 0 ? `Conflicts: ${conflictTypes.join(', ')}` : ''}
        style={{ 
          WebkitTapHighlightColor: 'transparent',
          outline: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          WebkitTouchCallout: 'none',
          borderStyle: 'solid',
          borderColor: 'black',
          WebkitUserModify: 'read-only',
          filter: isSolved ? 'brightness(0.95)' : 'none'
        }}
      >
        {state === 'x' && (
          <span className="text-black text-opacity-60 text-lg select-none">✕</span>
        )}
        {state === 'queen' && (
          <span className={`text-2xl ${isSolved ? 'text-yellow-500' : isConflicting ? 'text-red-600' : 'text-black'} select-none`}>
            ♛
          </span>
        )}
      </div>
    );
  };

  const handleSizeChange = (newSize: number) => {
    const validSize = Math.max(8, newSize);
    setSize(validSize);
    if (onSizeChange) {
      onSizeChange(validSize);
    }
  };

  const clearBoard = useCallback(() => {
    setSquares(Array(size * size).fill(null));
    setMessage('');
    setIsSolved(false);
    setConflicts([]);
  }, [size]);

  // Check diagonal conflicts
  const hasDiagonalConflict = (row1: number, col1: number, row2: number, col2: number): boolean => {
    // Only check if queens are on adjacent diagonals (directly touching)
    return Math.abs(row1 - row2) === 1 && Math.abs(col1 - col2) === 1;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 flex space-x-4">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={generateRandomSize}
        >
          New Puzzle
        </button>
        <button
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          onClick={showSolution}
          disabled={isSolved}
        >
          {showingSolution ? 'Hide Solution' : 'Show Solution'}
        </button>
        <button
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={clearBoard}
          disabled={showingSolution || isSolved}
        >
          Clear Board
        </button>
      </div>
      
      <div className="text-sm text-gray-900 mb-4 font-medium">
        {!isSolved ? 'Click once for X, twice for queen, three times to clear (or right-click to clear)' : 'Puzzle solved! Start a new puzzle to continue playing.'}
      </div>
      
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <button
              type="button"
              role="switch"
              aria-checked={autoPlaceXs}
              onClick={() => setAutoPlaceXs(!autoPlaceXs)}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                autoPlaceXs ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  autoPlaceXs ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
            <span>Auto-place X's</span>
          </label>
        </div>
        <div className="relative">
          <div 
            className="grid gap-[1px] bg-gray-300 p-[1px] border-4 border-black rounded-sm shadow-lg" 
            style={{ gridTemplateColumns: `repeat(${size}, 3rem)` }}
          >
            {Array.from({ length: size }).map((_, row) =>
              Array.from({ length: size }).map((_, col) => renderSquare(row, col))
            )}
          </div>
        </div>
        {isSolved && (
          <div className="text-lg font-semibold text-gray-900">
            Congratulations! You solved the puzzle!
          </div>
        )}
      </div>
    </div>
  );
}