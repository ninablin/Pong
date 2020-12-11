import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene, Texture, Shader
} = tiny;

class Cube extends Shape {
    constructor() {
        super("positions", "normals");
        this.arrays.position = Vector3.cast(
        [-1, 1, -1], [-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [1, 1, 1], [1, -1, 1], [1, -1, -1], [1, 1, -1]);
        this.arrays.normal = Vector3.cast(
        [-1, 1, -1], [-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [1, 1, 1], [1, -1, 1], [1, -1, -1], [1, 1, -1]);
        this.indices.push(0, 1, 2, 0, 2, 3, 2, 3, 4, 2, 4, 5, 4, 5, 6, 4, 6, 7, 0, 6,
            7, 0, 1, 6, 0, 3, 4, 0, 4, 7, 1, 2, 5, 1, 5, 6);
    }
}


// The sole purpose of this class is to import obj files.
// Usage: new Shape_From_File(FILEPATH)
export class Shape_From_File extends Shape {                                   // **Shape_From_File** is a versatile standalone Shape that imports
                                                                               // all its arrays' data from an .obj 3D model file.
    constructor(filename) {
        super("position", "normal", "texture_coord");
        // Begin downloading the mesh. Once that completes, return
        // control to our parse_into_mesh function.
        this.load_file(filename);
    }

    load_file(filename) {                             // Request the external file and wait for it to load.
        // Failure mode:  Loads an empty shape.
        return fetch(filename)
            .then(response => {
                if (response.ok) return Promise.resolve(response.text())
                else return Promise.reject(response.status)
            })
            .then(obj_file_contents => this.parse_into_mesh(obj_file_contents))
            .catch(error => {
                this.copy_onto_graphics_card(this.gl);
            })
    }

    parse_into_mesh(data) {                           // Adapted from the "webgl-obj-loader.js" library found online:
        var verts = [], vertNormals = [], textures = [], unpacked = {};

        unpacked.verts = [];
        unpacked.norms = [];
        unpacked.textures = [];
        unpacked.hashindices = {};
        unpacked.indices = [];
        unpacked.index = 0;

        var lines = data.split('\n');

        var VERTEX_RE = /^v\s/;
        var NORMAL_RE = /^vn\s/;
        var TEXTURE_RE = /^vt\s/;
        var FACE_RE = /^f\s/;
        var WHITESPACE_RE = /\s+/;

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            var elements = line.split(WHITESPACE_RE);
            elements.shift();

            if (VERTEX_RE.test(line)) verts.push.apply(verts, elements);
            else if (NORMAL_RE.test(line)) vertNormals.push.apply(vertNormals, elements);
            else if (TEXTURE_RE.test(line)) textures.push.apply(textures, elements);
            else if (FACE_RE.test(line)) {
                var quad = false;
                for (var j = 0, eleLen = elements.length; j < eleLen; j++) {
                    if (j === 3 && !quad) {
                        j = 2;
                        quad = true;
                    }
                    if (elements[j] in unpacked.hashindices)
                        unpacked.indices.push(unpacked.hashindices[elements[j]]);
                    else {
                        var vertex = elements[j].split('/');

                        unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 0]);
                        unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 1]);
                        unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 2]);

                        if (textures.length) {
                            unpacked.textures.push(+textures[((vertex[1] - 1) || vertex[0]) * 2 + 0]);
                            unpacked.textures.push(+textures[((vertex[1] - 1) || vertex[0]) * 2 + 1]);
                        }

                        unpacked.norms.push(+vertNormals[((vertex[2] - 1) || vertex[0]) * 3 + 0]);
                        unpacked.norms.push(+vertNormals[((vertex[2] - 1) || vertex[0]) * 3 + 1]);
                        unpacked.norms.push(+vertNormals[((vertex[2] - 1) || vertex[0]) * 3 + 2]);

                        unpacked.hashindices[elements[j]] = unpacked.index;
                        unpacked.indices.push(unpacked.index);
                        unpacked.index += 1;
                    }
                    if (j === 3 && quad) unpacked.indices.push(unpacked.hashindices[elements[0]]);
                }
            }
        }
        {
            const {verts, norms, textures} = unpacked;
            for (var j = 0; j < verts.length / 3; j++) {
                this.arrays.position.push(vec3(verts[3 * j], verts[3 * j + 1], verts[3 * j + 2]));
                this.arrays.normal.push(vec3(norms[3 * j], norms[3 * j + 1], norms[3 * j + 2]));
                this.arrays.texture_coord.push(vec(textures[2 * j], textures[2 * j + 1]));
            }
            this.indices = unpacked.indices;
        }
        this.normalize_positions(false);
        this.ready = true;
    }

    draw(context, program_state, model_transform, material) {               // draw(): Same as always for shapes, but cancel all
        // attempts to draw the shape before it loads:
        if (this.ready)
            super.draw(context, program_state, model_transform, material);
    }
}

