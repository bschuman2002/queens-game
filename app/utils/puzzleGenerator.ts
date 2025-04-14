import { RegionColor, SquareState } from "../types/chessboard";

// Define Position as a number[] tuple
type Position = [number, number]; // [row, col]

const VALID_SIZES = [8, 9, 10, 11, 12];

const AVAILABLE_COLORS: RegionColor[] = [
  "blue",
  "yellow",
  "red",
  "lime",
  "purple",
  "cyan",
  "brown",
  "green",
  "indigo",
  "orange",
  "emerald",
  "pink",
  "gray",
  "amber",
  "teal",
  "rose",
  "unassigned", // Temporary value used during region generation
];

interface Region {
  squares: [number, number][];
  color: RegionColor;
  queen: [number, number];
}

type Board = RegionColor[][];

// Directions for adjacent cells (up, right, down, left, diagonals)
const DIRECTIONS: [number, number][] = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, -1],
  [-1, 1],
  [1, 1],
  [1, -1],
];

/**
 * Generates a list of unique colors for regions
 * @param count Number of colors to generate
 * @returns Array of color strings
 */
function generateColors(count: number): RegionColor[] {
  // Generate a list of unique colors
  const colors: RegionColor[] = [];

  // Use predefined colors for small counts to ensure good contrast
  const predefinedColors: RegionColor[] = [
    "blue",
    "green",
    "yellow",
    "orange",
    "red",
    "purple",
    "gray",
    "teal",
  ];

  if (count <= predefinedColors.length) {
    return predefinedColors.slice(0, count);
  }

  // If we need more colors than predefined, use them first
  for (let i = 0; i < count; i++) {
    if (i < predefinedColors.length) {
      colors.push(predefinedColors[i]);
    } else {
      // For additional colors, reuse with a fallback to "unassigned"
      colors.push("unassigned");
    }
  }

  return colors;
}

