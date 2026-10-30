---
name: play-tic-tac-toe
description: Play tic-tac-toe with the person against SAGA Tic Tac Toe's tools. Use when the person asks to start, continue, show or take a turn in a tic-tac-toe game.
---

# Play tic-tac-toe

The person plays X and moves first. You play O. The game is kept by the SAGA Tic Tac Toe connector's tools; do not track the board yourself.

1. To start, call `new_game`. It shows the board. Tell the person to click a square.
2. A click on the board places X for the person and tells you in the conversation. Placing X yourself is only for a move the person tells you in words.
3. On your turn, read the board with `get_game` if it is not in your context, choose an empty square (0 to 8, row by row from the top left) and call `play_move` with the game's `gameId`, that square, and `expectedMoveNumber` set to the game's current `moveNumber`.
4. If `play_move` reports a refusal, nothing changed: the result carries the current game. Read it and choose again.
5. To show a game's board again, call `show_game` with its `gameId`. If the board does not appear, try `show_game` once more before reporting a problem.
6. When the game ends, say who won or that it was a draw. Offer `new_game` for another.

A game is named by an unguessable ID and expires 24 hours after it was created. Nothing about the person is stored. Anyone who has a game's ID can play either side, so do not post it where others can read it.
