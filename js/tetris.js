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

// Bonus button configuration and state
const bonusConfig = {
  slowAmount: 400, // Amount to slow down the game (in milliseconds) - easy to change
  clearRows: 2,   // Number of rows to clear from bottom (half of 20) - easy to change
  bombRadius: 2,  // Radius of bomb explosion (4 blocks diameter = 2 radius) - easy to change
  bombHeight: 3,  // Height of bomb explosion area - easy to change
  // Penalty points for using each bonus - easy to change
  penalties: {
    'bonus-1': -500, // Slow button penalty
    'bonus-2': -400, // Clear button penalty
    'bonus-3': -300, // Bomb button penalty
    'bonus-4': -300, // Replace button penalty
  },
  bonusUsed: {
    'bonus-1': false, // Slow button
    'bonus-2': false, // Clear button
    'bonus-3': false, // Bomb button
    'bonus-4': false, // Replace button (future)
    'bonus-5': false  // Star button (future)
  }
};

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

const bgTemps = {
  1: 'images/lantern-overlay-off-small-5000.webp',
  2: 'images/lantern-overlay-off-small-4000.webp',
  3: 'images/lantern-overlay-off-small-3000.webp'
}

// Background temperature images for different levels
const bgTempImages = {};

// Store piece image data for each placed piece
let placedPieces = [];
let imagesLoaded = false;

