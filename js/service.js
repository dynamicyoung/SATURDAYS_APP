var serverurl = 'https://saturdays.takko.me';
//var serverurl = 'http://192.168.1.196:8000';
plant
    .service('plantService', function ($http, $q, $rootScope, service_utility) {
        var plantService = this;

        this.products = [];
        this.plants = [];
        this.pots = [];


        //初始化植物列表
        this.initProducts = function () {
            var deferred = $q.defer();
            var localProducts = this.getProductsFromLocal();
            if (localProducts) {
                console.log('從LoaclStorage讀取中');
                plantService.products = localProducts;
                plantService.classification();
                deferred.resolve();
                plantService.checkUpdate();

            } else {
                console.log('從Server下載列表中');
                $http.get(serverurl + '/api-products/').
                success(function (data, status, headers, config) {
                    console.log('INIT_PLANT:success:', data);
                    plantService.products = plantService.standardizationProducts(data);
                    plantService.classification();
                    deferred.resolve();
                    plantService.saveProducts();
                    plantService.downloadAllImages();

                }).error(function (data, status, headers, config) {
                    console.log('INIT_PLANT:error:' + status);
                });
            }
            return deferred.promise;
        };

        //修正去得到的json
        this.standardizationProducts = function (data) {
            var products = [];
            angular.forEach(data, function (product, index) {
                //取得水滴數量
                if (product.water) {
                    product.waterPoint = getNumberWater(product.water);
                }
                //取得太陽數量
                if (product.sun) {
                    product.sunPoint = getNumberSun(product.sun);
                }
                // \n改成</br>
                if (product.about) {
                    product.about = product.about.replace(/\n/g, "<br/>");
                }
                products.push(product);
            });
            return products;
        };

        //將產品分類
        this.classification = function () {
            var products = plantService.products;
            angular.forEach(products, function (product, index) {
                switch (product.category) {
                    case 0:
                        plantService.pots.push(product);
                        break;
                    default:
                        plantService.plants.push(product);
                }
            });
        };

        //如果從local取得列表，
        this.checkUpdate = function () {
            //取得所有列表一一比對最後更新時間，查看是否有圖片需要重新下載
            $http.get(serverurl + '/api-products/').
            success(success).error(error);

            function success(data, status, headers, config) {
                var newPlants = plantService.standardizationProducts(data);
                var localPlants = plantService.plants;
                angular.forEach(newPlants, function (plant, index) {
                    var localPlant = plantService.findProductById(plant.id);
                    if (plant.updated && localPlant.updated) {
                        var newDate = new Date(plant.updated);
                        var oldDate = new Date(localPlant.updated);
                        if (newDate - oldDate > 0) {
                            console.log('NEW UPDATE:', plant.name);
                            plantService.downloadImages(plant, index);
                        } else {
                            console.log('IS LATEST:', plant.name);
                        }
                    } else {

                    }
                });
            }

            function error(data, status, headers, config) {
                console.log('checkupdate失敗');
            }
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
                    plantService.saveProducts();
                    plantService.classification();
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
        this.saveProducts = function () {
            localStorage.setItem('products', JSON.stringify(plantService.products));
        };
        //取得目前lacalStorage的Plants
        this.getProductsFromLocal = function () {
            return JSON.parse(localStorage.getItem('products'));
        };
        //顧客papal付款玩，回報server訂單付款成功
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
                deferred.resolve();
            }).
            error(function (data, status, headers, config) {
                console.log('ORDER_COMPLETE:error:' + status);
                deferred.resolve(false);
            });
            return deferred.promise;
        };

        //取得目前訂單
        this.getOrder = function () {
            return plantService.order;
        };
        //刪除訂單
        this.removeOrder = function () {
            plantService.order = undefined;
        };

        //取得植物列表
        this.getProducts = function () {
            return plantService.products;
        };
        //用id找植物
        this.findProductById = function (id) {
            var temp;
            angular.forEach(plantService.products, function (product, key) {
                if (product.id === id) {
                    temp = product;
                }
            });
            return temp;
        };
        //用Name找植物
        this.findProductByName = function (name) {
            var temp;
            angular.forEach(plantService.products, function (product, key) {
                if (product.name === name) {
                    temp = product;
                }
            });
            return temp;
        };
        //取得相關產品列表
        this.getSuggestion = function (products, suggestions) {
            var sug = [];
            angular.forEach(products, function (plant, key) {
                angular.forEach(suggestions, function (id, key) {
                    if (plant.id === id) {
                        sug.push(plant);
                    }
                });
            });
            return sug;
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
        var cartService = this;
        this.cart = [];
        this.total = 0;

        //用購物車列表的產品找id
        this.standardizationCarts = function (cart) {
            var temp = [];
            var plants = plantService.getProducts();
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
        this.findCartById = function (id) {
            var plant;
            angular.forEach(cartService.cart, function (item, key) {
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
                cartService.total = data.balance;
                cartService.cart = cartService.standardizationCarts(data);
                deferred.resolve();
            }).
            error(function (data, status, headers, config) {
                console.log('INIT_CART:error:', status);
            });
            return deferred.promise;
        };

        //取得購物車
        this.getCart = function () {
            return cartService.cart;
        };
        //取得總價
        this.getTotal = function () {
            return cartService.total;
        };
        //清空購物車
        this.removeAll = function () {
            var deferred = $q.defer();
            //清空購物車跟總金額
            cartService.cart = [];
            cartService.total = 0;
            deferred.resolve();
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
                cartService.total = data.balance;
                cartService.cart = cartService.standardizationCarts(data);
                deferred.resolve();
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
                cartService.total = data.balance;
                cartService.cart = cartService.standardizationCarts(data);
                deferred.resolve();
            }).
            error(function (data, status, headers, config) {
                console.log('REMOVE_CART:error:' + status);
            });
            return deferred.promise;
        };

        //回傳數字：商品要疊加還是新增
        this.plusCart = function (id, quantity) {
            //先找找看購物車有沒有這個商品：有的話把現在的數量疊加
            var item = cartService.findCartById(id);
            var total;
            if (item) {
                total = item.quantity + quantity;
            } else {
                total = quantity;
            }
            return total;
        };
        window.service_cart = this;
    })
    .service('checkoutService', function ($http, $q, cartService) {
        //取得購物車
        var checkoutService = this;
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
                checkoutService.order = data;
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
        var searchService = this;

        this.getBills = function () {
            return searchService.bills;
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
                searchService.bills = temp;
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
    //通知已付款
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
