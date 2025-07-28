const canvas = $('#tetris')[0];
const context = canvas.getContext('2d');
context.scale(20, 20); // Scale the canvas for easier drawing

let board = Array.from({ length: 20 }, () => Array(10).fill(0));
let currentPiece;
let dropInterval = 700;
let speedIncreasePerLine = 20; // Speed increase per line cleared
let lastTime = 0;
let score = 0;
let paused = false;  // Track the paused state
let gameStarted = false; // Track if the game has been started
let gameStartTime = null; // When the game was started
let gameElapsedTime = 0; // Total elapsed time in milliseconds
let timerInterval = null; // Timer update interval

// Define colors for each Tetrimino (fallback)
const colors = [
  null,
  'blue', // I
  'blue', // O
  'blue', // S
  'blue', // Z
  'blue', // L
  'blue', // J
  'blue' // T
];

// Luminaire images for each piece type
const luminaireImages = {};
const luminaireImageUrls = {
  1: 'images/i-luminaire.png',    // I piece - linear luminaire
  2: 'images/o-luminaire.png',    // O piece - square luminaire
  3: 'images/s-luminaire.png',    // S piece - S-shaped luminaire
  4: 'images/z-luminaire.png',    // Z piece - Z-shaped luminaire
  5: 'images/l-luminaire.png',    // L piece - L-shaped luminaire
  6: 'images/j-luminaire.png',    // J piece - J-shaped luminaire
  7: 'images/t-luminaire.png'     // T piece - T-shaped luminaire
};

// Store piece image data for each placed piece
let placedPieces = [];
let imagesLoaded = false;

// Load all luminaire images
function loadImages() {
  return Promise.all(
    Object.entries(luminaireImageUrls).map(([key, url]) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          luminaireImages[key] = img;
          resolve();
        };
        img.onerror = (error) => {
          GameUtils.showNotification(`Failed to load image ${url}, will use color fallback`, 'warning');
          resolve(); // Continue even if image fails to load
        };
        img.src = url;
      });
    })
  ).then(() => {
    imagesLoaded = true;
    GameUtils.showNotification('Luminaire images loaded successfully', 'success');
  }).catch((error) => {
    GameUtils.showNotification('Some images failed to load, using color fallback', 'warning');
    imagesLoaded = false;
  });
}

// Helper function to draw a single block (color only for collision detection)
function drawBlock(ctx, blockType, x, y, width = 1, height = 1) {
  if (blockType) {
    // Always use solid color for individual blocks (used for fallback and collision visualization)
    ctx.fillStyle = colors[blockType];
    ctx.fillRect(x, y, width, height);
  }
}

// Helper function to draw a complete luminaire piece
function drawLuminaire(ctx, piece, offsetX = 0, offsetY = 0) {
  // Check if this piece has been modified by line clearing
  // If so, fall back to colored blocks for better visual consistency
  const isModifiedPiece = piece.isModified || false;
  
  if (!isModifiedPiece && imagesLoaded && luminaireImages[piece.colorIndex]) {
    // Calculate the bounding box of the piece shape
    const bounds = getPieceBounds(piece.shape);
    
    // Use stored rotation if available, otherwise calculate it
    let rotation = piece.rotation;
    if (rotation === undefined) {
      // For current piece, calculate rotation dynamically
      const originalPiece = pieces[piece.colorIndex - 1];
      rotation = getRotationAngle(originalPiece, piece.shape);
    }
    
    const drawX = (piece.x + offsetX);
    const drawY = (piece.y + offsetY);
    
    if (rotation !== 0) {
      // Save the current canvas state
      ctx.save();
      
      // Move to the center of where we want to draw the piece
      const centerX = drawX + bounds.width / 2;
      const centerY = drawY + bounds.height / 2;
      ctx.translate(centerX, centerY);
      
      // Rotate the canvas
      ctx.rotate(rotation * Math.PI / 180);
      
      // Get original bounds for the image
      const originalPiece = pieces[piece.colorIndex - 1];
      const originalBounds = getPieceBounds(originalPiece);
      
      // Draw the image centered at the origin
      ctx.drawImage(
        luminaireImages[piece.colorIndex],
        -originalBounds.width / 2,
        -originalBounds.height / 2,
        originalBounds.width,
        originalBounds.height
      );
      
      // Restore the canvas state
      ctx.restore();
    } else {
      // No rotation needed, draw normally
      ctx.drawImage(
        luminaireImages[piece.colorIndex],
        drawX,
        drawY,
        bounds.width,
        bounds.height
      );
    }
  } else {
    // Fallback: draw individual colored blocks (for modified pieces or when images fail)
    piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          drawBlock(ctx, piece.colorIndex, piece.x + x + offsetX, piece.y + y + offsetY);
        }
      });
    });
  }
}

