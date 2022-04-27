/**
 * @author vanndxh
 * @date 2022-4-27
 * @lastModified 2022-4-27
 * @param viewer
 */
function analyseSkyline(viewer) {
    /**
     * 我也不知道前面那么多参数是在干嘛
     */
    let cartographic = viewer.scene.camera.positionCartographic
    let lon = Cesium.Math.toDegrees(cartographic.longitude)
    let lat = Cesium.Math.toDegrees(cartographic.latitude)
    let h = cartographic.height
    let position = [lon, lat, h]
    let direction = Cesium.Math.toDegrees(viewer.scene.camera.heading)
    let pitch = Cesium.Math.toDegrees(viewer.scene.camera.pitch)
    let roll = Cesium.Math.toDegrees(viewer.scene.camera.roll)
    let hpr = new Cesium.HeadingPitchRoll(direction, pitch, roll)
    let converter = Cesium.Transforms.eastNorthUpToFixedFrame

    /**
     * 开始操作
     */
    let collection = viewer.scene.postProcessStages
    let edgeDetection = Cesium.PostProcessStageLibrary.createEdgeDetectionStage()

    let postProcessStage0 = new Cesium.PostProcessStage({
        fragmentShader: 'uniform sampler2D colorTexture;' +
            'uniform sampler2D depthTexture;' +

            'varying vec2 v_textureCoordinates;' +

            'void main(void)' +
            '{' +
            'float depth = czm_readDepth(depthTexture, v_textureCoordinates);' +
            'vec4 color = texture2D(colorTexture, v_textureCoordinates);' +
            'if(depth<1.0 - 0.000001){'+
            'gl_FragColor = color;' +
            '}'+
            'else{'+
            'gl_FragColor = vec4(1.0,0.0,0.0,1.0);'+
            '}'+
            '}'
    })
    let postProcessStage1 = new Cesium.PostProcessStage({
        fragmentShader: 'uniform sampler2D colorTexture;' +
            'uniform sampler2D redTexture;' +
            'uniform sampler2D silhouetteTexture;' +

            'varying vec2 v_textureCoordinates;' +

            'void main(void)' +
            '{' +
            'vec4 redcolor=texture2D(redTexture, v_textureCoordinates);'+
            'vec4 silhouetteColor = texture2D(silhouetteTexture, v_textureCoordinates);' +
            'vec4 color = texture2D(colorTexture, v_textureCoordinates);' +
            'if(redcolor.r == 1.0){'+
            'gl_FragColor = mix(color, vec4(1.0,0.0,0.0,1.0), silhouetteColor.a);' +
            '}'+
            'else{'+
            'gl_FragColor = color;'+
            '}'+
            '}',
        uniforms: {
            redTexture: postProcessStage0.name,
            silhouetteTexture: edgeDetection.name
        }
    })
    let postProcessStage = new Cesium.PostProcessStageComposite({
        stages: [edgeDetection, postProcessStage0, postProcessStage1],
        inputPreviousStageTexture: false,
        uniforms: edgeDetection.uniforms
    })
    collection.add(postProcessStage)
    /**
     * 导出结果
     */

}