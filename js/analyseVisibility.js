/**
 * @author vanndxh
 * @date 2022-4-21
 * @lastModified 2022-4-24
 * @param viewer 要创建分析所在viewer
 * @param pos 观测点
 */
function analyseVisibility (viewer, pos) {
    let resultList = []
    // 开启地形深度监测
    viewer.scene.globe.depthTestAgainstTerrain = true;

    // 设定初始视角位置点
    let viewPoint = pos
    // let viewPoint = Cesium.Cartesian3.fromDegrees(115.77774943, 40.51669238, 1000);

    // 视角位置创建坐标轴
    let transform = Cesium.Transforms.eastNorthUpToFixedFrame(viewPoint);
    let modelMatrixPrimitive = viewer.scene.primitives.add(new Cesium.DebugModelMatrixPrimitive({
        modelMatrix: transform,
        length: 10.0
    }));

    // 世界坐标转换为投影坐标
    let webMercatorProjection = new Cesium.WebMercatorProjection(viewer.scene.globe.ellipsoid);
    let viewPointWebMercator = webMercatorProjection.project(Cesium.Cartographic.fromCartesian(viewPoint));

    // 排除碰撞监测的对象
    let objectsToExclude = [modelMatrixPrimitive];

    // 目标点集合
    let TargetPoints = [];

    // 视域点和目标点的距离
    let radius = 0;

    // 计算0°和90°之间的目标点
    for (let i = 0; i <= 10; i++) {
        let linePoints = [];//记录一条线上的所有目标点
        let pointsNum = 15;//该方向插值点数
        let lineDis = 200;//每两个插值点之间的距离m1
        for (let index = 0; index < pointsNum; index++) {
            radius = index * lineDis;
            // 度数转弧度
            let radians = Cesium.Math.toRadians(i);
            // 计算目标点
            let toPoint = new Cesium.Cartesian3(viewPointWebMercator.x + radius * Math.cos(radians), viewPointWebMercator.y + radius * Math.sin(radians), 0);
            // 投影坐标转世界坐标
            toPoint = webMercatorProjection.unproject(toPoint);
            // TargetPoints.push(Cesium.Cartographic.toCartesian(toPoint.clone()));
            let m_cartesian3 = Cesium.Cartographic.toCartesian(toPoint.clone());
            let m_ellipsoid = viewer.scene.globe.ellipsoid;
            let m_cartographic = m_ellipsoid.cartesianToCartographic(m_cartesian3);
            let m_height = viewer.scene.globe.getHeight(m_cartographic);
            let m_point = Cesium.Cartesian3.fromDegrees(m_cartographic.longitude / Math.PI * 180, m_cartographic.latitude / Math.PI * 180, m_height);
            linePoints.push({
                data: m_point,
                show: true
            });
        }
        TargetPoints.push({
            id: i,
            points: linePoints
        });
    }
    pickFromRay();

    /**
     * 依赖函数
     */
    function pickFromRay() {
        for (let i = 0; i < TargetPoints.length; i++) {
            let flag = false
            let e





            /*
            let cur_LinePoints = TargetPoints[i].points;
            cur_LinePoints.forEach(element => {
                // 计算射线的方向&#xff0c;目标点left 视域点right
                let direction = Cesium.Cartesian3.normalize(
                    Cesium.Cartesian3.subtract(
                        element.data,
                        viewPoint,
                        new Cesium.Cartesian3()
                    ),
                    new Cesium.Cartesian3()
                );
                // 建立射线
                let ray = new Cesium.Ray(viewPoint, direction);
                let res = scene.globe.pick(ray, scene)
                if (res !== undefined && res !== null) {
                    element.show = false;
                    if (!flag) {
                        resultList.push(element.data)
                        flag = true
                    }
                }
                // let result = viewer.scene.pickFromRay(ray, objectsToExclude); // 计算交互点&#xff0c;返回第一个
                // let buffer = ReturnDistance(element.data, result.position);
                // if (buffer > 10) {
                //     element.show = false;
                // }
            });
            if (!flag) {
                resultList.push()
            }
             */
        }
        console.log(resultList)
        console.log(TargetPoints)
        drawViewshedLine(TargetPoints);
    }

    function drawViewshedLine(data) {
        for (let index = 0; index < data.length; index++) {
            const element = data[index].points;
            let startIndex = 0;
            for (let i = 0; i < element.length; i++) {
                let defaultColor = new Cesium.Color(0.1, 1, 0.1, 0.3);
                // console.log(&#34;第&#34; + i + &#39;个点的起点是&#xff1a;&#39; + startIndex);
                const m_linestart = element[startIndex];
                let m_lineshow = m_linestart.show;
                const m_lineCurrent = element[i];
                const m_lineEnd = element[i + 1];
                if (m_lineEnd && m_lineCurrent.show != m_lineEnd.show) {
                    if (!m_lineshow) {
                        defaultColor = new Cesium.Color(1, 0.1, 0.1, 0.3);
                    }
                    viewer.entities.add({
                        polyline: {
                            positions: [m_linestart.data, m_lineEnd.data],
                            width: 2,
                            material: defaultColor,
                            clampToGround: true
                        }
                    });
                    startIndex = i + 1;
                }
                else if (!m_lineEnd) {
                    if (!m_lineshow) {
                        defaultColor = new Cesium.Color(1, 0.1, 0.1, 0.3);
                    }
                    viewer.entities.add({
                        polyline: {
                            positions: [m_linestart.data, m_lineCurrent.data],
                            // arcType: Cesium.ArcType.NONE,
                            width: 2,
                            material: defaultColor,
                            // depthFailMaterial: defaultColor,
                            clampToGround: true
                        }
                    });
                }

            }
        }
    }

    //空间两点距离计算函数
    function ReturnDistance(pos0, pos1) {
        let distance = 0;
        let point1cartographic = Cesium.Cartographic.fromCartesian(pos0);
        let point2cartographic = Cesium.Cartographic.fromCartesian(pos1);
        // 根据经纬度计算出距离
        let geodesic = new Cesium.EllipsoidGeodesic();
        geodesic.setEndPoints(point1cartographic, point2cartographic);
        let s = geodesic.surfaceDistance;
        return s.toFixed(2);
    }

    // 处理交互点
    function showIntersection(result, destPoint, viewPoint) {
        // 如果是场景模型的交互点&#xff0c;排除交互点是地球表面
        if (Cesium.defined(result) && Cesium.defined(result.object)) {
            drawLine(result.position, viewPoint, Cesium.Color.GREEN); // 可视区域
            drawLine(result.position, destPoint, Cesium.Color.RED); // 不可视区域
        } else {
            drawLine(viewPoint, destPoint, Cesium.Color.GREEN);
        }
    }
}