# `Pong` 
> Created by Yifu Yuan, Bing Lin, Sirui Wang

## Overview
We will be making an advanced 3D version of the game [Pong](https://en.wikipedia.org/wiki/Pong) (Image 1). The goal of the game is to use a board to bounce back a ball and hold on until the bouncing ball goes to the opponent’s end of the stage. The game is designed for two players, who will each take control over a board through key/button press detection. 

To make the 3D Pong more attractive, we will add advanced features such as ball variation, environment change and enable additional horizontal movement of player boards. These advanced feature designs will be detailed below.

![Pong Game](https://i.pinimg.com/originals/f1/22/c3/f122c306a0ce2fec19b5c37e4d459e9f.gif)

Image 1: Traditional 2D Pong Game

### Interactivity(Subject to Change)

- Two players will each have control over a board mainly with keyboard shortcut (also accessible through mouse click).
- Different from the traditional 2D game, where players can only move vertically, our version would enable players to move slightly in horizontal direction to increase the speed and alter the angle of the ball.
- The scores of players will be displayed with special effects such as rotation/scaling/change of color.
- The environment will most likely be set on a lawn where grass will appear to be moving with random breeze.
- The sun will be moving with time; with the source of light changing, the shadows and lightness will also be affected.
- Potential environment system, i.e. raining.
- During each collision of the ball, the shape/material/trace/lighting of the ball will have a chance to change.
- To challenge more experienced or accommodate new Pong players, three levels of ball speed are available to choose with the default being medium speed.
- Add music at collision/goal and as BGM.

### Advanced Features
- Simple Collision Detection (Done)
- Scene Graphics
- Shadows (Working on)
- Particle System, e.g., rain

### Games for inspiration
[Pong](https://en.wikipedia.org/wiki/Pong)

[Stikbold!](https://www.stikbold.com/)

## tiny-graphics.js
This is a small, single file JavaScript utility.  It organizes WebGL programs to be object-oriented and minimally cluttered.  

Writing code with raw JavaScript and WebGL can be repetitive and tedious.  Using frameworks like three.js can create an undesired separation between you and the raw JavaScript and WebGL and common graphics operations you want to learn.  Unlike other frameworks, tiny-graphics.js is purpose-built for education, has small source code, and teaches you how it is made.

This tiny library gives your WebGL program access to linear algebra routines, useful UI controls and readouts, and the drawing utilities needed by modern shader-based graphics.  It factors away the repetitive logic of GPU communication into re-usable objects.  The objects can be seamlessly shared between multiple WebGL contexts (drawing regions) on a web page.

The tiny-graphics.js software library has accompanied UCLA Computer Science's 174a course (Intro to Computer Graphics) since 2016, replacing Edward Angel's supplemental code from his textbook "Interactive Computer Graphics: A Top-Down Approach with WebGL".  Compared to Angel's library, tiny-graphics.js offers more organization and functionality.

This code library accompanies and supports a web project by the same author called "The Encyclopedia of Code", a crowd-sourced repository of WebGL demos and educational tutorials that uses an online editor.

To run a sample using tiny-graphics.js, visit its GitHub Pages link: https://encyclopedia-of-code.github.io/tiny-graphics-js/

To see all the demos and edit them:  Open the included "host.bat" or "host.command" file, then open localhost in your browser.  Open Developer Tools and create a workspace for your new folder.  Now you can edit the files, which is necessary to view the different demos.

To select a demo, open and edit main-scene.js.  Assign your choice to the Main_Scene variable.  Your choices for scenes are:

* Minimal_Webgl_Demo
* Transforms_Sandbox
* Axes_Viewer_Test_Scene
* Inertia_Demo
* Collision_Demo
* Many_Lights_Demo
* Obj_File_Demo
* Text_Demo
* Scene_To_Texture_Demo
* Surfaces_Demo

The code comments in each file should help, especially if you look at the definition of Transforms_Sandbox.  So should the explanations that the demos print on the page.  Enjoy!
