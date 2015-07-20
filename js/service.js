var serverurl = 'https://saturdays.takko.me';
plant
//植物列表
    .service('plantService', function ($http, $q, $rootScope, service_utility) {
        var order;
        var plantService = this;
        //og
        //一開始取得植物列表的defer
        //初始化植物列表
        this.initPlants = function () {
            var deferred = $q.defer();
            if (this.getPlants()) {
                plantService.plants = this.getPlants();
                deferred.resolve(this.getPlants());
            } else {
                $http.get(serverurl + '/api-products/').
                success(function (data, status, headers, config) {
                    console.log('INIT_PLANT:success:' + status);
                    plantService.standardizationPlants(data);
                    deferred.resolve(plantService.plants);
                    plantService.savePlants();
                    plantService.downloadImages();

                }).error(function (data, status, headers, config) {
                    console.log('INIT_PLANT:error:' + status);
                });
            }
            return deferred.promise;
        };

        this.standardizationPlants = function (data) {
            var plants = [];
            angular.forEach(data, function (plant, index) {
                //取得水滴數量
                plant.waterPoint = getNumberWater(plant.water);
                //取得太陽數量
                plant.sunPoint = getNumberSun(plant.sun);
                plants.push(plant);
            });
            plantService.plants = plants;
        };
        //下載植物裡面的所有圖片
        this.downloadImages = function () {
            angular.forEach(plantService.plants, function (plant, index) {
                plant.images_local = [];
                angular.forEach(plant.images, function (image, key) {
                    service_utility.downloadFile(image, 'plants').then(function (value) {
                        var filePath = service_utility.MakeFilePath(value);
                        plant.images_local.push(filePath);
                        plantService.plants[index] = plant;
                        plantService.savePlants();
                        $rootScope.$broadcast('plantsUpdate');
                    });
                });
            });
        };
        //把plants存入localStorage
        this.savePlants = function () {
            var plants = plantService.plants;
            localStorage.setItem('plants', JSON.stringify(plants));
        };
        //取得目前lacalStorage的Plants
        this.getPlants = function () {
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

        this.getOrder = function () {
            return order;
        };

        this.removeOrder = function () {
            order = null;
        };

        //取得植物列表
        this.getPlants = function () {
            return this.plants;
        };
        //用id找植物
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

        this.findPlantName = function (name) {
            var temps = this.getPlants();
            var plant;
            angular.forEach(temps, function (temp, key) {
                if (temp.name == name) {
                    plant = temp;
                }
            });
            return plant;
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
