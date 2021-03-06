var camera, scene, renderer;
var mesh;

var n = 6;
var dim = Math.pow(2, n) + 1;
var grid;
var magnitude = 6;
var magnitudeScale = Math.sqrt(n);

var width = 5;
var yOffset = -5;
var zOffset = 6.5;
var iterCount = 6;

init();
animate();

function init() {

    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.z = zOffset;
    // camera.position.x = magnitude / 2;
    camera.position.y = yOffset;
    camera.rotation.x = Math.PI / 2.5;

    scene = new THREE.Scene();

    // var texture = new THREE.TextureLoader().load( 'textures/crate.gif' );

    geometry = generateMountainGeometry(iterCount);
    // geometry = new THREE.BoxGeometry(10, 10, 10);

    // var material = new THREE.MeshNormalMaterial( {color: 0x00ff00} );

    var uniforms = {
        time: { type: "f", value: 1.0 },
        resolution: { type: "v2", value: new THREE.Vector2() }
    };
    var material = new THREE.ShaderMaterial( {
        uniforms: uniforms,
        vertexShader: document.getElementById( 'vertexShader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentShader' ).textContent
    });

    // material = THREE.MeshBasicMaterial()

    material.side = THREE.DoubleSide;

    mesh = new THREE.Mesh( geometry, material );
    // mesh.rotation.x = Math.PI;
    mesh.rotation.z = Math.PI / 1.75;
    mesh.position.z += 5;
    mesh.position.y -= 2;
    scene.add( mesh );

    renderer = new THREE.WebGLRenderer( { antialias: false } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    //

    // window.addEventListener( 'resize', onWindowResize, false );

}

function getNeighbors(i, j, dim) {
    var neighbors = [];

    for (var dx = -1; dx <= 1; dx += 2) {
        for (var dy = -1; dy <= 1; dy += 2) {
            if (i + dx >= 0 && i + dx < dim && j + dy >= 0 && j + dy < dim) {
                neighbors.push([i + dx, j + dy]);
            }
        }
    }

    return neighbors;
}

function noise(scalar) {
    var n = scalar || 1
    return Math.sin((Math.random() - 0.5) * Math.PI) / n
}

function generateMountainGeometry(iterCount) {
    var mountainGeometry = new THREE.Geometry();

    grid = new Array(dim);

    for (var i = 0; i < dim; i++) {
        grid[i] = new Array(dim);
        for (var j = 0; j < dim; j++) {

            var x = width * i / dim - width / 2;
            var y = width * j / dim - width / 2;

            grid[i][j] = {
                v: new THREE.Vector3(x, y, Math.random() * 1.4),
                i: undefined,
            };

            grid[i][j].n = grid[i][j].v.clone();

        }
    }

    var halfWidth = width;

    var attractors = [
        {
            pos: new THREE.Vector3(0, -width / 8 + noise(1.5), magnitude * 0.7 + noise(8)),
            width: width / 6,
        },
        {
            pos: new THREE.Vector3(width / 12 + noise(1.5), width / 8 + noise(1.5), magnitude * 0.75 + noise(8)),
            width: width / 4,
        }
    ];


    for (var iteration = 0; iteration < iterCount; iteration++) {

        var alpha = 1 - Math.pow(iteration / iterCount, 0.25);

        for (var i = 0; i < dim; i++) {
            for (var j = 0; j < dim; j++) {
                
                var attractorDelta = undefined;

                attractors.forEach(function(attractor) {

                    var lateralDistance = Math.sqrt(Math.pow(grid[i][j].v.x - attractor.pos.x, 2)
                                        + Math.pow(grid[i][j].v.y - attractor.pos.y, 2));

                    var verticalDistance = attractor.pos.z - grid[i][j].v.z;

                    var widthRatio = lateralDistance / attractor.width;

                    var weight = 1 / (widthRatio + 1);
                    weight = Math.pow(weight, 2);

                    var delta = verticalDistance * weight;
                    
                    if (attractorDelta === undefined || delta > attractorDelta) {
                        attractorDelta = delta;
                    }
                });


                var avgNeighborHeight = 0;

                var neighbors = getNeighbors(i, j, dim);

                if (neighbors.length > 0) {
                    neighbors.forEach(function(coord) {
                        avgNeighborHeight += grid[coord[0]][coord[1]].v.z;
                    });
                    avgNeighborHeight /= neighbors.length;
                }

                grid[i][j].n.z += alpha * attractorDelta + (1 - alpha) * (avgNeighborHeight - grid[i][j].v.z);

            }
        }

        for (var i = 0; i < dim; i++) {
            for (var j = 0; j < dim; j++) {
                grid[i][j].v = grid[i][j].n.clone();
            }
        }

    }

    var avgHeight = 0;

    for (var i = 0; i < dim; i++) {
        for (var j = 0; j < dim; j++) {
            avgHeight += grid[i][j].v.z;
        }
    }

    avgHeight /= (i * j);

    // assign index based on position in vertex list
    for (var i = 0; i < dim; i++) {
        for (var j = 0; j < dim; j++) {

            grid[i][j].v.z -= avgHeight;
            
            mountainGeometry.vertices.push(grid[i][j].v);
            grid[i][j].i = mountainGeometry.vertices.length - 1;
        }
    }

    var normal = new THREE.Vector3(0, 0, 1);

    // add faces
    for (var i = 0; i < dim - 1; i++) {
        for (var j = 0; j < dim - 1; j++) {
            mountainGeometry.faces.push(new THREE.Face3(
                grid[i][j].i,
                grid[i + 1][j].i,
                grid[i][j + 1].i,
                // normal
            ));

            mountainGeometry.faces.push(new THREE.Face3(
                grid[i + 1][j].i,
                grid[i + 1][j + 1].i,
                grid[i][j + 1].i,
                // normal
            ));
        }
    }

    mountainGeometry.computeFaceNormals()


    return mountainGeometry;
}

function animate() {
    renderer.render( scene, camera );
}

var meshInitZ = mesh.rotation.z
var meshInitX = mesh.rotation.x
window.onload = function(e) {
    console.log(e)
}
window.onmousemove = function(e) {
    var rangeX = e.clientX / document.body.clientWidth - 0.5
    var rangeY = e.clientY / document.body.clientHeight - 0.5
    var thetaZ = rangeX * Math.PI / 2 + meshInitZ
    var thetaX = rangeY * Math.PI / 3 + meshInitX
    mesh.rotation.z = thetaZ
    mesh.rotation.x = thetaX
    animate()
}