// Function to determine rotation angle by comparing shapes
function getRotationAngle(originalShape, currentShape) {
  // If shapes are identical, no rotation
  if (shapesEqual(originalShape, currentShape)) {
    return 0;
  }
  
  // Try 90, 180, and 270 degree rotations of the original
  let testShape = originalShape;
  
  // Test 90 degrees
  testShape = rotateShapeClockwise(testShape);
  if (shapesEqual(testShape, currentShape)) {
    return 90;
  }
  
  // Test 180 degrees
  testShape = rotateShapeClockwise(testShape);
  if (shapesEqual(testShape, currentShape)) {
    return 180;
  }
  
  // Test 270 degrees
  testShape = rotateShapeClockwise(testShape);
  if (shapesEqual(testShape, currentShape)) {
    return 270;
  }
  
  return 0; // Default to no rotation if no match found
}

// Helper function to rotate a shape clockwise
function rotateShapeClockwise(shape) {
  return shape[0].map((_, index) => shape.map(row => row[index]).reverse());
}

// Helper function to compare two shapes
function shapesEqual(shape1, shape2) {
  if (shape1.length !== shape2.length) return false;
  if (shape1[0].length !== shape2[0].length) return false;
  
  for (let y = 0; y < shape1.length; y++) {
    for (let x = 0; x < shape1[0].length; x++) {
      if (shape1[y][x] !== shape2[y][x]) return false;
    }
  }
  return true;
}

// Get the bounding dimensions of a piece shape
function getPieceBounds(shape) {
  return {
    width: shape[0].length,
    height: shape.length
  };
}

const pieces = [
  [[1, 1, 1, 1]], // I
  [[1, 1], [1, 1]], // O
  [[0, 1, 1], [1, 1, 0]], // S
  [[1, 1, 0], [0, 1, 1]], // Z
  [[1, 0, 0], [1, 1, 1]], // L
  [[0, 0, 1], [1, 1, 1]], // J
  [[0, 1, 0], [1, 1, 1]] // T
];

// Function to draw the board
function drawBoard() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw placed luminaire pieces
  placedPieces.forEach(piece => {
    drawLuminaire(context, piece);
  });
  
  // Draw individual blocks for any remaining board state (fallback)
  board.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        // Only draw if this position isn't covered by a luminaire piece
        const isCoveredByLuminaire = placedPieces.some(piece => {
          return piece.shape.some((pieceRow, py) => {
            return pieceRow.some((pieceValue, px) => {
              return pieceValue && 
                     (piece.x + px === x) && 
                     (piece.y + py === y);
            });
          });
        });
        
        if (!isCoveredByLuminaire) {
          drawBlock(context, value, x, y);
        }
      }
    });
  });
  
  drawScore(); // Draw the score
}

// Function to draw the current piece
function drawPiece() {
  drawLuminaire(context, currentPiece);
}

// Function to draw the drop indicator (where the piece will land)
function drawDropIndicator() {
  const dropPosition = getDropPosition();
  context.fillStyle = 'rgba(222, 215, 215, 0.08)'; // Semi-transparent white
  currentPiece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        context.fillRect(dropPosition.x + x, dropPosition.y + y, 1, 1);
      }
    });
  });
}

