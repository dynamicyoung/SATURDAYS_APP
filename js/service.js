var serverurl = 'https://saturdays.takko.me';
//var serverurl = 'http://192.168.1.196:8000';
plant
//植物列表
    .service('plantService', function ($http, $q, $rootScope, service_utility) {

        var plantService = this;

        //初始化
        this.initPlants = function () {
            var deferred = $q.defer();
            var localPlants = this.getPlantsFromLocal();
            if (localPlants) {
                console.log('從LoaclStorage讀取中');
                plantService.plants = localPlants;
                deferred.resolve(plantService.plants);
                plantService.checkUpdate();
            } else {
                console.log('從Server下載列表中');
                $http.get(serverurl + '/api-products/').
                success(function (data, status, headers, config) {
                    console.log('INIT_PLANT:success:', data);
                    plantService.plants = plantService.standardizationPlants(data);
                    deferred.resolve(plantService.plants);
                    plantService.savePlants();
                    plantService.downloadAllImages();

                }).error(function (data, status, headers, config) {
                    console.log('INIT_PLANT:error:' + status);
                });
            }
            return deferred.promise;
        };

        //如果從local取得列表，
        this.checkUpdate = function () {
            //取得所有列表一一比對最後更新時間，查看是否有圖片需要重新下載
            $http.get(serverurl + '/api-products/').
            success(success).error(error);

            function success(data, status, headers, config) {
                var newPlants = plantService.standardizationPlants(data);
                var localPlants = plantService.plants;
                angular.forEach(newPlants, function (plant, index) {
                    var localPlant = plantService.findPlant(plant.id);
                    var newDate = new Date(plant.updated);
                    var oldDate = new Date(localPlant.updated);
                    if (newDate - oldDate > 0) {
                        console.log('NEW UPDATE:', plant.name);
                        plantService.downloadImages(plant, index);
                    } else {
                        console.log('IS LATEST:', plant.name);
                    }
                });
            }

            function error(data, status, headers, config) {
                console.log('checkupdate失敗');
            }
        };

        //把水滴跟太陽的數字改成array
        this.standardizationPlants = function (data) {
            var plants = [];
            angular.forEach(data, function (plant, index) {
                //取得水滴數量
                plant.waterPoint = getNumberWater(plant.water);
                //取得太陽數量
                plant.sunPoint = getNumberSun(plant.sun);
                plants.push(plant);
            });
            return plants;
        };

        //下載植物的所有圖片
        this.downloadImages = function (plant, index) {
            plant.images_local = [];
            angular.forEach(plant.images, function (image, key) {
                service_utility.downloadFile(image, 'plants').then(function (value) {
                    console.log('downLoadImage:', image);
                    var filePath = service_utility.MakeFilePath(value);
                    plant.images_local.push(filePath);
                    plantService.plants[index] = plant;
                    plantService.savePlants();
                    $rootScope.$broadcast('plantsUpdate');
                });
            });
        }

        //下載植物裡面的所有圖片
        this.downloadAllImages = function () {
            angular.forEach(plantService.plants, function (plant, index) {
                plantService.downloadImages(plant, index);
            });
        };
        //把plants存入localStorage
        this.savePlants = function () {
            var plants = plantService.plants;
            localStorage.setItem('plants', JSON.stringify(plants));
        };
        //取得目前lacalStorage的Plants
        this.getPlantsFromLocal = function () {
            var plants = JSON.parse(localStorage.getItem('plants'));
            return plants;
        };

        //回報訂單成功
        this.orderComplete = function (temp) {
            var deferred = $q.defer();
            $http({
                method: 'POST',
                url: serverurl + '/payment/result/',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                data: temp
            }).
            success(function (data, status, headers, config) {
                console.log('ORDER_COMPLETE:success:' + status);
                plantService.order = temp;
            }).
            error(function (data, status, headers, config) {
                console.log('ORDER_COMPLETE:error:' + status);
                deferred.resolve(false);
            });
            return deferred.promise;
        };
        //取得目前訂單
        this.getOrder = function () {
            return this.order;
        };

        //清除現在訂單
        this.removeOrder = function () {
            this.order = null;
        };

        //取得植物列表
        this.getPlants = function () {
            return this.plants;
        };

        //用植物id來找植物
        this.findPlant = function (id) {
            var temps = this.getPlants();
            var plant;
            angular.forEach(temps, function (temp, key) {
                if (temp.id == id) {
                    plant = temp;
                }
            });
            return plant;
        };

        //用植物名稱來找札物
        this.findPlantName = function (name) {
            var plants = this.getPlants();
            var temp;
            angular.forEach(plants, function (plant, key) {
                if (plant.name === name) {
                    temp = plant;
                }
            });
            return temp;
        };

        //貨到時通知我
        this.emailNotify = function (data) {
            var deferred = $q.defer();
            $http({
                method: 'POST',
                url: serverurl + '/products/inquiry/',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                data: data
            }).
            success(function (data, status, headers, config) {
                console.log('EmailNotify:success:' + status);
                deferred.resolve(true);
            }).
            error(function (data, status, headers, config) {
                console.log('EmailNotify:error:' + status);
                deferred.resolve(false);
            });
            return deferred.promise;
        };
        window.service_plants = this;
    })
    .service('cartService', function ($http, $q, plantService) {
        var cart;
        var total;
        //用購物車列表的產品找id
        var findPlants = function (cart) {
            var temp = [];
            var plants = plantService.getPlants();
            angular.forEach(cart.items, function (item, key) {
                angular.forEach(plants, function (plant, key) {
                    if (item.item === plant.id) {
                        plant['quantity'] = item.quantity;
                        temp.push(plant);
                    }
                });
            });
            return temp;
        };
        //用id尋找植物
        var findPlant = function (id) {
            var plant;
            angular.forEach(cart, function (item, key) {
                if (item.id === id) {
                    plant = item;
                }
            });
            return plant;
        };
        //初始化購物車
        this.initCart = function () {
            var deferred = $q.defer();
            //初始化取得購物車列表
            $http.get(serverurl + '/cart/get/').
            success(function (data, status, headers, config) {
                console.log('INIT_CART:success:', status, data);
                total = data.balance;
                cart = findPlants(data);
                deferred.resolve(cart);
            }).
            error(function (data, status, headers, config) {
                console.log('INIT_CART:error:', status);
            });
            return deferred.promise;
        };
        //取得購物車
        this.getCart = function () {
            return cart;
        };
        //取得總價
        this.getTotal = function () {
            return total;
        };
        //清空購物車
        this.removeAll = function () {
            var deferred = $q.defer();
            //清空購物車跟總金額
            cart = [];
            total = 0;
            deferred.resolve(cart);
            return deferred.promise;
        };
        //加入購物車
        this.addCart = function (id, quantity) {
            var deferred = $q.defer();
            $http({
                method: 'POST',
                url: serverurl + '/cart/update/',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                data: {
                    item: id,
                    quantity: quantity
                }
            }).
            success(function (data, status, headers, config) {
                console.log('ADD_CART:success:' + status, data);
                total = data.balance;
                cart = findPlants(data);
                deferred.resolve(cart);
            }).
            error(function (data, status, headers, config) {
                console.log('ADD_CART:error:' + status);
            });
            return deferred.promise;
        };

        this.removeCart = function (id) {
            var deferred = $q.defer();
            $http({
                method: 'POST',
                url: serverurl + '/cart/update/',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                data: {
                    item: id,
                    quantity: 0
                }
            }).
            success(function (data, status, headers, config) {
                console.log('REMOVE_CART:success:' + status, data);
                total = data.balance;
                cart = findPlants(data);
                deferred.resolve(cart);
            }).
            error(function (data, status, headers, config) {
                console.log('REMOVE_CART:error:' + status);
            });
            return deferred.promise;
        };

        //回傳數字：商品要疊加還是新增
        this.plusCart = function (id, quantity) {
            //先找找看購物車有沒有這個商品：有的話把現在的數量疊加
            var item = findPlant(id);
            if (item) {
                var plus = item.quantity + quantity;
                return plus;
            } else {
                return quantity;
            }
        };
        window.service_cart = this;
    })
    .service('checkoutService', function ($http, $q, cartService) {
        //取得購物車
        this.getCart = function () {
            var cart = cartService.getCart();
            return cart;
        };
        //步驟1
        this.confirm = function (area) {
            var deferred = $q.defer();
            $http({
                method: 'POST',
                url: serverurl + '/checkout/confirm/',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                data: {
                    shipping_area: area,
                }
            }).
            success(function (data, status, headers, config) {
                console.log('CONFIRM:success:' + status, data);
                deferred.resolve(true);
            }).
            error(function (data, status, headers, config) {
                console.log('CONFIRM:error:' + status);
                deferred.resolve(false);
            });
            return deferred.promise;
        };

        this.profile = function (data) {
            var deferred = $q.defer();
            $http({
                method: 'POST',
                url: serverurl + '/checkout/shipping-and-payment/',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                data: data
            }).
            success(function (data, status, headers, config) {
                console.log('PROFILE:success:' + status, data);
                deferred.resolve(data);
            }).
            error(function (data, status, headers, config) {
                console.log('PROFILE:error:' + status);
                deferred.resolve(false);
            });
            return deferred.promise;
        };
        window.service_check = this;
    })
    .service('contactService', function ($http, $q) {
        this.snedContact = function (data) {
            var deferred = $q.defer();
            $http({
                method: 'POST',
                url: serverurl + '/suggestion/',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                data: data
            }).
            success(function (data, status, headers, config) {
                console.log('CONTACT:success:' + status, data);
                deferred.resolve(true);
            }).
            error(function (data, status, headers, config) {
                console.log('CONTACT:error:' + status);
                deferred.resolve(false);
            });
            return deferred.promise;
        };
        window.service_contact = this;
    })
    .service('searchService', function ($http, $q) {
        var bills;
        this.getBills = function () {
            return bills;
        };
        this.searchBill = function (data) {
            var deferred = $q.defer();
            $http({
                method: 'POST',
                url: serverurl + '/order/search/',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                data: data
            }).
            success(function (data, status, headers, config) {
                console.log('SEARCH:success:' + status, data);
                var temp = [];
                temp.push(data);
                bills = temp;
                deferred.resolve(temp);
            }).
            error(function (data, status, headers, config) {
                console.log('SEARCH:error:' + status);
                deferred.resolve(false);
            });
            return deferred.promise;
        };
        window.service_search = this;
    })
    .service('paidService', function ($http, $q) {
        this.send = function (data) {
            var deferred = $q.defer();
            $http({
                method: 'POST',
                url: serverurl + '/payment/confirm-atm-transfer/',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                data: data
            }).
            success(function (data, status, headers, config) {
                console.log('SEARCH:success:' + status, data);
                deferred.resolve(true);
            }).
            error(function (data, status, headers, config) {
                console.log('SEARCH:error:' + status);
                deferred.resolve(false);
            });
            return deferred.promise;
        };
        window.service_search = this;
    });
