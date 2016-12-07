function getDevices() {
    navigator.mediaDevices.enumerateDevices()
        .then(function (MediaDeviceInfo) {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                console.log("enumerateDevices() not supported.");


                return;
            }

// List cameras and microphones.

            navigator.mediaDevices.enumerateDevices()
                .then(function (devices) {
                    devices.forEach(function (device) {
                        console.log(device.kind + ": " + "label: " + device.label +
                            " id = " + device.deviceId);
                        //if(device.label != "De")
                    });
                })
                .catch(function (err) {
                    console.log(err.name + ": " + err.message);
                });

        });
}