// Update the score display in the DOM
function drawScore() {
  // Update the HTML score element using jQuery
  $('#score').text(`Score: ${score}`);
}

// Function to merge the piece with the board
function merge() {
  // Calculate and store the rotation angle for this piece
  const originalPiece = pieces[currentPiece.colorIndex - 1];
  const rotation = getRotationAngle(originalPiece, currentPiece.shape);
  
  // Add the complete piece to the placed pieces array with rotation info
  placedPieces.push({
    shape: currentPiece.shape,
    x: currentPiece.x,
    y: currentPiece.y,
    colorIndex: currentPiece.colorIndex,
    rotation: rotation // Store the rotation angle
  });
  
  // Also update the board array for collision detection
  currentPiece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        board[currentPiece.y + y][currentPiece.x + x] = currentPiece.colorIndex;
      }
    });
  });
  
  // Award 1 point for placing a piece
  score += 1;
  GameUtils.logGameState('Piece placed! +1 point. Score:', score);
}

// Function to reset the current piece
function resetPiece() {
  const randomIndex = Math.floor(Math.random() * pieces.length);
  currentPiece = {
    shape: pieces[randomIndex],
    x: 3,
    y: 0,
    colorIndex: randomIndex + 1 // Color index corresponds to the piece
  };
}

// Function to check for collisions
function collide() {
  return currentPiece.shape.some((row, y) => {
    return row.some((value, x) => {
      return value && (board[currentPiece.y + y] && board[currentPiece.y + y][currentPiece.x + x]) !== 0;
    });
  });
}

// Function to rotate the piece
function rotatePiece() {
  const originalShape = currentPiece.shape;
  currentPiece.shape = currentPiece.shape[0].map((_, index) => currentPiece.shape.map(row => row[index]).reverse());
  if (collide()) {
    currentPiece.shape = originalShape; // Revert if collision
  }
}

// Function to move the piece left or right
function movePiece(dir) {
  currentPiece.x += dir;
  if (collide()) {
    currentPiece.x -= dir; // Revert if collision
  }
}

// Function to drop the piece
function drop() {
  currentPiece.y++;
  if (collide()) {
    currentPiece.y--;
    merge();
    clearLines();
    resetPiece();
    if (collide()) {
      showGameOver();
    }
  }
}

// Function to drop the piece to the bottom
function dropToBottom() {
  const startingY = currentPiece.y; // Record starting position
  
  while (!collide()) {
    currentPiece.y++;
  }
  currentPiece.y--; // Move back up one space
  
  // Calculate drop height and award bonus points
  const dropHeight = currentPiece.y - startingY;
  const heightBonus = Math.round(dropHeight / 4);
  
  if (heightBonus > 0) {
    score += heightBonus;
    GameUtils.logGameState(`Piece dropped ${dropHeight} lines! Height bonus: +${heightBonus} points. Score:`, score);
  }
  
  merge();
  clearLines();
  resetPiece();
  if (collide()) {
    showGameOver();
  }
}

// Function to get the drop position of the current piece
function getDropPosition() {
  let dropY = currentPiece.y;
  while (!collideAt(currentPiece.x, dropY + 1)) {
    dropY++;
  }
  return { x: currentPiece.x, y: dropY };
}

// Function to check for collisions at a specific position
function collideAt(x, y) {
  return currentPiece.shape.some((row, dy) => {
    return row.some((value, dx) => {
      return value && (board[y + dy] && board[y + dy][x + dx]) !== 0;
    });
  });
}

// Helper function to compact a piece shape by removing empty rows from bottom
function compactPieceShape(shape) {
  // Remove empty rows from the bottom only
  while (shape.length > 0 && shape[shape.length - 1].every(value => value === 0)) {
    shape.pop();
  }
  
  // Remove empty rows from the top only
  while (shape.length > 0 && shape[0].every(value => value === 0)) {
    shape.shift();
  }
  
  // If the shape is empty, return empty array
  if (shape.length === 0) {
    return [];
  }
  
  // Don't trim columns for modified pieces - preserve the original structure
  // This maintains the relative positioning of blocks within the piece
  console.log('  Shape compacted from', JSON.stringify(shape), 'to', JSON.stringify(shape));
  
  return shape;
}

