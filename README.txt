BLANK SCREEN FIX

Replace these two files in the ROOT of your GitHub repository:
1. styles.css
2. script.js

Do not place them inside assets.

Cause fixed:
- The redesign CSS hid all .reveal content until JavaScript marked it visible.
- The previous script.js did not contain the reveal logic, so the page looked blank except for navigation and WhatsApp.
- The updated CSS also fails open: content remains visible even if JavaScript ever fails to load.
