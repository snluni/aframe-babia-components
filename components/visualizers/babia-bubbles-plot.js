let updateTitle = require('../others/common').updateTitle;
const colors = require('../others/common').colors;
let updateFunction = require('../others/common').updateFunction;

const NotiBuffer = require("../../common/noti-buffer").NotiBuffer;
const math = require("mathjs");

//save vectors 
let boxes = [];
let vectors = [];
let points =[];
let dataMatrix;
let tMatrix;

function boxColliderEventHandler(matrix, boxEntity, component){
    //number of the box
    let id = boxEntity.getAttribute('id');
    let aux = id.split('-');
    let index = parseInt(aux[1]);
    console.log('índice box', index);

    //new position of the box
    let boxPosition = boxEntity.object3D.position;

    //modify transformation matrix
    matrix[0][index] = boxPosition.x;
    matrix[1][index] = boxPosition.y;
    matrix[2][index] = boxPosition.z;
    console.log('new tMatrix', matrix);

    tMatrixGlobal = matrix;
    //modify vector
    let entityVector = vectors[index];
    //entityVector.object3D.remove();

    //calculate the new norm 
    let newNorm = math.norm([matrix[0][index], matrix[1][index], matrix[2][index]]);

    let geometry = new THREE.CylinderGeometry( 0.1, 0.1, newNorm, 3, 1);
    let material = new THREE.MeshBasicMaterial( {color: 0xffff00});
    let vector = new THREE.Mesh(geometry, material);
    vector.position.set(0,0,0);
    vector.geometry.rotateX(Math.PI*0.5);
    vector.lookAt(boxPosition);    

    vector.position.x = vector.position.x + matrix[0][index]/2;
    vector.position.y = vector.position.y + matrix[1][index]/2;
    vector.position.z = vector.position.z + matrix[2][index]/2;

    entityVector.setObject3D('vector-' + index,vector);

    component.updateChart();
}

function drawVectors(tMatrix, el, component){
    //origin = {x:0,y:0,z:0}
    let geometry;
    let material;
    let box;
    let norm;
    let entity;

    let k = tMatrix[0].length
    for(let i=0; i < k; i++){

        //draw box

        //create entity for box
        entity = document.createElement('a-box');
        box = entity.object3D;

        box.position.set(tMatrix[0][i], tMatrix[1][i], tMatrix[2][i]);

        
        box.scale.set(0.5, 0.5, 0.5);
        
        boxes.push(box);
        console.log('boxes', boxes);
        
        entity.setAttribute('id', 'box-' + i);
        //boxes belong to collidable class
        entity.setAttribute('class', 'collidable');
        entity.setAttribute('grabbable', '');
        
        el.appendChild(entity);
        console.log(entity);

        //addEventListener
        entity.addEventListener('grab-end', function(event){
            boxColliderEventHandler(tMatrix, event.detail.target, component);
        });


        //draw vector
        norm = math.norm([tMatrix[0][i], tMatrix[1][i], tMatrix[2][i]]);
        geometry = new THREE.CylinderGeometry( 0.1, 0.1, norm, 3, 1);
        material = new THREE.MeshBasicMaterial( {color: 0xffff00});
        cylinder = new THREE.Mesh(geometry, material);
        cylinder.position.set(0,0,0);
        cylinder.geometry.rotateX(Math.PI*0.5);
        cylinder.lookAt(box.position);
        
        //translate
        cylinder.position.x = cylinder.position.x + tMatrix[0][i]/2;
        cylinder.position.y = cylinder.position.y + tMatrix[1][i]/2;
        cylinder.position.z = cylinder.position.z + tMatrix[2][i]/2;

        //create entity for vector  
        entity = document.createElement('a-entity');
        entity.setObject3D('vector-' + i, cylinder);
        entity.setAttribute('id', 'vector' + i);
        vectors.push(entity);
        el.appendChild(entity);
        
    }
}