// Function to find connected components in a piece shape
function findConnectedComponents(shape, colorIndex) {
  const visited = shape.map(row => row.map(() => false));
  const components = [];
  
  function floodFill(startY, startX, component) {
    if (startY < 0 || startY >= shape.length || 
        startX < 0 || startX >= shape[0].length ||
        visited[startY][startX] || !shape[startY][startX]) {
      return;
    }
    
    visited[startY][startX] = true;
    component.blocks.push({ x: startX, y: startY });
    
    // Check 4-directional connectivity (up, down, left, right)
    floodFill(startY - 1, startX, component);
    floodFill(startY + 1, startX, component);
    floodFill(startY, startX - 1, component);
    floodFill(startY, startX + 1, component);
  }
  
  // Find all connected components
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[0].length; x++) {
      if (shape[y][x] && !visited[y][x]) {
        const component = { blocks: [], colorIndex: colorIndex };
        floodFill(y, x, component);
        components.push(component);
      }
    }
  }
  
  return components;
}

// Function to create a piece from a connected component
function createPieceFromComponent(component, originalPiece) {
  if (component.blocks.length === 0) return null;
  
  // Find bounding box
  const minX = Math.min(...component.blocks.map(b => b.x));
  const maxX = Math.max(...component.blocks.map(b => b.x));
  const minY = Math.min(...component.blocks.map(b => b.y));
  const maxY = Math.max(...component.blocks.map(b => b.y));
  
  // Create new shape
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const newShape = Array.from({ length: height }, () => Array(width).fill(0));
  
  // Fill in the blocks
  component.blocks.forEach(block => {
    newShape[block.y - minY][block.x - minX] = 1;
  });
  
  // Create new piece
  return {
    shape: newShape,
    x: originalPiece.x + minX,
    y: originalPiece.y + minY,
    colorIndex: component.colorIndex,
    rotation: originalPiece.rotation,
    isModified: true // All separated pieces are considered modified
  };
}