export function generatePuzzle(
  boardSize: number
): [RegionColor[][], SquareState[][]] {
  if (!VALID_SIZES.includes(boardSize)) {
    throw new Error(
      `Invalid board size: ${boardSize}. Valid sizes are: ${VALID_SIZES.join(
        ", "
      )}`
    );
  }

  const size = boardSize;
  let regions: RegionColor[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(null));
  let squares: SquareState[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(null));
  const selectedColors = AVAILABLE_COLORS.slice(0, size);

  /** @unused - Kept for future region validation functionality */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isConnectedToRegion = (
    r: number,
    c: number,
    color: RegionColor
  ): boolean => {
    const directions = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ];
    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;
      if (
        nr >= 0 &&
        nr < size &&
        nc >= 0 &&
        nc < size &&
        regions[nr][nc] === color
      ) {
        return true;
      }
    }
    return false;
  };

  /** @unused - Kept for future region validation functionality */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getConnectedCells = (color: RegionColor): Set<string> => {
    const connected = new Set<string>();
    const queue: [number, number][] = [];

    // Find a starting point (queen position)
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (regions[r][c] === color) {
          queue.push([r, c]);
          connected.add(`${r},${c}`);
          break;
        }
      }
    }

    // BFS to find all connected cells
    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      const directions = [
        [0, 1],
        [1, 0],
        [0, -1],
        [-1, 0],
      ];

      for (const [dr, dc] of directions) {
        const nr = r + dr;
        const nc = c + dc;
        if (
          nr >= 0 &&
          nr < size &&
          nc >= 0 &&
          nc < size &&
          regions[nr][nc] === color &&
          !connected.has(`${nr},${nc}`)
        ) {
          queue.push([nr, nc]);
          connected.add(`${nr},${nc}`);
        }
      }
    }

    return connected;
  };

  // Place queens in a grid-like pattern
  const placeQueens = (): [number, number][] => {
    const queens: [number, number][] = [];
    const positions = [];

    // Create list of all positions
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        positions.push([r, c]);
      }
    }

    // Try to place queens
    for (let i = 0; i < size; i++) {
      shuffleArray(positions);
      let placed = false;

      for (const [r, c] of positions) {
        if (
          !queens.some(([qr, qc]) => qr === r || qc === c) &&
          canPlaceQueen(r, c, queens)
        ) {
          queens.push([r, c]);
          placed = true;
          break;
        }
      }

      if (!placed) {
        throw new Error("Failed to place queens");
      }
    }

    return queens;
  };

  // Grow regions around queens
  const growRegions = (board: Board, queens: [number, number][]): Board => {
    const size = board.length;
    const directions = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ]; // Orthogonal directions only for contiguity

    // Initialize the board with all unassigned cells
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        board[r][c] = "unassigned" as RegionColor; // Temporary value
      }
    }

    // Assign each queen to its own region first
    queens.forEach((queen, i) => {
      const [r, c] = queen;
      board[r][c] = selectedColors[i % selectedColors.length];
    });

    // Randomly select one queen to potentially have a single-cell region
    const potentialSingleCellRegionIndex = Math.floor(
      Math.random() * queens.length
    );

    // Create a queue for BFS with varying growth rates
    const cellsToProcess: Array<[number, number, RegionColor, number]> = [];

    // Add all cells adjacent to queens to the queue initially with growth priorities
    queens.forEach((queen, i) => {
      const [r, c] = queen;
      const color = selectedColors[i % selectedColors.length];

      // Assign random growth rates to create varied region sizes
      // Higher number = higher priority to grow (1-10)
      let growthRate = Math.floor(Math.random() * 10) + 1;

      // If this is our potential single-cell region, give it a very low growth rate
      if (i === potentialSingleCellRegionIndex) {
        growthRate = 1; // Lowest priority
      }

      // For each direction
      for (const [dr, dc] of directions) {
        const nr = r + dr;
        const nc = c + dc;
        if (
          nr >= 0 &&
          nr < size &&
          nc >= 0 &&
          nc < size &&
          board[nr][nc] === ("unassigned" as RegionColor)
        ) {
          cellsToProcess.push([nr, nc, color, growthRate]);
        }
      }
    });

    // Process the queue in order of growth priority
    while (cellsToProcess.length > 0) {
      // Sort by growth rate (higher numbers first) and add some randomization
      cellsToProcess.sort((a, b) => {
        const priorityDiff = b[3] - a[3]; // Higher growth rate first
        // If priorities are close, randomize a bit
        if (Math.abs(priorityDiff) <= 2) {
          return Math.random() > 0.5 ? 1 : -1;
        }
        return priorityDiff;
      });

      // Take the cell with highest growth priority
      const [r, c, color, growthRate] = cellsToProcess.shift()!;

      // If the cell is already assigned, skip it
      if (board[r][c] !== ("unassigned" as RegionColor)) continue;

      // Assign the color to the cell
      board[r][c] = color;

      // Add unassigned neighbors to the queue with slightly reduced growth rate
      for (const [dr, dc] of directions) {
        const nr = r + dr;
        const nc = c + dc;
        if (
          nr >= 0 &&
          nr < size &&
          nc >= 0 &&
          nc < size &&
          board[nr][nc] === ("unassigned" as RegionColor)
        ) {
          // Randomly reduce growth rate as we get further from queen
          const newGrowthRate = Math.max(
            1,
            growthRate - (Math.random() > 0.7 ? 1 : 0)
          );
          cellsToProcess.push([nr, nc, color, newGrowthRate]);
        }
      }
    }

    // If there are any unassigned cells left, assign them to the nearest region
    let unassignedLeft = true;
    while (unassignedLeft) {
      unassignedLeft = false;

      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (board[r][c] === ("unassigned" as RegionColor)) {
            unassignedLeft = true;

            // Find an adjacent assigned cell
            let assigned = false;
            for (const [dr, dc] of directions) {
              const nr = r + dr;
              const nc = c + dc;
              if (
                nr >= 0 &&
                nr < size &&
                nc >= 0 &&
                nc < size &&
                board[nr][nc] !== ("unassigned" as RegionColor)
              ) {
                board[r][c] = board[nr][nc];
                assigned = true;
                break;
              }
            }

            // If no adjacent cells, find the nearest region
            if (!assigned) {
              // Find the region with the fewest cells
              const colorCounts = new Map<RegionColor, number>();
              for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                  if (board[i][j] !== ("unassigned" as RegionColor)) {
                    colorCounts.set(
                      board[i][j],
                      (colorCounts.get(board[i][j]) || 0) + 1
                    );
                  }
                }
              }

              let minColor = selectedColors[0];
              let minCount = Infinity;
              for (const [color, count] of colorCounts.entries()) {
                if (count < minCount) {
                  minCount = count;
                  minColor = color;
                }
              }

              board[r][c] = minColor;
            }
          }
        }
      }
    }

    // VERIFICATION STEP: Ensure all regions are contiguous
    // For each color, check if all cells of that color are contiguous
    const uniqueColors = new Set<RegionColor>();
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        uniqueColors.add(board[r][c]);
      }
    }

    // Count how many single-cell regions we have
    const regionSizes = new Map<RegionColor, number>();
    for (const color of uniqueColors) {
      if (color === "unassigned") continue;

      let count = 0;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (board[r][c] === color) {
            count++;
          }
        }
      }
      regionSizes.set(color, count);
    }

    // Count single-cell regions
    let singleCellRegions = 0;
    for (const [_, count] of regionSizes.entries()) {
      if (count === 1) singleCellRegions++;
    }

    // First pass: Ensure we have at most one single-cell region
    if (singleCellRegions > 1) {
      // Get all single-cell regions except one to expand
      const singleCellColors: RegionColor[] = [];
      for (const [color, count] of regionSizes.entries()) {
        if (count === 1) {
          singleCellColors.push(color);
        }
      }

      // Keep the first one as is, expand the rest
      for (let i = 1; i < singleCellColors.length; i++) {
        const color = singleCellColors[i];

        // Find the queen position
        let queenRow = -1,
          queenCol = -1;
        for (const [r, c] of queens) {
          if (board[r][c] === color) {
            queenRow = r;
            queenCol = c;
            break;
          }
        }

        // Try to take a cell from largest adjacent region
        const adjacentRegions = new Map<RegionColor, number>();
        for (const [dr, dc] of directions) {
          const nr = queenRow + dr;
          const nc = queenCol + dc;
          if (
            nr >= 0 &&
            nr < size &&
            nc >= 0 &&
            nc < size &&
            board[nr][nc] !== color
          ) {
            const adjColor = board[nr][nc];
            if (regionSizes.get(adjColor)! > 2) {
              // Only take from regions with > 2 cells
              adjacentRegions.set(adjColor, regionSizes.get(adjColor)!);
            }
          }
        }

        // Find largest adjacent region
        let largestRegion: RegionColor | null = null;
        let largestSize = 0;
        for (const [adjColor, adjSize] of adjacentRegions.entries()) {
          if (adjSize > largestSize) {
            largestSize = adjSize;
            largestRegion = adjColor;
          }
        }

        // Take a cell from the largest region
        if (largestRegion) {
          for (const [dr, dc] of directions) {
            const nr = queenRow + dr;
            const nc = queenCol + dc;
            if (
              nr >= 0 &&
              nr < size &&
              nc >= 0 &&
              nc < size &&
              board[nr][nc] === largestRegion
            ) {
              board[nr][nc] = color;
              break;
            }
          }
        }
      }
    }

    // Second pass: Ensure all regions are contiguous
    for (const color of uniqueColors) {
      if (color === "unassigned") continue;

      // Find queen with this color
      let queenRow = -1,
        queenCol = -1;
      for (let i = 0; i < queens.length; i++) {
        const [r, c] = queens[i];
        if (board[r][c] === color) {
          queenRow = r;
          queenCol = c;
          break;
        }
      }

      if (queenRow === -1) continue; // Skip if no queen found (shouldn't happen)

      // Use BFS to find all connected cells
      const visited = Array(size)
        .fill(null)
        .map(() => Array(size).fill(false));
      const queue: [number, number][] = [[queenRow, queenCol]];
      visited[queenRow][queenCol] = true;

      while (queue.length > 0) {
        const [r, c] = queue.shift()!;
        for (const [dr, dc] of directions) {
          const nr = r + dr;
          const nc = c + dc;
          if (
            nr >= 0 &&
            nr < size &&
            nc >= 0 &&
            nc < size &&
            !visited[nr][nc] &&
            board[nr][nc] === color
          ) {
            visited[nr][nc] = true;
            queue.push([nr, nc]);
          }
        }
      }

      // Find any cells of this color that weren't visited
      const disconnectedCells: [number, number][] = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (board[r][c] === color && !visited[r][c]) {
            disconnectedCells.push([r, c]);
          }
        }
      }

      // If there are disconnected cells, try to connect them
      if (disconnectedCells.length > 0) {
        // For each disconnected cell
        for (const [r, c] of disconnectedCells) {
          // Try to find a path to the main region
          let pathFound = false;

          // First, try to find an adjacent cell that's connected
          for (const [dr, dc] of directions) {
            const nr = r + dr;
            const nc = c + dc;
            if (
              nr >= 0 &&
              nr < size &&
              nc >= 0 &&
              nc < size &&
              visited[nr][nc]
            ) {
              // Found a direct connection - we're done
              pathFound = true;
              break;
            }
          }

          // If no direct connection, try to create a path by reassigning cells
          if (!pathFound) {
            // Starting from this cell, find the shortest path to any visited cell
            const pathVisited = Array(size)
              .fill(null)
              .map(() => Array(size).fill(false));
            const pathQueue: [number, number, Array<[number, number]>][] = [
              [r, c, [[r, c]]],
            ];
            pathVisited[r][c] = true;
            let shortestPath: Array<[number, number]> = [];

            while (pathQueue.length > 0 && shortestPath.length === 0) {
              const [pr, pc, path] = pathQueue.shift()!;

              for (const [dr, dc] of directions) {
                const nr = pr + dr;
                const nc = pc + dc;
                if (
                  nr >= 0 &&
                  nr < size &&
                  nc >= 0 &&
                  nc < size &&
                  !pathVisited[nr][nc]
                ) {
                  pathVisited[nr][nc] = true;
                  const newPath = [...path, [nr, nc] as [number, number]];

                  if (visited[nr][nc]) {
                    // Found a path to the main region
                    shortestPath = newPath;
                    break;
                  }

                  pathQueue.push([nr, nc, newPath]);
                }
              }
            }

            // If we found a path, use it to connect
            if (shortestPath.length > 0) {
              // Convert all cells in the path to this color
              for (const [pr, pc] of shortestPath) {
                board[pr][pc] = color;
                visited[pr][pc] = true; // Mark as visited for future disconnected cells
              }
              pathFound = true;
            }
          }

          // If still no path, reassign this cell to an adjacent color
          if (!pathFound) {
            for (const [dr, dc] of directions) {
              const nr = r + dr;
              const nc = c + dc;
              if (
                nr >= 0 &&
                nr < size &&
                nc >= 0 &&
                nc < size &&
                board[nr][nc] !== color
              ) {
                board[r][c] = board[nr][nc];
                break;
              }
            }
          }
        }
      }
    }

    return board;
  };

  const generateValidPuzzle = (): [RegionColor[][], SquareState[][]] => {
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        // Reset arrays
        regions = Array(size)
          .fill(null)
          .map(() => Array(size).fill(null));
        squares = Array(size)
          .fill(null)
          .map(() => Array(size).fill(null));

        // Place queens first
        const queens = placeQueens();

        // Actually place the queens in the squares array
        queens.forEach(([r, c]) => {
          squares[r][c] = "queen";
        });

        // Grow regions around queens
        growRegions(regions, queens);

        // Validate regions
        const regionCounts = new Map<RegionColor, number>();
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            const color = regions[r][c];
            if (color !== null) {
              regionCounts.set(color, (regionCounts.get(color) || 0) + 1);
            }
          }
        }

        // Check if any region is too large (>30% of board)
        const maxAllowedSize = Math.ceil(size * size * 0.3);
        let isValid = true;
        for (const [, count] of regionCounts) {
          if (count > maxAllowedSize) {
            isValid = false;
            break;
          }
        }

        // Ensure we have exactly size regions
        if (regionCounts.size !== size) {
          isValid = false;
          continue;
        }

        if (isValid) {
          return [regions, squares];
        }
      } catch {
        // Continue to next attempt
        continue;
      }
    }

    throw new Error(
      `Failed to generate valid puzzle after ${maxAttempts} attempts`
    );
  };

  return generateValidPuzzle();
}