// Load all luminaire images and background temperature images
function loadImages() {
  // Load luminaire images
  const luminairePromises = Object.entries(luminaireImageUrls).map(([key, url]) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        luminaireImages[key] = img;
        resolve();
      };
      img.onerror = (error) => {
        GameUtils.showNotification(`Failed to load luminaire image ${url}, will use color fallback`, 'warning');
        resolve(); // Continue even if image fails to load
      };
      img.src = url;
    });
  });

  // Load background temperature images
  const bgTempPromises = Object.entries(bgTemps).map(([key, url]) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        bgTempImages[key] = img;
        resolve();
      };
      img.onerror = (error) => {
        GameUtils.showNotification(`Failed to load background image ${url}, will use fallback`, 'warning');
        resolve(); // Continue even if image fails to load
      };
      img.src = url;
    });
  });

  // Wait for both luminaire and background images to load
  return Promise.all([...luminairePromises, ...bgTempPromises]).then(() => {
    imagesLoaded = true;
    GameUtils.showNotification('All images loaded successfully', 'success');
  }).catch((error) => {
    GameUtils.showNotification('Some images failed to load, using fallbacks', 'warning');
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
  context.fillStyle = 'rgba(194, 202, 236, 0.25)'; // Semi-transparent white
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
  $('#score-value').text(`${score}`);
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
  score += 10;
  GameUtils.logGameState('Piece placed! +10 point. Score:', score);
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
  const originalX = currentPiece.x;
  
  // Check if this is an I-piece (colorIndex 1, which is a 4x1 or 1x4 piece)
  const isIPiece = currentPiece.colorIndex === 1;
  
  // Perform the rotation
  currentPiece.shape = currentPiece.shape[0].map((_, index) => currentPiece.shape.map(row => row[index]).reverse());
  
  // Special handling for I-piece rotation anchor point
  if (isIPiece) {
    // Determine if we're rotating from horizontal to vertical or vice versa
    const wasHorizontal = originalShape.length === 1; // 1 row, multiple columns
    const nowVertical = currentPiece.shape.length > currentPiece.shape[0].length;
    
    if (wasHorizontal && nowVertical) {
      // Rotating from horizontal (4x1) to vertical (1x4)
      // Adjust position to keep piece centered around the same point
      currentPiece.x += 1; // Move right 1 to center the rotation
    } else if (!wasHorizontal && !nowVertical) {
      // Rotating from vertical (1x4) to horizontal (4x1)  
      // Adjust position to keep piece centered around the same point
      currentPiece.x -= 1; // Move left 1 to center the rotation
    }
  }
  
  // Check if rotation is valid at current position
  if (!collide() && !isOutOfBounds()) {
    return; // Rotation successful, no additional adjustment needed
  }
  
  // Try wall kicks - attempt to move left/right to make rotation work
  const wallKickOffsets = [-1, 1, -2, 2]; // Try moving left 1, right 1, left 2, right 2
  
  for (const offset of wallKickOffsets) {
    currentPiece.x = originalX + offset + (isIPiece ? getIPieceAdjustment(originalShape, currentPiece.shape) : 0);
    
    // Check if this position works (no collision and within bounds)
    if (!collide() && !isOutOfBounds()) {
      GameUtils.logGameState(`Wall kick successful: moved ${offset > 0 ? 'right' : 'left'} ${Math.abs(offset)} position(s)${isIPiece ? ' with I-piece centering' : ''}`);
      return; // Successful wall kick
    }
  }
  
  // If no wall kick worked, revert everything
  currentPiece.shape = originalShape;
  currentPiece.x = originalX;
  GameUtils.logGameState('Rotation failed: no valid wall kick position found');
}

// Helper function to get I-piece adjustment for wall kicks
function getIPieceAdjustment(originalShape, newShape) {
  const wasHorizontal = originalShape.length === 1;
  const nowVertical = newShape.length > newShape[0].length;
  
  if (wasHorizontal && nowVertical) {
    return 1; // Moving from horizontal to vertical, shift right
  } else if (!wasHorizontal && !nowVertical) {
    return -1; // Moving from vertical to horizontal, shift left  
  }
  return 0; // No adjustment needed
}

// Helper function to check if piece is out of bounds
function isOutOfBounds() {
  return currentPiece.shape.some((row, y) => {
    return row.some((value, x) => {
      if (value) {
        const newX = currentPiece.x + x;
        const newY = currentPiece.y + y;
        // Check if any part of the piece is outside the board boundaries
        return newX < 0 || newX >= 10 || newY < 0 || newY >= 20;
      }
      return false;
    });
  });
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
  const heightBonus = (Math.round(dropHeight / 4) * 10);
  
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
      pointsEarned = 100;
      break;
    case 2:
      pointsEarned = 250;
      break;
    case 3:
      pointsEarned = 400;
      break;
    case 4:
      pointsEarned = 600;
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
  
  // Reset bonus buttons
  resetBonusButtons();
  
  GameUtils.resetTimer().updateUI();
  
  // Reset start button
  $('#start').prop('disabled', false).html('<i class="fas fa-play"></i>');
  
  // Only start update loop if game has been started
  if (gameStarted) {
    update();
  }
}

// Function to reset bonus buttons for a new game
function resetBonusButtons() {
  // Reset bonus usage tracking
  Object.keys(bonusConfig.bonusUsed).forEach(buttonId => {
    bonusConfig.bonusUsed[buttonId] = false;
  });
  
  // Re-enable all bonus buttons
  $('.bonus-btn').prop('disabled', false).removeClass('used');
  
  GameUtils.logGameState('Bonus buttons reset for new game');
}

// Function to handle bonus button actions
function activateBonus(buttonId) {
  // Check if bonus has already been used
  if (bonusConfig.bonusUsed[buttonId]) {
    GameUtils.logGameState(`Bonus ${buttonId} already used this game`);
    return;
  }
  
  // Special check for replace bonus - need an active piece
  if (buttonId === 'bonus-4' && !currentPiece) {
    GameUtils.showNotification('No piece to replace! Wait for a piece to be falling.', 'warning');
    return;
  }
  
  // Mark bonus as used
  bonusConfig.bonusUsed[buttonId] = true;
  
  // Apply penalty for using the bonus
  applyBonusPenalty(buttonId);
  
  // Disable the button and mark it as used
  $(`#${buttonId}`).prop('disabled', true).addClass('used');
  
  switch(buttonId) {
    case 'bonus-1': // SLOW button
      activateSlowBonus();
      break;
    case 'bonus-2': // CLEAR button
      activateClearBonus();
      break;
    case 'bonus-3': // BOMB button
      activateBombBonus();
      break;
    case 'bonus-4': // REPLACE button
      activateReplaceBonus();
      break;
    case 'bonus-5': // Future: STAR button
      GameUtils.showNotification('Star bonus - Coming soon!', 'info');
      break;
    default:
      GameUtils.logGameState(`Unknown bonus button: ${buttonId}`);
  }
}

// Function to activate the slow bonus
function activateSlowBonus() {
  const oldInterval = dropInterval;
  dropInterval += bonusConfig.slowAmount;
  
  GameUtils.logGameState(`SLOW bonus activated! Drop interval increased from ${oldInterval}ms to ${dropInterval}ms`)
    .showNotification(`Game slowed down! Drop speed decreased by ${bonusConfig.slowAmount}ms`, 'success');
}

// Function to activate the clear bonus
function activateClearBonus() {
  const rowsToClear = bonusConfig.clearRows;
  
  GameUtils.logGameState(`CLEAR bonus activated! Removing ${rowsToClear} rows from bottom`);
  
  // Remove the specified number of rows from the bottom of the board
  for (let i = 0; i < rowsToClear; i++) {
    board.pop(); // Remove bottom row
  }
  
  // Add empty rows at the top to maintain board size
  for (let i = 0; i < rowsToClear; i++) {
    board.unshift(Array(10).fill(0)); // Add empty row at top
  }
  
  GameUtils.logGameState('Board after clearing bottom rows:', board.map((row, i) => `${i}: [${row.join(',')}]`).join('\n'));
  
  // Update placed pieces - remove any pieces that were in the cleared area
  placedPieces = placedPieces.filter(piece => {
    const pieceBottom = piece.y + piece.shape.length - 1;
    const clearedAreaStart = 20 - rowsToClear; // Y coordinate where clearing started
    
    // If the piece's bottom is in the cleared area, remove it completely
    if (pieceBottom >= clearedAreaStart) {
      GameUtils.logGameState(`Removing piece ${piece.colorIndex} at (${piece.x},${piece.y}) - was in cleared area`);
      return false;
    }
    
    // If piece extends into cleared area, trim it
    let pieceAffected = false;
    let newShape = [...piece.shape.map(row => [...row])]; // Deep copy
    
    piece.shape.forEach((row, py) => {
      const blockY = piece.y + py;
      if (blockY >= clearedAreaStart) {
        // This row of the piece was in the cleared area
        newShape[py] = newShape[py].map(() => 0); // Clear this row
        pieceAffected = true;
      }
    });
    
    if (pieceAffected) {
      // Compact the shape by removing empty rows from bottom
      while (newShape.length > 0 && newShape[newShape.length - 1].every(value => value === 0)) {
        newShape.pop();
      }
      
      // If piece still has blocks, update it
      if (newShape.length > 0 && newShape.some(row => row.some(value => value !== 0))) {
        piece.shape = newShape;
        piece.isModified = true;
        GameUtils.logGameState(`Trimmed piece ${piece.colorIndex} at (${piece.x},${piece.y}) - removed bottom section`);
      } else {
        GameUtils.logGameState(`Removing piece ${piece.colorIndex} at (${piece.x},${piece.y}) - completely trimmed`);
        return false;
      }
    }
    
    return true;
  });
  
  GameUtils.logGameState('Placed pieces after clearing:', placedPieces.map(p => `Piece ${p.colorIndex} at (${p.x},${p.y})`));
  
  // Apply gravity to all remaining pieces
  applyGravityToPieces();
  
  GameUtils.showNotification(`Cleared ${rowsToClear} bottom rows! All pieces above fell down.`, 'success');
}

// Function to activate the bomb bonus
function activateBombBonus() {
  const radius = bonusConfig.bombRadius;
  const height = bonusConfig.bombHeight;
  
  // Find all occupied positions on the board
  const occupiedPositions = [];
  board.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        occupiedPositions.push({ x, y });
      }
    });
  });
  
  if (occupiedPositions.length === 0) {
    GameUtils.showNotification('No blocks to bomb!', 'warning');
    return;
  }
  
  // Choose a random occupied position as bomb center
  const randomIndex = Math.floor(Math.random() * occupiedPositions.length);
  const bombCenter = occupiedPositions[randomIndex];
  
  GameUtils.logGameState(`BOMB bonus activated! Explosion center at (${bombCenter.x}, ${bombCenter.y})`);
  
  // Define the circular explosion pattern
  const explosionBlocks = [];
  
  // Create a circular pattern with the specified radius and height
  for (let dy = 0; dy < height; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        // Check if the point is within the circular radius
        const distance = Math.sqrt(dx * dx + dz * dz);
        if (distance <= radius) {
          const explosionX = bombCenter.x + dx;
          const explosionY = bombCenter.y + dy;
          
          // Ensure coordinates are within board bounds
          if (explosionX >= 0 && explosionX < 10 && explosionY >= 0 && explosionY < 20) {
            explosionBlocks.push({ x: explosionX, y: explosionY });
          }
        }
      }
    }
  }
  
  GameUtils.logGameState('Explosion will affect blocks at:', explosionBlocks);
  
  // Clear blocks in explosion area from the board
  explosionBlocks.forEach(pos => {
    board[pos.y][pos.x] = 0;
  });
  
  // Update placed pieces - remove blocks that are in the explosion area
  placedPieces = placedPieces.filter(piece => {
    let pieceAffected = false;
    let newShape = [...piece.shape.map(row => [...row])]; // Deep copy
    
    // Check each block of the piece
    piece.shape.forEach((row, py) => {
      row.forEach((value, px) => {
        if (value) {
          const blockX = piece.x + px;
          const blockY = piece.y + py;
          
          // Check if this block is in the explosion area
          const isInExplosion = explosionBlocks.some(explosion => 
            explosion.x === blockX && explosion.y === blockY
          );
          
          if (isInExplosion) {
            newShape[py][px] = 0; // Remove this block
            pieceAffected = true;
            GameUtils.logGameState(`  Removing block at (${blockX},${blockY}) from piece ${piece.colorIndex}`);
          }
        }
      });
    });
    
    if (pieceAffected) {
      // Clean up the shape by removing empty rows
      const compactedShape = compactPieceShape(newShape);
      
      // If piece still has blocks, check for structural integrity
      if (compactedShape.length > 0 && compactedShape.some(row => row.some(value => value !== 0))) {
        // Find connected components in the modified piece
        const components = findConnectedComponents(compactedShape, piece.colorIndex);
        GameUtils.logGameState(`  Found ${components.length} connected components in bombed piece`);
        
        if (components.length === 1) {
          // Single connected piece - just update it
          piece.shape = compactedShape;
          piece.isModified = true;
          GameUtils.logGameState(`  Piece remains intact after bomb, marked as modified`);
        } else if (components.length > 1) {
          // Multiple disconnected components - split into separate pieces
          GameUtils.logGameState(`  Piece split into ${components.length} separate components by bomb`);
          
          // Create new pieces for each component (except the first one)
          for (let i = 1; i < components.length; i++) {
            const newPiece = createPieceFromComponent(components[i], piece);
            if (newPiece) {
              placedPieces.push(newPiece);
              GameUtils.logGameState(`    Created new piece fragment at (${newPiece.x},${newPiece.y})`);
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
            GameUtils.logGameState(`    Updated original piece to largest fragment`);
          } else {
            GameUtils.logGameState(`    Original piece completely destroyed by bomb`);
            return false;
          }
        } else {
          // No components found - piece is completely gone
          GameUtils.logGameState(`  Piece completely destroyed by bomb`);
          return false;
        }
      } else {
        // Piece is completely gone
        GameUtils.logGameState(`  Piece completely destroyed by bomb`);
        return false;
      }
    }
    
    return true;
  });
  
  GameUtils.logGameState('Placed pieces after bomb explosion:', placedPieces.map(p => `Piece ${p.colorIndex} at (${p.x},${p.y})`));
  
  // Apply gravity to all remaining pieces
  applyGravityToPieces();
  
  const blocksDestroyed = explosionBlocks.length;
  GameUtils.showNotification(`BOOM! Destroyed ${blocksDestroyed} blocks in circular explosion!`, 'success');
}