// Function to clear completed lines
function clearLines() {
  let clearedLines = [];
  
  // First pass: identify all complete lines
  for (let y = board.length - 1; y >= 0; y--) {
    if (board[y].every(value => value !== 0)) {
      clearedLines.push(y);
    }
  }
  
  if (clearedLines.length === 0) return; // No lines to clear
  
  GameUtils.logGameState('Lines to clear:', clearedLines)
    .logGameState('Board before clearing:', board.map((row, i) => `${i}: [${row.join(',')}]`).join('\n'))
    .logGameState('Placed pieces before clearing:', placedPieces.map(p => `Piece ${p.colorIndex} at (${p.x},${p.y}) rotation:${p.rotation} shape:${JSON.stringify(p.shape)}`));
  
  // Remove complete lines from the board
  // Sort in descending order to remove from bottom to top
  clearedLines.sort((a, b) => b - a);
  clearedLines.forEach(lineY => {
    GameUtils.logGameState('Removing line at Y:', lineY);
    board.splice(lineY, 1);
    board.unshift(Array(10).fill(0)); // Add a new empty row at the top
  });
  
  GameUtils.logGameState('Board after line removal:', board.map((row, i) => `${i}: [${row.join(',')}]`).join('\n'));
  
  // Update placed pieces based on cleared lines
  placedPieces = placedPieces.filter(piece => {
    let pieceAffected = false;
    let newShape = [...piece.shape.map(row => [...row])]; // Deep copy
    
    GameUtils.logGameState(`Processing piece ${piece.colorIndex} at (${piece.x},${piece.y})`);
    
    // Check each cleared line
    clearedLines.forEach(clearedY => {
      // Remove any part of this piece that was on the cleared line
      // Use board coordinates to determine which blocks to remove
      piece.shape.forEach((row, py) => {
        row.forEach((value, px) => {
          if (value) {
            const boardY = piece.y + py;
            const boardX = piece.x + px;
            
            GameUtils.logGameState(`  Block at piece(${px},${py}) -> board(${boardX},${boardY}), cleared line: ${clearedY}`);
            
            // Check if this block is on a cleared line
            if (boardY === clearedY) {
              GameUtils.logGameState(`    Removing block at (${px},${py}) from piece`);
              newShape[py][px] = 0; // Remove this block
              pieceAffected = true;
            }
          }
        });
      });
    });
    
    if (pieceAffected) {
      GameUtils.logGameState(`  Piece affected. New shape:`, newShape);
      
      // Clean up the shape by removing empty rows and ensuring consistency
      const compactedShape = compactPieceShape(newShape);
      GameUtils.logGameState(`  Compacted shape:`, compactedShape);
      
      // If piece still has blocks, check for structural integrity
      if (compactedShape.length > 0 && compactedShape.some(row => row.some(value => value !== 0))) {
        // Find connected components in the modified piece
        const components = findConnectedComponents(compactedShape, piece.colorIndex);
        GameUtils.logGameState(`  Found ${components.length} connected components in modified piece`);
        
        if (components.length === 1) {
          // Single connected piece - just update it
          piece.shape = compactedShape;
          piece.isModified = true;
          GameUtils.logGameState(`  Piece remains structurally intact, marked as modified`);
        } else if (components.length > 1) {
          // Multiple disconnected components - split into separate pieces
          GameUtils.logGameState(`  Piece split into ${components.length} separate components`);
          
          // Create new pieces for each component (except the first one)
          for (let i = 1; i < components.length; i++) {
            const newPiece = createPieceFromComponent(components[i], piece);
            if (newPiece) {
              placedPieces.push(newPiece);
              GameUtils.logGameState(`    Created new piece at (${newPiece.x},${newPiece.y}) with shape:`, newPiece.shape);
            }
          }
          
          // Update the original piece to be the largest component
          const largestComponent = components.reduce((largest, current) => 
            current.blocks.length > largest.blocks.length ? current : largest
          );
          const largestPiece = createPieceFromComponent(largestComponent, piece);
          if (largestPiece) {
            piece.shape = largestPiece.shape;
            piece.x = largestPiece.x;
            piece.y = largestPiece.y;
            piece.isModified = true;
            GameUtils.logGameState(`    Updated original piece to largest component at (${piece.x},${piece.y})`);
          } else {
            GameUtils.logGameState(`    Original piece completely removed`);
            return false;
          }
        } else {
          // No components found - piece is completely gone
          GameUtils.logGameState(`  Piece completely removed`);
          return false;
        }
      } else {
        // Piece is completely gone
        GameUtils.logGameState(`  Piece completely removed`);
        return false;
      }
    }
    
    // Calculate how many cleared lines are above this piece
    // Only pieces that are entirely above cleared lines should move down
    const pieceTop = piece.y;
    const linesAbove = clearedLines.filter(clearedY => clearedY > pieceTop + (piece.shape.length - 1)).length;
    GameUtils.logGameState(`  Piece spans Y: ${pieceTop} to ${pieceTop + piece.shape.length - 1}, lines cleared above piece: ${linesAbove}`);
    piece.y += linesAbove;
    
    return true;
  });
  
  GameUtils.logGameState('Placed pieces after processing:', placedPieces.map(p => `Piece ${p.colorIndex} at (${p.x},${p.y}) rotation:${p.rotation} shape:${JSON.stringify(p.shape)}`));
  
  // Apply gravity to all remaining pieces after line clearing
  applyGravityToPieces();
  
  // Check for additional lines that might be formed after gravity
  // This creates a cascading effect when separated blocks form new complete lines
  const additionalLines = checkForNewCompleteLines();
  if (additionalLines.length > 0) {
    GameUtils.logGameState('Additional lines formed after gravity:', additionalLines);
    // Recursively clear any new lines formed
    clearLines();
  }
  
  // Calculate points based on number of lines cleared simultaneously
  let pointsEarned = 0;
  switch(clearedLines.length) {
    case 1:
      pointsEarned = 10;
      break;
    case 2:
      pointsEarned = 25;
      break;
    case 3:
      pointsEarned = 40;
      break;
    case 4:
      pointsEarned = 60;
      break;
    default:
      pointsEarned = 0;
  }
  
  score += pointsEarned;
  GameUtils.logGameState(`Lines cleared: ${clearedLines.length}, Points earned: ${pointsEarned}, Total score: ${score}`);
  
  // Increase difficulty by decreasing drop interval for each line cleared
  // Decrease by 10ms per line cleared, with a minimum of 100ms
  const speedIncrease = clearedLines.length * speedIncreasePerLine;
  dropInterval = Math.max(100, dropInterval - speedIncrease);
  GameUtils.logGameState(`Speed increased! New drop interval: ${dropInterval}ms (decreased by ${speedIncrease}ms)`)
    .updateUI(); // Update the UI with new score
}

