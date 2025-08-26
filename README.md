# 🎮 Luminaire Tetris

A modern web-based Tetris game featuring beautiful luminaire-themed pieces, strategic bonus system, enhanced scoring mechanics, dynamic backgrounds, and responsive mobile controls.

## ✨ Features

### 🎯 Enhanced Gameplay
- **Start Button Control**: Game doesn't auto-start - click "Start Game" to begin
- **Background Cycling**: Pre-game animation cycling through temperature-based backgrounds
- **Real-time Timer**: Precision timer showing minutes, seconds, and hundredths
- **Pause/Resume**: Pause the game anytime, timer stops during pause
- **Drop Indicator**: Semi-transparent preview showing where pieces will land
- **Advanced Line Clearing**: Pieces can split and fall under gravity when partially cleared
- **Wall Kick System**: Intelligent rotation system that adjusts piece position near edges
- **I-Piece Centered Rotation**: Natural rotation anchoring for the I-piece

### 🎁 Strategic Bonus System
- **4 One-Time Bonuses**: Each bonus can only be used once per game
- **Strategic Penalties**: Each bonus costs points, adding risk/reward decisions
- **Keyboard Hotkeys**: Number keys 1-4 activate bonuses instantly
- **Visual Feedback**: Used bonuses are visually disabled and marked

#### Bonus Types
1. **🌡️ SLOW** (Key: 1) - Slows game speed by 400ms | Penalty: -500 points
2. **🧱 CLEAR** (Key: 2) - Removes 2 bottom rows | Penalty: -400 points  
3. **💣 BOMB** (Key: 3) - Circular explosion destroying blocks | Penalty: -300 points
4. **🔄 REPLACE** (Key: 4) - Replaces current piece with I-piece | Penalty: -300 points

### 🎨 Visual Design
- **Luminaire Theme**: Each Tetris piece is represented by beautiful luminaire images
- **Dynamic Backgrounds**: Temperature-themed backgrounds (3000K, 4000K, 5000K)
- **Pre-game Animation**: Background cycling preview before game start
- **Fallback System**: Automatic fallback to colored blocks if images fail to load
- **Responsive UI**: Clean, modern interface that works on desktop and mobile
- **Visual Feedback**: Button press animations and state indicators

### 📱 Mobile Support
- **Touch Controls**: Complete mobile interface with intuitive button layout
- **Movement Controls**: Left, Right, Down, Rotate, and Drop buttons
- **Game Controls**: Start, Pause/Resume, and Restart functionality
- **Bonus Buttons**: Touch-friendly bonus activation
- **Responsive Design**: Optimized for various screen sizes

### ⌨️ Keyboard Controls
- **Arrow Keys**: Move (Left/Right/Down) and Rotate (Up)
- **WASD**: Alternative movement controls
- **Spacebar**: Instant drop to bottom
- **Bonus Hotkeys**: 
  - `1` key: Activate SLOW bonus
  - `2` key: Activate CLEAR bonus  
  - `3` key: Activate BOMB bonus
  - `4` key: Activate REPLACE bonus

## 🏆 Scoring System

The game features a comprehensive scoring system that rewards different types of play:

### 📊 Point Values
| Action | Points | Description |
|--------|--------|-------------|
| **Piece Placement** | +10 | Awarded for each piece successfully placed |
| **Single Line** | +100 | Clear 1 complete line |
| **Double Lines** | +250 | Clear 2 lines simultaneously |
| **Triple Lines** | +400 | Clear 3 lines simultaneously |
| **Tetris (4 Lines)** | +600 | Clear 4 lines simultaneously |
| **Drop Height Bonus** | +¼ height × 10 | Bonus for active dropping (rounded) |

### � Bonus System Penalties
| Bonus | Penalty | Effect |
|-------|---------|---------|
| **SLOW** | -500 points | Reduces game speed by 400ms |
| **CLEAR** | -400 points | Removes 2 bottom rows |
| **BOMB** | -300 points | Circular explosion (2-block radius) |
| **REPLACE** | -300 points | Changes current piece to I-piece |

### �🎯 Strategy Tips
- **Multi-line Clears**: Setting up 2, 3, or 4 line clears gives exponentially more points
- **Active Dropping**: Use the drop button or spacebar from height for bonus points
- **Height Bonus**: Drop from 8+ lines to get meaningful height bonuses
- **Bonus Timing**: Use bonuses strategically - they're one-time only with significant penalties
- **Speed Bonus**: Game speeds up as you clear lines, increasing the challenge

## 🎲 Game Mechanics

### 🔄 Piece Physics
- **Wall Kick System**: Smart rotation that auto-adjusts position when rotating near edges
- **I-Piece Centering**: I-pieces rotate around a natural center point for intuitive movement
- **Gravity System**: Pieces fall naturally when lines are cleared
- **Structural Integrity**: Partially cleared pieces can split into separate components
- **Collision Detection**: Accurate collision system for piece placement and rotation
- **Line Detection**: Automatic detection and clearing of complete horizontal lines

