# 🎮 Luminaire Tetris

A modern web-based Tetris game featuring beautiful luminaire-themed pieces, enhanced scoring mechanics, and responsive mobile controls.

## ✨ Features

### 🎯 Enhanced Gameplay
- **Start Button Control**: Game doesn't auto-start - click "Start Game" to begin
- **Real-time Timer**: Precision timer showing minutes, seconds, and hundredths
- **Pause/Resume**: Pause the game anytime, timer stops during pause
- **Drop Indicator**: Semi-transparent preview showing where pieces will land
- **Advanced Line Clearing**: Pieces can split and fall under gravity when partially cleared

### 🎨 Visual Design
- **Luminaire Theme**: Each Tetris piece is represented by beautiful luminaire images
- **Fallback System**: Automatic fallback to colored blocks if images fail to load
- **Responsive UI**: Clean, modern interface that works on desktop and mobile
- **Visual Feedback**: Button press animations and state indicators

### 📱 Mobile Support
- **Touch Controls**: Complete mobile interface with intuitive button layout
- **Movement Controls**: Left, Right, Down, Rotate, and Drop buttons
- **Game Controls**: Start, Pause/Resume, and Restart functionality
- **Responsive Design**: Optimized for various screen sizes

### ⌨️ Keyboard Controls
- **Arrow Keys**: Move (Left/Right/Down) and Rotate (Up)
- **WASD**: Alternative movement controls
- **Special Rotations**: 
  - `3` key: Rotate counterclockwise
  - `4` key: Rotate 180 degrees
- **Spacebar**: Instant drop to bottom

## 🏆 Scoring System

The game features a comprehensive scoring system that rewards different types of play:

### 📊 Point Values
| Action | Points | Description |
|--------|--------|-------------|
| **Piece Placement** | +1 | Awarded for each piece successfully placed |
| **Single Line** | +10 | Clear 1 complete line |
| **Double Lines** | +25 | Clear 2 lines simultaneously |
| **Triple Lines** | +40 | Clear 3 lines simultaneously |
| **Tetris (4 Lines)** | +60 | Clear 4 lines simultaneously |
| **Drop Height Bonus** | +¼ height | Bonus for active dropping (rounded) |

### 🎯 Strategy Tips
- **Multi-line Clears**: Setting up 2, 3, or 4 line clears gives exponentially more points
- **Active Dropping**: Use the drop button or spacebar from height for bonus points
- **Height Bonus**: Drop from 8+ lines to get meaningful height bonuses
- **Speed Bonus**: Game speeds up as you clear lines, increasing the challenge

## 🎲 Game Mechanics

### 🔄 Piece Physics
- **Gravity System**: Pieces fall naturally when lines are cleared
- **Structural Integrity**: Partially cleared pieces can split into separate components
- **Collision Detection**: Accurate collision system for piece placement and rotation
- **Line Detection**: Automatic detection and clearing of complete horizontal lines

### ⚡ Difficulty Progression
- **Speed Increase**: Game speeds up by 20ms per line cleared
- **Minimum Speed**: Speed caps at 100ms intervals for maximum challenge
- **Progressive Difficulty**: Longer games become increasingly challenging

### 🔧 Technical Features
- **jQuery Integration**: Modern jQuery-based UI interactions and animations
- **Image Loading**: Asynchronous loading with graceful fallback handling
- **Performance Optimization**: Canvas-based rendering for smooth gameplay
- **Error Handling**: Robust error handling and user notifications

## 🚀 Getting Started

### Prerequisites
- Modern web browser with HTML5 Canvas support
- Internet connection (for jQuery and Font Awesome CDN)

### Installation
1. Clone or download the project files
2. Ensure the following structure:
   ```
   tetris/
   ├── index.html
   ├── css/
   │   └── style.css
   ├── js/
   │   └── tetris.js
   └── images/
       ├── i-luminaire.png
       ├── o-luminaire.png
       ├── s-luminaire.png
       ├── z-luminaire.png
       ├── l-luminaire.png
       ├── j-luminaire.png
       └── t-luminaire.png
   ```
3. Open `index.html` in a web browser
4. Click "Start Game" to begin playing!

### Controls Summary
- **Desktop**: Arrow keys, WASD, or spacebar
- **Mobile**: Touch the on-screen control buttons
- **Pause**: Click/tap the pause button anytime
- **Restart**: Click/tap restart to reset the game

## 🎨 Customization

### Luminaire Images
Replace the images in the `images/` folder to customize piece appearance:
- `i-luminaire.png` - I piece (4-block line)
- `o-luminaire.png` - O piece (2x2 square)
- `s-luminaire.png` - S piece (S-shaped)
- `z-luminaire.png` - Z piece (Z-shaped)
- `l-luminaire.png` - L piece (L-shaped)
- `j-luminaire.png` - J piece (reverse L)
- `t-luminaire.png` - T piece (T-shaped)

### Scoring Adjustments
Modify the scoring values in `tetris.js`:
- Line clear points in the `clearLines()` function
- Piece placement points in the `merge()` function
- Height bonus calculation in the `dropToBottom()` function

### Speed Settings
Adjust game speed in the global variables:
- `dropInterval`: Starting speed (default: 700ms)
- `speedIncreasePerLine`: Speed increase per line (default: 20ms)

## 🛠️ Technical Stack

- **HTML5**: Canvas-based game rendering
- **CSS3**: Responsive design and animations
- **JavaScript (ES6+)**: Core game logic and mechanics
- **jQuery 3.6.0**: DOM manipulation and event handling
- **Font Awesome 6.0**: Icon system for controls

## 📝 License

This project is open source and available under the MIT License.

## 🎮 Enjoy Playing!

Have fun playing Luminaire Tetris! Try to beat your high score and see how fast you can get the game to run. The combination of strategic line clearing and active piece dropping creates an engaging and rewarding gameplay experience.

---

*Built with ❤️ for classic puzzle game enthusiasts*