// Function to check if any new complete lines were formed after gravity
function checkForNewCompleteLines() {
  const newCompleteLines = [];
  
  for (let y = board.length - 1; y >= 0; y--) {
    if (board[y].every(value => value !== 0)) {
      newCompleteLines.push(y);
    }
  }
  
  return newCompleteLines;
}

// Function to apply gravity to all placed pieces
function applyGravityToPieces() {
  GameUtils.logGameState('Applying gravity to pieces...');
  let pieceMoved = true;
  let iterations = 0;
  const maxIterations = 50; // Prevent infinite loops
  
  // Keep applying gravity until no pieces can fall further
  while (pieceMoved && iterations < maxIterations) {
    pieceMoved = false;
    iterations++;
    GameUtils.logGameState(`Gravity iteration ${iterations}`);
    
    // Sort pieces by their bottom position (highest y values first)
    // This ensures we process pieces from bottom to top
    placedPieces.sort((a, b) => {
      const aBottom = a.y + a.shape.length - 1;
      const bBottom = b.y + b.shape.length - 1;
      return bBottom - aBottom;
    });
    
    // Clear the board before recalculating positions
    board = Array.from({ length: 20 }, () => Array(10).fill(0));
    
    // Process each piece to see if it can fall
    for (let pieceIndex = 0; pieceIndex < placedPieces.length; pieceIndex++) {
      const piece = placedPieces[pieceIndex];
      let canMoveDown = true;
      
      // Check if this piece can move down by checking collision with bottom and other pieces
      piece.shape.forEach((row, py) => {
        row.forEach((value, px) => {
          if (value) {
            const newY = piece.y + py + 1;
            const newX = piece.x + px;
            
            // Check if it would go out of bounds
            if (newY >= board.length) {
              canMoveDown = false;
              return;
            }
            
            // Check if it would collide with another piece
            const wouldCollide = placedPieces.some((otherPiece, otherIndex) => {
              if (otherIndex === pieceIndex) return false; // Don't check against itself
              
              return otherPiece.shape.some((otherRow, otherPy) => {
                return otherRow.some((otherValue, otherPx) => {
                  return otherValue && 
                         (otherPiece.x + otherPx === newX) && 
                         (otherPiece.y + otherPy === newY);
                });
              });
            });
            
            if (wouldCollide) {
              canMoveDown = false;
            }
          }
        });
      });
      
      // If the piece can move down, move it
      if (canMoveDown) {
        piece.y += 1;
        pieceMoved = true;
        GameUtils.logGameState(`  Piece ${piece.colorIndex} moved down to (${piece.x},${piece.y})`);
      }
    }
    
    // Rebuild the board array after this iteration
    placedPieces.forEach(piece => {
      piece.shape.forEach((row, py) => {
        if (row) { // Check if row exists
          row.forEach((value, px) => {
            if (value) {
              const boardY = piece.y + py;
              const boardX = piece.x + px;
              // Ensure we're within board bounds
              if (boardY >= 0 && boardY < board.length && boardX >= 0 && boardX < board[0].length) {
                board[boardY][boardX] = piece.colorIndex;
              }
            }
          });
        }
      });
    });
  }
  
  if (iterations >= maxIterations) {
    GameUtils.showNotification('Gravity application reached maximum iterations, stopping to prevent infinite loop', 'warning');
  }
  
  GameUtils.logGameState('Gravity application complete after', iterations, 'iterations');
}