function calculateMultiplication(tMatrix, dataMatrix){

    //throw an error if columns and rows do not match
    if(tMatrix[0].length != dataMatrix.length){
        throw new Error('Matrix (A) column number must match matrix (B) row number');
    }
    
    //multiply matrices
    const result = math.multiply(tMatrix, dataMatrix);
    
    console.log("Data babia-bubbles-plot:", result);

    //transform result to json
    let dataToPrint = [];

    //features= rows, examples= columns
    for(let i=0; i < result[0].length; i++){
        dataToPrint.push({x: result[0][i], y: result[1][i], z: result[2][i]});
    }
    return dataToPrint;
}

/* global AFRAME */
if (typeof AFRAME === 'undefined') {
    throw new Error('Component attempted to register before AFRAME was available.');
}

/**
* A-Charts component for A-Frame.
*/
AFRAME.registerComponent('babia-bubbles-plot', {
    schema: {
        data: { type: 'string' },
        height: { type: 'string', default: 'height' },
        radius: { type: 'string', default: 'radius' },
        x_axis: { type: 'string', default: 'x_axis' },
        z_axis: { type: 'string', default: 'z_axis' },
        from: { type: 'string' },
        legend: { type: 'boolean' },
        legend_lookat: { type: 'string', default: "[camera]" },
        legend_scale: { type: 'number', default: 1 },
        axis: { type: 'boolean', default: true },
        // Name for axis
        axis_name: {type: 'boolean', default: false},
        animation: { type: 'boolean', default: false },
        palette: { type: 'string', default: 'ubuntu' },
        title: { type: 'string' },
        titleFont: { type: 'string' },
        titleColor: { type: 'string' },
        titlePosition: { type: 'string', default: "0 0 0" },
        scale: { type: 'number' },
        heightMax: { type: 'number' },
        radiusMax: { type: 'number' },
        transform_matrix: {type: 'string'},
        form: {type: 'string'},
        size: {type: 'number'}
    },
        
    /**
     * List of visualization properties
     */
    visProperties: ['height', 'radius', 'x_axis', 'z_axis'],

    /**
    * Set if component needs multiple instancing.
    */
    multiple: false,

    /**
    * Called once when component is attached. Generally for initial setup.
    */
        init: function () {
            this.notiBuffer = new NotiBuffer();
        },

    /**
    * Called when component is attached and when component data changes.
    * Generally modifies the entity based on the data.
    */

    update: function (oldData) {
        updateFunction(this, oldData)
    },

    /**
    * Querier component target
    */
    prodComponent: undefined,

    /**
    * NotiBuffer identifier
    */
    notiBufferId: undefined,

    /**
     * Where the data is gonna be stored
     */
    newData: undefined,

    /**
     * Where the metadata is gonna be stored
     */
    babiaMetadata: {
        id: 0
    },

    /*
    * Update title
    */
    updateTitle: function(){
        const titleRotation = { x: 0, y: 0, z: 0 }
        const titleEl = updateTitle(this.data, titleRotation);        
        this.el.appendChild(titleEl);
    },

    /*
    * Update chart
    */
    updateChart: function () {
        const data = this.data;
        const el = this.el;
        if(!tMatrix || !dataMatrix){

            if(data.transform_matrix){
                tMatrix = JSON.parse(data.transform_matrix);
            }
    
            dataMatrix = this.newData;

            console.log("new data ", dataMatrix);

            //generate random default transform matrix
            if(!tMatrix){   
                let aux = [[],[],[]];
                for(let i = 0; i < aux.length; i++){
                    for(let j = 0; j < dataMatrix.length; j++){
                        aux[i].push(Math.floor(Math.random()*11));
                    }
                }
                tMatrix = aux;
            }

            //clear the previous vectors when the transform matrix is changed
            vectors = [];
            boxes = [];

            drawVectors(tMatrix, el, this);

            //create chart
            this.chartEl = document.createElement('a-entity');
            this.chartEl.classList.add('babiaxrChart');
            el.appendChild(this.chartEl);
        }

        const dataToPrint = calculateMultiplication(tMatrix, dataMatrix);

        const animation = data.animation
        const palette = data.palette
        const scale = data.scale
    
        let heightMax = data.heightMax
        let radiusMax = data.radiusMax

        let xLabels = [];
        let xTicks = [];
        let zLabels = [];
        let zTicks = [];
        let colorId = 0
        let maxColorId = 0
        let stepX = 0
        let stepZ = 0
    
        let maxX = 0
        let maxZ = 0
    
        let keys_used = {}
        let z_axis = {}
    
        let valueMax = Math.max.apply(Math, dataToPrint.map(function (o) { return o[data.height]; }))
        let maxRadius = Math.max.apply(Math, dataToPrint.map(function (o) { return o[data.radius]; }))
        if (scale) {
            valueMax = valueMax / scale
            maxRadius = maxRadius / scale
        }
        if (!heightMax) {
            heightMax = valueMax
        }
        proportion = heightMax / valueMax
          
        if (!radiusMax) {
            radiusMax = maxRadius
        }
        radius_scale = radiusMax / maxRadius
    
        if (scale) {
            maxX = maxRadius / scale;
            maxZ = maxRadius / scale;
        } else {
            maxX = maxRadius * radius_scale;
            maxZ = maxRadius * radius_scale;
        }

        //if there were previous points, delete them
        if(points){
            for(let point of points){
                point.parentNode.removeChild(point);
            }
            points = [];
        }

        for (let bubble of dataToPrint) {
            let xLabel = bubble[data.x_axis];
            let zLabel = bubble[data.z_axis];
            let height = bubble[data.height];
            let radius = bubble[data.radius]

            // Check if used in order to put the bubble in the parent row
            if (keys_used[xLabel]) {
                stepX = keys_used[xLabel].posX
                colorId = keys_used[xLabel].colorId
            } else {
                if (scale) {
                    stepX += 2 * maxRadius / scale + 0.5
                } else {
                    stepX += 2 * maxRadius * radius_scale + 0.5
                }
                colorId = maxColorId
                //Save in used
                keys_used[xLabel] = {
                    "posX": stepX,
                    "colorId": colorId
                }
    
                xLabels.push(xLabel)
                xTicks.push(stepX)
                maxColorId++
            }
    
            // Get Z val
            if (z_axis[zLabel]) {
                stepZ = z_axis[zLabel].posZ
            } else {
                if (scale) {
                    stepZ = maxZ + 2 * maxRadius / scale + 0.5
                } else {
                    stepZ = maxZ + 2 * maxRadius * radius_scale + 0.5
                }
                //Save in used
                z_axis[zLabel] = {
                    "posZ": stepZ
                }
                zLabels.push(zLabel)
                zTicks.push(stepZ)
            }
    

            if (stepX > maxX){
                maxX = stepX
            }
            if (stepZ > maxZ){
                maxZ = stepZ
            }

            let bubbleEntity = generateBubble(height, radius, colorId, palette, stepX, stepZ, animation, scale, proportion, radius_scale, data.form, data.size);
            
            //save point
            points.push(bubbleEntity);

            bubbleEntity.classList.add("babiaxraycasterclass")
            this.chartEl.appendChild(bubbleEntity);
            
            //Prepare legend
            if (data.legend) {
               showLegend(data, bubbleEntity, bubble, el)
            }
        }
    
        //Print axis
        if (data.axis) {
            const lengthX = maxX
            const lengthZ = maxZ
            const lengthY = heightMax
            this.updateAxis(xLabels, xTicks, lengthX, zLabels, zTicks, lengthZ, valueMax, lengthY);
        }
        this.updateTitle();
    },

    /*
    * Update axis
    */
    updateAxis: function(xLabels, xTicks, lengthX, zLabels, zTicks, lengthZ, valueMax, lengthY) {
        let xAxisEl = document.createElement('a-entity');
        this.chartEl.appendChild(xAxisEl);
        xAxisEl.setAttribute('babia-axis-x',{'labels': xLabels, 'ticks': xTicks, 'length': lengthX,'palette': this.data.palette});
        xAxisEl.setAttribute('position', {x: 0, y: 0, z: 0});
  
        let yAxisEl = document.createElement('a-entity');
        this.chartEl.appendChild(yAxisEl);
        yAxisEl.setAttribute('babia-axis-y',{'maxValue': valueMax, 'length': lengthY});
        yAxisEl.setAttribute('position', {x: 0, y: 0, z: 0});
  
        let zAxisEl = document.createElement('a-entity');
        this.chartEl.appendChild(zAxisEl);
        zAxisEl.setAttribute('babia-axis-z',{'labels': zLabels, 'ticks': zTicks, 'length': lengthZ});
        zAxisEl.setAttribute('position', {x: 0, y: 0, z: 0});

        if (this.data.axis_name){
            xAxisEl.setAttribute('babia-axis-x', 'name', this.data.x_axis);
            yAxisEl.setAttribute('babia-axis-y', 'name', this.data.height);
            zAxisEl.setAttribute('babia-axis-z', 'name', this.data.z_axis);
        }
    },

    /*
    * Process data obtained from producer
    */
    processData: function (data) {
        console.log("processData", this);
        this.newData = data;
        this.babiaMetadata = { id: this.babiaMetadata.id++ };
        while (this.el.firstChild)
            this.el.firstChild.remove();
        console.log("Generating bubbles...")
        this.updateChart()
        this.notiBuffer.set(this.newData)
    }
})


