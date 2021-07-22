import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import ASScroll from '@ashthornton/asscroll'

import fragment from './shaders/fragment.glsl'
import vertex from './shaders/vertex.glsl'
// import testTexture from './tileTexture-water.jpeg'
import testTexture from './tileTexture.jpg'


import * as dat from 'dat.gui'


import gsap from 'gsap'


export default class Sketch{
    constructor(options){
        this.container = options.domElement;
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;

        this.camera = new THREE.PerspectiveCamera( 30, this.width / this.height, 10, 1000 );
        this.camera.position.z = 600;

        this.camera.fov = 2*Math.atan( (this.height/2)/600 ) * 180/Math.PI;

        this.scene = new THREE.Scene();

        
        this.renderer = new THREE.WebGLRenderer( {
            antialias: true,
            alpha: true
        } );
        this.renderer.setPixelRatio(window.devicePixelRatio)
        this.container.appendChild(this.renderer.domElement);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement)

        this.materials = []

        this.asscroll = new ASScroll({
            disableRaf: true
        });
        this.asscroll.enable({
            horizontalScroll:true
        })

        this.time = 0;
        this.settings();
        this.addObjects();
        this.resize();

        this.render();
        this.setupResize()

    }

    settings(){
        this.settings = {
            progress: 0
        }
        this.gui = new dat.GUI();
        this.gui.add(this.settings, "progress",0,1,0.001)
    }

    resize(){
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.renderer.setSize( this.width, this.height );
        this.camera.aspect =  this.width/this.height;
        this.camera.updateProjectionMatrix();

        this.camera.fov = 2*Math.atan( (this.height/2)/600 ) * 180/Math.PI;

        this.materials.forEach(m=>{
            m.uniforms.uResolution.value.x = this.width;
            m.uniforms.uResolution.value.y = this.height;

        })

        this.imageStore.forEach(i=>{
            let bounds = i.img.getBoundingClientRect();
            i.mesh.scale.set(bounds.width, bounds.height, 1);
            i.top =  bounds.top;
            i.left = bounds.left + this.asscroll.currentPos;
            i.width = bounds.width;
            i.height = bounds.height;

            i.mesh.material.uniforms.uQuadSize.value.x = bounds.width;
            i.mesh.material.uniforms.uQuadSize.value.y = bounds.height;

            i.mesh.material.uniforms.uTextureSize.value.x = bounds.width;
            i.mesh.material.uniforms.uTextureSize.value.y = bounds.height;
        })

    }

    setupResize(){
        window.addEventListener('resize', this.resize.bind(this))
    }

    addObjects(){
       
        // this.geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
        this.geometry = new THREE.PlaneBufferGeometry( 1, 1, 100, 100 );
        // this.geometry = new THREE.SphereBufferGeometry( 0.5, 160, 160);

        // this.material = new THREE.MeshNormalMaterial();
        // this.material = new THREE.MeshBasicMaterial({
        //     color: 0xffff00
        // });

        this.material = new THREE.ShaderMaterial({
            wireframe: false,
            uniforms:{
                time: { value: 1.0 },
                uProgress: { value: 0 },
                uTexture: { value: new THREE.TextureLoader().load(testTexture) },
                uTextureSize: { value: new THREE.Vector2(100, 100) },
                uCorners: { value: new THREE.Vector4(0, 0, 0, 0) },

                uResolution: {value: new THREE.Vector2(this.width, this.height) },
                uQuadSize: {value: new THREE.Vector2(300, 300) }

            },
            vertexShader: vertex,
            fragmentShader: fragment, 
        })

        this.tl = gsap.timeline()
            .to(this.material.uniforms.uCorners.value,{
                x:1,
                duration: 1
            })
            .to(this.material.uniforms.uCorners.value,{
                y:1,
                duration: 1
            },0.1)
            .to(this.material.uniforms.uCorners.value,{
                z:1,
                duration: 1
            },0.2)
            .to(this.material.uniforms.uCorners.value,{
                w:1,
                duration: 1
            },0.3)

        this.mesh = new THREE.Mesh( this.geometry, this.material );
        this.mesh.scale.set(300, 300, 1)
        // this.scene.add( this.mesh );
        this.mesh.position.x = 300;
       
        this.images =[ ...document.querySelectorAll('.js-image')];

        // the array images
        this.imageStore = this.images.map(img=>{
            let bounds = img.getBoundingClientRect();
            console.log(bounds)
            let m = this.material.clone()
            this.materials.push(m)
            let texture = new THREE.Texture(img);
            texture.needsUpdate = true;

            m.uniforms.uTexture.value = texture;

            let mesh = new THREE.Mesh(this.geometry, m);
            this.scene.add(mesh);
            mesh.scale.set(bounds.width, bounds.height, 1)

            return{
                img: img,
                mesh: mesh,
                width: bounds.width,
                height: bounds.height,
                top: bounds.top,
                left: bounds.left,
                
            }

        })

    }

    setPosition(){
        console.log(this.asscroll.currentPos)
        this.imageStore.forEach(o=>{
            o.mesh.position.x = -this.asscroll.currentPos + o.left - this.width/2 + o.width/2;
            o.mesh.position.y = -o.top + this.height/2 - o.height/2;
        })
    }

    render(){
        this.time += 0.05;
        this.material.uniforms.time.value = this.time;
        // this.material.uniforms.uProgress.value = this.settings.progress;

        this.asscroll.update();
        this.setPosition();

        this.tl.progress(this.settings.progress)
        this.mesh.rotation.x = this.time / 2000;
        this.mesh.rotation.y = this.time / 1000;
    
        this.renderer.render( this.scene, this.camera );

        // console.log(this.time)
        requestAnimationFrame(this.render.bind(this))
        
    }

}

new Sketch({
    domElement: document.getElementById('container')
});