// Function to update the game
function update(time = 0) {
  if (paused || !gameStarted) return; // If the game is paused or not started, stop the game loop
  if (time - lastTime > dropInterval) {
    drop();
    lastTime = time;
  }
  drawBoard();
  drawPiece();
  drawDropIndicator(); // Draw the drop indicator
  requestAnimationFrame(update);
}

// Function to reset the game
function resetGame() {
  board = Array.from({ length: 20 }, () => Array(10).fill(0));
  placedPieces = []; // Clear all placed luminaire pieces
  score = 0; // Reset score
  dropInterval = 700; // Reset drop interval to starting speed
  resetPiece();
  lastTime = 0; // Reset lastTime to ensure the drop interval works correctly
  paused = false;
  GameUtils.resetTimer().updateUI();
  
  // Reset start button
  $('#start').prop('disabled', false)
    .html('<i class="fas fa-play"></i> Start Game');
  
  // Only start update loop if game has been started
  if (gameStarted) {
    update();
  }
}

// Start the game - load images first using jQuery patterns
$(document).ready(function() {
  // Initialize the game but don't start it
  loadImages().then(() => {
    resetPiece();
    GameUtils.showNotification('Game ready! Click Start to begin.', 'success');
    // Draw initial state without starting the game loop
    drawBoard();
    drawPiece();
  }).catch((error) => {
    GameUtils.showNotification('Game ready with color fallback! Click Start to begin.', 'warning');
    resetPiece();
    // Draw initial state without starting the game loop
    drawBoard();
    drawPiece();
  });
  
  // Start button functionality
  $('#start').on('click', function() {
    if (!gameStarted) {
      gameStarted = true;
      GameUtils.startTimer();
      update(); // Start the game loop
      $(this).prop('disabled', true)
        .html('<i class="fas fa-check"></i> Started');
      GameUtils.showNotification('Game started! Good luck!', 'success');
    }
  });
  
  // Mobile touch controls - prevent default touch behavior and add click handlers
  $('.control-btn').on('touchstart click', function(e) {
    e.preventDefault();
    
    const buttonId = this.id;
    
    // Handle start button separately
    if (buttonId === 'start') {
      return; // Let the click handler above handle it
    }
    
    // Only allow game controls if game has started
    if (!gameStarted && buttonId !== 'restart') return;
    
    if (paused && buttonId !== 'pause' && buttonId !== 'restart') return; // Only allow pause/restart when paused
    
    switch(buttonId) {
      case 'move-left':
        movePiece(-1);
        break;
      case 'move-right':
        movePiece(1);
        break;
      case 'move-down':
        drop();
        break;
      case 'rotate':
        rotatePiece();
        break;
      case 'drop':
        if (currentPiece) {
          dropToBottom();
        }
        break;
      case 'pause':
        if (gameStarted) {
          paused = !paused;
          if (paused) {
            GameUtils.stopTimer();
          } else {
            // Resume timer
            gameStartTime = Date.now() - gameElapsedTime;
            timerInterval = setInterval(() => GameUtils.updateTimer(), 10);
            update();
          }
          // Update pause button icon
          $(this).find('i').toggleClass('fa-pause fa-play');
        }
        break;
      case 'restart':
        resetGame();
        // Reset pause button icon
        $('#pause').find('i').removeClass('fa-play').addClass('fa-pause');
        break;
    }
  });
  
  // Add visual feedback for button presses
  $('.control-btn').on('touchstart mousedown', function() {
    $(this).addClass('pressed');
  });
  
  $('.control-btn').on('touchend mouseup mouseleave', function() {
    $(this).removeClass('pressed');
  });
});