function generateBubble(height, radius, colorId, palette, positionX, positionZ, animation, scale, proportion, radius_scale, form, size) {
    let color = colors.get(colorId, palette)
    console.log("Generating bubble...")
    if (scale) {
        height = height / scale
        radius = radius / scale
        size = size / scale
    } else if (proportion || radius_scale) {
        if (proportion) {
            height = proportion * height
        }
        if (radius_scale) {
            radius = radius_scale * radius
        }
    }
    let entity;
    switch(form){
        case 'box':
            entity = document.createElement('a-box');
            break;
        case 'cylinder':
            entity = document.createElement('a-cylinder');
            break;
        case 'sphere':
            entity = document.createElement('a-sphere');
            break;
        default:
            document.createElement('a-sphere');
    }
    entity.setAttribute('color', color);
    entity.setAttribute('radius', radius);

    //change entity size
    if(size){
        entity.setAttribute('width', size);
        entity.setAttribute('height', size);
        entity.setAttribute('depth', size);
    }
    else{
        entity.setAttribute('width', 1);
        entity.setAttribute('height', 1);
        entity.setAttribute('depth', 1);
    }
    // Add Animation
    if (animation) {
        let from = positionX.toString() + " " + radius.toString() + " " + positionZ.toString()
        let to = positionX.toString() + " " + (radius + height).toString() + " " + positionZ.toString()
        entity.setAttribute('animation__position', {
            'property': 'position',
            'from': from,
            'to': to,
            'dur': '3000',
            'easing': 'linear',
        })
    } else {
        entity.setAttribute('position', { x: positionX, y: radius + height, z: positionZ });
    }
    return entity;
}

