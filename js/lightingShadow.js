/**
 * @author vanndxh
 * @date 2022-4-21
 * @lastModified 2022-4-22
 * @param viewer 要创建分析所在viewer
 * @param options 传入参数，包含speed
 * @param pos 观测点
 */

function lightingShadowInit(viewer, options, pos) {
    if (!pos) {
        alert("请先确定测量点")
    } else {
        // 实现日照分析demo
        scene.globe.enableLighting = true;
        viewer.shadows = true;
        viewer.clock.multiplier = options.speed;
        viewer.clock.shouldAnimate = true
        // 准备分析结果
        let cartographic = Cesium.Cartographic.fromCartesian(pos);
        let lon = Cesium.Math.toDegrees(cartographic.longitude);
        let lat = Cesium.Math.toDegrees(cartographic.latitude);
        let height = cartographic.height;
        let lightingTime = 24 * (Math.acos((Math.tan(lat*0.0175))*(Math.tan(23.5*0.0175)))) / Math.PI

        let now = new Date()
        let month = (now.getMonth() >= 1 && now.getMonth() <= 9) ? ("0" + now.getMonth().toString()) : now.getMonth()
        let day = (now.getDay() >= 1 && now.getDay() <= 9) ? ("0" + now.getDay().toString()) : now.getDay()
        let hour = (now.getHours() >= 1 && now.getHours() <= 9) ? ("0" + now.getHours().toString()) : now.getHours()
        let minute = (now.getMinutes() >= 1 && now.getMinutes() <= 9) ? ("0" + now.getMinutes().toString()) : now.getMinutes()
        let second = (now.getSeconds() >= 1 && now.getSeconds() <= 9) ? ("0" + now.getSeconds().toString()) : now.getSeconds()
        let formatTime = now.getFullYear() + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second
        // 输出对象
        let lightingAnalysis = {}
        lightingAnalysis.title = "日照分析结果"
        lightingAnalysis.lon = lon
        lightingAnalysis.lat = lat
        lightingAnalysis.height = height
        lightingAnalysis.type = "累计"
        lightingAnalysis.outputTime = "真太阳时"
        lightingAnalysis.analyseTime = formatTime
        lightingAnalysis.lightingTime = lightingTime.toString().slice(0, 4) + "h"

        console.log(lightingAnalysis)
    }
}