class Base_Scene extends Scene {
    constructor() {
        super();
        this.hover = this.swarm = false;
        this.shapes = {
            'strip': new Cube(),
            'box': new defs.Cube(),
            'sphere': new defs.Subdivision_Sphere(4),
            'ball_earth': new Shape_From_File("assets/ball/earth.obj"),
            'ball_moon': new Shape_From_File("assets/ball/Mars.obj"),
            'guardian': new Shape_From_File("assets/guardian/guardian_model.obj"),
            'grass_round': new Shape_From_File("assets/environment/grass/grass-round.obj"),
            "grass_strip": new Shape_From_File("assets/environment/grass/grass-strip.obj"),
            "grass_cat_tail": new Shape_From_File("assets/environment/grass/grass-cattail.obj"),
            "rock_1": new Shape_From_File("assets/environment/rock/rock1/uploads_files_2274456_Rock1.obj"),
            "rock_3": new Shape_From_File("assets/environment/rock/Rock3.OBJ"),
            "cobbles": new Shape_From_File("assets/environment/rock/cobbles/cobblestone.obj"),
            "wall": new Shape_From_File("assets/wall/uploads_files_2526021_modular_assets_dungeon.obj"),
        };

        this.shapes.box.arrays.texture_coord.forEach(p => p.scale_by(2));
        this.shapes.sphere.arrays.texture_coord.forEach(p => p.scale_by(2));
        const bump = new defs.Fake_Bump_Map(1);
        this.materials = {
            plastic: new Material(new defs.Phong_Shader(), {ambient: .4, diffusivity: .6, specularity: 1, color: hex_color("#ffffff")}),
            score: new Material(new defs.Phong_Shader(), {ambient: 0.2, diffusivity: 0, specularity: 0, color: hex_color("#ffffff")}),
            ground_daylight: new Material(bump, {ambient: 1, diffusivity: .4, specularity: 0, texture: new Texture("assets/ground_texture.jpeg")}),
            ground_rainy: new Material(bump, {ambient: 0.7, diffusivity: .4, specularity: 0, texture: new Texture("assets/ground_texture.jpeg")}),
            rock: new Material(bump, {ambient: 1, diffusivity: .6, texture: new Texture("assets/rock1.jpeg")}),
            ball: new Material(bump, {ambient: 1, diffusivity: .6, texture: new Texture("assets/earth.gif")}),
            ball_texture1: new Material(bump, {ambient: 1, diffusivity: .6, texture: new Texture("assets/ball/earth.png")}),
            ball_texture2: new Material(bump, {ambient: 1, diffusivity: .6, texture: new Texture("assets/ball/mars2.png")}),
            rock_guardian: new Material(new defs.Textured_Phong(1), {ambient: 0.7, diffusivity: .6, specularity: 0.5, texture: new Texture("assets/guardian/guardian_texture.png")}),
            rain: new Material(new defs.Phong_Shader(), {ambient: .4, diffusivity: .6, specularity: 0, color: hex_color("#f7f8fa")}),
            grass_light: new Material(new defs.Phong_Shader(), {ambient: 1, color: hex_color("#326500")}),
            grass_dark: new Material(new defs.Phong_Shader(), {ambient: 1, color: hex_color("#183200")}),
            rock_pattern1: new Material(new defs.Fake_Bump_Map(1), {ambient: 0.7, diffusivity: .6, specularity: 0.5, texture: new Texture("assets/environment/rock/rock1/texture.png")}),
            rock_pattern5: new Material(new defs.Fake_Bump_Map(1), {ambient: 0.7, diffusivity: .6, specularity: 0.5, texture: new Texture("assets/environment/rock/texture/texture5.jpg")}),
            cobbles_texture: new Material(new defs.Fake_Bump_Map(1), {ambient: 1, diffusivity: 0.5, specularity: 0.5, texture: new Texture("assets/environment/rock/cobbles/texture-cobble.png")}),
            wall_texture: new Material(new defs.Fake_Bump_Map(1), {ambient: 1, diffusivity: 1, specularity: 0, texture: new Texture("assets/wall/modular_wall01_DefaultMaterial_BaseColor.png")}),
            score_red: new Material(new defs.Phong_Shader(), {ambient: 1, diffusivity: 1, specularity: 0, color: hex_color("#f56e64")}),
            score_yellow: new Material(new defs.Phong_Shader(), {ambient: 1, diffusivity: 1, specularity: 0, color: hex_color("#f7ee94")}),
            score_green: new Material(new defs.Phong_Shader(), {ambient: 1, diffusivity: 1, specularity: 0, color: hex_color("#85f578")}),
            score_aqua: new Material(new defs.Phong_Shader(), {ambient: 1, diffusivity: 1, specularity: 0, color: hex_color("#7af0e4")}),
            score_purple: new Material(new defs.Phong_Shader(), {ambient: 1, diffusivity: 1, specularity: 0, color: hex_color("#bb84f5")}),
            score_pink: new Material(new defs.Phong_Shader(), {ambient: 1, diffusivity: 1, specularity: 0, color: hex_color("#ffa3d6")}),
            rock_guardian_test: new Material(new defs.Shadow_Phong(), {ambient: 0.7, diffusivity: .6, specularity: 0.5, texture: new Texture("assets/guardian/guardian_texture.png")}),

        }


    }
// 10.14, 3.59, -53.40
    // Adjust Camera Location and Light Source
    display(context, program_state) {
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // this.initial_camera_location = Mat4.look_at(vec3(0, -20, 50), vec3(0, 1, 1), vec3(0, 1, 0));
            this.initial_camera_location = Mat4.look_at(vec3(-1, -40, 55), vec3(0, 1, 1), vec3(0, 1, 0));
            program_state.set_camera(this.initial_camera_location.times(Mat4.translation(0,-5,0)));
        }
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 200);
    }
}

// Core of Pong
export class Pong extends Base_Scene {
     constructor(context) {
         super();

         this.PI = 3.1415926535898;
         this.bounce = false;
         this.bounceTimer = 0;

         // Flag which signals whether the round has started or ended
         this.flag = false;
         this.roundEndFlag = false;

         // Flag which signa false;

         // Stage Ground
         this.stage_ground = Mat4.identity().times(Mat4.translation(0,0,-2)).times(Mat4.scale(82,50,1));
        
         // Player Position (Plate Length: 6)
         this.leftPlayer = Mat4.identity().times(Mat4.translation(-27,10,3)).times(Mat4.rotation(Math.PI/2,1,0,0)).times(Mat4.rotation(Math.PI/2,0,1,0)).times(Mat4.scale(3,3,3));
         this.rightPlayer = Mat4.identity().times(Mat4.translation(27,10,3)).times(Mat4.rotation(Math.PI/2,1,0,0)).times(Mat4.rotation(-Math.PI/2,0,1,0)).times(Mat4.scale(3,3,3));
         this.leftPlayerTarget = this.leftPlayer;
         this.rightPlayerTarget = this.rightPlayer;
         this.leftLoser = true;


         // Boundary Positils whether the game has ended
         //          this.gameEndFlag =on (Total Field Dimension: 72 * 40)
         this.upperBound = Mat4.identity().times(Mat4.translation(0,30,0)).times(Mat4.scale(35,1,1));
         this.lowerBound = Mat4.identity().times(Mat4.translation(0,-10,0)).times(Mat4.scale(35,1,1));
         this.leftBound = Mat4.identity().times(Mat4.translation(-36,10,0)).times(Mat4.scale(1,21,1));
         this.rightBound = Mat4.identity().times(Mat4.translation(36,10,0)).times(Mat4.scale(1,21,1));

         // Ball Position and Velocity
         this.ball = Mat4.identity().times(Mat4.translation(-25.5,10,0));
         // this.totalSpeed = 10;         // the speed calculated by sqrt(xv**2 + yv**2)
         this.xv = 0;                  // velocity in x direction
         this.yv = 0;                  // velocity in y direction
         // this.xvMax = 8; this.xvMin = 2;  // the max and min velocity in x direction
         this.angle = 0;               // ball flying angle
         this.velocity = 0;               // ball flying speed


         // Difficulty (Ball Speed) Option
         this.easy = 1000;
         this.medium = 500;
         this.hard = 200;
         this.difficulty = this.medium; // Default is medium

         // Scores of Two Players
         this.leftScorePos = Mat4.identity().times(Mat4.translation(-34,25,5));
         this.rightScorePos = Mat4.identity().times(Mat4.translation(34,25,5));
         this.leftScore = 0;
         this.rightScore = 0;
         this.pastLeftScore = 0;
         this.pastRightScore = 0;
         this.leftScoreMaterial = this.scoreRandomColor();
         this.rightScoreMaterial = this.scoreRandomColor();
         this.storeMaterial = this.leftScoreMaterial;


         // Rain drops array
         this.rain_drops = [];

         // Music Control
         this.bgm_flag = false;
         this.bgm = new Audio("assets/music/Cissy_Strut.mp3");
         this.rain_bgm = new Audio("assets/music/rain.mp3");

         // Environment
         this.middle = Mat4.identity().times(Mat4.translation(0,30,0)).times(Mat4.rotation(Math.PI/2,1,0,0)).times(Mat4.rotation(Math.PI/2,0,1,0)).times(Mat4.scale(10,15,10));
         this.strip = Mat4.identity().times(Mat4.translation(0,33,0)).times(Mat4.rotation(Math.PI / 2,1,0,0)).times(Mat4.scale(10,40,10));
         this.grass_middle = Mat4.identity().times(Mat4.translation(-58,70,0)).times(Mat4.rotation(Math.PI/2,1,0,0)).times(Mat4.rotation(Math.PI/2,0,1,0)).times(Mat4.scale(5,4,7));
         this.cattail = Mat4.identity().times(Mat4.translation(0,20,3)).times(Mat4.rotation(Math.PI/2,1,0,0)).times(Mat4.rotation(-Math.PI/2,0,1,0)).times(Mat4.rotation(Math.PI/2,0,1,0)).times(Mat4.scale(5,6,5));
         this.margin = Mat4.identity().times(Mat4.translation(-90,25,1)).times(Mat4.rotation(Math.PI/2,1,0,0)).times(Mat4.rotation(Math.PI/2,0,1,0)).times(Mat4.scale(6,6,6));

         //shadow material
         //this.materials["shadow"] = new Material(new defs.Shadow_Phong({ambient: 1.0, diffusivity: 0.0, specularity: 0.0, texture:new Texture("assets/ball/earth.png") }));
         /*this.materials["shadow"] = context.get_instance(Shadow_Phong)
             .material(Color.of(0,0,0,1),
                 {ambient: 1.0, diffusivity: 0.0, specularity: 0.0 })
             .override({texture:context.get_instance("assets/ball/earth.png")});*/
     }