// Function to activate the replace bonus
function activateReplaceBonus() {
  if (!currentPiece) {
    GameUtils.showNotification('No piece to replace!', 'warning');
    return;
  }
  
  // Store the current position
  const currentX = currentPiece.x;
  const currentY = currentPiece.y;
  
  GameUtils.logGameState(`REPLACE bonus activated! Replacing current piece (type ${currentPiece.colorIndex}) with I-piece`);
  
  // Replace with I-piece (index 0 in pieces array, colorIndex 1)
  const iPieceShape = pieces[0]; // I-piece is at index 0
  
  // Create new I-piece at current position
  const newPiece = {
    shape: iPieceShape.map(row => [...row]), // Deep copy of I-piece shape
    x: currentX,
    y: currentY,
    colorIndex: 1 // I-piece color index
  };
  
  // Check if the new I-piece fits at the current position
  const originalCurrentPiece = currentPiece;
  currentPiece = newPiece;
  
  // If it collides or is out of bounds, try to adjust position
  if (collide() || isOutOfBounds()) {
    // Try to center the I-piece horizontally
    currentPiece.x = Math.max(0, Math.min(6, currentX - 1)); // Center I-piece (4 blocks wide)
    
    // If still colliding, try moving up
    if (collide() || isOutOfBounds()) {
      currentPiece.y = Math.max(0, currentY - 1);
      
      // If still problematic, place at top center as fallback
      if (collide() || isOutOfBounds()) {
        currentPiece.x = 3; // Center position
        currentPiece.y = 0; // Top of board
        
        // Final check - if this position is also invalid, revert
        if (collide()) {
          currentPiece = originalCurrentPiece;
          GameUtils.showNotification('Cannot replace piece - no room for I-piece!', 'warning');
          return;
        }
      }
    }
  }
  
  GameUtils.logGameState(`Successfully replaced piece! New I-piece at (${currentPiece.x}, ${currentPiece.y})`);
  GameUtils.showNotification('Piece replaced with I-piece!', 'success');
}

