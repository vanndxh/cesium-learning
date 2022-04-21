/**
 * state
 */
const tokenYX = "cd3f3677-ffee-4e63-a33f-ec2cb31ffae3"
const tokenZJ = "04a4b863-0c13-48df-a054-0aa35e599bbf"
const proxyPath = "https://ditu.zjzwfw.gov.cn:443/"

function loadResources() {
    // 地图影像
    viewer.imageryLayers.addImageryProvider(
        new Cesium.WebMapTileServiceImageryProvider({
            url: proxyPath + "services/wmts/imgmap/default/oss?request=getcapabilities&service=wmts&token=" + tokenYX,
            layer: "imgmap",
            style: "default",
            format: "image/png",
            tileMatrixSetID: "esritilematirx",
            //minimumLevel:9,
            maximumLevel: 20,//控制最大级别为20
            //tilingScheme:new Cesium.GeographicTilingScheme(),//2000坐标系
            tilingScheme:new Cesium.GeographicTilingScheme({
                ellipsoid:Cesium.Ellipsoid.WGS84,
                rectangle:new Cesium.Rectangle(-Math.PI,-Math.PI*3/2,Math.PI,Math.PI/2),
                numberOfLevelZeroTilesX:1,
                numberOfLevelZeroTilesY:1
            }),
            credit: new Cesium.Credit("浙江省影像")
        })
    )

    // 地图注记
    viewer.imageryLayers.addImageryProvider(
        new Cesium.WebMapTileServiceImageryProvider({
            url: proxyPath + "services/wmts/imgmap_lab/default/oss?request=getcapabilities&service=wmts&token=" + tokenZJ,
            layer: "imgmap_lab",
            style: "default",
            format: "image/png",
            tileMatrixSetID: "esritilematirx",
            //minimumLevel:11,
            maximumLevel: 20,//控制最大级别为20,
            //tilingScheme:new Cesium.GeographicTilingScheme(),//2000坐标系
            tilingScheme:new Cesium.GeographicTilingScheme({
                ellipsoid:Cesium.Ellipsoid.WGS84,
                rectangle:new Cesium.Rectangle(-Math.PI,-Math.PI*3/2,Math.PI,Math.PI/2),
                numberOfLevelZeroTilesX:1,
                numberOfLevelZeroTilesY:1
            }),
            credit: new Cesium.Credit("浙江省影像注记")
        })
    )

    // 加载地形
    viewer.terrainProvider = Cesium.createWorldTerrain({
        requestWaterMask : true, // required for water effects
        requestVertexNormals : false // required for terrain lighting
    });

    // 3d tiles
    let tileset = scene.primitives.add(
        new Cesium.Cesium3DTileset({
            url: "http://172.17.70.209:3866/Smartearth/server/SG/anji.397940/tokens(eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImZhbnl1bmxpYW5nIn0.6d019Mi2PbKZ6yY6uRiyuHNq4x2cW5zKugSHBm0iHLo)/b3dm/anji.397940/tileset.json"
        })
    )

    return tileset
}