    //lerp player movement
    easing(target, currentValue, speed){
        var difference = target[1][3] - currentValue[1][3];
        return difference * speed;
    }

    // Player Movement_Controls (Enforced the plates not to go over the boundaries)
    leftUp() {
        if (this.leftPlayerTarget[1][3] < this.upperBound[1][3] - 5.5)
            this.leftPlayerTarget = this.leftPlayerTarget.times(Mat4.translation(0.5,0,0));
    }
    leftDown() {
        if (this.leftPlayerTarget[1][3] > this.lowerBound[1][3] + 5.5)
            this.leftPlayerTarget = this.leftPlayerTarget.times(Mat4.translation(-0.5,0,0));
    }
    rightUp() {
        if (this.rightPlayerTarget[1][3] < this.upperBound[1][3] - 5.5)
            this.rightPlayerTarget = this.rightPlayerTarget.times(Mat4.translation(-0.5,0,0));
    }
    rightDown() {
        if (this.rightPlayerTarget[1][3] > this.lowerBound[1][3] + 5.5)
            this.rightPlayerTarget = this.rightPlayerTarget.times(Mat4.translation(0.5,0,0));
    }

    // Intitialize Ball Movement_Controls
    throwPitch() {
        if (!this.flag) {  // flag used to keep that "New Round" bottom can only work after a round is finished
            //this.xv = Math.random() * (this.xvMax - this.xvMin) + this.xvMin;  // randomly selects x velocity between xmin and xmax
            //this.yv = Math.sqrt(this.totalSpeed**2 - this.xv**2);              // calculate y velocity using totalSpeed and x velocity above
            this.angle = Math.random()* this.PI * 2/3 - this.PI * 1/3;
            this.velocity = 12;
            //if (Math.random() > 0.5)                                           // decide the sign of y velocity randomly
            //    this.yv = -1 * this.yv;
            // Signals the start of this round
            this.flag = true;
        }
    }

    ballMovement(){
        if(this.velocity != 0) {
            this.xv = this.velocity * Math.cos(this.angle);
            this.yv = this.velocity * Math.sin(this.angle);
        }else{
            this.xv = 0;
            this.yv = 0;
        }
    }

    // Simulate raining where raindrops are represented by extremely thin boxes
    rain(context, program_state, dt) {
        // Firstly, add 75 raindrops to the rain_drop array by randomly choosing their own x, y and z
        for (let i = 0; i < 75; i++){
            let x = Math.random() * 40;
            if (Math.random() > 0.5)
                x = -x;
            let y = Math.random() * 40;
            if (Math.random() > 0.5)
                y = -y;
            let z = Math.random() * 15 + 35;
            let rain_len = Math.random() * 0.5 + 0.5;
            let rain_drop = Mat4.identity().times(Mat4.translation(x,y,z)).times(Mat4.scale(0.05,0.05,rain_len));
            this.rain_drops.push(rain_drop);
        }
        
        // Secondly, move all rain drops downwards by random speed v.
        // If the rain drop is below the plane z=0, remove the rain drop from rain_drops array
        for (let i = 0; i < this.rain_drops.length; i++){
            let v = Math.random() * 5 + 5;
            this.rain_drops[i] = this.rain_drops[i].times(Mat4.translation(0,0,-v));
            if (this.rain_drops[i][2][3] < 0) {
                this.rain_drops.splice(i, 1);
                continue;
            }
            this.shapes.box.draw(context, program_state, this.rain_drops[i].times(Mat4.translation(0,0,-v)), this.materials.rain);
        }

        // To simulate the dark environment of rainy days, adjust the light and color of ground
        program_state.lights = [new Light(vec4(0,5,5,1), color(1, 1, 1, 1), 1000)];
        this.draw_box(context, program_state, this.stage_ground, this.materials.ground_rainy);

        // Play rainy day bgm
        this.rain_bgm.play();
    }

    play_music() {
        this.bgm_flag ^= true;
        if (this.bgm_flag)
            this.bgm.play();
        else
            this.bgm.pause();
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("New Round", ["q"], this.throwPitch);
        //this.key_triggered_button("Easy", ["5"],() => this.difficulty = () => this.easy);
        //this.key_triggered_button("Meidum", ["6"],() => this.difficulty = () => this.medium);
        //this.key_triggered_button("Hard", ["7"],() => this.difficulty = () => this.hard);
        this.new_line();
        // Add a button for controlling the scene.
        this.key_triggered_button("Player1 UP", ["t"], this.leftUp);this.new_line();
        this.key_triggered_button("Player1 DOWN", ["g"], this.leftDown); this.new_line();
        this.key_triggered_button("Player2 UP", ["i"], this.rightUp); this.new_line();
        this.key_triggered_button("Player2 DOWN", ["k"], this.rightDown); this.new_line();
        this.key_triggered_button("Rain", ["p"], () => {
            this.rain_flag ^= true;}); this.new_line();
        this.key_triggered_button("Play BGM", ["l"], this.play_music); this.new_line();
    }