// Function to apply penalty for using a bonus
function applyBonusPenalty(buttonId) {
  const penalty = bonusConfig.penalties[buttonId];
  
  if (penalty !== undefined) {
    const oldScore = score;
    score = Math.max(0, score + penalty); // Ensure score doesn't go below 0
    
    GameUtils.logGameState(`Bonus penalty applied! Score changed from ${oldScore} to ${score} (penalty: ${penalty})`)
      .showNotification(`Bonus used! Score penalty: ${Math.abs(penalty)} points`, 'warning')
      .updateUI(); // Update the score display
  }
}




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
    $('#score-value').text(`${score}`);
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
    $('#time-value').text('00:00.00');
    return this;
  },
  
  updateTimer: function() {
    if (gameStartTime && !paused) {
      gameElapsedTime = Date.now() - gameStartTime;
      const totalSeconds = Math.floor(gameElapsedTime / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const hundredths = Math.floor((gameElapsedTime % 1000) / 10);
      
      const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
      $('#time-value').text(timeString);
    }
    return this;
  }
};

// Global functions for modal interactions
async function getName() {
  return new Promise((resolve) => {
    console.log('getName called');
    $('#form-get-name').off('submit').on('submit', function(e) {
      e.preventDefault();
      let firstname = $('#form_firstname').val();
      let lastname = $('#form_lastname').val();
      let branch = $('#form_branch').val();
      let email = $('#player_email').val();
      if (firstname && lastname && branch && email) {        
        console.log('Name entered:', firstname, lastname, branch, email);
        UIkit.modal('#enter-name-modal').hide();
        $('#overlay').show();        
        resolve(`${firstname}|${lastname}|${branch}|${email}`);
        //resolve(firstname);
      }
    });     
    setTimeout(function() {
      console.log('Showing name modal');
      UIkit.modal('#enter-name-modal', { bgClose: false, escClose: false, stack : true }).show();
      $('#form_name').val("").focus();
    }, 1000);
  });
}

