# Quick Draw Clone

This is a clone of Google's Quick Draw game, where you draw an object and the game tries to guess what you're drawing.

## How to Play

1. Open `index.html` in your web browser
2. You'll be given a prompt to draw (e.g., "Draw: cat")
3. Use your mouse or touch screen to draw the object within 20 seconds
4. When the timer ends, the game will evaluate your drawing
5. If your drawing is correctly identified, you'll earn points and move to the next prompt
6. If not, the game will end and show your final score
7. Try to get the highest score possible!

## Features

- Drawing recognition at the end of each round
- 20-second timer for each drawing
- Score tracking
- Responsive design that works on desktop and mobile devices
- Clear canvas button to start over

## Technical Details

This application uses:
- HTML5 Canvas for drawing
- JavaScript for game logic and drawing recognition simulation
- CSS for styling and responsive design

## Implementation Note

This version uses a simulation approach for drawing recognition instead of machine learning. The game will evaluate your drawing when the timer ends, with a bias toward the current prompt.

## Troubleshooting

If you encounter any issues:
- Make sure you're using a modern browser like Chrome, Firefox, or Edge
- Check your browser console for any error messages
- Try clearing your browser cache and reloading the page

## Credits

- Inspired by Google's Quick Draw game
- Original Quick Draw: https://quickdraw.withgoogle.com/ 