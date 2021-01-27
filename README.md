# `YLW - Pong` 
> Group project for CS 174A Introduction to Computer Graphics
>
## Group Members
Yifu Yuan, Bing Lin, Sirui Wang

## Overview
This is an advanced 3D version of the game [Pong](https://en.wikipedia.org/wiki/Pong) (Image 1). The goal of the game is to use a board to bounce back a ball and hold on until the bouncing ball goes to the opponent’s end of the stage. The game is designed for two players, who will each take control over a board through key/button press detection. 

![Pong Game](https://i.pinimg.com/originals/f1/22/c3/f122c306a0ce2fec19b5c37e4d459e9f.gif)

Image 1: Traditional 2D Pong Game


![Game demo](https://github.com/ninablin/Pong/blob/master/assets/demo.gif)

Image 2: Demo of our game


![Game demo](https://github.com/ninablin/Pong/blob/master/assets/rain-demo.gif)

Image 3: Rain simulation


### Description
- Two players take control over keyboard in turn.
- The appearance of the score tracking plate changes when either side score a point.
- The environment is set on a lawn where the grass is moving with random breeze.
- The lighting and texture of the game scene changes when rain simulation is on.
- The appearance of the ball changes after each collision
- Play music at collision/goal or turn play button on as BGM.

### Key Features
- Simple Collision Detection
    - Detect collision between the ball, two players and the arena boundary
- Scene Graphics
- Environmental System 
    - Rain simulation

### Controls
- Press `q` to start a new round. 

- Use the `t` and `g` to control the movement of the left player.

- Use the `i` and `k` to control the movement of the left player.

- To simulate rain, press the button `p`

- To play background music, press the button `l`




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