async function getEmail() {
  return new Promise((resolve) => {
    $('#form-get-email').off('submit').on('submit', function(e) {
      e.preventDefault();
      let email = $('#form_email').val();


      if (email) {        

        // has email already been used?
        $.ajax({
          url: 'https://sst.tamlite.co.uk/api/darts_check_email',
          type: 'POST',
          data: { email: email },
          success: function(data) {
            data = JSON.parse(data);
            console.log(data);
            if (data.success == '1') {                
              // this email is already in the db but allow it anyway
              $('#player_email').val(email);
              UIkit.modal('#enter-email-modal').hide();
              $('#overlay').hide();              
              resolve(email);
            } else {
              // save the email
              $('#player_email').val(email);
              UIkit.modal('#enter-email-modal').hide();
              $('#overlay').hide();              
              resolve(email);
            }
          }
        });

      }
    });     
    UIkit.modal('#enter-email-modal', { stack : true }).show();
    $('#email_error').empty();
    $('#form_email').val("").focus();
  });
}

// Function to show game over message using jQuery
async function showGameOver() {
  // Stop the timer when game ends
  GameUtils.stopTimer();
  gameStarted = false; // Set gameStarted to false to stop the game loop

  // Calculate final time for display
  const finalMinutes = Math.floor(gameElapsedTime / 60000);
  const finalSeconds = Math.floor((gameElapsedTime % 60000) / 1000);
  const finalHundredths = Math.floor((gameElapsedTime % 1000) / 10);
  const finalTimeString = `${finalMinutes.toString().padStart(2, '0')}:${finalSeconds.toString().padStart(2, '0')}.${finalHundredths.toString().padStart(2, '0')}`;


  var game_mode = $('#game_mode').val();
  if (game_mode == 'compete') {

    name = await getName();
    while (!name) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // save the score
    saveScore(score, name, gameElapsedTime);
    // get the scores
    setTimeout(function () {
      getScores(); // Refresh the scores
    }, 1000);

  }
  resetGame();

}

  function renderScores(scores) {        
    if (scores) {
      $('#scoreboard-body').empty();
      scores.forEach(function(score) {        
        gameElapsedTime = score.time; // Use the time from the score
        const finalMinutes = Math.floor(gameElapsedTime / 60000);
        const finalSeconds = Math.floor((gameElapsedTime % 60000) / 1000);
        const finalHundredths = Math.floor((gameElapsedTime % 1000) / 10);
        const finalTimeString = `${finalMinutes.toString().padStart(2, '0')}:${finalSeconds.toString().padStart(2, '0')}.${finalHundredths.toString().padStart(2, '0')}`;
        const fullName = (score.firstname + ' ' + score.lastname).substring(0, 20);
        
        $('#scoreboard-body').append('<tr><td>' + fullName + '</td><td>' + score.score + '</td><td>' + finalTimeString + '</td></tr>');
      });
    }     
  }


  function getScores() {
    // save the score to the database
    $.ajax({
      url: 'https://sst.tamlite.co.uk/api/darts_get_scores',
      type: 'POST',
      data: { },
      success: function(data) {        
        scores = JSON.parse(data);
        renderScores(scores.scores);        
      }
    });
  }


  function saveScore(score, name, time) {
    // save the score and elapsed time to the database
    $.ajax({
      url: 'https://sst.tamlite.co.uk/api/darts_save_score',
      type: 'POST',
      data: { score: score, name: name, time: time },
      success: function(data) {
        console.log(data);
      }
    });
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
  } else if (event.key >= '1' && event.key <= '4') {
    // Number keys 1-4 for bonus buttons
    const bonusNumber = parseInt(event.key);
    const buttonId = `bonus-${bonusNumber}`;
    
    // Check if the bonus button is available (not used and not disabled)
    const $bonusButton = $(`#${buttonId}`);
    if (!$bonusButton.prop('disabled') && !bonusConfig.bonusUsed[buttonId]) {
      activateBonus(buttonId);
    } else {
      GameUtils.showNotification(`Bonus ${bonusNumber} is not available!`, 'warning');
    }
  }
});


