/**
 * @author vanndxh
 * @date 2022-4-21
 * @lastModified 2022-4-27
 * @param viewer 要创建分析所在viewer
 * @param pos 观测点
 * @param options 传入参数对象
 * @param options.distance 分析半径
 * @param options.direction 锥体方向
 * @param options.hFOV 可视域水平夹角
 * @param options.vFOV 可视域垂直夹角
 * @param options.color 可视/不可视颜色
 */

function analyseViewshed(viewer, pos, options) {
    /**
     * 依赖函数
     */
    let __makeTemplateObject = (this && this.__makeTemplateObject) || function(cooked, raw) {
        if (Object.defineProperty) {
            Object.defineProperty(cooked, "raw", {
                value: raw
            });
        } else {
            cooked.raw = raw;
        }
        return cooked;
    };


    function glsl(x) {
        return x.toString();
    }


    function createPostStage(viewer, camera, distance, shadow) {
        viewer.shadows = true;
        viewer.terrainShadows = true;
        let fs = glsl(__makeTemplateObject(["\n    #define USE_CUBE_MAP_SHADOW true\nuniform sampler2D colorTexture;\n// \u6DF1\u5EA6\u7EB9\u7406\nuniform sampler2D depthTexture;\n// \u7EB9\u7406\u5750\u6807\nvarying vec2 v_textureCoordinates;\n\nuniform mat4 camera_projection_matrix;\n\nuniform mat4 camera_view_matrix;\n// \u89C2\u6D4B\u8DDD\u79BB\nuniform float far;\n//\u9634\u5F71\nuniform samplerCube shadowMap_textureCube;\n\nuniform mat4 shadowMap_matrix;\nuniform vec4 shadowMap_lightPositionEC;\nuniform vec4 shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness;\nuniform vec4 shadowMap_texelSizeDepthBiasAndNormalShadingSmooth;\n\nstruct zx_shadowParameters\n{\n    vec3 texCoords;\n    float depthBias;\n    float depth;\n    float nDotL;\n    vec2 texelStepSize;\n    float normalShadingSmooth;\n    float darkness;\n};\n\nfloat czm_shadowVisibility(samplerCube shadowMap, zx_shadowParameters shadowParameters)\n{\n    float depthBias = shadowParameters.depthBias;\n    float depth = shadowParameters.depth;\n    float nDotL = shadowParameters.nDotL;\n    float normalShadingSmooth = shadowParameters.normalShadingSmooth;\n    float darkness = shadowParameters.darkness;\n    vec3 uvw = shadowParameters.texCoords;\n\n    depth -= depthBias;\n    float visibility = czm_shadowDepthCompare(shadowMap, uvw, depth);\n    return czm_private_shadowVisibility(visibility, nDotL, normalShadingSmooth, darkness);\n}\n\nvec4 getPositionEC(){\n  return czm_windowToEyeCoordinates(gl_FragCoord);\n}\n\nvec3 getNormalEC(){\n    return vec3(1.);\n  }\n\n  vec4 toEye(in vec2 uv,in float depth){\n    vec2 xy=vec2((uv.x*2.-1.),(uv.y*2.-1.));\n    vec4 posInCamera=czm_inverseProjection*vec4(xy,depth,1.);\n    posInCamera=posInCamera/posInCamera.w;\n    return posInCamera;\n  }\n\n  vec3 pointProjectOnPlane(in vec3 planeNormal,in vec3 planeOrigin,in vec3 point){\n    vec3 v01=point-planeOrigin;\n    float d=dot(planeNormal,v01);\n    return(point-planeNormal*d);\n  }\n\n  float getDepth(in vec4 depth){\n    float z_window=czm_unpackDepth(depth);\n    z_window=czm_reverseLogDepth(z_window);\n    float n_range=czm_depthRange.near;\n    float f_range=czm_depthRange.far;\n    return(2.*z_window-n_range-f_range)/(f_range-n_range);\n  }\n\n  float shadow( in vec4 positionEC ){\n    vec3 normalEC=getNormalEC();\n    zx_shadowParameters shadowParameters;\n    shadowParameters.texelStepSize=shadowMap_texelSizeDepthBiasAndNormalShadingSmooth.xy;\n    shadowParameters.depthBias=shadowMap_texelSizeDepthBiasAndNormalShadingSmooth.z;\n    shadowParameters.normalShadingSmooth=shadowMap_texelSizeDepthBiasAndNormalShadingSmooth.w;\n    shadowParameters.darkness=shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness.w;\n    vec3 directionEC=positionEC.xyz-shadowMap_lightPositionEC.xyz;\n    float distance=length(directionEC);\n    directionEC=normalize(directionEC);\n    float radius=shadowMap_lightPositionEC.w;\n    if(distance>radius)\n    {\n      return 2.0;\n    }\n    vec3 directionWC=czm_inverseViewRotation*directionEC;\n\n    shadowParameters.depth=distance/radius-0.0003;\n    shadowParameters.nDotL=clamp(dot(normalEC,-directionEC),0.,1.);\n\n    shadowParameters.texCoords=directionWC;\n    float visibility=czm_shadowVisibility(shadowMap_textureCube,shadowParameters);\n    return visibility;\n  }\n\n  bool visible(in vec4 result)\n  {\n    result.x/=result.w;\n    result.y/=result.w;\n    result.z/=result.w;\n    return result.x>=-1.&&result.x<=1.&&result.y>=-1.&&result.y<=1.&&result.z>=-1.&&result.z<=1.;\n  }\n\n  void main(){\n    // \u5F97\u5230\u91C9\u8272 = \u7ED3\u6784\u4E8C\u7EF4(\u5F69\u8272\u7EB9\u7406,\u7EB9\u7406\u5750\u6807)\n    gl_FragColor=texture2D(colorTexture,v_textureCoordinates);\n    // \u6DF1\u5EA6 = (\u91C9\u8272 = \u7ED3\u6784\u4E8C\u7EF4(\u6DF1\u5EA6\u7EB9\u7406,\u7EB9\u7406\u5750\u6807))\n    float depth=getDepth(texture2D(depthTexture,v_textureCoordinates));\n    // \u89C6\u89D2 = (\u7EB9\u7406\u5750\u6807,\u6DF1\u5EA6)\n    vec4 viewPos=toEye(v_textureCoordinates,depth);\n    //\u4E16\u754C\u5750\u6807\n    vec4 wordPos=czm_inverseView*viewPos;\n    // \u865A\u62DF\u76F8\u673A\u4E2D\u5750\u6807\n    vec4 vcPos=camera_view_matrix*wordPos;\n    float near=.001*far;\n    float dis=length(vcPos.xyz);\n    if(dis>near&&dis<far){\n      //\u900F\u89C6\u6295\u5F71\n      vec4 posInEye=camera_projection_matrix*vcPos;\n      // \u53EF\u89C6\u533A\u989C\u8272\n      vec4 v_color=vec4(0.,1.,0.,.5);\n      vec4 inv_color=vec4(1.,0.,0.,.5);\n      if(visible(posInEye)){\n        float vis=shadow(viewPos);\n        if(vis>0.3){\n          gl_FragColor=mix(gl_FragColor,v_color,.5);\n        } else{\n          gl_FragColor=mix(gl_FragColor,inv_color,.5);\n        }\n      }\n    }\n  }\n"], ["\n    #define USE_CUBE_MAP_SHADOW true\nuniform sampler2D colorTexture;\n// \u6DF1\u5EA6\u7EB9\u7406\nuniform sampler2D depthTexture;\n// \u7EB9\u7406\u5750\u6807\nvarying vec2 v_textureCoordinates;\n\nuniform mat4 camera_projection_matrix;\n\nuniform mat4 camera_view_matrix;\n// \u89C2\u6D4B\u8DDD\u79BB\nuniform float far;\n//\u9634\u5F71\nuniform samplerCube shadowMap_textureCube;\n\nuniform mat4 shadowMap_matrix;\nuniform vec4 shadowMap_lightPositionEC;\nuniform vec4 shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness;\nuniform vec4 shadowMap_texelSizeDepthBiasAndNormalShadingSmooth;\n\nstruct zx_shadowParameters\n{\n    vec3 texCoords;\n    float depthBias;\n    float depth;\n    float nDotL;\n    vec2 texelStepSize;\n    float normalShadingSmooth;\n    float darkness;\n};\n\nfloat czm_shadowVisibility(samplerCube shadowMap, zx_shadowParameters shadowParameters)\n{\n    float depthBias = shadowParameters.depthBias;\n    float depth = shadowParameters.depth;\n    float nDotL = shadowParameters.nDotL;\n    float normalShadingSmooth = shadowParameters.normalShadingSmooth;\n    float darkness = shadowParameters.darkness;\n    vec3 uvw = shadowParameters.texCoords;\n\n    depth -= depthBias;\n    float visibility = czm_shadowDepthCompare(shadowMap, uvw, depth);\n    return czm_private_shadowVisibility(visibility, nDotL, normalShadingSmooth, darkness);\n}\n\nvec4 getPositionEC(){\n  return czm_windowToEyeCoordinates(gl_FragCoord);\n}\n\nvec3 getNormalEC(){\n    return vec3(1.);\n  }\n\n  vec4 toEye(in vec2 uv,in float depth){\n    vec2 xy=vec2((uv.x*2.-1.),(uv.y*2.-1.));\n    vec4 posInCamera=czm_inverseProjection*vec4(xy,depth,1.);\n    posInCamera=posInCamera/posInCamera.w;\n    return posInCamera;\n  }\n\n  vec3 pointProjectOnPlane(in vec3 planeNormal,in vec3 planeOrigin,in vec3 point){\n    vec3 v01=point-planeOrigin;\n    float d=dot(planeNormal,v01);\n    return(point-planeNormal*d);\n  }\n\n  float getDepth(in vec4 depth){\n    float z_window=czm_unpackDepth(depth);\n    z_window=czm_reverseLogDepth(z_window);\n    float n_range=czm_depthRange.near;\n    float f_range=czm_depthRange.far;\n    return(2.*z_window-n_range-f_range)/(f_range-n_range);\n  }\n\n  float shadow( in vec4 positionEC ){\n    vec3 normalEC=getNormalEC();\n    zx_shadowParameters shadowParameters;\n    shadowParameters.texelStepSize=shadowMap_texelSizeDepthBiasAndNormalShadingSmooth.xy;\n    shadowParameters.depthBias=shadowMap_texelSizeDepthBiasAndNormalShadingSmooth.z;\n    shadowParameters.normalShadingSmooth=shadowMap_texelSizeDepthBiasAndNormalShadingSmooth.w;\n    shadowParameters.darkness=shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness.w;\n    vec3 directionEC=positionEC.xyz-shadowMap_lightPositionEC.xyz;\n    float distance=length(directionEC);\n    directionEC=normalize(directionEC);\n    float radius=shadowMap_lightPositionEC.w;\n    if(distance>radius)\n    {\n      return 2.0;\n    }\n    vec3 directionWC=czm_inverseViewRotation*directionEC;\n\n    shadowParameters.depth=distance/radius-0.0003;\n    shadowParameters.nDotL=clamp(dot(normalEC,-directionEC),0.,1.);\n\n    shadowParameters.texCoords=directionWC;\n    float visibility=czm_shadowVisibility(shadowMap_textureCube,shadowParameters);\n    return visibility;\n  }\n\n  bool visible(in vec4 result)\n  {\n    result.x/=result.w;\n    result.y/=result.w;\n    result.z/=result.w;\n    return result.x>=-1.&&result.x<=1.&&result.y>=-1.&&result.y<=1.&&result.z>=-1.&&result.z<=1.;\n  }\n\n  void main(){\n    // \u5F97\u5230\u91C9\u8272 = \u7ED3\u6784\u4E8C\u7EF4(\u5F69\u8272\u7EB9\u7406,\u7EB9\u7406\u5750\u6807)\n    gl_FragColor=texture2D(colorTexture,v_textureCoordinates);\n    // \u6DF1\u5EA6 = (\u91C9\u8272 = \u7ED3\u6784\u4E8C\u7EF4(\u6DF1\u5EA6\u7EB9\u7406,\u7EB9\u7406\u5750\u6807))\n    float depth=getDepth(texture2D(depthTexture,v_textureCoordinates));\n    // \u89C6\u89D2 = (\u7EB9\u7406\u5750\u6807,\u6DF1\u5EA6)\n    vec4 viewPos=toEye(v_textureCoordinates,depth);\n    //\u4E16\u754C\u5750\u6807\n    vec4 wordPos=czm_inverseView*viewPos;\n    // \u865A\u62DF\u76F8\u673A\u4E2D\u5750\u6807\n    vec4 vcPos=camera_view_matrix*wordPos;\n    float near=.001*far;\n    float dis=length(vcPos.xyz);\n    if(dis>near&&dis<far){\n      //\u900F\u89C6\u6295\u5F71\n      vec4 posInEye=camera_projection_matrix*vcPos;\n      // \u53EF\u89C6\u533A\u989C\u8272\n      vec4 v_color=vec4(0.,1.,0.,.5);\n      vec4 inv_color=vec4(1.,0.,0.,.5);\n      if(visible(posInEye)){\n        float vis=shadow(viewPos);\n        if(vis>0.3){\n          gl_FragColor=mix(gl_FragColor,v_color,.5);\n        } else{\n          gl_FragColor=mix(gl_FragColor,inv_color,.5);\n        }\n      }\n    }\n  }\n"]));
        let postStage = new Cesium.PostProcessStage({
            fragmentShader: fs,
            uniforms: {
                camera_projection_matrix: camera.frustum.projectionMatrix,
                camera_view_matrix: camera.viewMatrix,
                far: function() {
                    return distance;
                },
                shadowMap_textureCube: function() {
                    shadow.update(Reflect.get(viewer.scene, "_frameState"));
                    return Reflect.get(shadow, "_shadowMapTexture");
                },
                shadowMap_matrix: function() {
                    shadow.update(Reflect.get(viewer.scene, "_frameState"));
                    return Reflect.get(shadow, "_shadowMapMatrix");
                },
                shadowMap_lightPositionEC: function() {
                    shadow.update(Reflect.get(viewer.scene, "_frameState"));
                    return Reflect.get(shadow, "_lightPositionEC");
                },
                shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness: function() {
                    shadow.update(Reflect.get(viewer.scene, "_frameState"));
                    var bias = shadow._pointBias;
                    return Cesium.Cartesian4.fromElements(bias.normalOffsetScale, shadow._distance, shadow.maximumDistance, 0.0, new Cesium.Cartesian4());
                },
                shadowMap_texelSizeDepthBiasAndNormalShadingSmooth: function() {
                    shadow.update(Reflect.get(viewer.scene, "_frameState"));
                    let bias = shadow._pointBias;
                    let texelStepSize = new Cesium.Cartesian2();
                    texelStepSize.x = 1.0 / shadow._textureSize.x;
                    texelStepSize.y = 1.0 / shadow._textureSize.y;
                    return Cesium.Cartesian4.fromElements(texelStepSize.x, texelStepSize.y, bias.depthBias, bias.normalShadingSmooth, new Cesium.Cartesian4());
                }
            }
        });
        viewer.scene.postProcessStages.add(postStage);
    }


    function CreateViewshed(viewer, position, options) {
        let spotLightCamera = new Cesium.Camera(viewer.scene);
        let context = viewer.scene.context;

        const hr = Cesium.Math.toRadians(options.hFOV);
        const vr = Cesium.Math.toRadians(options.vFOV);
        // 纵横比
        spotLightCamera.frustum.aspectRatio = (options.distance * Math.tan(hr / 2) * 2) / (options.distance * Math.tan(vr / 2) * 2);

        spotLightCamera.frustum.fov = Math.max(hr, vr)
        spotLightCamera.frustum.near = 1.0;
        spotLightCamera.frustum.far = options.distance;
        spotLightCamera.setView({
            destination: position,
            orientation: {
                heading: options.direction,
                pitch: Cesium.Math.toRadians(0),
                roll: Cesium.Math.toRadians(0)
            }
        });
        // Cesium.Cartesian3.clone(this._viewer.scene.globe.ellipsoid.geodeticSurfaceNormal(position, new Cesium.Cartesian3), spotLightCamera.up);
        let shadowOptions = {
            context: context,
            lightCamera: spotLightCamera,
            cascadesEnabled: false,
            isPointLight: true, //点光源
            pointLightRadius: options.distance,
            normalOffset: false,
            fromLightSource: false,
            softShadows: false
        };

        viewer.scene.shadowMap = new Cesium.ShadowMap(shadowOptions);
        let shadowMap = viewer.scene.shadowMap;
        shadowMap.enabled = true;
        shadowMap.debugShow = false; // 辅助圆
        shadowMap.show = true;
        shadowMap._distance = options.distance;
        shadowMap.maximumDistance = 10000;
        shadowMap.debugCreateRenderStates();
        shadowMap.dirty = true;
        viewer.scene.globe.shadows = Cesium.ShadowMode.fromCastReceive(true, true);
        viewer.scene.globe.show = true;
        viewer.scene.skyAtmosphere.show = false;

        // 创建postStage
        createPostStage(viewer, spotLightCamera, options.distance, shadowMap)
        // 绘制视锥线
        drawFrustumOutline(spotLightCamera)
    }

    function drawFrustumOutline(spotLightCamera) {
        let scratchRight = new Cesium.Cartesian3();
        let scratchRotation = new Cesium.Matrix3();
        let scratchOrientation = new Cesium.Quaternion();
        let direction = spotLightCamera.directionWC
        let up = spotLightCamera.upWC;
        let right = spotLightCamera.rightWC;
        right = Cesium.Cartesian3.negate(right, scratchRight);

        Cesium.Matrix3.setColumn(scratchRotation, 0, right, scratchRotation);
        Cesium.Matrix3.setColumn(scratchRotation, 1, up, scratchRotation);
        Cesium.Matrix3.setColumn(scratchRotation, 2, direction, scratchRotation);
        //计算视锥姿态
        let orientation = Cesium.Quaternion.fromRotationMatrix(scratchRotation, scratchOrientation);
        //视锥轮廓线图形
        let instanceOutline = new Cesium.GeometryInstance({
            geometry: new Cesium.FrustumOutlineGeometry({
                frustum: spotLightCamera.frustum,
                origin: pos,
                orientation: orientation
            }),
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.YELLOW),
                show: new Cesium.ShowGeometryInstanceAttribute(true)
            }
        });
        //添加图元
        viewer.scene.primitives.add(new Cesium.Primitive({
            geometryInstances: [instanceOutline],
            appearance: new Cesium.PerInstanceColorAppearance({
                flat: true,
                translucent: false
            })
        }));
    }

    function drawLine(start, end, color, width) {
        viewer.entities.add({
            position: start,
            polyline: {
                positions: [start, end],
                width: width,
                material: color,
            },
        })
    }


    /**
     * 视域分析
     */
    if (pos) {
        CreateViewshed(viewer, pos, options)
        alert("视域分析完成！观测点坐标：" + pos)
    } else {
        alert("请先点击地图确定观测点！")
    }

    /**
     * 输出分析结果报告（离散点信息）
     */
    let resultList = []

    // 从视锥离散出n个点存入points
    // 针对水平角度以及垂直角度进行遍历，基于极坐标系对每个视锥底面上的点求解三维地理坐标
    // bug描述：
    // 理想（错误/现在）算法：基于当前点的上北（y）右东（x）高度(z)进行xyz求解（可以理解为以camera建系独立计算）
    // 正确算法：基于全球上北右东坐标系（甚至没有右东这个说法，全球建系的x正向轴未知，盲猜可能是格林威治线），这也是为什么中国地区x值为负数
    // 误差来源：direction参数，如果该参数在任意点都指向北极，则误差消失
    let points = []
    for (let i=-options.vFOV/2+1; i<options.vFOV/2; i+=2) {
        for (let j=options.direction-options.hFOV/2+1; j<options.direction+options.hFOV/2; j+=2) {
            let _i = Cesium.Math.toRadians(i)
            let _j = Cesium.Math.toRadians(j)
            let point = Cesium.Cartesian3.fromElements(
                pos.x + options.distance * Math.cos(_j) * Math.cos(_i),
                pos.y + options.distance * Math.sin(_j) * Math.cos(_i),
                pos.z + options.distance * Math.sin(_i)
            )
            // viewer.entities.add({
            //     position: point,
            //     ellipsoid: {
            //         radii: new Cesium.Cartesian3(1, 1, 1),
            //         material: Cesium.Color.GREEN
            //     },
            // });
            points.push(point)
        }
    }
    console.log("points:" , points)

    // 遍历确定每一条射线的第一个交点
    points.forEach(i => {
        let direction = Cesium.Cartesian3.normalize(
            Cesium.Cartesian3.subtract(
                i,
                pos,
                new Cesium.Cartesian3()
            ),
            new Cesium.Cartesian3()
        );
        let ray = new Cesium.Ray(pos, direction);
        let res = viewer.scene.pickFromRay(ray, [])
        let distance = res !== undefined ? Cesium.Cartesian3.distance(res.position, pos) : options.distance+1
        if (res !== undefined && distance <= options.distance) {
            // drawLine(pos, res.position, Cesium.Color.GREEN, 1)
            // drawLine(res.position, i, Cesium.Color.RED, 1)
            resultList.push(res.position)
        } else {
            resultList.push(i)
            // drawLine(pos, i, Cesium.Color.GREEN, 1)
        }
    })
    console.log("resultList:", resultList)
}