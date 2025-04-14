'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { generatePuzzle } from '../utils/puzzleGenerator';
import { ChessboardProps, ConflictInfo, RegionColor, SquareState } from '../types/chessboard';

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
  unassigned: 'bg-gray-300',
};

export default function Chessboard({ size: initialSize = 8, onSizeChange }: ChessboardProps) {
  const [size, setSize] = useState<number>(initialSize);
  const [regions, setRegions] = useState<RegionColor[][]>(() => 
    Array(initialSize).fill(null).map(() => Array(initialSize).fill('purple' as RegionColor))
  );
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [showingSolution, setShowingSolution] = useState<boolean>(false);
  const [squares, setSquares] = useState<SquareState[][]>(() => 
    Array(initialSize).fill(null).map(() => Array(initialSize).fill(null))
  );
  const [autoPlaceXs, setAutoPlaceXs] = useState(false);
  const [solution, setSolution] = useState<SquareState[][]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [message, setMessage] = useState('');
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'info' | 'success' | 'error', visible: boolean}>({
    message: '',
    type: 'info',
    visible: false
  });
  // Track retry attempts
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  // Flag to track if component has been mounted
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted flag after client-side render
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize with a random size on client-side only to prevent hydration mismatch
  useEffect(() => {
    if (initialSize === 8) { // If we're using the default size
      const randomSize = Math.floor(Math.random() * 5) + 8; // Generate between 8-12
      setSize(randomSize);
      if (onSizeChange) {
        onSizeChange(randomSize);
      }
    }
  }, [initialSize, onSizeChange]);

  // Show toast notification
  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ message, type, visible: true });
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Memoize the generateValidPuzzle function
  const generateValidPuzzle = useCallback(() => {
    try {
      setIsGenerating(true);
      showToast('Generating new puzzle...', 'info');
      
      const [newRegions, newSolution] = generatePuzzle(size);
      
      // Count unique colors used (just for validation)
      const usedColors = new Set<RegionColor>();
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          usedColors.add(newRegions[r][c]);
        }
      }
      
      // Set the state with our new puzzle
      setRegions(newRegions);
      setSolution(newSolution);
      setShowingSolution(false);
      setIsSolved(false);
      setSquares(Array(size).fill(null).map(() => Array(size).fill(null)));
      setMessage('');
      
      setIsGenerating(false);
      showToast('New puzzle ready!', 'success');
      return true;
    } catch (error) {
      console.error('Failed to generate puzzle:', error);
      
      // Try with a different size instead of just showing an error
      // Generate a different size that's not the current one
      let newSize: number;
      do {
        newSize = Math.floor(Math.random() * 5) + 8; // Random size between 8-12
      } while (newSize === size);
      
      showToast('Trying with a different board size...', 'info');
      
      // Update size which will trigger a new puzzle generation via useEffect
      setSize(newSize);
      if (onSizeChange) {
        onSizeChange(newSize);
      }
      
      return false;
    }
  }, [size, onSizeChange]); // Add onSizeChange as a dependency

  // Initialize board on mount and when size changes
  useEffect(() => {
    // Skip server-side rendering and wait for client
    if (!isMounted) return;

    if (onSizeChange) {
      onSizeChange(size);
    }

    // If we've already tried too many times, use a fallback size
    if (retryCount >= MAX_RETRIES) {
      showToast('Having trouble generating puzzles. Using fallback size 8.', 'error');
      setSize(8);
      setRetryCount(0);
      return;
    }

    setIsGenerating(true);
    showToast('Generating new puzzle...', 'info');
    const success = generateValidPuzzle();
    
    if (!success) {
      // Increment retry count
      setRetryCount(prev => prev + 1);
    } else {
      // Reset retry count on success
      setRetryCount(0);
    }
  }, [size, onSizeChange, generateValidPuzzle, retryCount, MAX_RETRIES, isMounted]); // Include isMounted

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isRegionConnected = (regions: RegionColor[][], color: RegionColor): boolean => {
    const visited = Array(size).fill(false).map(() => Array(size).fill(false));
    let startRow = -1, startCol = -1;
    
    // Find first cell of this color
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (regions[r][c] === color) {
          startRow = r;
          startCol = c;
          break;
        }
      }
      if (startRow !== -1) break;
    }
    
    if (startRow === -1) return true; // No cells of this color
    
    // BFS to check connectivity
    const queue: [number, number][] = [[startRow, startCol]];
    visited[startRow][startCol] = true;
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    
    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      
      for (const [dr, dc] of directions) {
        const newRow = r + dr;
        const newCol = c + dc;
        
        if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size &&
            !visited[newRow][newCol] && regions[newRow][newCol] === color) {
          visited[newRow][newCol] = true;
          queue.push([newRow, newCol]);
        }
      }
    }
    
    // Check if all cells of this color were visited
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (regions[r][c] === color && !visited[r][c]) {
          return false;
        }
      }
    }
    
    return true;
  };

  // Function to randomly select a new board size
  const generateRandomSize = useCallback(() => {
    if (isGenerating) return; // Prevent multiple simultaneous generations
    
    setShowingSolution(false);
    const newSize = Math.floor(Math.random() * 5) + 8; // Always generate a new size between 8 and 12
    
    // Clear state before setting new size
    setSquares(Array(newSize).fill(null).map(() => Array(newSize).fill(null)));
    setRegions([]);
    setSolution([]);
    setIsSolved(false);
    setConflicts([]);
    setMessage('');
    setRetryCount(0); // Reset retry count when user manually requests a new puzzle
    
    // Set new size which will trigger puzzle generation
    setSize(newSize);
    if (onSizeChange) {
      onSizeChange(newSize);
    }
  }, [onSizeChange, isGenerating]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isValidPosition = (board: SquareState[][], row: number, col: number): boolean => {
    // If regions is not properly initialized, return false
    if (!regions || !Array.isArray(regions) || !regions[row] || !regions[row][col]) {
      return false;
    }

    const region = regions[row][col];

    // Check row
    for (let c = 0; c < size; c++) {
      if (c !== col && board[row][c] === 'queen') return false;
    }

    // Check column
    for (let r = 0; r < size; r++) {
      if (r !== row && board[r][col] === 'queen') return false;
    }

    // Check region
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if ((r !== row || c !== col) && 
            regions[r][c] === region && 
            board[r][c] === 'queen') {
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
            board[r][c] === 'queen') {
          return false;
        }
      }
    }

    return true;
  };

  const showSolution = useCallback(() => {
    if (showingSolution) {
      setSquares(Array(size).fill(null).map(() => Array(size).fill(null)));
      setShowingSolution(false);
      setMessage('');
    } else {
      setShowingSolution(true);
      setSquares(solution);
      setMessage('Solution shown! Queens are now placed in valid positions.');
    }
  }, [showingSolution, size, solution]);

  const findConflicts = (squares: SquareState[][]): ConflictInfo[] => {
    const conflicts: ConflictInfo[] = [];
    const queenPositions: [number, number][] = [];
    
    // Get all queen positions
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (squares[r][c] === 'queen') {
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
    if (showingSolution) return;
    
    // Create deep copy of squares to avoid mutation issues
    const newSquares = JSON.parse(JSON.stringify(squares));
    
    if (newSquares[row][col] === null) {
      newSquares[row][col] = 'x';
      setMessage('X placed to mark an invalid position.');
      setConflicts([]);
    } else if (newSquares[row][col] === 'x') {
      newSquares[row][col] = 'queen';
      setMessage('Queen placed. Checking for conflicts...');
      
      // If auto-place X's is enabled, mark invalid positions
      if (autoPlaceXs) {
        // Mark invalid positions in the same row
        for (let c = 0; c < size; c++) {
          if (c !== col && newSquares[row][c] === null) {
            newSquares[row][c] = 'x';
          }
        }
        
        // Mark invalid positions in the same column
        for (let r = 0; r < size; r++) {
          if (r !== row && newSquares[r][col] === null) {
            newSquares[r][col] = 'x';
          }
        }
        
        // Mark invalid positions in the same region
        const region = regions[row][col];
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if ((r !== row || c !== col) && regions[r][c] === region && newSquares[r][c] === null) {
              newSquares[r][c] = 'x';
            }
          }
        }
      }
    } else { // Queen is being removed
      // Clear this square
      newSquares[row][col] = null;
      setMessage('Square cleared.');
      setConflicts([]);
      
      // If auto-place X's is enabled, we need to recalculate all X positions
      if (autoPlaceXs) {
        // First clear all X's
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (newSquares[r][c] === 'x') {
              newSquares[r][c] = null;
            }
          }
        }
        
        // Then re-place X's based on remaining queens
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (newSquares[r][c] === 'queen') {
              const queenRegion = regions[r][c];
              
              // Mark row
              for (let c2 = 0; c2 < size; c2++) {
                if (c2 !== c && newSquares[r][c2] === null) {
                  newSquares[r][c2] = 'x';
                }
              }
              
              // Mark column
              for (let r2 = 0; r2 < size; r2++) {
                if (r2 !== r && newSquares[r2][c] === null) {
                  newSquares[r2][c] = 'x';
                }
              }
              
              // Mark region
              for (let r2 = 0; r2 < size; r2++) {
                for (let c2 = 0; c2 < size; c2++) {
                  if ((r2 !== r || c2 !== c) && regions[r2][c2] === queenRegion && newSquares[r2][c2] === null) {
                    newSquares[r2][c2] = 'x';
                  }
                }
              }
            }
          }
        }
      }
    }
    
    setSquares(newSquares);
    
    // Check if the puzzle is solved
    const queenCount = newSquares.reduce((count: number, row: SquareState[]) => 
      count + row.filter((square: SquareState) => square === 'queen').length, 0);
    
    if (queenCount === size) {
      const conflicts = findConflicts(newSquares);
      if (conflicts.length === 0) {
        setIsSolved(true);
        setMessage('Congratulations! You solved the puzzle!');
      } else {
        setConflicts(conflicts);
        const conflictMessages = {
          row: 'Queens in same row',
          column: 'Queens in same column',
          region: 'Multiple queens in same region',
          adjacent: 'Queens are touching'
        };
        setMessage(conflicts.map(c => conflictMessages[c.type]).join(', '));
      }
    }
  };
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isValidQueenPlacement = (row: number, col: number, currentSquares: SquareState[][]) => {
    // Check if there's already a queen in this row
    for (let c = 0; c < size; c++) {
      if (c !== col && currentSquares[row][c] === 'queen') {
        return false;
      }
    }
    
    // Check if there's already a queen in this column
    for (let r = 0; r < size; r++) {
      if (r !== row && currentSquares[r][col] === 'queen') {
        return false;
      }
    }
    
    // Check if there's already a queen in this region
    const region = regions[row][col];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if ((r !== row || c !== col) && 
            regions[r][c] === region && 
            currentSquares[r][c] === 'queen') {
          return false;
        }
      }
    }
    
    // Check for any adjacent queens (both diagonal and orthogonal)
    for (let r = Math.max(0, row - 1); r <= Math.min(size - 1, row + 1); r++) {
      for (let c = Math.max(0, col - 1); c <= Math.min(size - 1, col + 1); c++) {
        if ((r !== row || c !== col) && currentSquares[r][c] === 'queen') {
          return false;
        }
      }
    }
    
    return true;
  };
  
  const isSolutionValid = (currentSquares: SquareState[][]): boolean => {
    // Check that there are exactly N queens
    const queens = currentSquares.flat().filter(square => square === 'queen');
    if (queens.length !== size * size) {
      return false;
    }
    
    // Create an array of queen positions
    const queenPositions: [number, number][] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (currentSquares[r][c] === 'queen') {
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
    if (showingSolution) return;
    
    if (squares[row][col] === 'queen' || squares[row][col] === 'x') {
      // Create deep copy of squares to avoid mutation issues
      const newSquares = JSON.parse(JSON.stringify(squares));
      newSquares[row][col] = null;
      
      // If auto-place X's is enabled and we're removing a queen, recalculate X positions
      if (autoPlaceXs && squares[row][col] === 'queen') {
        // First clear all X's
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (newSquares[r][c] === 'x') {
              newSquares[r][c] = null;
            }
          }
        }
        
        // Then re-place X's based on remaining queens
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (newSquares[r][c] === 'queen') {
              const queenRegion = regions[r][c];
              
              // Mark row
              for (let c2 = 0; c2 < size; c2++) {
                if (c2 !== c && newSquares[r][c2] === null) {
                  newSquares[r][c2] = 'x';
                }
              }
              
              // Mark column
              for (let r2 = 0; r2 < size; r2++) {
                if (r2 !== r && newSquares[r2][c] === null) {
                  newSquares[r2][c] = 'x';
                }
              }
              
              // Mark region
              for (let r2 = 0; r2 < size; r2++) {
                for (let c2 = 0; c2 < size; c2++) {
                  if ((r2 !== r || c2 !== c) && regions[r2][c2] === queenRegion && newSquares[r2][c2] === null) {
                    newSquares[r2][c2] = 'x';
                  }
                }
              }
            }
          }
        }
      }
      
      setSquares(newSquares);
      setMessage('Square cleared.');
      setConflicts([]);
    }
  };

  const renderSquare = (row: number, col: number) => {
    // Handle out-of-bounds indexes during SSR
    if (!isMounted && (row >= 8 || col >= 8)) {
      return <div className="w-12 h-12 bg-purple-700 border border-black/10"></div>;
    }
    
    // Handle potential undefined values during SSR/hydration
    if (!squares[row] || squares[row][col] === undefined || !regions[row] || regions[row][col] === undefined) {
      return <div className="w-12 h-12 bg-purple-700 border border-black/10"></div>;
    }
    
    const position = row * size + col;
    const state = squares[row][col];
    const region = regions[row][col];

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

    // Calculate borders between different regions - add null checks
    const topBorder = row > 0 && regions?.[row - 1]?.[col] !== undefined 
      ? regions[row - 1][col] !== region ? 'border-t-[3px] border-t-black' : ''
      : '';
    const bottomBorder = row < size - 1 && regions?.[row + 1]?.[col] !== undefined
      ? regions[row + 1][col] !== region ? 'border-b-[3px] border-b-black' : ''
      : '';
    const leftBorder = col > 0 && regions?.[row]?.[col - 1] !== undefined
      ? regions[row][col - 1] !== region ? 'border-l-[3px] border-l-black' : ''
      : '';
    const rightBorder = col < size - 1 && regions?.[row]?.[col + 1] !== undefined
      ? regions[row][col + 1] !== region ? 'border-r-[3px] border-r-black' : ''
      : '';

    return (
      <div
        key={`${row}-${col}`}
        className={`w-12 h-12 flex items-center justify-center relative outline-none focus:outline-none active:outline-none
          ${REGION_COLORS[region]}
          border border-black/10
          ${topBorder} ${bottomBorder} ${leftBorder} ${rightBorder}
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSizeChange = (newSize: number) => {
    const validSize = Math.max(8, newSize);
    setSize(validSize);
    if (onSizeChange) {
      onSizeChange(validSize);
    }
  };

  const clearBoard = useCallback(() => {
    setSquares(Array(size).fill(null).map(() => Array(size).fill(null)));
    setMessage('');
    setIsSolved(false);
    setConflicts([]);
    // No need to handle auto-X placements here since we're clearing everything
  }, [size]);

  // Check diagonal conflicts
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const hasDiagonalConflict = (row1: number, col1: number, row2: number, col2: number): boolean => {
    // Only check if queens are on adjacent diagonals (directly touching)
    return Math.abs(row1 - row2) === 1 && Math.abs(col1 - col2) === 1;
  };

  const renderChessboard = () => {
    // Fixed initial grid for SSR to prevent hydration mismatch
    // This will be replaced during client-side rendering
    const gridStyle = isMounted 
      ? { gridTemplateColumns: `repeat(${size}, 1fr)` } 
      : { gridTemplateColumns: `repeat(8, 1fr)` };
    
    // If not mounted yet (server-side), use initial size of 8
    const displaySize = isMounted ? size : 8;
    
    return (
      <div className="grid border-4 border-black rounded-md shadow-lg" style={gridStyle}>
        {Array(displaySize).fill(null).map((_, rowIndex) =>
          Array(displaySize).fill(null).map((_, colIndex) => (
            <div key={`${rowIndex}-${colIndex}`} className="relative">
              {renderSquare(rowIndex, colIndex)}
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 flex gap-4">
        <button
          onClick={generateRandomSize}
          disabled={isGenerating || showingSolution}
          className={`px-4 py-2 rounded transition-colors ${
            isGenerating || showingSolution
              ? 'bg-blue-300 text-white cursor-not-allowed opacity-60'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isGenerating ? 'Generating...' : 'New Puzzle'}
        </button>
        <button
          onClick={showSolution}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          {showingSolution ? 'Hide Solution' : 'Show Solution'}
        </button>
        <button
          onClick={clearBoard}
          disabled={showingSolution}
          className={`px-4 py-2 rounded transition-colors ${
            showingSolution 
              ? 'bg-red-300 text-white cursor-not-allowed opacity-60' 
              : 'bg-red-500 text-white hover:bg-red-600'
          }`}
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
        <div className="relative p-4">
          {renderChessboard()}
        </div>
        {isSolved && (
          <div className="text-lg font-semibold text-gray-900">
            Congratulations! You solved the puzzle!
          </div>
        )}
      </div>
      
      {/* Toast notification */}
      {toast.visible && (
        <div 
          className={`fixed bottom-4 right-4 px-6 py-3 rounded-md shadow-lg text-white transition-opacity duration-300 ${
            toast.type === 'success' ? 'bg-green-500' : 
            toast.type === 'error' ? 'bg-red-500' : 
            'bg-blue-500'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}