    //put camera to original position
    camera_to_origianl(program_state){
        this.initial_camera_location = Mat4.look_at(vec3(-1, -40, 55), vec3(0, 1, 1), vec3(0, 1, 0));
        program_state.set_camera(this.initial_camera_location.times(Mat4.translation(0,-5,0)));
    }

    // The default method to draw a box
    draw_box(context, program_state, model_transform, texture) {
        this.shapes.box.draw(context, program_state, model_transform, texture);
        model_transform = model_transform.times(Mat4.translation(1,1,0)).times(Mat4.translation(-1,1,0));
        return model_transform;
    }

    // The default method to draw a ball
    draw_ball(context, program_state){
        if(this.COLLIDE)
            this.shapes.ball_earth.draw(context, program_state, this.ball, this.materials.ball_texture1);
        else
            this.shapes.ball_earth.draw(context, program_state, this.ball.times(Mat4.rotation(Math.PI/2, 0, 1, 0)), this.materials.ball_texture2);
    }

    draw_obstacle(context, program_state, model_transform){
        this.shapes.cube.draw(context, program_state, this.ball, this.materials.ball_texture2);
    }

    // Detect Collision at every frame
    collision_detector(dt) {
        // Upper and Lower Boundary Collision
        if(!this.bounce) {
            if (this.ball[1][3] >= this.upperBound[1][3] - 1 || this.ball[1][3] <= this.lowerBound[1][3] + 1) {
                this.angle = -this.angle;
                this.COLLIDE ^= true;
                this.bounce = true;
                new Audio("assets/music/bounce.mp3").play();
            }
        }
        // Left and Right Boundary Collision
        if (this.ball[0][3] >= this.rightBound[0][3] - 1) {
            this.leftLoser = false;
            this.roundEndFlag = true;
            this.leftScore = this.leftScore + 1;
            if (this.leftScore > 4) {
                this.gameEndFlag = true;
                new Audio("assets/music/win.mp3").play();
                return;
            }
            new Audio("assets/music/leftwin.mp3").play();
        }
        if (this.ball[0][3] <= this.leftBound[0][3] + 1) {
            this.leftLoser = true;
            this.roundEndFlag = true;
            this.rightScore = this.rightScore + 1;
            if (this.rightScore > 4) {
                this.gameEndFlag = true;
                new Audio("assets/music/win.mp3").play();
                return;
            }
            new Audio("assets/music/rightwin.mp3").play();
        }
        // Left Player Collision
        /*else if (this.ball[0][3] < this.leftPlayer[0][3] + 1.5 && this.ball[0][3] > this.leftPlayer[0][3] - 1.5) {
            if (this.ball[1][3] < this.leftPlayer[1][3] + 6 && this.ball[1][3] > this.leftPlayer[1][3] - 6)
                this.angle = this.PI - this.angle;
                this.COLLIDE ^= true;
        }
        // Right Player Collision
        else if (this.ball[0][3] < this.rightPlayer[0][3] + 1.5 && this.ball[0][3] > this.rightPlayer[0][3] - 1.5) {
            if (this.ball[1][3] < this.rightPlayer[1][3] + 6 && this.ball[1][3] > this.rightPlayer[1][3] - 6)
                this.angle = this.PI - this.angle;
                this.COLLIDE ^= true;
        }*/

        if(!this.bounce) {
            // right Player X collision
            if (this.ball[1][3] < this.rightPlayer[1][3] + 6 && this.ball[1][3] > this.rightPlayer[1][3] - 6) {
                if (this.ball[0][3] > this.rightPlayer[0][3] - 1.5 && this.ball[0][3] < this.rightPlayer[0][3] - 1) {
                    this.angle =  this.PI - this.lerp(-4/9*this.PI ,4/9* this.PI, this.rightPlayer[1][3] - 6, this.rightPlayer[1][3] + 6, this.ball[1][3]);
                    this.COLLIDE ^= true;
                    this.bounce = true;
                    new Audio("assets/music/bounce.mp3").play();
                    //console.log("collide right X");
                }
            }

            // right Player Y collision
            if (this.ball[0][3] < this.rightPlayer[0][3] + 1 && this.ball[0][3] > this.rightPlayer[0][3] - 1) {
                if (this.ball[1][3] < this.rightPlayer[1][3] + 6.5 && this.ball[1][3] > this.rightPlayer[1][3] - 6.5) {
                    this.angle = -this.angle;
                    this.COLLIDE ^= true;
                    this.bounce = true;
                    new Audio("assets/music/bounce.mp3").play();
                    // console.log("collide right Y");
                }
            }

            // left Player X collision
            if (this.ball[1][3] < this.leftPlayer[1][3] + 6 && this.ball[1][3] > this.leftPlayer[1][3] - 6) {
                if (this.ball[0][3] < this.leftPlayer[0][3] + 1.5 && this.ball[0][3] > this.leftPlayer[0][3] + 1) {
                    this.angle =  this.lerp(-4/9*this.PI ,4/9* this.PI, this.leftPlayer[1][3] - 6, this.leftPlayer[1][3] + 6, this.ball[1][3]);
                    this.COLLIDE ^= true;
                    this.bounce = true;
                    new Audio("assets/music/bounce.mp3").play();
                    // console.log("collide left X");
                }
            }

            //left Player Y collision
            if (this.ball[0][3] < this.leftPlayer[0][3] + 1 && this.ball[0][3] > this.leftPlayer[0][3] - 1) {
                if (this.ball[1][3] < this.leftPlayer[1][3] + 6.5 && this.ball[1][3] > this.leftPlayer[1][3] - 6.5) {
                    this.angle = -this.angle;
                    this.COLLIDE ^= true;
                    this.bounce = true;
                    new Audio("assets/music/bounce.mp3").play();
                    // console.log("collide left Y");
                }
            }
        }
        this.resetBounce(dt);

    }


    lerp(targetMin, targetMax, thisMin, thisMax, thisValue){
        var ratio = (targetMax - targetMin)/(thisMax - thisMin);
        var value = targetMin + ratio * (thisValue - thisMin);
        return value;
    }

    // set a bounce timer, so cannot bounce twice in 0.1 second
    resetBounce(dt){
        if(this.bounce){
            this.bounceTimer += dt;
        }
        if(this.bounceTimer >= 0.1){
            this.bounce = false;
            this.bounceTimer = 0;
        }
    }
    