function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function canPlaceQueen(
  row: number,
  col: number,
  queens: [number, number][]
): boolean {
  for (const [qRow, qCol] of queens) {
    // Check if in same row or column
    if (qRow === row || qCol === col) {
      return false;
    }

    // Check diagonals
    if (Math.abs(qRow - row) === Math.abs(qCol - col)) {
      return false;
    }
  }
  return true;
}

/**
 * Checks if two cells are adjacent to each other
 * @param r1 Row of first cell
 * @param c1 Column of first cell
 * @param r2 Row of second cell
 * @param c2 Column of second cell
 * @returns True if cells are adjacent (orthogonal or diagonal)
 */
function isAdjacent(r1: number, c1: number, r2: number, c2: number): boolean {
  return DIRECTIONS.some(([dr, dc]) => r1 + dr === r2 && c1 + dc === c2);
}

export function growRegions(size: number, queens: Position[]): RegionColor[][] {
  const board = Array(size)
    .fill(null)
    .map(() => Array(size).fill(null));
  const colors = generateColors(queens.length);

  // Assign each queen a unique color
  queens.forEach((queen, i) => {
    const [row, col] = queen;
    board[row][col] = colors[i];
  });

  // Randomly select one queen that might have a single-cell region
  const potentialSingleCellIndex = Math.floor(Math.random() * queens.length);

  // Create a map to track growth rates for cells adjacent to each queen
  const growthRates = new Map<string, number>();

  // Queue of cells to process (row, col, color)
  const queue: [number, number, RegionColor][] = [];

  // Initialize the queue with cells adjacent to queens with their assigned colors
  queens.forEach((queen, i) => {
    const [row, col] = queen;
    const color = colors[i];

    // Each queen has a different probability of growth for its adjacent cells
    const baseGrowthRate = Math.random() * 0.5 + 0.5; // Between 0.5 and 1.0

    // Add adjacent cells to the queue with the queen's color
    for (const [dr, dc] of DIRECTIONS) {
      const newRow = row + dr;
      const newCol = col + dc;

      if (
        newRow >= 0 &&
        newRow < size &&
        newCol >= 0 &&
        newCol < size &&
        board[newRow][newCol] === null
      ) {
        // If not a single cell candidate or random chance allows growth
        if (i !== potentialSingleCellIndex || Math.random() < baseGrowthRate) {
          queue.push([newRow, newCol, color]);
          // Store growth rate for this cell
          growthRates.set(`${newRow},${newCol}`, baseGrowthRate);
        }
      }
    }
  });

  // Process the queue
  while (queue.length > 0) {
    // Randomly select a cell from the queue to process
    const randomIndex = Math.floor(Math.random() * queue.length);
    const [row, col, color] = queue[randomIndex];
    queue.splice(randomIndex, 1);

    // Skip if cell is already colored
    if (board[row][col] !== null) continue;

    // Color the cell
    board[row][col] = color;

    // Get the growth rate for this cell
    const cellGrowthRate = growthRates.get(`${row},${col}`) || 0.75;

    // Add adjacent uncolored cells to the queue
    for (const [dr, dc] of DIRECTIONS) {
      const newRow = row + dr;
      const newCol = col + dc;

      if (
        newRow >= 0 &&
        newRow < size &&
        newCol >= 0 &&
        newCol < size &&
        board[newRow][newCol] === null &&
        // Apply growth rate probability
        Math.random() < cellGrowthRate
      ) {
        queue.push([newRow, newCol, color]);
        // Calculate new growth rate (slightly decreased)
        const newGrowthRate = cellGrowthRate * (Math.random() * 0.2 + 0.8); // 80-100% of parent's growth rate
        growthRates.set(`${newRow},${newCol}`, newGrowthRate);
      }
    }
  }

  // Handle any uncolored cells
  const uncoloredCells: Position[] = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (board[row][col] === null) {
        uncoloredCells.push([row, col]);
      }
    }
  }

  // Assign uncolored cells to adjacent colored regions
  while (uncoloredCells.length > 0) {
    let assignedAny = false;

    for (let i = uncoloredCells.length - 1; i >= 0; i--) {
      const [row, col] = uncoloredCells[i];
      const adjacentColors = new Set<RegionColor>();

      for (const [dr, dc] of DIRECTIONS) {
        const newRow = row + dr;
        const newCol = col + dc;

        if (
          newRow >= 0 &&
          newRow < size &&
          newCol >= 0 &&
          newCol < size &&
          board[newRow][newCol] !== null
        ) {
          adjacentColors.add(board[newRow][newCol]);
        }
      }

      if (adjacentColors.size > 0) {
        // Convert Set to Array for random selection
        const adjacentColorsArray = Array.from(adjacentColors);
        const selectedColor =
          adjacentColorsArray[
            Math.floor(Math.random() * adjacentColorsArray.length)
          ];
        board[row][col] = selectedColor;
        uncoloredCells.splice(i, 1);
        assignedAny = true;
      }
    }

    // If we couldn't assign any cells in this pass, assign them randomly
    if (!assignedAny && uncoloredCells.length > 0) {
      for (const [row, col] of uncoloredCells) {
        board[row][col] = colors[Math.floor(Math.random() * colors.length)];
      }
      break;
    }
  }

  // Count cells per region to check for single cell regions
  const regionCounts = new Map<RegionColor, number>();
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const color = board[row][col];
      regionCounts.set(color, (regionCounts.get(color) || 0) + 1);
    }
  }

  // Expand single-cell regions if we have more than one
  let singleCellRegionCount = 0;
  let singleCellRegionColor: RegionColor | null = null;

  for (const [color, count] of regionCounts.entries()) {
    if (count === 1) {
      singleCellRegionCount++;
      singleCellRegionColor = color;
    }
  }

  // If we have more than one single-cell region or none at all, fix it
  if (
    singleCellRegionCount > 1 ||
    (singleCellRegionCount === 0 && Math.random() < 0.2)
  ) {
    // For each single cell region (except potentially one), merge it with an adjacent region
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const color = board[row][col];

        // Skip if this is the single cell region we want to keep
        if (singleCellRegionCount === 1 && color === singleCellRegionColor)
          continue;

        // If this is a single cell region that needs to be merged
        if (regionCounts.get(color) === 1) {
          // Find adjacent colors
          const adjacentColors = new Set<RegionColor>();
          for (const [dr, dc] of DIRECTIONS) {
            const newRow = row + dr;
            const newCol = col + dc;

            if (
              newRow >= 0 &&
              newRow < size &&
              newCol >= 0 &&
              newCol < size &&
              board[newRow][newCol] !== color
            ) {
              adjacentColors.add(board[newRow][newCol]);
            }
          }

          if (adjacentColors.size > 0) {
            // Convert Set to Array for random selection
            const adjacentColorsArray = Array.from(adjacentColors);
            const selectedColor =
              adjacentColorsArray[
                Math.floor(Math.random() * adjacentColorsArray.length)
              ];

            // Check if this cell contains a queen
            const containsQueen = queens.some(
              ([qr, qc]) => qr === row && qc === col
            );

            // Only merge if the region doesn't already have a queen
            const regionHasQueen = queens.some(
              ([qr, qc]) => board[qr][qc] === selectedColor
            );

            if (containsQueen && regionHasQueen) {
              // If both regions have queens, don't merge and try another approach
              continue;
            } else if (containsQueen) {
              // If this cell has a queen, propagate its color to the adjacent region
              const selectedCells = [];
              for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                  if (board[r][c] === selectedColor) {
                    selectedCells.push([r, c]);
                  }
                }
              }
              // Change color of one adjacent cell
              if (selectedCells.length > 0) {
                const [targetRow, targetCol] =
                  selectedCells[
                    Math.floor(Math.random() * selectedCells.length)
                  ];
                board[targetRow][targetCol] = color;
                regionCounts.set(color, (regionCounts.get(color) || 0) + 1);
                regionCounts.set(
                  selectedColor,
                  (regionCounts.get(selectedColor) || 0) - 1
                );
              }
            } else {
              // Merge this cell into adjacent region
              board[row][col] = selectedColor;
              regionCounts.set(
                selectedColor,
                (regionCounts.get(selectedColor) || 0) + 1
              );
              regionCounts.set(color, (regionCounts.get(color) || 0) - 1);
            }
          }
        }
      }
    }
  }

  // Verify that each region has exactly one queen
  const regionQueens = new Map<RegionColor, number>();
  queens.forEach(([r, c]) => {
    const region = board[r][c];
    regionQueens.set(region, (regionQueens.get(region) || 0) + 1);
  });

  // Fix regions with no queens or multiple queens
  for (let color of colors) {
    const queenCount = regionQueens.get(color) || 0;

    if (queenCount !== 1) {
      // Identify cells in this region
      const cellsInRegion: Position[] = [];
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          if (board[row][col] === color) {
            cellsInRegion.push([row, col]);
          }
        }
      }

      if (queenCount === 0) {
        // Region has no queens - steal a queen from a region with multiple queens
        const regionWithExtraQueens = Array.from(regionQueens.entries()).find(
          ([_, count]) => count > 1
        );

        if (regionWithExtraQueens) {
          const [extraQueensColor, _] = regionWithExtraQueens;

          // Find a queen in the region with extra queens
          const queensInExtraRegion = queens.filter(
            ([r, c]) => board[r][c] === extraQueensColor
          );
          const [queenRow, queenCol] =
            queensInExtraRegion[queensInExtraRegion.length - 1];

          // Change the queen's region
          board[queenRow][queenCol] = color;

          // Update queen counts
          regionQueens.set(color, 1);
          regionQueens.set(
            extraQueensColor,
            regionQueens.get(extraQueensColor)! - 1
          );
        } else {
          // No region with extra queens, reassign a random cell in this region to a queen
          if (cellsInRegion.length > 0) {
            const randomCellIndex = Math.floor(
              Math.random() * cellsInRegion.length
            );
            const [cellRow, cellCol] = cellsInRegion[randomCellIndex];

            // Swap this cell with a queen
            const randomQueenIndex = Math.floor(Math.random() * queens.length);
            const [queenRow, queenCol] = queens[randomQueenIndex];

            // Update the queens array
            queens[randomQueenIndex] = [cellRow, cellCol];

            // Update the colors on the board for these cells
            const queenColor = board[queenRow][queenCol];
            board[cellRow][cellCol] = color;

            // Update queen counts
            regionQueens.set(color, 1);
            regionQueens.set(queenColor, regionQueens.get(queenColor)! - 1);
          }
        }
      } else if (queenCount > 1) {
        // Region has multiple queens - find regions without queens
        const regionsWithoutQueens = Array.from(colors).filter(
          (c) => !regionQueens.has(c) || regionQueens.get(c) === 0
        );

        if (regionsWithoutQueens.length > 0) {
          // Find queens in this region
          const queensInRegion = queens.filter(
            ([r, c]) => board[r][c] === color
          );

          // Move a queen to a region without queens
          const targetRegion = regionsWithoutQueens[0];
          const [queenRow, queenCol] =
            queensInRegion[queensInRegion.length - 1];

          // Create a suitable cell in the target region if none exists
          let cellFound = false;
          for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
              // Skip existing queens
              if (queens.some(([qr, qc]) => qr === row && qc === col)) continue;

              // Find a cell adjacent to the target region
              const isAdjacentToTargetRegion = DIRECTIONS.some(([dr, dc]) => {
                const adjacentRow = row + dr;
                const adjacentCol = col + dc;
                return (
                  adjacentRow >= 0 &&
                  adjacentRow < size &&
                  adjacentCol >= 0 &&
                  adjacentCol < size &&
                  board[adjacentRow][adjacentCol] === targetRegion
                );
              });

              if (isAdjacentToTargetRegion) {
                // Change color of this cell to the target region
                const originalColor = board[row][col];
                board[row][col] = targetRegion;

                // Move the queen to this cell
                for (let i = 0; i < queens.length; i++) {
                  if (queens[i][0] === queenRow && queens[i][1] === queenCol) {
                    queens[i] = [row, col];
                    break;
                  }
                }

                // Update queen counts
                regionQueens.set(targetRegion, 1);
                regionQueens.set(color, queenCount - 1);

                cellFound = true;
                break;
              }
            }
            if (cellFound) break;
          }

          // If we couldn't find a suitable cell, just reassign the queen's color
          if (!cellFound) {
            board[queenRow][queenCol] = targetRegion;
            regionQueens.set(targetRegion, 1);
            regionQueens.set(color, queenCount - 1);
          }
        }
      }
    }
  }

  return board;
}