### 🎁 Bonus Mechanics
- **One-Time Usage**: Each bonus can only be activated once per game
- **Penalty System**: Strategic point deductions for using bonuses
- **Immediate Effect**: Bonuses activate instantly when triggered
- **Visual Feedback**: Used bonuses are disabled and visually marked
- **Keyboard Integration**: Number keys 1-4 provide instant bonus activation

### ⚡ Difficulty Progression
- **Speed Increase**: Game speeds up by 20ms per line cleared
- **Minimum Speed**: Speed caps at 100ms intervals for maximum challenge
- **Progressive Difficulty**: Longer games become increasingly challenging

### 🌈 Background System
- **Temperature Themes**: Three background variations (3000K, 4000K, 5000K color temperatures)
- **Pre-game Cycling**: Animated preview of all backgrounds before game start
- **Automatic Loading**: All backgrounds preload for smooth transitions

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
       ├── t-luminaire.png
       ├── thermometer-cold.png
       ├── broken-wall.png
       ├── unlit-bomb.png
       ├── i-brick.png
       ├── lantern-overlay-off-small-3000.webp
       ├── lantern-overlay-off-small-4000.webp
       └── lantern-overlay-off-small-5000.webp
   ```
3. Open `index.html` in a web browser
4. Watch the background cycling animation
5. Click "Start Game" to begin playing!

### Controls Summary
- **Desktop**: Arrow keys, WASD, spacebar, or number keys 1-4 for bonuses
- **Mobile**: Touch the on-screen control buttons and bonus buttons
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

### Bonus Button Images
Customize bonus button icons:
- `thermometer-cold.png` - SLOW bonus icon
- `broken-wall.png` - CLEAR bonus icon
- `unlit-bomb.png` - BOMB bonus icon
- `i-brick.png` - REPLACE bonus icon

### Background Images
Temperature-themed backgrounds for different game levels:
- `lantern-overlay-off-small-3000.webp` - 3000K color temperature
- `lantern-overlay-off-small-4000.webp` - 4000K color temperature
- `lantern-overlay-off-small-5000.webp` - 5000K color temperature

### Scoring Adjustments
Modify the scoring values in `tetris.js`:
- Line clear points in the `clearLines()` function
- Piece placement points in the `merge()` function
- Height bonus calculation in the `dropToBottom()` function

### Bonus Configuration
Customize bonus behavior in the `bonusConfig` object:
- `slowAmount`: Milliseconds to slow the game (default: 400ms)
- `clearRows`: Number of bottom rows to clear (default: 2)
- `bombRadius`: Explosion radius in blocks (default: 2)
- `bombHeight`: Explosion height in rows (default: 3)
- `penalties`: Point penalties for each bonus (adjustable per bonus)

### Speed Settings
Adjust game speed in the global variables:
- `dropInterval`: Starting speed (default: 700ms)
- `speedIncreasePerLine`: Speed increase per line (default: 20ms)

## 🛠️ Technical Stack

- **HTML5**: Canvas-based game rendering
- **CSS3**: Responsive design and animations
- **JavaScript (ES6+)**: Core game logic and mechanics
- **jQuery 3.6.0**: DOM manipulation and event handling
- **UIKit 3.17.11**: Responsive grid system and components
- **Font Awesome 6.0**: Icon system for controls

## 🎮 Advanced Features

### Strategic Gameplay
- **Risk/Reward System**: Bonus penalties create meaningful strategic decisions
- **One-Shot Bonuses**: Each bonus can only be used once per game
- **Combo Potential**: Bomb and Clear bonuses can create cascading line clears
- **Emergency Tools**: SLOW and REPLACE bonuses help in critical situations

### Technical Excellence
- **Wall Kick Rotation**: Advanced rotation system with multiple fallback positions
- **Piece Splitting**: Complex algorithm handles piece fragmentation during line clears
- **Gravity Physics**: Realistic gravity application after structural changes
- **Performance Optimized**: Efficient canvas rendering and image preloading

### User Experience
- **Instant Feedback**: Immediate visual and audio feedback for all actions
- **Progressive Disclosure**: Game complexity increases naturally
- **Accessibility**: Multiple input methods (keyboard, touch, mouse)
- **Error Recovery**: Graceful handling of image loading failures

## 📝 License

This project is open source and available under the MIT License.

## 🎮 Enjoy Playing!

Have fun playing Luminaire Tetris! Master the bonus system, discover optimal strategies, and see how high you can score. The combination of strategic bonus usage, advanced rotation mechanics, and dynamic backgrounds creates an engaging and challenging puzzle experience.

Challenge yourself to:
- 🎯 Clear a Tetris (4 lines) without using any bonuses
- 💣 Use the BOMB bonus to create a chain reaction of line clears  
- 🔄 Master the wall kick system for tight rotation scenarios
- 🌡️ Achieve a high score while strategically using the SLOW bonus

---

*Built with ❤️ for classic puzzle game enthusiasts who love strategic depth*
