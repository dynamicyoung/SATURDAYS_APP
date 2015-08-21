plant
    .controller('PlantController', function ($scope, $rootScope, $timeout, $state, $http, $interval, $location, $translate, $document, plantService, cartService, service_utility) {
        //初始化變數

        $scope.menuShow = false; //menu開關
        $scope.cartShow = false; //cart開關
        $scope.language = $translate.preferredLanguage();
        $scope.plants; //產品列表
        $scope.pots;
        $scope.plantsPage; //目前頁面上的產品列表
        $scope.cart; //購物車列表
        $scope.pictureModal = false;
        $rootScope.redirect = false;
        //目前第幾頁
        $scope.page = 1;
        $scope.totalPage;
        //一頁最多顯示幾個

        //取得目前頁數的data
        $scope.progress = 0;

        $scope.statusData = {
            0: $translate.instant('submit'),
            1: $translate.instant('submit_loading'),
            2: $translate.instant('submit_success'),
            3: $translate.instant('submit_fail')
        };

        //打開圖片預覽Modal
        $scope.openPictureModal = function (url) {
            $scope.pictureModal = true;
            $scope.picture = url;
        };
        //關閉圖片預覽Modal
        $scope.closePictureModal = function () {
            $scope.pictureModal = false;
            $rootScope.$broadcast('destroyPicture');
        };

        //切換state時
        $rootScope.$on('$stateChangeSuccess',
            function (e, toState, toParams, fromState, fromParams) {
                progressJs().end();

                function scrollTo(value) {
                    $timeout(function () {
                        window.scrollTo(0, value);
                    }, 100);
                }
                if (fromState.name === 'domain' || fromState.name === 'products' || fromState.name === 'pots') {
                    $rootScope.memoryTop = $(window).scrollTop();
                }
                if (toState.name === 'domain' || toState.name === 'products' || toState.name === 'pots') {
                    scrollTo($rootScope.memoryTop);
                } else {
                    scrollTo(0);
                }
                //跳轉頁面時關閉side-menu
                $scope.hideSide();
            }
        );

        //重新導向回首頁
        $scope.reload = function () {
            window.location.href = '/';
        };
        //轉換state
        $scope.goState = function (state, data) {
            $state.go(state, data);
        };

        $scope.makeImagesPath = function (product) {
            if (product.hasOwnProperty('images_local')) {
                return service_utility.MakeFilePath(product.images_local[0]);
            } else if (product.hasOwnProperty('images')) {
                return product.images[0];
            } else {
                return 'img/notfound.jpg';
            }
        };

        $scope.makeDetailPath = function (product) {
            if (product) {
                var images = [];
                if (product.hasOwnProperty('images_local')) {
                    var images_local = [];
                    angular.forEach(product.images_local, function (image, key) {
                        images_local.push(service_utility.MakeFilePath(image));
                    });
                    images = images_local;
                } else {
                    images = product.images;
                }

                if (images.length > 1) {
                    images = images.slice(1, images.length);
                } else if (images.length === 0) {
                    images.push('img/notfound.jpg');
                }
                return images;
            }
        };

        //等到整個cordova好之後 才初始化
        $document.bind('deviceready', function (event) {
            $scope.initProducts();
        });

        //取得首頁產品列表
        $scope.initProducts = function () {
            //檢查有沒有付款成功的參數：
            var promise = plantService.initial.init();
            promise.then(function () {
                $scope.products = plantService.products;
                $scope.plants = plantService.plants;
                $scope.pots = plantService.pots;
                $rootScope.$broadcast('initProductsComplete');
                navigator.splashscreen.hide();
                //初始化產品列表後才去抓購物車比對資料
                $scope.initCart();
            });
        };


        $scope.$on('refreshPage', function () {
            console.log('更新畫面');
            $scope.$broadcast('iso-option', $scope.isoOptions);
            $scope.products = plantService.products;
            $scope.plants = plantService.plants;
            $scope.pots = plantService.pots;
        });


        $scope.updateProducts = function () {
            $scope.products = plantService.products;
            $scope.plants = plantService.plants;
            $scope.pots = plantService.pots;
        }

        //iso
        $scope.isoOptions = {
            "itemSelector": ".item",
            "transitionDuration": 0,
            "masonry": {
                "gutter": 50
            }
        };

        $scope.imgLoadedEvents = {
            always: function (instance) {
                $scope.$broadcast('iso-option', $scope.isoOptions);
            },
            done: function (instance) {
                var parent = angular.element(instance.elements[0]);
                parent.removeClass('loading').addClass('ready');
            },
            fail: function (instance) {
                var parent = angular.element(instance.elements[0]);
                parent.removeClass('loading').addClass('error');
            },
            progress: function (instance, image) {
                var parent = angular.element(instance.elements[0]);
                parent.addClass('loading');
            }
        };


        $scope.viewLoadedEvents = {
            always: function (instance) {},
            done: function (instance) {
                //畫面LOADING結束
                console.log('畫面Loading完畢');
                $scope.imgLoadedCount = 0;
                progressJs().end();
            },
            fail: function (instance) {},
            progress: function (instance, image) {
                if (instance.images.length > 0) {
                    if (image.isLoaded) {
                        $scope.imgLoadedCount++;
                        var progress = Math.floor(($scope.imgLoadedCount / instance.images.length) * 100);
                        progressJs().start().set(progress);
                    }
                }
            }
        };

        //用id找植物名字
        $scope.findProductById = function (id) {
            return plantService.findProductById(id);
        };

        $scope.findProduct = function (id) {
            return plantService.findProductById(id);
        };

        //取得購物車列表
        $scope.initCart = function () {
            var promise = cartService.initCart();
            promise.then(function () {
                $scope.cart = cartService.cart;
            });
        };
        //加入購物車
        $scope.addCart = function (id, quantity) {
            //加入購物車：回傳新的cart之後更新
            if (id && !isNaN(quantity)) {
                var promise = cartService.addCart(id, quantity);
                promise.then(function () {
                    $scope.cart = cartService.cart;
                });
            }
        };



        //取得目前總價
        $scope.getTotal = function () {
            var total = cartService.getTotal();
            return total;
        };

        //取得小計
        $scope.getSubtotal = function (price, amount) {
            var result = price * amount;
            return isNaN(result) ? 0 : result;
        };

        //移除購物車產品
        $scope.removeCart = function (id) {
            //加入購物車：回傳新的cart之後更新
            var promise = cartService.removeCart(id);
            promise.then(function (data) {
                $scope.cart = cartService.cart;
            });
        };
        $scope.removeAllCart = function (id) {
            //加入購物車：回傳新的cart之後更新
            var promise = cartService.removeAll();
            promise.then(function () {
                $scope.cart = cartService.cart;
            });
        };

        //疊加購物車數量 + 打開購物車
        $scope.plusCart = function (id, quantity) {
            if (id && !isNaN(quantity)) {
                //加入購物車：回傳新的cart之後更新
                var plus = cartService.plusCart(id, quantity);
                $scope.addCart(id, plus);
                $scope.cartShow = true;
            }
        };

        //打開側邊選單
        $scope.openMenu = function () {
            $scope.menuShow = true;
            $scope.cartShow = false;
        };
        //打開購物車
        $scope.openCart = function () {
            $scope.menuShow = false;
            $scope.cartShow = true;
        };
        //關閉側邊視窗:當點擊blur時
        $scope.hideSide = function () {
            $scope.menuShow = false;
            $scope.cartShow = false;
        };
        //收到broadcast時清空購物車
        $rootScope.$on('removeAllCart', function () {
            $scope.removeAllCart();
        });


        //分享按鈕的事件
        $scope.share = function (name) {
            switch (name) {
            case 'facebook':
                shareFacebook()
                break;
            case 'google':
                shareGoogle();
                break;
            case 'twitter':
                shareTwitter();
                break;
            case 'weibo':
                shareWeibo();
                break;
            };
            return false;
        };
        //        $scope.initProducts();
        window.plantScope = $scope;

    })
    .controller('DetailController', function ($scope, $rootScope, $state, $stateParams, plantService) {
        //產品內頁data
        $scope.detail;
        //初始化頁面的數量
        $scope.quantity = 1;
        //傳送狀態
        $scope.status = 0;
        //水分點數
        $scope.waterPoint;
        //陽光點數
        $scope.sunPoint;
        //到貨請通知我的顯示
        $scope.showEmail = false;
        //相關產品
        $scope.suggestions = [];

        //toggle email的欄位
        $scope.toggleEmail = function () {
            $scope.showEmail = !$scope.showEmail;
        };
        //到貨請通知我的顯示
        $scope.sendEmail = function (id, email) {
            $scope.status = 1;
            var data = {
                'id': id,
                'email': email
            };
            var promise = plantService.emailNotify(data);
            promise.then(function (result) {
                if (result) {
                    $scope.status = 2;
                } else {
                    $state.go('error');
                }
            });
        };


        //初始化detail:用id從產品列表找產品
        $scope.initDetail = function () {
            //用一開始取得的產品列表比對
            $scope.detail = plantService.findProductByName($stateParams.productName);
        };

        //如果他是reload畫面的話，等到初始化產品列表後再init
        $rootScope.$on('initProductsComplete', function (event) {
            console.log('初始化detail');
            $scope.initDetail();
        });
        $scope.initDetail();
        window.plantDetail = $scope;

    })
    //結帳流程Controller
    .controller('CheckoutController', function ($scope, $rootScope, $stateParams, $state, $location, $translate, checkoutService, cartService, plantService) {

        //animation:目前步驟的方向(左/右)
        $scope.stepWay;
        //是否同購買人的開關
        $scope.copyToggle = false;
        //傳送狀態：0:未傳送 1:傳送中 
        $scope.status = 0;
        //寄送方式：ng-option
        $scope.options = [
            {
                label: $translate.instant('deliver_taiwan'),
                value: 0,
                price: 65
            },
            {
                label: $translate.instant('deliver_foreign'),
                value: 1,
                price: 180
            }
        ];
        //寄送地區初始值
        $scope.shipping_area = $scope.options[0];
        //訂單編號
        $scope.order_number = '';
        //預設付款方式為信用卡
        $scope.payment_method = 0;

        //個人資料data
        $scope.data = {
            'addressee': $scope.addressee, //收件人：姓名
            'addressee_mobile': $scope.addressee_mobile, //收件人：電話
            'address': $scope.address, //收件人：地址
            'name': $scope.name, //購買人：姓名
            'mobile': $scope.mobile, //購買人：電話
            'email': $scope.email, //購買人：地址
            'payment_method': $scope.payment_method //付款方式
        };
        //驗證部分
        $scope.check = [
            {
                'title': 'addressee',
                'valid': '', //收件人：姓名
                'info': '',
                'role': $translate.instant('receiver')
                },
            {
                'title': 'addressee_mobile',
                'valid': '', //收件人：電話
                'info': '',
                'role': $translate.instant('receiver')
                },
            {
                'title': 'address',
                'valid': '', //收件人：地址
                'info': '',
                'role': $translate.instant('receiver')
                },
            {
                'title': 'name',
                'valid': '', //購買人：姓名
                'info': '',
                'role': $translate.instant('purchaser')
                },
            {
                'title': 'mobile',
                'valid': '', //購買人：電話
                'info': '',
                'role': $translate.instant('purchaser')
                },
            {
                'title': 'email',
                'valid': '', //購買人：地址
                'info': '',
                'role': $translate.instant('purchaser')
                }
            ];
        //改變驗證狀態
        $scope.change_check = function (title, valid, info) {
            angular.forEach($scope.check, function (check, key) {
                if (check.title === title) {
                    $scope.check[key].valid = valid;
                    $scope.check[key].info = info;
                }
            });
        };

        //取得驗證狀態
        $scope.getValid = function (title) {
            var valid;
            angular.forEach($scope.check, function (check, key) {
                if (check.title === title) {
                    valid = check.valid;
                }
            });
            return valid;
        };
        //取得驗證成功的count
        $scope.checkComplete = function () {
            var total = 0;
            var count = $scope.check.length;
            angular.forEach($scope.check, function (check, key) {
                if (check.valid === true) {
                    total++;
                }
            });
            if (total === count) {
                return true;
            } else {
                return false;
            }
        };
        //同購買人資料：複製左邊欄位至右邊
        $scope.copy = function () {
            $scope.copyToggle = !$scope.copyToggle;
            if ($scope.copyToggle === true) {
                $scope.unbindWatcher = $scope.$watch("[data.name, data.mobile]",
                    function (newValue, oldValue) {
                        $scope.data.addressee = $scope.data.name || '';
                        $scope.data.addressee_mobile = $scope.data.mobile || '';
                        $scope.checkName('addressee', $scope.data.addressee);
                        $scope.checkPhone('addressee_mobile', $scope.data.addressee_mobile);
                    }
                );
            } else {
                //如果沒有勾選就把watch unbind
                $scope.unbindWatcher();
                $scope.data.addressee = '';
                $scope.data.addressee_mobile = '';
            }
        };
        $scope.payment_method = 0;
        //根據目前步驟載入不同樣板
        $scope.steps = {
            0: 'template/check/cart.html',
            1: 'template/check/profile.html',
            2: 'template/check/success.html'
        };
        //初始化步驟:0
        $scope.step = $scope.steps[0];
        $scope.stepCount = 0;
        //email驗證
        $scope.checkEmail = function (title, email) {
            var regexp = new RegExp("^([0-9a-zA-Z]([-_\\.]*[0-9a-zA-Z]+)*)@([0-9a-zA-Z]([-_\\.]*[0-9a-zA-Z]+)*)[\\.]([a-zA-Z]{2,9})$");
            if (regexp.test(email)) {
                $scope.change_check(title, true, '');
            } else if (isEmpty(email)) {
                $scope.change_check(title, false, $translate.instant('validation_email_empty'));
            } else {
                $scope.change_check(title, false, $translate.instant('validation_email_type'));
            }
        };
        //姓名驗證
        $scope.checkName = function (title, name) {
            var regexp = new RegExp("^[\u4e00-\u9fa5_a-zA-Z0-9]+$");
            if (regexp.test(name)) {
                $scope.change_check(title, true, '');
            } else if (isEmpty(name)) {
                $scope.change_check(title, false, $translate.instant('validation_name_empty'));
            } else {
                $scope.change_check(title, false, $translate.instant('validation_name_type'));
            }
        };
        //電話驗證
        $scope.checkPhone = function (title, phone) {
            var regexp = new RegExp("^(0)(9)([0-9]{8})$");
            if (regexp.test(phone)) {
                $scope.change_check(title, true, '');
            } else if (isEmpty(phone)) {
                $scope.change_check(title, false, $translate.instant('validation_phone_empty'));
            } else {
                $scope.change_check(title, false, $translate.instant('validation_phone_type'));
            }
        };
        //地址驗證
        $scope.checkAddress = function (title, address) {
            if (isEmpty(address)) {
                $scope.change_check(title, true, '');
            } else {
                $scope.change_check(title, false, $translate.instant('address_error_type'));
            }
        };

        //第一個步驟:選擇運送方式
        $scope.comfirm = function () {
            $scope.status = 1;
            var area = $scope.shipping_area.value;
            var promise = checkoutService.confirm(area);
            promise.then(function (data) {
                if (data) {
                    $scope.status = 0;
                    $scope.nextStep();
                } else {
                    $scope.status = 0;
                }
            });
        };
        //第二個步驟：填寫個人資料跟付款方式 -> 進入結帳流程
        $scope.payment = function () {
            $scope.status = 1;
            var promise = checkoutService.profile($scope.data);
            promise.then(function (data) {
                //導進paypal
                if (data) {
                    //檢查有沒有要跳轉網址
                    if (data.approval_url) {
                        $rootScope.redirect = true;
                        window.location = data.approval_url;
                    } else {
                        //如果沒有就視為ATM轉帳直到下一頁
                        $scope.order = checkoutService.order;
                        $scope.nextStep();
                    }
                } else {
                    $state.go('error');
                }
                //清空購物車
                $rootScope.$broadcast('removeAllCart');
            });
        };
        //nextStep:下一步
        $scope.nextStep = function () {
            $scope.step = $scope.steps[++$scope.stepCount];
            $scope.stepWay = true;
        };
        //prevStep:上一步
        $scope.prevStep = function () {
            $scope.step = $scope.steps[--$scope.stepCount];
            $scope.stepWay = false;
        };
        //取得目前在第幾個步驟
        $scope.stepSum = function () {
            return Object.keys($scope.steps).length - 1;
        };
        //初始化
        $scope.initCheckout = function () {
            //如果有接到訂單參數
            if (Object.keys($stateParams).length === 6) {
                //loding modal
                $rootScope.redirect = true;
                //回報給server告訴他訂單已完成結帳
                var promise = plantService.orderComplete($stateParams);
                promise.then(function () {
                    //取得訂單成功，跳到結帳第三頁
                    $scope.order = plantService.order;
                    if ($scope.order) {
                        $scope.step = $scope.steps[2];
                        $scope.stepCount = 2;
                        //移除在service的訂單
                        plantService.removeOrder();
                        //把loading關掉
                        $rootScope.redirect = false;
                    } else {
                        $state.go('error');
                    }
                });
            }
        };
        $scope.initCheckout();
        window.checkScope = $scope;

    })
    //產品內頁Controller
    .controller('TeachController', function ($scope, $state, $stateParams) {
        //教學三個tab的樣板
        $scope.pages = {
            '新手指南': 'template/teach/teach.html',
            '常見問題': 'template/teach/question.html',
            '購物須知': 'template/teach/notice.html',
            '售後說明': 'template/teach/service.html'
        };

        $scope.page = $stateParams.tabName ? $scope.pages[$stateParams.tabName] : $scope.pages['新手指南'];
        $scope.pageIndex = $stateParams.tabName ? $stateParams.tabName : '新手指南';
        $scope.changePage = function (index) {
            $scope.pageIndex = index;
            $scope.page = $scope.pages[index];
        };

        window.teachScope = $scope;

    })
    //產品內頁Controller
    .controller('AboutController', function ($scope, $state, $stateParams, $rootScope) {
        //教學三個tab的樣板
        $scope.pages = {
            'zh-tw': {
                'brand': 'template/about/brand.html',
                'declaration': 'template/about/declaration.html',
                'quality': 'template/about/quality.html'
            },
            'en': {
                'brand': 'template/about/brand_en.html',
                'declaration': 'template/about/declaration_en.html',
                'quality': 'template/about/quality_en.html'
            }
        };
        $scope.page = $stateParams.tabName ? $scope.pages[$scope.language][$stateParams.tabName] : $scope.pages[$scope.language]['brand'];
        $scope.pageIndex = $stateParams.tabName ? $stateParams.tabName : 'brand';
        //改變目前page
        $scope.changePage = function (index) {
            $scope.pageIndex = index;
            $scope.page = $scope.pages[$scope.language][index];
        };


        window.teachScope = $scope;

    })
    .controller('ContactController', function ($scope, $translate, contactService) {
        $scope.status = 0; //０:未傳送 // １：傳送中 //２：傳送成功
        $scope.sex = "male";
        $scope.data = {
            'name': $scope.name,
            'sex': $scope.sex,
            'email': $scope.email,
            'content': $scope.content,
        };
        //驗證部分
        $scope.check = [
            {
                'title': 'name',
                'valid': '',
                'info': ''
                },
            {
                'title': 'email',
                'valid': '',
                'info': ''
                },
            {
                'title': 'content',
                'valid': '',
                'info': ''
            }];

        //改變驗證狀態
        $scope.change_check = function (title, valid, info) {
            angular.forEach($scope.check, function (check, key) {
                if (check.title === title) {
                    $scope.check[key].valid = valid;
                    $scope.check[key].info = info;
                }
            });
        };

        //取得驗證狀態
        $scope.getValid = function (title) {
            var valid;
            angular.forEach($scope.check, function (check, key) {
                if (check.title === title) {
                    valid = check.valid;
                }
            });
            return valid;
        };

        //取得驗證成功的count
        $scope.checkComplete = function () {
            var total = 0;
            var count = $scope.check.length;
            angular.forEach($scope.check, function (check, key) {
                if (check.valid === true) {
                    total++;
                }
            });
            if (total === count) {
                return true;
            } else {
                return false;
            }
        };
        //email驗證
        $scope.checkEmail = function (title, email) {
            var regexp = new RegExp("^([0-9a-zA-Z]([-_\\.]*[0-9a-zA-Z]+)*)@([0-9a-zA-Z]([-_\\.]*[0-9a-zA-Z]+)*)[\\.]([a-zA-Z]{2,9})$");
            if (regexp.test(email)) {
                $scope.change_check(title, true, '');
            } else if (isEmpty(email)) {
                $scope.change_check(title, false, $translate.instant('validation_email_empty'));
            } else {
                $scope.change_check(title, false, $translate.instant('validation_email_type'));
            }
        };
        //姓名驗證
        $scope.checkName = function (title, name) {
            var regexp = new RegExp("^[\u4e00-\u9fa5_a-zA-Z0-9]+$");
            if (regexp.test(name)) {
                $scope.change_check(title, true, '');
            } else if (isEmpty(name)) {
                $scope.change_check(title, false, $translate.instant('validation_name_empty'));
            } else {
                $scope.change_check(title, false, $translate.instant('validation_name_type'));
            }
        };
        //內容驗證
        $scope.checkContent = function (title, content) {
            if (isEmpty(content)) {
                $scope.change_check(title, true, '');
            } else {
                $scope.change_check(title, false, $translate.instant('validation _content_empty'));
            }
        };
        //傳送資訊
        $scope.send = function () {
            $scope.status = 1;
            $scope.data = {
                'name': $scope.name,
                'sex': $scope.sex,
                'email': $scope.email,
                'content': $scope.content,
            };
            var promise = contactService.snedContact($scope.data);
            promise.then(function (data) {
                if (data === true) {
                    $scope.status = 2;
                } else {
                    $scope.status = 0;
                }
            });
        };

        window.plantContact = $scope;
    })
    .controller('SearchController', function ($scope, $state, $translate, searchService) {
        $scope.notfound = false;
        $scope.data = {
            'mobile': $scope.name,
            'order_number': $scope.sex
        };
        $scope.status = 0;
        //驗證部分
        $scope.check = [
            {
                'title': 'mobile',
                'valid': '',
                'info': ''
                },
            {
                'title': 'order_number',
                'valid': '',
                'info': ''
                }
            ];

        //改變驗證狀態
        $scope.change_check = function (title, valid, info) {
            angular.forEach($scope.check, function (check, key) {
                if (check.title === title) {
                    $scope.check[key].valid = valid;
                    $scope.check[key].info = info;
                }
            });
        };

        //取得驗證狀態
        $scope.getValid = function (title) {
            var valid;
            angular.forEach($scope.check, function (check, key) {
                if (check.title === title) {
                    valid = check.valid;
                }
            });
            return valid;
        };

        //取得驗證成功的count
        $scope.checkComplete = function () {
            var total = 0;
            var count = $scope.check.length;
            angular.forEach($scope.check, function (check, key) {
                if (check.valid === true) {
                    total++;
                }
            });
            if (total === count) {
                return true;
            } else {
                return false;
            }
        };
        //email驗證
        $scope.checkPhone = function (title, phone) {
            var regexp = new RegExp("^(0)(9)([0-9]{8})$");
            if (regexp.test(phone)) {
                $scope.change_check(title, true, '');
            } else if (isEmpty(phone)) {
                $scope.change_check(title, false, $translate.instant('validation_phone_empty'));
            } else {
                $scope.change_check(title, false, $translate.instant('validation_phone_type'));
            }
        };
        //內容驗證
        $scope.checkOrder = function (title, content) {
            if (isEmpty(content)) {
                $scope.change_check(title, true, '');
            } else {
                $scope.change_check(title, false, $translate.instant('validation_ordernumber_empty'));
            }
        };
        //傳送資訊
        $scope.search = function () {
            $scope.status = 1;
            $scope.data = {
                'mobile': $scope.mobile,
                'order_number': $scope.order_number
            };
            var promise = searchService.searchBill($scope.data);
            promise.then(function (data) {
                if (data) {
                    $state.go('result', data);
                } else {
                    $scope.notfound = true;
                    $scope.status = 0;
                }
            });
        };
        //重新搜尋
        $scope.refound = function () {
            $scope.notfound = false;
        };
        window.searchScope = $scope;
    })
    .controller('ResultController', function ($scope, $state, $stateParams, $translate, searchService) {
        $scope.result = [];
        //取得查詢結果:空的話則導回搜尋
        $scope.initResult = function () {
            var data = searchService.getBills();
            $scope.result = data || $state.go('search');
        };
        //輸入數字：取得付款方式文字
        $scope.getPayment = function (payment) {
            var method = {
                '0': $translate.instant('profile_credit'),
                '1': $translate.instant('profile_paypal'),
                '2': $translate.instant('profile_atm')
            };
            return method[payment];
        };

        $scope.getPaid = function (paid) {
            var method = {
                'true': $translate.instant('paid'),
                'false': $translate.instant('unpaid')
            };
            return method[paid];
        };

        $scope.getShipped = function (shipped) {
            var method = {
                'true': $translate.instant('delivered'),
                'false': $translate.instant('undelivered')
            };
            return method[shipped];
        };
        $scope.initResult();
        window.resultScope = $scope;
    })
    .controller('PaidController', function ($scope, $timeout, $state, $translate, paidService) {
        $scope.status = 0;
        $scope.data = {
            'order_number': $scope.order_number,
            'amount': $scope.amount,
            'account': $scope.account,
            'date': $scope.date,
            'note': $scope.note
        };
        //驗證部分
        $scope.check = [
            {
                'title': 'order_number',
                'valid': '',
                'info': ''
            },
            {
                'title': 'amount',
                'valid': '',
                'info': ''
                },
            {
                'title': 'account',
                'valid': '',
                'info': ''
            },
            {
                'title': 'date',
                'valid': '',
                'info': ''
            }];

        //改變驗證狀態
        $scope.changeCheck = function (title, valid, info) {
            angular.forEach($scope.check, function (check, key) {
                if (check.title === title) {
                    $scope.check[key].valid = valid;
                    $scope.check[key].info = info;
                }
            });
        };
        //取得驗證狀態
        $scope.getValid = function (title) {
            var valid;
            angular.forEach($scope.check, function (check, key) {
                if (check.title === title) {
                    valid = check.valid;
                }
            });
            return valid;
        };

        //取得驗證成功的count
        $scope.checkComplete = function () {
            var total = 0;
            var count = $scope.check.length;
            angular.forEach($scope.check, function (check, key) {
                if (check.valid === true) {
                    total++;
                }
            });
            if (total === count) {
                return true;
            } else {
                return false;
            }
        };

        //匯款金額
        $scope.checkAmount = function (title, amount) {
            var regexp = new RegExp("^\\d+$");
            if (regexp.test(amount)) {
                $scope.changeCheck(title, true, '');
            } else if (isEmpty(amount)) {
                $scope.changeCheck(title, false, $translate.instant('validation_price_empty'));
            } else {
                $scope.changeCheck(title, false, $translate.instant('validation_price_type'));
            }
        };
        //匯款後五碼驗證
        $scope.checkAccount = function (title, content) {
            if (isEmpty(content, 5, 5)) {
                $scope.changeCheck(title, true, '');
            } else {
                $scope.changeCheck(title, false, $translate.instant('validation_account_type'));
            }
        };
        //訂單號碼
        $scope.checkOrderNumber = function (title, content) {
            if (isEmpty(content)) {
                $scope.changeCheck(title, true, '');
            } else {
                $scope.changeCheck(title, false, $translate.instant('validation_ordernumber_empty'));
            }
        };
        //匯款時間
        $scope.checkDate = function (title, date) {

            if (isEmpty(date)) {
                $scope.changeCheck(title, true, '');
            } else {
                $scope.changeCheck(title, false, $translate.instant('validation_date_empty'));
            }

        };
        //傳送匯款資訊
        $scope.send = function () {
            $scope.status = 1;
            $scope.data = {
                'order_number': $scope.order_number,
                'amount': $scope.amount,
                'account': $scope.account,
                'date': new Date($scope.date).toISOString(),
                'note': $scope.note
            };
            var promise = paidService.send($scope.data);
            promise.then(function (result) {
                if (result === true) {
                    $scope.status = 2;
                } else {
                    $scope.status = 3;
                }
            });
        };
        $scope.refound = function () {
            $scope.status = 0;
        };
        //初始化頁面
        //        $scope.initPaid = function () {
        //            $("#datepicker").datepicker({
        //                firstDay: 1,
        //                minDate: -30,
        //                onSelect: function (dateText, inst) {
        //                    var date = $(this).val();
        //                    $scope.checkDate('date', date);
        //                    $scope.date = date;
        //                }
        //            });
        //        };
        //        $scope.initPaid();
        window.paidScope = $scope;

    });