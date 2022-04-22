function go (type) {
    if (type === 2) {
        viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(120.25, 29.7, 30000)})
    } else if (type === 1) {
        viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(120.5, 29, 1000000) })
    } else if (type === 0) {
        viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(100.48, 30, 19000000) })
    } else if (type === 3) {
        viewer.flyTo(tileset)
    }
}