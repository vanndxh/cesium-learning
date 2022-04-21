function optionEvent() {
    // 查看经纬度功能
    let entity = viewer.entities.add({
        label: {
            show: false,
            showBackground: true,
            font: "14px monospace",
            horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
            verticalOrigin: Cesium.VerticalOrigin.TOP,
            pixelOffset: new Cesium.Cartesian2(30, 0),
        },
    });
    let handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    handler.setInputAction(function(movement) {
        let cartesian = viewer.camera.pickEllipsoid(
            movement.endPosition,
            scene.globe.ellipsoid
        );
        if (cartesian) {
            let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            let longitudeString = Cesium.Math.toDegrees(
                cartographic.longitude
            ).toFixed(6);
            let latitudeString = Cesium.Math.toDegrees(
                cartographic.latitude
            ).toFixed(6);
            entity.position = cartesian;
            entity.label.show = true;
            entity.label.text =
                "Lon:" + (" " + longitudeString).slice(-10) + "\u00B0" +
                "\nLat:" + (" " + latitudeString).slice(-10) + "\u00B0"
        } else {
            entity.label.show = false;
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 实现鼠标点击确定观测点
    handler.setInputAction(function(e) {
        // 取模型表面的点而不是地球表面的点，并准备好经纬度等数据
        if (scene.mode !== Cesium.SceneMode.MORPHING) {
            let pickedObject = scene.pick(e.position);
            if (scene.pickPositionSupported && Cesium.defined(pickedObject)) {
                let cartesian = viewer.scene.pickPosition(e.position);
                if (Cesium.defined(cartesian)) {
                    let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                    let lng = Cesium.Math.toDegrees(cartographic.longitude);
                    let lat = Cesium.Math.toDegrees(cartographic.latitude);
                    let height = cartographic.height; // 模型高度
                    let mapPosition = {x:lng,y:lat,z:height};
                    pos = cartesian
                }
            }
        }
        let entity2 = viewer.entities.getById('viewPointEntity2');
        viewer.entities.remove(entity2)
        viewer.entities.add({
            id: 'viewPointEntity2',
            position: pos,
            ellipsoid: {
                radii: new Cesium.Cartesian3(5, 5, 5),
                material: Cesium.Color.YELLOW
            },
        });
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // 按键移动camera
    let flags = {
        looking : false,
        moveForward : false,
        moveBackward : false,
        moveUp : false,
        moveDown : false,
        moveLeft : false,
        moveRight : false
    };
    function getFlagForKeyCode(keyCode) {
        switch (keyCode) {
            case 'W'.charCodeAt(0):
                return 'moveForward';
            case 'S'.charCodeAt(0):
                return 'moveBackward';
            case 'Q'.charCodeAt(0):
                return 'moveUp';
            case 'E'.charCodeAt(0):
                return 'moveDown';
            case 'D'.charCodeAt(0):
                return 'moveRight';
            case 'A'.charCodeAt(0):
                return 'moveLeft';
            default:
                return undefined;
        }
    }
    document.addEventListener('keydown', function(e) {
        let flagName = getFlagForKeyCode(e.keyCode);
        if (typeof flagName !== 'undefined') {
            flags[flagName] = true;
        }
    }, false);
    document.addEventListener('keyup', function(e) {
        let flagName = getFlagForKeyCode(e.keyCode);
        if (typeof flagName !== 'undefined') {
            flags[flagName] = false;
        }
    }, false);
    let ellipsoid = viewer.scene.globe.ellipsoid;
    viewer.clock.onTick.addEventListener(function(clock) {
        let camera = viewer.camera;

        if (flags.looking) {
            let width = canvas.clientWidth;
            let height = canvas.clientHeight;

            // Coordinate (0.0, 0.0) will be where the mouse was clicked.
            let x = (mousePosition.x - startMousePosition.x) / width;
            let y = -(mousePosition.y - startMousePosition.y) / height;

            let lookFactor = 0.05;
            camera.lookRight(x * lookFactor);
            camera.lookUp(y * lookFactor);
        }

        // Change movement speed based on the distance of the camera to the surface of the ellipsoid.
        let cameraHeight = ellipsoid.cartesianToCartographic(camera.position).height;
        let moveRate = cameraHeight / 100.0;

        if (flags.moveForward) {
            camera.moveForward(moveRate);
        }
        if (flags.moveBackward) {
            camera.moveBackward(moveRate);
        }
        if (flags.moveUp) {
            camera.moveUp(moveRate);
        }
        if (flags.moveDown) {
            camera.moveDown(moveRate);
        }
        if (flags.moveLeft) {
            camera.moveLeft(moveRate);
        }
        if (flags.moveRight) {
            camera.moveRight(moveRate);
        }
    });
}