    // If the current round is over, clean the stage
    cleanStage() {
        this.flag = false;
        this.roundEndFlag = false;
        if (this.gameEndFlag) {
            this.leftScore = 0;
            this.rightScore = 0;
            this.gameEndFlag = false;
        }

         // Player Position (Plate Length: 4)
         this.leftPlayer = Mat4.identity().times(Mat4.translation(-27,10,3)).times(Mat4.rotation(Math.PI/2,1,0,0)).times(Mat4.rotation(Math.PI/2,0,1,0)).times(Mat4.scale(3,3,3));
         this.rightPlayer = Mat4.identity().times(Mat4.translation(27,10,3)).times(Mat4.rotation(Math.PI/2,1,0,0)).times(Mat4.rotation(-Math.PI/2,0,1,0)).times(Mat4.scale(3,3,3));

        this.leftPlayerTarget = this.leftPlayer;
        this.rightPlayerTarget = this.rightPlayer;

         // Boundary Position (Total Field Dimension: 70 * 40)
         this.upperBound = Mat4.identity().times(Mat4.translation(0,30,0)).times(Mat4.scale(35,1,1));
         this.lowerBound = Mat4.identity().times(Mat4.translation(0,-10,0)).times(Mat4.scale(35,1,1));
         this.leftBound = Mat4.identity().times(Mat4.translation(-36,10,0)).times(Mat4.scale(1,21,1));
         this.rightBound = Mat4.identity().times(Mat4.translation(36,10,0)).times(Mat4.scale(1,21,1));

        // Ball Position and Velocity
        if(this.leftLoser) {
            this.ball = Mat4.identity().times(Mat4.translation(-25.5, 10, 0));
        }else{
            this.ball = Mat4.identity().times(Mat4.translation(25.5, 10, 0));
        }
        //this.totalSpeed = 10;
        //this.xv = 0;
        //this.yv = 0;
        this.velocity = 0;
    }

    ballFollowPlayer(){
        if(this.leftLoser) {
            this.ball = this.ball.times(Mat4.translation(0,- this.easing(this.leftPlayer , this.leftPlayerTarget, 0.02)*3,0));
        }else{
            this.ball = this.ball.times(Mat4.translation(0,- this.easing(this.rightPlayer , this.rightPlayerTarget, 0.02)*3,0));
        }
    }
    
    // Display Scores as Sets of Cubes
    // More specifically, the set of a score is composed of 15 unit cubes placed in a 5x3 rectangle
    // All this function has done is to decide which cubes not to display based on specific scores
    // e.g, score = 0, cube # 4, 7, 10 will be hidden
    //这里有问题
    scoreRandomColor(){
        var num = Math.random()*6;
        var s_material;
        if(num < 1){
            s_material = this.materials.score_red;
        }else if(num < 2){
            s_material = this.materials.score_yellow;
        }else if(num < 3){
            s_material = this.materials.score_green;
        }else if(num < 4){
            s_material = this.materials.score_aqua;
        }else if(num < 5){
            s_material = this.materials.score_purple;
        }else if(num < 6){
            s_material = this.materials.score_pink;
        }
        return s_material;
    }

    scoreChange(score,pastScore){
        if(score!= pastScore){
            return true;
        }
        else{return false;}
    }