function generateLegend(data, bubble, bubbleEntity) {
    let text = bubble[data.x_axis] + ': \n Radius:' + bubble[data.radius] + '\nHeight:' + bubble[data.height];

    let width = 2;
    if (text.length > 16)
        width = text.length / 8;

    let bubblePosition = bubbleEntity.getAttribute('position')
    let bubbleRadius = parseFloat(bubbleEntity.getAttribute('radius'))
    let entity = document.createElement('a-plane');
    entity.setAttribute('position', {
        x: bubblePosition.x, y: bubblePosition.y + bubbleRadius + 1,
        z: bubblePosition.z + 0.1
    });
    entity.setAttribute('rotation', { x: 0, y: 0, z: 0 });
    entity.setAttribute('height', '1');
    entity.setAttribute('width', width);
    entity.setAttribute('color', 'white');
    entity.setAttribute('text', {
        'value': text,
        'align': 'center',
        'width': 6,
        'color': 'black'
    });
    entity.classList.add("babiaxrLegend")
    entity.setAttribute('babia-lookat', data.legend_lookat);
    entity.setAttribute('scale',{x: data.legend_scale, y: data.legend_scale, z: data.legend_scale});
    return entity;
}

function showLegend(data, bubbleEntity, bubble, element) {
    bubbleEntity.addEventListener('mouseenter', function () {
        this.setAttribute('scale', { x: 1.1, y: 1.1, z: 1.1 });
        legend = generateLegend(data, bubble, bubbleEntity);
        element.appendChild(legend);
    });

    bubbleEntity.addEventListener('mouseleave', function () {
        this.setAttribute('scale', { x: 1, y: 1, z: 1 });
        element.removeChild(legend);
    });
}