// jQuery utility functions for the game
const GameUtils = {
  // Log game state with jQuery-style chaining
  logGameState: function(message, data) {
    if (typeof data !== 'undefined') {
      console.log(message, data);
    } else {
      console.log(message);
    }
    return this; // Enable chaining
  },
  
  // Update UI elements with jQuery
  updateUI: function() {
    $('#score').text(`Score: ${score}`);
    return this;
  },
  
  // Show notifications (could be enhanced with jQuery UI)
  showNotification: function(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // Future enhancement: Could show toast notifications with jQuery
    return this;
  },
  
  // Timer functions
  startTimer: function() {
    gameStartTime = Date.now();
    this.updateTimer();
    timerInterval = setInterval(() => this.updateTimer(), 10); // Update every 10ms for hundredths
    this.logGameState('Game timer started');
    return this;
  },
  
  stopTimer: function() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
      this.logGameState('Game timer stopped');
    }
    return this;
  },
  
  resetTimer: function() {
    this.stopTimer();
    gameStarted = false;
    gameStartTime = null;
    gameElapsedTime = 0;
    $('#timer').text('Time: 00:00.00');
    return this;
  },
  
  updateTimer: function() {
    if (gameStartTime && !paused) {
      gameElapsedTime = Date.now() - gameStartTime;
      const totalSeconds = Math.floor(gameElapsedTime / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const hundredths = Math.floor((gameElapsedTime % 1000) / 10);
      
      const timeString = `Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
      $('#timer').text(timeString);
    }
    return this;
  }
};

// Function to show game over message using jQuery
function showGameOver() {
  // Stop the timer when game ends
  GameUtils.stopTimer();
  
  // Calculate final time for display
  const finalMinutes = Math.floor(gameElapsedTime / 60000);
  const finalSeconds = Math.floor((gameElapsedTime % 60000) / 1000);
  const finalHundredths = Math.floor((gameElapsedTime % 1000) / 10);
  const finalTimeString = `${finalMinutes.toString().padStart(2, '0')}:${finalSeconds.toString().padStart(2, '0')}.${finalHundredths.toString().padStart(2, '0')}`;
  
  // You could create a custom modal here instead of alert
  // For now, keeping the alert but could be enhanced with jQuery UI or custom modal
  alert(`Game Over!\nFinal Score: ${score}\nTime: ${finalTimeString}`);
  resetGame();
}
function rotatePieceCounterclockwise() {
  const originalShape = currentPiece.shape;
  currentPiece.shape = currentPiece.shape[0].map((_, index) => currentPiece.shape.map(row => row[originalShape[0].length - 1 - index]));
  if (collide()) {
    currentPiece.shape = originalShape; // Revert if collision
  }
}
// Function to rotate the piece 180 degrees
function rotatePiece180() {
  const originalShape = currentPiece.shape;
  // Rotate the piece 180 degrees by reversing the rows and then reversing each row
  currentPiece.shape = currentPiece.shape.reverse().map(row => row.reverse());
  if (collide()) {
    currentPiece.shape = originalShape; // Revert if collision
  }
}

// Keyboard controls (only allow input if not paused) - using jQuery
$(document).on('keydown', function(event) {
  if (!gameStarted || paused) return; // Ignore input if game hasn't started or is paused

  if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
    movePiece(-1);  // Move left
  } else if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
    movePiece(1);  // Move right
  } else if (event.key === 'ArrowDown' || event.key === 's' || event.key === 'S') {
    drop();  // Move down
  } else if (event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') {
    rotatePiece();  // Rotate piece clockwise
  } else if (event.key === ' ') { // Space bar to drop piece to the bottom
    if (currentPiece) { // Ensure currentPiece is defined
      dropToBottom();
    }
  }
});