    scoreDisplay(context, program_state, sidePos, score, s_material) {
        this.scoreArray = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14];
        switch (score) {
            case 0:
                this.scoreArray = [0,1,2,3,5,6,8,9,11,12,13,14];
                break;
            case 1:
                this.scoreArray = [1,4,7,10,13];
                break;
            case 2:
                this.scoreArray = [0,1,2,5,6,7,8,9,12,13,14];
                break;
            case 3:
                this.scoreArray = [0,1,2,5,6,7,8,11,12,13,14];
                break;
            case 4:
                this.scoreArray = [0,2,3,5,6,7,8,11,14];
                break;
        }
        for (let i = 0; i < this.scoreArray.length; i++){
            if (this.scoreArray[i] == 0)
                this.draw_box(context, program_state, sidePos.times(Mat4.rotation(-0.5,1,0,0)).times(Mat4.translation(-2,0,4)), s_material);
            else if (this.scoreArray[i] == 1)
                this.draw_box(context, program_state, sidePos.times(Mat4.rotation(-0.5,1,0,0)).times(Mat4.translation(0,0,4)), s_material);
            else if (this.scoreArray[i] == 2)
                this.draw_box(context, program_state, sidePos.times(Mat4.rotation(-0.5,1,0,0)).times(Mat4.translation(2,0,4)), s_material);
            else if (this.scoreArray[i] == 3)
                this.draw_box(context, program_state, sidePos.times(Mat4.rotation(-0.5,1,0,0)).times(Mat4.translation(-2,0,2)), s_material);
            else if (this.scoreArray[i] == 4)
                this.draw_box(context, program_state, sidePos.times(Mat4.rotation(-0.5,1,0,0)).times(Mat4.translation(0,0,2)), s_material);
            else if (this.scoreArray[i] == 5)
                this.draw_box(context, program_state, sidePos.times(Mat4.rotation(-0.5,1,0,0)).times(Mat4.translation(2,0,2)), s_material);
            else if (this.scoreArray[i] == 6)
                this.draw_box(context, program_state, sidePos.times(Mat4.rotation(-0.5,1,0,0)).times(Mat4.translation(-2,0,0)), s_material);
            else if (this.scoreArray[i] == 7)
                this.draw_box(context, program_state, sidePos.times(Mat4.rotation(-0.5,1,0,0)).times(Mat4.translation(0,0,0)), s_material);
            else if (this.scoreArray[i] == 8)
                this.draw_box(context, program_state, sidePos.times(Mat4.rotation(-0.5,1,0,0)).times(Mat4.translation(2,0,0)), s_material);
            else if (this.scoreArray[i] == 9)
                this.draw_box(context, program_state, sidePos.times(Mat4.rotation(-0.5,1,0,0)).times(Mat4.translation(-2,0,-2)), s_material);
            else if (this.scoreArray[i] == 10)
                this.draw_box(context, program_state, sidePos.times(Mat4.rotation(-0.5,1,0,0)).times(Mat4.translation(0,0,-2)), s_material);
            else if (this.scoreArray[i] == 11)
                this.draw_box(context, program_state, sidePos.times(Mat4.rotation(-0.5,1,0,0)).times(Mat4.translation(2,0,-2)), s_material);
            else if (this.scoreArray[i] == 12)
                this.draw_box(context, program_state, sidePos.times(Mat4.rotation(-0.5,1,0,0)).times(Mat4.translation(-2,0,-4)), s_material);
            else if (this.scoreArray[i] == 13)
                this.draw_box(context, program_state, sidePos.times(Mat4.rotation(-0.5,1,0,0)).times(Mat4.translation(0,0,-4)), s_material);
            else if (this.scoreArray[i] == 14)
                this.draw_box(context, program_state, sidePos.times(Mat4.rotation(-0.5,1,0,0)).times(Mat4.translation(2,0,-4)), s_material);
        }
    }

    display(context, program_state) {
        const t = program_state.animation_time;
        const light_position = vec4(0, 5, 5, 1);
        if (!this.rain_flag) {
            program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];
            this.draw_box(context, program_state, this.stage_ground, this.materials.ground_daylight);
            // Environment grass
            this.rain_bgm.pause();
        }
        super.display(context, program_state);
        let model_transform = Mat4.identity();
        
        // Time Definition
        const dt = program_state.animation_delta_time / this.difficulty;
        
        // Game Boundary
        // this.draw_box(context, program_state, this.leftBound, this.materials.rock);
        // this.draw_box(context, program_state, this.rightBound, this.materials.rock);
        // this.draw_box(context, program_state, this.upperBound, this.materials.rock);
        // this.draw_box(context, program_state, this.lowerBound, this.materials.rock);

        //ease player movement
        if(this.leftPlayer != this.leftPlayerTarget)
            this.leftPlayer = this.leftPlayer.times(Mat4.translation( - this.easing(this.leftPlayer , this.leftPlayerTarget, 0.02),0,0));
        if(this.rightPlayer != this.rightPlayerTarget)
            this.rightPlayer = this.rightPlayer.times(Mat4.translation(this.easing(this.rightPlayer , this.rightPlayerTarget, 0.02),0,0));

        //ball follow player before game starts
        if(!this.flag){
            this.ballFollowPlayer();
        }

        // Player Plates
        this.shapes.guardian.draw(context, program_state, this.leftPlayer, this.materials.rock_guardian);
        this.shapes.guardian.draw(context, program_state, this.rightPlayer, this.materials.rock_guardian);

        // Scores Display
        this.scoreDisplay(context, program_state, this.leftScorePos, this.leftScore, this.leftScoreMaterial);
        this.scoreDisplay(context, program_state, this.rightScorePos, this.rightScore, this.rightScoreMaterial);

        // make sure random color is different from previous one
        if(this.scoreChange(this.pastLeftScore, this.leftScore)) {
            do{
                this.storeMaterial = this.scoreRandomColor();
            }
            while(this.leftScoreMaterial == this.storeMaterial)
            this.leftScoreMaterial = this.storeMaterial;
        }
        if(this.scoreChange(this.pastRightScore, this.rightScore)) {
            do{
                this.storeMaterial = this.scoreRandomColor();
            }
            while(this.rightScoreMaterial == this.storeMaterial)
            this.rightScoreMaterial = this.storeMaterial;
        }

        this.pastLeftScore = this.leftScore;
        this.pastRightScore = this.rightScore;

        // Rain
        if (this.rain_flag)
            this.rain(context, program_state, dt);

        // Ball
        this.ballMovement();
        this.ball = this.ball.times(Mat4.translation(dt*this.xv,dt*this.yv,0));
        this.draw_ball(context, program_state);
        this.collision_detector(dt);
        if (this.roundEndFlag)
            this.cleanStage();

        // Arena Boundary & Scene boundary
        this.draw_boundary(context, program_state);

        // Environment
        this.background_environment(context, program_state, t);
    }
    draw_boundary(context, program_state){
         // Arena Boundary
        // Top Bound
        this.shapes.cobbles.draw(context, program_state, this.middle.times(Mat4.translation(0.3, -0.05, 3)).times(Mat4.scale(0.4, 0.2, 0.4)), this.materials.cobbles_texture);
        this.shapes.cobbles.draw(context, program_state, this.middle.times(Mat4.translation(0.3, -0.05, 1.5)).times(Mat4.scale(0.4, 0.2, 0.4)).times(Mat4.rotation(Math.PI, 0, 1, 0)), this.materials.cobbles_texture);
        this.shapes.cobbles.draw(context, program_state, this.middle.times(Mat4.translation(0.3, -0.05, 0)).times(Mat4.scale(0.4, 0.2, 0.4)), this.materials.cobbles_texture);
        this.shapes.cobbles.draw(context, program_state, this.middle.times(Mat4.translation(0.3, -0.05, -1.5)).times(Mat4.scale(0.4, 0.2, 0.4)).times(Mat4.rotation(Math.PI, 0, 1, 0)), this.materials.cobbles_texture);
        this.shapes.cobbles.draw(context, program_state, this.middle.times(Mat4.translation(0.3, -0.05, -3)).times(Mat4.scale(0.4, 0.2, 0.4)), this.materials.cobbles_texture);
        // Bottom Bound
        this.shapes.cobbles.draw(context, program_state, this.middle.times(Mat4.translation(-4.2, -0.05, 3)).times(Mat4.scale(0.3, 0.2, 0.3)), this.materials.cobbles_texture);
        this.shapes.cobbles.draw(context, program_state, this.middle.times(Mat4.translation(-4.2, -0.05, 2)).times(Mat4.scale(0.3, 0.2, 0.3)).times(Mat4.rotation(Math.PI, 0, 1, 0)), this.materials.cobbles_texture);
        this.shapes.cobbles.draw(context, program_state, this.middle.times(Mat4.translation(-4.2, -0.05, 1)).times(Mat4.scale(0.3, 0.2, 0.3)), this.materials.cobbles_texture);
        this.shapes.cobbles.draw(context, program_state, this.middle.times(Mat4.translation(-4.2, -0.05, 0)).times(Mat4.scale(0.3, 0.2, 0.3)).times(Mat4.rotation(Math.PI, 0, 1, 0)), this.materials.cobbles_texture);
        this.shapes.cobbles.draw(context, program_state, this.middle.times(Mat4.translation(-4.2, -0.05, -1)).times(Mat4.scale(0.3, 0.2, 0.3)), this.materials.cobbles_texture);
        this.shapes.cobbles.draw(context, program_state, this.middle.times(Mat4.translation(-4.2, -0.05, -2)).times(Mat4.scale(0.3, 0.2, 0.3)).times(Mat4.rotation(Math.PI, 0, 1, 0)), this.materials.cobbles_texture);
        this.shapes.cobbles.draw(context, program_state, this.middle.times(Mat4.translation(-4.2, -0.05, -3)).times(Mat4.scale(0.3, 0.2, 0.3)), this.materials.cobbles_texture);
        // Left Bound
        this.shapes.cobbles.draw(context, program_state, this.middle.times(Mat4.translation(-0.3, -0.05, -3.7)).times(Mat4.scale(0.4, 0.2, 0.4)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)), this.materials.cobbles_texture);
        this.shapes.cobbles.draw(context, program_state, this.middle.times(Mat4.translation(-1.8, -0.05, -3.7)).times(Mat4.scale(0.3, 0.2, 0.3)).times(Mat4.rotation(-Math.PI/2, 0, 1, 0)), this.materials.cobbles_texture);
        this.shapes.cobbles.draw(context, program_state, this.middle.times(Mat4.translation(-2.8, -0.05, -3.7)).times(Mat4.scale(0.3, 0.2, 0.3)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)), this.materials.cobbles_texture);
        this.shapes.cobbles.draw(context, program_state, this.middle.times(Mat4.translation(-3.8, -0.05, -3.7)).times(Mat4.scale(0.3, 0.2, 0.3)).times(Mat4.rotation(-Math.PI/2, 0, 1, 0)), this.materials.cobbles_texture);
        // Right Bound
        this.shapes.cobbles.draw(context, program_state, this.middle.times(Mat4.translation(0, -0.05, 3.8)).times(Mat4.scale(0.4, 0.2, 0.4)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)), this.materials.cobbles_texture);
        this.shapes.cobbles.draw(context, program_state, this.middle.times(Mat4.translation(-1.5, -0.05, 3.8)).times(Mat4.scale(0.3, 0.2, 0.3)).times(Mat4.rotation(-Math.PI/2, 0, 1, 0)), this.materials.cobbles_texture);
        this.shapes.cobbles.draw(context, program_state, this.middle.times(Mat4.translation(-2.5, -0.05, 3.8)).times(Mat4.scale(0.3, 0.2, 0.3)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)), this.materials.cobbles_texture);
        this.shapes.cobbles.draw(context, program_state, this.middle.times(Mat4.translation(-3.5, -0.05, 3.8)).times(Mat4.scale(0.3, 0.2, 0.3)).times(Mat4.rotation(-Math.PI/2, 0, 1, 0)), this.materials.cobbles_texture);

        // Scene boundary
        for(var i = -10; i < 3; i += 3){
            this.shapes.wall.draw(context, program_state, this.margin.times(Mat4.translation(i, 0.5, 2)), this.materials.wall_texture);
            this.shapes.wall.draw(context, program_state, this.margin.times(Mat4.translation(i, 0.5, 28)), this.materials.wall_texture);
        }
        for(var i = -3.5; i > -30; i -= 3){
            this.shapes.wall.draw(context, program_state, this.margin.times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(i, 0.5, 3)), this.materials.wall_texture);
            this.shapes.wall.draw(context, program_state, this.margin.times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(i, 0.5, -12)), this.materials.wall_texture);

        }

     }

    background_environment(context, program_state, t){
         // Rocks
        this.shapes.rock_1.draw(context, program_state, this.middle.times(Mat4.scale(0.5, 0.5, 0.5)).times(Mat4.translation(2, 0, -3)).times(Mat4.rotation(Math.PI/6, 0, 0, 1)), this.materials.rock_pattern1);
        this.shapes.rock_1.draw(context, program_state, this.middle.times(Mat4.scale(0.5, 0.5, 0.5)).times(Mat4.translation(-13, 0, -10)).times(Mat4.rotation(Math.PI, 1, 0, 0)), this.materials.rock_pattern1);
        this.shapes.rock_1.draw(context, program_state, this.middle.times(Mat4.scale(0.5, 0.5, 0.5)).times(Mat4.translation(-2, 0, 9)).times(Mat4.rotation(-Math.PI/4, 1, 0, 0)), this.materials.rock_pattern1);

        // Waving grass strips
        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(0.5, 0, -3.7)).times(Mat4.scale(1, 1, 2)).times(Mat4.rotation(-Math.PI/4, 0, 1, 0)).times(Mat4.translation(0,0,-0.1 * Math.sin(0.0005 * t))), this.materials.grass_light);
        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(0.5, 0, -4.7)).times(Mat4.scale(1, 1, 2)).times(Mat4.rotation(-Math.PI/4, 0, 1, 0)).times(Mat4.translation(0,0,0.1 * Math.cos(0.0005 * t))), this.materials.grass_light);
        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(0.2, 0, 4)).times(Mat4.rotation(Math.PI/4, 0, 1, 0)).times(Mat4.translation(0,0,-0.1 * Math.sin(0.0005 * t))), this.materials.grass_light);
        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(0.2, 0, 4.5)).times(Mat4.rotation(Math.PI/4, 0, 1, 0)).times(Mat4.translation(0,0,0.1 * Math.cos(0.0005 * t))), this.materials.grass_light);
        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(0.2, 0, 4.5)).times(Mat4.rotation(Math.PI/4, 0, 1, 0)).times(Mat4.translation(0,0,-0.1 * Math.sin(0.0005 * t))), this.materials.grass_light);

        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(0.7, 0, -2)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(0,0,-0.1 * Math.cos(0.0005 * t))), this.materials.grass_light);
        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(0.7, 0, 1)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(0,0,0.1 * Math.sin(0.0005 * t))), this.materials.grass_light);
        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(1.3, 0, -2)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(0,0,-0.1 * Math.sin(0.0005 * t))), this.materials.grass_light);
        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(1.0, 0, 1)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(0,0,-0.1 * Math.cos(0.0005 * t))), this.materials.grass_light);
        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(1.3, 0, -2)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(0,0,-0.1 * Math.sin(0.0005 * t))), this.materials.grass_light);
        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(1.3, 0, 1)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(0,0,-0.1 * Math.cos(0.0005 * t))), this.materials.grass_light);
        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(1.5, 0, -2)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(0,0,-0.1 * Math.sin(0.0005 * t))), this.materials.grass_light);

        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(-4.5, 0, -3.5)).times(Mat4.rotation(Math.PI/4, 0, 1, 0)).times(Mat4.translation(0,0,-0.1 * Math.cos(0.0005 * t))), this.materials.grass_light);
        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(-5, 0, -3.5)).times(Mat4.rotation(Math.PI/4, 0, 1, 0)).times(Mat4.translation(0,0,-0.1 * Math.cos(0.0005 * t))), this.materials.grass_light);
        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(-5.5, 0, -3.5)).times(Mat4.rotation(Math.PI/4, 0, 1, 0)).times(Mat4.translation(0,0,-0.1 * Math.cos(0.0005 * t))), this.materials.grass_light);
        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(-5.5, 0, -4)).times(Mat4.rotation(Math.PI/4, 0, 1, 0)).times(Mat4.translation(0,0,-0.1 * Math.cos(0.0005 * t))), this.materials.grass_light);
        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(-5.5, 0, -4.5)).times(Mat4.rotation(Math.PI/4, 0, 1, 0)).times(Mat4.translation(0,0,-0.1 * Math.cos(0.0005 * t))), this.materials.grass_light);
        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(-6, 0, -3.5)).times(Mat4.rotation(Math.PI/4, 0, 1, 0)).times(Mat4.translation(0,0,-0.1 * Math.cos(0.0005 * t))), this.materials.grass_light);

        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(-4.5, 0, -2)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(0,0,0.1 * Math.sin(0.0005 * t))), this.materials.grass_light);
        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(-4.5, 0, 1)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(0,0,-0.1 * Math.cos(0.0005 * t))), this.materials.grass_light);
        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(-5, 0, -2)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(0,0,-0.1 * Math.cos(0.0005 * t))), this.materials.grass_light);
        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(-5, 0, 1)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(0,0,0.1 * Math.sin(0.0005 * t))), this.materials.grass_light);
        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(-5.5, 0, -2)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(0,0,-0.1 * Math.cos(0.0005 * t))), this.materials.grass_light);
        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(-5.5, 0, 1)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(0,0,0.1 * Math.sin(0.0005 * t))), this.materials.grass_light);

        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(0, 0, -6)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(0,0,0.1 * Math.sin(0.0005 * t))), this.materials.grass_light);
        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(-0.5, 0, -6)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(0,0,-0.1 * Math.cos(0.0005 * t))), this.materials.grass_light);
        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(-1, 0, -6)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(0,0,-0.1 * Math.cos(0.0005 * t))), this.materials.grass_light);
        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(-1.5, 0, -6)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(0,0,0.1 * Math.sin(0.0005 * t))), this.materials.grass_light);
        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(-2, 0, -6)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(0,0,-0.1 * Math.cos(0.0005 * t))), this.materials.grass_light);

        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(0, 0, 6)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(0,0,0.1 * Math.sin(0.0005 * t))), this.materials.grass_light);
        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(-0.5, 0, 6)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(0,0,-0.1 * Math.cos(0.0005 * t))), this.materials.grass_light);
        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(-1, 0, 6)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(0,0,-0.1 * Math.cos(0.0005 * t))), this.materials.grass_light);
        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(-1.5, 0, 6)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(0,0,0.1 * Math.sin(0.0005 * t))), this.materials.grass_light);
        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(-2, 0, 6)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(0,0,-0.1 * Math.cos(0.0005 * t))), this.materials.grass_light);
        this.shapes.grass_strip.draw(context, program_state, this.middle.times(Mat4.translation(-2.5, 0, 6)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(0,0,0.1 * Math.sin(0.0005 * t))), this.materials.grass_light);


        // Environment - Grass
        for(var i = -2; i < 20; i += 2){
            this.shapes.grass_round.draw(context, program_state, this.grass_middle.times(Mat4.translation(-6,0, i)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)), this.materials.grass_light);
            this.shapes.grass_round.draw(context, program_state, this.grass_middle.times(Mat4.translation(-6,0, i)), this.materials.grass_light);
            this.shapes.grass_round.draw(context, program_state, this.grass_middle.times(Mat4.translation(-18,0, i)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)), this.materials.grass_light);
            this.shapes.grass_round.draw(context, program_state, this.grass_middle.times(Mat4.translation(-18,0, i)), this.materials.grass_light);
            this.shapes.grass_round.draw(context, program_state, this.grass_middle.times(Mat4.translation(-20,0, i)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)), this.materials.grass_light);
            this.shapes.grass_round.draw(context, program_state, this.grass_middle.times(Mat4.translation(-20,0, i)), this.materials.grass_light);
            this.shapes.grass_round.draw(context, program_state, this.grass_middle.times(Mat4.translation(-22,0, i)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)), this.materials.grass_light);
            this.shapes.grass_round.draw(context, program_state, this.grass_middle.times(Mat4.translation(-22,0, i)), this.materials.grass_light);
        }
        for(var i = -1; i < 3; i += 2){
            this.shapes.grass_round.draw(context, program_state, this.grass_middle.times(Mat4.translation(-8,0, i)), this.materials.grass_light);
            this.shapes.grass_round.draw(context, program_state, this.grass_middle.times(Mat4.translation(-8,0, i)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)), this.materials.grass_light);
            this.shapes.grass_round.draw(context, program_state, this.grass_middle.times(Mat4.translation(-10,0, i)), this.materials.grass_light);
            this.shapes.grass_round.draw(context, program_state, this.grass_middle.times(Mat4.translation(-10,0, i)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)), this.materials.grass_light);
            this.shapes.grass_round.draw(context, program_state, this.grass_middle.times(Mat4.translation(-12,0, i)), this.materials.grass_light);
            this.shapes.grass_round.draw(context, program_state, this.grass_middle.times(Mat4.translation(-12,0, i)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)), this.materials.grass_light);
            this.shapes.grass_round.draw(context, program_state, this.grass_middle.times(Mat4.translation(-14,0, i)), this.materials.grass_light);
            this.shapes.grass_round.draw(context, program_state, this.grass_middle.times(Mat4.translation(-14,0, i)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)), this.materials.grass_light);
            this.shapes.grass_round.draw(context, program_state, this.grass_middle.times(Mat4.translation(-16,0, i)), this.materials.grass_light);
            this.shapes.grass_round.draw(context, program_state, this.grass_middle.times(Mat4.translation(-16,0, i)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)), this.materials.grass_light);
        }
        for(var i = 15.3; i < 19.3; i += 2){
            this.shapes.grass_round.draw(context, program_state, this.grass_middle.times(Mat4.translation(-8,0, i)), this.materials.grass_light);
            this.shapes.grass_round.draw(context, program_state, this.grass_middle.times(Mat4.translation(-8,0, i)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)), this.materials.grass_light);
            this.shapes.grass_round.draw(context, program_state, this.grass_middle.times(Mat4.translation(-10,0, i)), this.materials.grass_light);
            this.shapes.grass_round.draw(context, program_state, this.grass_middle.times(Mat4.translation(-10,0, i)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)), this.materials.grass_light);
            this.shapes.grass_round.draw(context, program_state, this.grass_middle.times(Mat4.translation(-12,0, i)), this.materials.grass_light);
            this.shapes.grass_round.draw(context, program_state, this.grass_middle.times(Mat4.translation(-12,0, i)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)), this.materials.grass_light);
            this.shapes.grass_round.draw(context, program_state, this.grass_middle.times(Mat4.translation(-14,0, i)), this.materials.grass_light);
            this.shapes.grass_round.draw(context, program_state, this.grass_middle.times(Mat4.translation(-14,0, i)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)), this.materials.grass_light);
            this.shapes.grass_round.draw(context, program_state, this.grass_middle.times(Mat4.translation(-16,0, i)), this.materials.grass_light);
            this.shapes.grass_round.draw(context, program_state, this.grass_middle.times(Mat4.translation(-16,0, i)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)), this.materials.grass_light);
        }


     }
}