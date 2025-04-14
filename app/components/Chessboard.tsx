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
  teal: 'bg-teal-500',
  pink: 'bg-pink-500',
  indigo: 'bg-indigo-800',
  lime: 'bg-lime-400',
  cyan: 'bg-cyan-400',
  rose: 'bg-rose-600',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
};

export default function Chessboard({ size: initialSize = 8, onSizeChange }: ChessboardProps) {
  const [size, setSize] = useState<number>(8);
  const [regions, setRegions] = useState<RegionColor[][]>([]);
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [showingSolution, setShowingSolution] = useState<boolean>(false);
  const [squares, setSquares] = useState<SquareState[]>(Array(size * size).fill(null));
  const [autoPlaceXs, setAutoPlaceXs] = useState(false);
  const [solution, setSolution] = useState<SquareState[]>([]);
  const [message, setMessage] = useState('');

  const generatePuzzle = useCallback((): RegionColor[][] => {
    // Create initial regions with one color
    const initialRegions: RegionColor[][] = Array(size)
      .fill(null)
      .map(() => Array(size).fill(null as unknown as RegionColor));
    
    // Reset solution array
    const initialSolution: SquareState[] = Array(size * size).fill(null);
    
    // STEP 1: Generate random queen positions (more variety)
    const queens: [number, number][] = [];
    const usedRows = new Set<number>();
    const usedCols = new Set<number>();
    
    // Choose a random starting approach for increased variety
    const approaches = ['diagonal', 'modular', 'staggered', 'random'];
    const randomApproach = approaches[Math.floor(Math.random() * approaches.length)];
    
    const isAdjacent = (row1: number, col1: number, row2: number, col2: number): boolean => {
      const rowDiff = Math.abs(row1 - row2);
      const colDiff = Math.abs(col1 - col2);
      return (rowDiff <= 1 && colDiff <= 1) && !(rowDiff === 0 && colDiff === 0);
    };
    
    const tryRandomPlacement = () => {
      queens.length = 0;
      usedRows.clear();
      usedCols.clear();
      
      // Different starting strategies for more variety
      if (randomApproach === 'diagonal') {
        // Start with queens on main diagonal with random offsets
        const offset = Math.floor(Math.random() * size);
        for (let i = 0; i < size; i++) {
          const row = i;
          const col = (i + offset) % size;
          
          // Check for adjacent queens before placing
          let hasAdjacentQueen = false;
          for (const [qRow, qCol] of queens) {
            if (isAdjacent(row, col, qRow, qCol)) {
              hasAdjacentQueen = true;
              break;
            }
          }
          
          if (hasAdjacentQueen) {
            return false;
          }
          
          queens.push([row, col]);
          usedRows.add(row);
          usedCols.add(col);
        }
      } else if (randomApproach === 'modular') {
        // Use modular arithmetic with a random factor
        const factor = 2 + Math.floor(Math.random() * (size - 2));
        for (let i = 0; i < size; i++) {
          const row = i;
          const col = (i * factor) % size;
          
          // Check for adjacent queens before placing
          let hasAdjacentQueen = false;
          for (const [qRow, qCol] of queens) {
            if (isAdjacent(row, col, qRow, qCol)) {
              hasAdjacentQueen = true;
              break;
            }
          }
          
          if (hasAdjacentQueen) {
            return false;
          }
          
          queens.push([row, col]);
          usedRows.add(row);
          usedCols.add(col);
        }
      } else if (randomApproach === 'staggered') {
        // Use a staggered pattern with random shifts
        const shift = Math.floor(Math.random() * 4);
        for (let i = 0; i < size; i++) {
          let row = i;
          let col;
          if (i % 2 === 0) {
            col = (i + shift) % size;
          } else {
            col = (i * 2 + shift) % size;
          }
          
          // Check for adjacent queens before placing
          let hasAdjacentQueen = false;
          for (const [qRow, qCol] of queens) {
            if (isAdjacent(row, col, qRow, qCol)) {
              hasAdjacentQueen = true;
              break;
            }
          }
          
          if (hasAdjacentQueen) {
            return false;
          }
          
          queens.push([row, col]);
          usedRows.add(row);
          usedCols.add(col);
        }
      } else {
        // Fully randomized attempt (fallback)
        return false;
      }
      
      return true;
    };
    
    // Second pass - backtracking search if initial approach fails
    const placeQueensBacktracking = () => {
      queens.length = 0;
      usedRows.clear();
      usedCols.clear();
      
      // Create all possible positions and shuffle them
      const allPositions: [number, number][] = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          allPositions.push([r, c]);
        }
      }
      
      // Fisher-Yates shuffle to randomize the search order
      for (let i = allPositions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allPositions[i], allPositions[j]] = [allPositions[j], allPositions[i]];
      }
      
      // Recursive backtracking with randomization
      const placeNext = (index: number): boolean => {
        if (index === size) return true;
        
        // Try random positions first
        for (const [row, col] of allPositions) {
          // Skip if row or column already used
          if (usedRows.has(row) || usedCols.has(col)) continue;
          
          // Check for adjacent queens
          let hasAdjacentQueen = false;
          for (let i = 0; i < queens.length; i++) {
            const [qRow, qCol] = queens[i];
            if (isAdjacent(row, col, qRow, qCol)) {
              hasAdjacentQueen = true;
              break;
            }
          }
          
          if (hasAdjacentQueen) continue;
          
          // Place the queen
          queens.push([row, col]);
          usedRows.add(row);
          usedCols.add(col);
          
          // Recurse
          if (placeNext(index + 1)) return true;
          
          // Backtrack
          queens.pop();
          usedRows.delete(row);
          usedCols.delete(col);
        }
        
        return false;
      };
      
      return placeNext(0);
    };
    
    const generateRegions = (): RegionColor[][] => {
      // Initialize all squares as null (unassigned)
      const regions: RegionColor[][] = Array(size)
        .fill(null)
        .map(() => Array(size).fill(null as unknown as RegionColor));
      
      // Define the available colors with high contrast between adjacent colors
      const availableColors: RegionColor[] = [
        'blue', 'yellow', 'red', 'lime', 
        'purple', 'cyan', 'brown', 'green',
        'indigo', 'orange', 'emerald', 'pink',
        'gray', 'amber', 'teal', 'rose'
      ];
      
      // Shuffle colors to get a random assignment each time
      for (let i = availableColors.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableColors[i], availableColors[j]] = [availableColors[j], availableColors[i]];
      }
      
      // Assign unique colors to each queen
      const regionColors: RegionColor[] = [];
      for (let i = 0; i < size; i++) {
        regionColors.push(availableColors[i % availableColors.length]);
      }
      
      // Assign each queen its unique color
      queens.forEach(([row, col], index) => {
        regions[row][col] = regionColors[index];
      });
      
      // Keep track of which cells have been processed
      const processed = Array(size).fill(false).map(() => Array(size).fill(false));
      queens.forEach(([row, col]) => {
        processed[row][col] = true;
      });
      
      // Function to check if a cell can be added to a region
      const canAddToRegion = (row: number, col: number, color: RegionColor): boolean => {
        // Check if this cell would connect to its region
        let touchesSameColor = false;
        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        
        for (const [dr, dc] of directions) {
          const newRow = row + dr;
          const newCol = col + dc;
          
          if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
            if (regions[newRow][newCol] === color) {
              touchesSameColor = true;
              break;
            }
          }
        }
        
        return touchesSameColor;
      };
      
      // Grow regions one cell at a time, ensuring connectivity
      let madeProgress = true;
      
      // Assign growth rates to each region for variety
      const growthRates = queens.map(() => {
        // More extreme variation: some regions grow very fast, others very slow
        const baseRate = Math.random();
        return baseRate * baseRate * 1.5; // Square it to make differences more dramatic
      });
      
      // Bias some regions to be much larger
      const targetSizes = queens.map(() => {
        const isLarge = Math.random() < 0.3; // 30% chance of being a large region
        return isLarge ? size * size * 0.4 : size * size * 0.1; // Large regions target 40% of board, small ones 10%
      });

      while (madeProgress) {
        madeProgress = false;
        
        // Process each queen's region
        for (let queenIndex = 0; queenIndex < queens.length; queenIndex++) {
          const color = regionColors[queenIndex];
          const candidates: [number, number][] = [];
          
          // Count current region size
          let currentSize = 0;
          for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
              if (regions[r][c] === color) currentSize++;
            }
          }
          
          // Stop growing if reached target size
          if (currentSize >= targetSizes[queenIndex]) continue;
          
          // Aggressive growth for regions below target
          const growthMultiplier = currentSize < targetSizes[queenIndex] ? 2.0 : 0.5;
          
          // Only attempt growth based on adjusted growth rate
          if (Math.random() > growthRates[queenIndex] * growthMultiplier) {
            continue;
          }
          
          // Find unprocessed cells adjacent to this region
          for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
              if (!processed[row][col] && regions[row][col] === null) {
                if (canAddToRegion(row, col, color)) {
                  // Add position weight based on distance from queen
                  const [qRow, qCol] = queens[queenIndex];
                  const distance = Math.abs(row - qRow) + Math.abs(col - qCol);
                  const weight = Math.max(1, 5 - distance); // Higher weight for closer cells
                  
                  // Add the candidate multiple times based on weight
                  for (let i = 0; i < weight; i++) {
                    candidates.push([row, col]);
                  }
                }
              }
            }
          }
          
          // Add multiple random candidates to the region based on growth rate
          const numToAdd = Math.floor(candidates.length * growthRates[queenIndex] * growthMultiplier * 0.5);
          for (let i = 0; i < numToAdd && candidates.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * candidates.length);
            const [row, col] = candidates[randomIndex];
            regions[row][col] = color;
            processed[row][col] = true;
            madeProgress = true;
            
            // Remove all instances of this position from candidates
            candidates.splice(randomIndex, 1);
          }
        }
      }
      
      // Fill any remaining unprocessed cells
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          if (!processed[row][col]) {
            // Find adjacent colors
            const adjacentColors = new Set<RegionColor>();
            const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
            
            for (const [dr, dc] of directions) {
              const newRow = row + dr;
              const newCol = col + dc;
              
              if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
                if (regions[newRow][newCol] !== null) {
                  adjacentColors.add(regions[newRow][newCol]);
                }
              }
            }
            
            // Choose a random adjacent color
            const colorArray = Array.from(adjacentColors);
            const randomColor = colorArray[Math.floor(Math.random() * colorArray.length)];
            regions[row][col] = randomColor || regionColors[0];
            processed[row][col] = true;
          }
        }
      }
      
      // Check for and fix single-square regions
      const regionSizes = new Map<RegionColor, number>();
      const singleSquarePositions = new Map<RegionColor, [number, number]>();

      // Count region sizes and track positions of single squares
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          const color = regions[row][col];
          regionSizes.set(color, (regionSizes.get(color) || 0) + 1);
          if (regionSizes.get(color) === 1) {
            singleSquarePositions.set(color, [row, col]);
          }
        }
      }

      // If we have more than one single-square region, merge them with adjacent regions
      if (singleSquarePositions.size > 1) {
        singleSquarePositions.forEach((pos, color) => {
          const [row, col] = pos;
          if (regionSizes.get(color) === 1) { // Double check it's still size 1
            // Find the largest adjacent region
            let maxSize = 0;
            let bestColor: RegionColor | null = null;
            const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];

            for (const [dr, dc] of directions) {
              const newRow = row + dr;
              const newCol = col + dc;
              
              if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
                const adjColor = regions[newRow][newCol];
                const adjSize = regionSizes.get(adjColor) || 0;
                // Prefer larger regions that aren't single squares
                if (adjSize > maxSize && adjSize > 1) {
                  maxSize = adjSize;
                  bestColor = adjColor;
                }
              }
            }

            // Merge with the best adjacent region
            if (bestColor) {
              regions[row][col] = bestColor;
              regionSizes.set(bestColor, (regionSizes.get(bestColor) || 0) + 1);
              regionSizes.delete(color);
            }
          }
        });
      }

      return regions;
    };

    // After generating regions, verify each region has exactly one queen
    const verifyRegions = (regions: RegionColor[][]): boolean => {
      const regionQueens = new Map<RegionColor, number>();
      
      // Count queens in each region
      queens.forEach(([row, col]) => {
        const region = regions[row][col];
        regionQueens.set(region, (regionQueens.get(region) || 0) + 1);
      });
      
      // Verify each region has exactly one queen
      const allRegions = new Set<RegionColor>();
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          allRegions.add(regions[row][col]);
        }
      }
      
      for (const region of allRegions) {
        if (!regionQueens.has(region) || regionQueens.get(region) !== 1) {
          return false;
        }
      }
      
      return true;
    };

    // Try various approaches to get a valid queen placement
    let validPlacement = tryRandomPlacement();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      if (!validPlacement) {
        validPlacement = placeQueensBacktracking();
      }

      if (validPlacement && queens.length === size) {
        const regions = generateRegions();
        if (verifyRegions(regions)) {
          // Mark queens in the solution
          queens.forEach(([row, col]) => {
            initialSolution[row * size + col] = 'queen';
          });
          
          // Set up the solution
          setSolution(initialSolution);
          return regions;
        }
      }

      // If we get here, either queen placement failed or regions weren't valid
      queens.length = 0;
      usedRows.clear();
      usedCols.clear();
      validPlacement = tryRandomPlacement();
      attempts++;
    }

    // If we've exhausted our attempts, throw an error
    throw new Error('Failed to generate valid puzzle after maximum attempts');
  }, [size]);

  // Initialize board when size changes
  useEffect(() => {
    try {
      // When the size changes, reset the board and generate a new puzzle
      setShowingSolution(false);
      setIsSolved(false);
      setSquares(Array(size * size).fill(null));
      setSolution([]);
      setMessage('');
      
      // Generate a new puzzle with the specified size
      const newRegions = generatePuzzle();
      setRegions(newRegions);
    } catch (error) {
      console.error('Error generating puzzle:', error);
      // Reset to a safe state
      setSquares(Array(size * size).fill(null));
      setRegions(Array(size).fill([]).map(() => Array(size).fill('purple' as RegionColor)));
      setMessage('Error generating puzzle. Please try again.');
    }
  }, [size, generatePuzzle]);

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

  const handleSquareClick = (row: number, col: number) => {
    if (showingSolution) return;
    
    const index = row * size + col;
    const newSquares = [...squares];
    
    // Cycle through: null -> 'x' -> 'queen' -> null
    if (newSquares[index] === null) {
      newSquares[index] = 'x';
      setMessage('X placed to mark an invalid position.');
    } else if (newSquares[index] === 'x') {
      // Place queen regardless of validity check
      newSquares[index] = 'queen';
      setMessage('Queen placed successfully!');
      
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
        
        // Mark invalid positions in all diagonals
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if ((r !== row || c !== col) && newSquares[r * size + c] === null) {
              // Check if they're on the same diagonal
              if (Math.abs(r - row) === Math.abs(c - col)) {
                newSquares[r * size + c] = 'x';
              }
            }
          }
        }
        
        // Mark diagonally adjacent squares (only direct adjacents)
        for (let r = Math.max(0, row - 1); r <= Math.min(size - 1, row + 1); r++) {
          for (let c = Math.max(0, col - 1); c <= Math.min(size - 1, col + 1); c++) {
            if ((r !== row || c !== col) && newSquares[r * size + c] === null) {
              newSquares[r * size + c] = 'x';
            }
          }
        }
      }
    } else {
      // Removing a queen
      newSquares[index] = null;
      setMessage('Square cleared.');
      
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
              
              // Mark invalid positions in all diagonals
              for (let r2 = 0; r2 < size; r2++) {
                for (let c2 = 0; c2 < size; c2++) {
                  if ((r2 !== queenRow || c2 !== queenCol) && tempSquares[r2 * size + c2] === null) {
                    // Check if they're on the same diagonal
                    if (Math.abs(r2 - queenRow) === Math.abs(c2 - queenCol)) {
                      tempSquares[r2 * size + c2] = 'x';
                    }
                  }
                }
              }
              
              // Mark diagonally adjacent squares (only direct adjacents)
              for (let r2 = Math.max(0, queenRow - 1); r2 <= Math.min(size - 1, queenRow + 1); r2++) {
                for (let c2 = Math.max(0, queenCol - 1); c2 <= Math.min(size - 1, queenCol + 1); c2++) {
                  if ((r2 !== queenRow || c2 !== queenCol) && tempSquares[r2 * size + c2] === null) {
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

  const renderSquare = (row: number, col: number) => {
    const position = row * size + col;
    const state = squares[position];
    const region = regions?.[row]?.[col] || 'purple'; // Provide default color if regions not initialized

    // Determine border classes based on neighbors
    let borderClasses = '';
    
    // Check if we need to add borders by comparing region colors with neighbors
    // Top border
    if (row === 0) {
      borderClasses += ' border-t-2 border-black';
    } else if (regions?.[row-1]?.[col] !== region) {
      borderClasses += ' border-t-2 border-black';
    }
    
    // Left border
    if (col === 0) {
      borderClasses += ' border-l-2 border-black';
    } else if (regions?.[row]?.[col-1] !== region) {
      borderClasses += ' border-l-2 border-black';
    }
    
    // Right border
    if (col === size - 1) {
      borderClasses += ' border-r-2 border-black';
    } else if (regions?.[row]?.[col+1] !== region) {
      borderClasses += ' border-r-2 border-black';
    }
    
    // Bottom border
    if (row === size - 1) {
      borderClasses += ' border-b-2 border-black';
    } else if (regions?.[row+1]?.[col] !== region) {
      borderClasses += ' border-b-2 border-black';
    }

    // Handle right click (context menu) to clear the square
    const handleRightClick = (e: React.MouseEvent) => {
      e.preventDefault(); // Prevent the context menu from appearing
      if (showingSolution) return;
      
      if (state === 'queen' || state === 'x') {
        const newSquares = [...squares];
        newSquares[position] = null;
        
        // If removing a queen and auto-place X's is enabled, update X placements
        if (state === 'queen' && autoPlaceXs) {
          // Clear all X's first
          for (let i = 0; i < newSquares.length; i++) {
            if (newSquares[i] === 'x') {
              newSquares[i] = null;
            }
          }
          
          // Re-place X's based on remaining queens
          for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
              if (newSquares[r * size + c] === 'queen') {
                const queenRow = r;
                const queenCol = c;
                
                // Mark invalid positions in the same row
                for (let c2 = 0; c2 < size; c2++) {
                  if (c2 !== queenCol && newSquares[queenRow * size + c2] === null) {
                    newSquares[queenRow * size + c2] = 'x';
                  }
                }
                
                // Mark invalid positions in the same column
                for (let r2 = 0; r2 < size; r2++) {
                  if (r2 !== queenRow && newSquares[r2 * size + queenCol] === null) {
                    newSquares[r2 * size + queenCol] = 'x';
                  }
                }
                
                // Mark invalid positions in the same region
                const region = regions[queenRow][queenCol];
                for (let r2 = 0; r2 < size; r2++) {
                  for (let c2 = 0; c2 < size; c2++) {
                    if ((r2 !== queenRow || c2 !== queenCol) && regions[r2][c2] === region && newSquares[r2 * size + c2] === null) {
                      newSquares[r2 * size + c2] = 'x';
                    }
                  }
                }
                
                // Mark invalid positions in all diagonals
                for (let r2 = 0; r2 < size; r2++) {
                  for (let c2 = 0; c2 < size; c2++) {
                    if ((r2 !== queenRow || c2 !== queenCol) && newSquares[r2 * size + c2] === null) {
                      // Check if they're on the same diagonal
                      if (Math.abs(r2 - queenRow) === Math.abs(c2 - queenCol)) {
                        newSquares[r2 * size + c2] = 'x';
                      }
                    }
                  }
                }
                
                // Mark diagonally adjacent squares (only direct adjacents)
                for (let r2 = Math.max(0, queenRow - 1); r2 <= Math.min(size - 1, queenRow + 1); r2++) {
                  for (let c2 = Math.max(0, queenCol - 1); c2 <= Math.min(size - 1, queenCol + 1); c2++) {
                    if ((r2 !== queenRow || c2 !== queenCol) && newSquares[r2 * size + c2] === null) {
                      newSquares[r2 * size + c2] = 'x';
                    }
                  }
                }
              }
            }
          }
        }
        
        setSquares(newSquares);
      }
    };

    return (
      <div
        key={`${row}-${col}`}
        className={`w-12 h-12 flex items-center justify-center cursor-pointer relative outline-none focus:outline-none active:outline-none
          ${REGION_COLORS[region]}
          ${borderClasses}`}
        onClick={() => handleSquareClick(row, col)}
        onContextMenu={handleRightClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleSquareClick(row, col);
            e.preventDefault();
          }
        }}
        role="button"
        tabIndex={0}
        style={{ 
          WebkitTapHighlightColor: 'transparent',
          outline: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          WebkitTouchCallout: 'none',
          borderStyle: 'solid',
          borderColor: 'black',
          WebkitUserModify: 'read-only'
        }}
      >
        {state === 'x' && (
          <span className="text-black text-opacity-60 text-lg select-none">✕</span>
        )}
        {state === 'queen' && (
          <span className={`text-2xl ${isSolved ? 'text-yellow-500' : 'text-black'} select-none`}>
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
        >
          {showingSolution ? 'Hide Solution' : 'Show Solution'}
        </button>
        <button
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={clearBoard}
          disabled={showingSolution}
        >
          Clear Board
        </button>
      </div>
      
      <div className="text-sm text-gray-900 mb-4 font-medium">
        Click once for X, twice for queen, three times to clear (or right-click to clear)
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