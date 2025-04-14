import { describe, test, expect } from "vitest";
import { generatePuzzle } from "../../../app/utils/puzzleGenerator";
import { RegionColor, SquareState } from "../../../app/types/chessboard";

describe("Puzzle Generator", () => {
  // Helper function to get queen positions from squares array
  const getQueenPositions = (squares: SquareState[][]): [number, number][] => {
    const positions: [number, number][] = [];
    for (let r = 0; r < squares.length; r++) {
      for (let c = 0; c < squares[r].length; c++) {
        if (squares[r][c] === "queen") {
          positions.push([r, c]);
        }
      }
    }
    return positions;
  };

  // Helper function to check if two positions are adjacent (including diagonally)
  const areAdjacent = (
    pos1: [number, number],
    pos2: [number, number]
  ): boolean => {
    const [row1, col1] = pos1;
    const [row2, col2] = pos2;
    return Math.abs(row1 - row2) <= 1 && Math.abs(col1 - col2) <= 1;
  };

  // Helper function to check if a region is contiguous using flood fill
  // Note: Only considers orthogonal connections (not diagonal)
  const isRegionContiguous = (
    regions: RegionColor[][],
    color: RegionColor,
    size: number
  ): boolean => {
    // Find first cell of the color
    let startRow = -1,
      startCol = -1;
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

    if (startRow === -1) return true; // Empty region is considered contiguous

    // Flood fill from start position
    const visited = Array(size)
      .fill(false)
      .map(() => Array(size).fill(false));
    const stack: [number, number][] = [[startRow, startCol]];
    visited[startRow][startCol] = true;
    // Only orthogonal directions (no diagonals)
    const directions = [
      [0, 1], // right
      [1, 0], // down
      [0, -1], // left
      [-1, 0], // up
    ];

    while (stack.length > 0) {
      const [r, c] = stack.pop()!;
      for (const [dr, dc] of directions) {
        const newRow = r + dr;
        const newCol = c + dc;
        if (
          newRow >= 0 &&
          newRow < size &&
          newCol >= 0 &&
          newCol < size &&
          !visited[newRow][newCol] &&
          regions[newRow][newCol] === color
        ) {
          visited[newRow][newCol] = true;
          stack.push([newRow, newCol]);
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

  test("generates valid puzzle for various board sizes", () => {
    const sizes = [8, 9, 10, 11, 12];

    for (const size of sizes) {
      const [regions, squares] = generatePuzzle(size);

      // Find queens in the squares array
      const queens: [number, number][] = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (squares[r][c] === "queen") {
            queens.push([r, c]);
          }
        }
      }

      // Test 1: Correct number of queens
      expect(queens.length).toBe(size);

      // Test 2: One queen per row
      const rows = new Set(queens.map(([r]) => r));
      expect(rows.size).toBe(size);

      // Test 3: One queen per column
      const cols = new Set(queens.map(([_, c]) => c));
      expect(cols.size).toBe(size);

      // Test 4: Queens are not adjacent
      for (let i = 0; i < queens.length; i++) {
        for (let j = i + 1; j < queens.length; j++) {
          expect(areAdjacent(queens[i], queens[j])).toBe(false);
        }
      }

      // Test 5: One queen per region
      const regionQueens = new Map<RegionColor, number>();
      queens.forEach(([r, c]) => {
        const region = regions[r][c];
        regionQueens.set(region, (regionQueens.get(region) || 0) + 1);
      });
      for (const count of regionQueens.values()) {
        expect(count).toBe(1);
      }

      // Test 6: All regions are contiguous
      const uniqueRegions = new Set(regions.flat());
      uniqueRegions.forEach((region) => {
        expect(isRegionContiguous(regions, region, size)).toBe(true);
      });

      // Test 7: Board dimensions are correct
      expect(regions.length).toBe(size);
      regions.forEach((row) => {
        expect(row.length).toBe(size);
      });

      // Test 8: No null or undefined values
      expect(
        regions.flat().every((color) => color !== null && color !== undefined)
      ).toBe(true);
    }
  });

  test("throws error for invalid board sizes", () => {
    const invalidSizes = [0, -1, 7, 13];

    for (const size of invalidSizes) {
      expect(() => generatePuzzle(size)).toThrow();
    }
  });

  test("generates different puzzles on subsequent calls", () => {
    const size = 8;
    const [regions1, squares1] = generatePuzzle(size);
    const [regions2, squares2] = generatePuzzle(size);

    // Test that either regions or solutions are different
    const areDifferent =
      JSON.stringify(regions1) !== JSON.stringify(regions2) ||
      JSON.stringify(squares1) !== JSON.stringify(squares2);

    expect(areDifferent).toBe(true);
  });

  test("regions have reasonable distribution", () => {
    const size = 8;
    const [regions] = generatePuzzle(size);
    const colorCounts = new Map<RegionColor, number>();

    // Count occurrences of each color
    regions.flat().forEach((color) => {
      colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
    });

    // Allow one region to have only 1 cell, others should have at least 2
    let foundSingleCell = false;
    for (const [color, count] of colorCounts.entries()) {
      if (count === 1 && !foundSingleCell) {
        foundSingleCell = true;
        continue;
      }
      expect(count).toBeGreaterThanOrEqual(2);
      expect(count).toBeLessThanOrEqual(Math.floor((size * size) / 2));
    }
  });

  test("queens can be on same diagonal if not adjacent", () => {
    const size = 8;
    let foundDiagonal = false;

    for (let attempt = 0; attempt < 10 && !foundDiagonal; attempt++) {
      const [_, squares] = generatePuzzle(size);
      const queens = getQueenPositions(squares);

      foundDiagonal = queens.some((pos1, i) =>
        queens.some((pos2, j) => {
          if (i === j) return false;
          const [r1, c1] = pos1;
          const [r2, c2] = pos2;
          const isDiagonal = Math.abs(r1 - r2) === Math.abs(c1 - c2);
          const isNotAdjacent = !areAdjacent(pos1, pos2);
          return isDiagonal && isNotAdjacent;
        })
      );
    }
    expect(foundDiagonal).toBe(true);
  });

  test("regions are properly connected to queens", () => {
    const size = 8;
    const [regions, squares] = generatePuzzle(size);
    const queens = getQueenPositions(squares);

    // Each queen should be part of its region and not isolated
    queens.forEach(([row, col]) => {
      const color = regions[row][col];
      let hasNeighborOfSameColor = false;
      const directions = [
        [0, 1],
        [1, 0],
        [0, -1],
        [-1, 0],
      ];

      // Check if at least one neighbor has the same color
      for (const [dr, dc] of directions) {
        const nr = row + dr;
        const nc = col + dc;
        if (
          nr >= 0 &&
          nr < size &&
          nc >= 0 &&
          nc < size &&
          regions[nr][nc] === color
        ) {
          hasNeighborOfSameColor = true;
          break;
        }
      }

      // Skip if queen is a single-cell region
      const regionSize = regions.flat().filter((c) => c === color).length;
      if (regionSize > 1) {
        expect(hasNeighborOfSameColor).toBe(true);
      }
    });
  });

  test("regions are guaranteed to be orthogonally contiguous for all board sizes", () => {
    // Test each valid board size
    for (const size of [8, 9, 10, 11, 12]) {
      // Run multiple tests per size
      for (let testRun = 0; testRun < 5; testRun++) {
        const [regions] = generatePuzzle(size);

        // Check each color region
        const uniqueRegions = new Set(regions.flat());

        uniqueRegions.forEach((region) => {
          if (region !== "unassigned") {
            // Check contiguity using BFS
            let startRow = -1,
              startCol = -1;

            // Find first cell of this color
            for (let r = 0; r < size; r++) {
              for (let c = 0; c < size; c++) {
                if (regions[r][c] === region) {
                  startRow = r;
                  startCol = c;
                  break;
                }
              }
              if (startRow !== -1) break;
            }

            // Do BFS from this cell
            const visited = Array(size)
              .fill(false)
              .map(() => Array(size).fill(false));

            const queue: [number, number][] = [[startRow, startCol]];
            visited[startRow][startCol] = true;

            const directions = [
              [0, 1], // right
              [1, 0], // down
              [0, -1], // left
              [-1, 0], // up
            ];

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
                  regions[nr][nc] === region
                ) {
                  visited[nr][nc] = true;
                  queue.push([nr, nc]);
                }
              }
            }

            // Verify all cells of this color were visited
            let allVisited = true;
            const unvisitedCells: [number, number][] = [];

            for (let r = 0; r < size; r++) {
              for (let c = 0; c < size; c++) {
                if (regions[r][c] === region && !visited[r][c]) {
                  allVisited = false;
                  unvisitedCells.push([r, c]);
                }
              }
            }

            if (!allVisited) {
              // Debug output
              console.log(`Non-contiguous region found: ${region}`);
              console.log(`Unvisited cells: ${JSON.stringify(unvisitedCells)}`);

              // Print the region map
              const regionMap: string[] = [];
              for (let r = 0; r < size; r++) {
                let row = "";
                for (let c = 0; c < size; c++) {
                  if (regions[r][c] === region) {
                    row += visited[r][c] ? "V" : "X"; // V = visited, X = unvisited
                  } else {
                    row += "."; // not this region
                  }
                }
                regionMap.push(row);
              }
              console.log("Region map (V=visited, X=unvisited, .=other):");
              console.log(regionMap.join("\n"));
            }

            expect(allVisited).toBe(true);
          }
        });
      }
    }
  });
});
