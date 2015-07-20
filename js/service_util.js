plant.service('service_utility', function ($q, $http) {

    var service_utility = this;
    /**
     * 注入 authorization 的 token
     * @method injectAuthToken
     */
    this.injectAuthToken = function (token) {
        this.AuthToken = token;
    };

    /**
     * 從相機或是相簿取出圖片 type:0相簿 1 照相機 edit:是否開啟編輯功能
     * @method GetCameraPicture
     *
     */
    this.GetCameraPicture = function (type, edit) {
        //先做出 promise
        var defer = $q.defer();

        //如果沒有指定 type 就要跳出 action sheet 問他要哪種
        if (typeof (type) === 'number') {
            camera(type);
        } else {
            var hidesheet = $ionicActionSheet.show({
                buttons: [{
                        text: $translate.instant('gallery')
                },
                    {
                        text: $translate.instant('camera')
                }],

                titleText: $translate.instant('choose_picture'),
                cancelText: $translate.instant('cancel'),
                cancel: function () {
                    hidesheet();
                },
                buttonClicked: function (index) {
                    hidesheet();
                    camera(index);
                }
            });
        }

        //select source from actionsheet
        function camera(index) {
            //設定照片截取的尺寸相關選項
            var option = {
                destinationType: Camera.DestinationType.FILE_URI,
                sourceType: index,
                allowEdit: edit,
                quality: 45,
                encodingType: Camera.EncodingType.JPEG,
                mediaType: Camera.MediaType.PHOTO,
                saveToPhotoAlbum: false,
                targetWidth: 1080,
                targetHeight: 1080
            };

            //如果不是從 wifi 上傳就把 比例降低
            if (navigator.connection.type !== window.Connection.WIFI || edit) {
                option.targetWidth = 1080;
                option.targetHeight = 1080;
                option.quality = 30;
            }
            //取得圖片
            navigator.camera.getPicture(function (data) {
                defer.resolve(data);
            }, function (message) {
                //如果是沒有開通相機存取權限就要跳出 modal
                if (message.indexOf('access') > -1) {
                    $scope.OpenPhotoAlertModal();
                }
                defer.reject(message);
            }, option);
        }
        return defer.promise;
    };

    /**
     * 儲存檔案到 folder_name 底下 並刪除 delete_url
     * @method copyFile
     * @param {string} file_uri 檔案路徑
     * @param {string} folder_name 要存在本地的資料夾名稱
     */
    this.copyFile = function (file_uri, folder_name) {
        var defer = $q.defer();

        //第一步先取得目標檔案的 file entry
        window.resolveLocalFileSystemURL(file_uri, FileEntry, err);

        //錯誤處理機制回傳錯誤上去
        function err(e) {
            defer.reject(e);
        }

        //取得檔案的 file entry
        function FileEntry(entry) {

            var path = MakeFilePath();

            //取得即將要複製到的地方的 directory entry
            window.resolveLocalFileSystemURL(path, storeDir, err);

            //取得成功
            function storeDir(dir) {
                //往下取得所要存到的資料夾，如果沒有該資料夾就創一個出來
                dir.getDirectory(folder_name, {
                    create: true,
                    excusive: false
                }, getfolderdir, err);
            }

            //進來目標資料夾裡面了
            function getfolderdir(dir) {

                //把原本的檔案的 entry 呼叫 copy 的功能到這個資料夾裡面
                entry.copyTo(dir, makeid(10), copySuccess, err);

                function copySuccess(entry) {
                    //成功了
                    defer.resolve(entry.fullPath);
                }

            }
        }
        return defer.promise;
    };

    /**
     * @metod deleteFile
     * @param {string} file_uri_short 檔案路徑 例如 /avatar/wefwfvr3
     */
    this.deleteFile = function (file_uri_short) {

        var defer = $q.defer();

        //先把 file uri parse 到正確的路徑過去
        var file_url = MakeFilePath(file_uri_short);

        //解開路徑取得檔案的 entry
        window.resolveLocalFileSystemURL(file_url, resolveSuccess, resolveerror);

        //成功取得檔案的 entry
        function resolveSuccess(data) {
            if (data.isFile) {
                data.remove();
                defer.resolve();
            } else {
                defer.reject();
            }
        }

        //失敗處理
        function resolveerror() {
            defer.reject();
        }

        return defer.promise;
    };

    /**
     * 下載資料到指定的資料夾內
     * @method downloadFile
     */
    this.downloadFile = function (web_url, folder_name) {
        //檢查是否下載完成的promiss
        var deferred = $q.defer();
        var web_url = encodeURI(web_url);
        if (!web_url || !folder_name) {
            deferred.reject();
        }
        //根據裝置的不同產生不同的檔案路徑
        var path = MakeFilePath();
        //取得檔案根目錄路徑，開始下載圖片
        window.resolveLocalFileSystemURL(path, getStorage, DownloadAvatarError);

        //定義錯誤的 function 
        function DownloadAvatarError(e) {
            //console.log('下載圖片流程失敗', e);
            deferred.reject(e);
        }

        //取得資料夾權限
        function getStorage(dir) {
            //console.log('取得根目錄 dir entry');
            dir.getDirectory(folder_name, {
                create: true,
                exclusive: false
            }, getFileDir, DownloadAvatarError);
        }

        //檢查需不需要移除檔案若沒有指定移除的檔案就直接下載
        function getFileDir(dir) {
            startDownload(dir);
        }

        //下載檔案
        function startDownload(dir) {
            //console.log('開始下載檔案');
            var fileTransfer = new FileTransfer();
            //var uri = encodeURI(web_url);
            var uri = web_url;
            fileTransfer.download(
                uri,
                dir.nativeURL + makeid(10),
                function (entry) {
                    //console.log('download picture  success', entry.fullPath, entry.nativeURL);
                    deferred.resolve(entry.fullPath);
                },
                DownloadAvatarError,
                true);
        }
        return deferred.promise;
    };



    this.uploadFile = function (web_url, photo_url, param_obj) {
        var defer = $q.defer();
        var fileoptions = new FileUploadOptions();
        //設定圖片上傳的options
        fileoptions.fileKey = "photo";
        fileoptions.fileName = 'photo.jpg';
        fileoptions.mimeType = "image/jpeg";
        fileoptions.trustAllHosts = true;
        fileoptions.chunkedMode = false;
        fileoptions.headers = {
            'Authorization': 'Token ' + this.AuthToken
        };
        //ios 就打開 chunk mode
        if (ionic.Platform.isIOS()) {
            fileoptions.chunkedMode = true;
        }
        //如果有 參數就放進去
        if (param_obj) {
            fileoptions.params = param_obj;
        }

        //傳送照片
        var ft = new FileTransfer();
        ft.upload(photo_url, web_url, uploadPhoto_success, uploadPhoto_fail, fileoptions);

        //上傳的時候回傳進度給外面
        ft.onprogress = function (result) {
            defer.notify(result);
        };

        //傳送成功
        function uploadPhoto_success(data) {
            defer.resolve(data);
        }

        //傳送失敗
        function uploadPhoto_fail(err) {
            defer.reject(err);
        }
        return defer.promise;

    };

    this.getGPS = function () {
        var defer = $q.defer();
        navigator.geolocation.getCurrentPosition(geolocationSuccess, geolocationerror, {
            timeout: 15000,
            enableHighAccuracy: true
        });
        //取得 gps 資訊然後回報 {lat:22.2313, lng:120.234234}
        function geolocationSuccess(position) {
            defer.resolve({
                lat: position.coords.latitude,
                lng: position.coords.longitude
            });
        }

        function geolocationerror(e) {
            defer.reject(e);
        }

        return defer.promise;
    };

    //筆記：如何用 ip address 找到 geolocation 
    //首先要找到 router 的 ip address 
    //https://github.com/vallieres/cordova-plugin-get-router-ip-address
    //找到 geolocation 的 api
    //http://www.ipinfodb.com/ip_location_api_json.php

    //上傳電話簿到 server 裡面
    this.uploadContacts = function () {
        //maker defer 
        var defer = $q.defer();
        //make option
        var option = new ContactFindOptions;
        option.multiple = true;
        var fields = ["*"];
        //find contacts from plugin 
        navigator.contacts.find(fields, getContactSuccess, error, option);

        //find contacts success
        function getContactSuccess(contacts) {
            //upload contacts
            $http.post(WebUrl.contactupload, contacts).success(uploadContactSuccess).error(error);
        }

        //upload contacts success
        function uploadContactSuccess() {
            defer.resolve();
        }

        //when error reject defer 
        function error() {
            defer.reject();
        }

        return defer.promise;

    };


    /**
     * upload app version to server
     * @method UploadAppVersion
     */
    this.uploadAppVersion = function () {
        $http.post(WebUrl.updateAppVersion, {
            app_version: WebUrl.appversion
        }).error(function () {});
    };



    //====================================================

    function MakeFilePath(filepath) {
        var path;
        switch (device.platform.toLowerCase()) {
            case 'ios':
                path = cordova.file.documentsDirectory;
                break;
            case 'android':
                //如果有 filepath 表示要串網址的所以要拿出root directory
                if (filepath) {
                    path = cordova.file.externalRootDirectory;
                } else {
                    path = cordova.file.externalApplicationStorageDirectory;
                }
                break;
        }

        if (filepath) {
            if (filepath.indexOf('/') === 0) {
                filepath = filepath.substring(1, filepath.length);
            }
            return path + filepath;
        } else {
            return path;
        }
    }

    function makeid(num) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < num; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    }

    //指向 global
    this.makeid = makeid;
    this.MakeFilePath = MakeFilePath;

    window.service_utility = this;
});