function setBGTemp(level) {
  if (level) {
    // make sure leevel is a string
    //level = level.toString();
    const bgImage = bgTempImages[level];
    if (bgImage) {
      console.log('Setting background image to', bgImage.src);
      $('.game-wrapper').css('background-image', `url(${bgImage.src})`);
    } 
  }
}

// Function to cycle through background temperatures before game start
async function cycleBGTemps() {
  const cycleDelay = 100; // 1/10 second (100ms) delay between changes
  const sequence = [1, 2, 3, 3, 2, 1, 1, 2, 3, 3, 2, 1, 2, 3, 3, 2, 1, 1]; // Cycle from 3->1 then 1->3
  
  GameUtils.showNotification('Initializing background themes...', 'info');
  
  for (let i = 0; i < sequence.length; i++) {
    setBGTemp(sequence[i]);
    await new Promise(resolve => setTimeout(resolve, cycleDelay));
  }
  
  // Set final background to level 1 for game start
  setBGTemp(1);
  GameUtils.showNotification('Background initialization complete!', 'success');
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
    getScores();
  }).catch((error) => {
    GameUtils.showNotification('Game ready with color fallback! Click Start to begin.', 'warning');
    resetPiece();
    // Draw initial state without starting the game loop
    drawBoard();
    drawPiece();
  });
  
  $('#cancelemail').on('click', function() {
    UIkit.modal('#enter-email-modal').hide();
    //$('#overlay').hide();
  });

  $('#play-now').on('click', async function() {
      const test_mode = false;
     
      email = $('#player_email').val();

      if (!email) {
        email = await getEmail();
        while (!email) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } else {
        $('#overlay').hide(); // Hide overlay if email is already set        
      }

      // Cycle through background colors before starting the game
      await cycleBGTemps();

      // Start the game
      gameStarted = true;
      GameUtils.startTimer();
      update(); // Start the game loop
  });

  
  // Mobile touch controls - prevent default touch behavior and add click handlers
  $('.control-btn').on('touchstart click', async function(e) {
    e.preventDefault();    
    const buttonId = this.id;    
    
    if (paused && buttonId !== 'pause' && buttonId !== 'restart') return; // Only allow pause/restart when paused

    console.log('Button clicked:', buttonId);
    
    switch(buttonId) {
      case 'start':
        if (!gameStarted) {
         

          gameStarted = true;
          GameUtils.startTimer();
          update(); // Start the game loop
          $(this).prop('disabled', false).html('<i class="fas fa-pause"></i>').attr('id', 'pause');

          GameUtils.showNotification('Game started! Good luck!', 'success');
        }
        break;        
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

  // Bonus button click handlers
  $('.bonus-btn').on('click', function(e) {
    e.preventDefault();
    
    if (!gameStarted || paused) {
      GameUtils.showNotification('Start the game first to use bonus buttons!', 'warning');
      return;
    }
    
    const buttonId = this.id;
    activateBonus(buttonId);
  });
  
  // Add visual feedback for button presses
  $('.control-btn').on('touchstart mousedown', function() {
    $(this).addClass('pressed');
  });
  
  $('.control-btn').on('touchend mouseup mouseleave', function() {
    $(this).removeClass('pressed');
  });



});  // end docready

