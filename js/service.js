var serverurl = 'https://saturdays.takko.me';
//var serverurl = 'http://192.168.1.196:8000';
plant
    .service('plantService', function ($http, $q, $rootScope, $timeout, service_utility) {
        var plantService = this;

        this.products = [];
        this.plants = [];
        this.pots = [];

        this.initial = {
            init: function () {
                var deferred = $q.defer();
                var localData = this.getProductsFromLocal();
                if (!localData) {
                    //第一次進入
                    plantService.firstEnter = true;
                    this.getProducts().then(function (data) {
                        plantService.products = data;
                        plantService.initial.standardizationProducts();
                        deferred.resolve();
                    })
                } else {
                    //第N次進入
                    plantService.firstEnter = false;
                    plantService.products = localData
                    plantService.initial.standardizationProducts();
                    deferred.resolve();
                }
                return deferred.promise;
            },
            start: function () {
                plantService.startUpdate = true;
                if (plantService.firstEnter) {
                    console.log('DOWNLOAD:第一次進入APP, 開始進行下載');
                    plantService.initial.downloadAllImages().then(success);
                } else {
                    console.log('UPDATE:檢查是否更新圖片');
                    plantService.initial.checkUpdate().then(success);
                }

                function success() {
                    console.log('全部更新完畢')
                    plantService.initial.refreshPage();
                }
            },
            refreshPage: function () {
                $rootScope.$broadcast('refreshPage');
            },
            getProducts: function () {
                var deferred = $q.defer();
                $http.get(serverurl + '/api-products/').
                success(function (data, status, headers, config) {
                    console.log('api-products:success:' + status);
                    deferred.resolve(data);
                }).error(function (data, status, headers, config) {
                    console.log('api-products:error:' + status);
                });
                return deferred.promise;
            },
            checkUpdate: function () {
                //取得所有列表一一比對最後更新時間，查看是否有圖片需要重新下載
                var deferred = $q.defer();
                plantService.initial.getProducts().then(success)

                function check(localProduct, newProduct) {
                    //var newDate = new Date(newProduct.updated);
                    var newDate = new Date();
                    var oldDate = new Date(localProduct.updated);
                    if (!localProduct.downloaded || newDate - oldDate > 0) {
                        return true;
                    }
                }

                function updateProducts(localProduct, newProduct, index) {
                    var deferred_updateProducts = $q.defer();
                    var promises = [];
                    //                    var promise_remove = plantService.initial.removeImages(localProduct);
                    var promise_download = plantService.initial.downloadImages(newProduct, index);

                    //                    promises.push(promise_remove);
                    promises.push(promise_download);

                    $q.all(promises).then(function () {
                        console.log(newProduct.name + '更新完成');
                        deferred_updateProducts.resolve();
                    });
                    return deferred_updateProducts.promise;
                }

                function success(data, status, headers, config) {
                    var newProducts = data;
                    var localProducts = plantService.products;
                    var promises = [];
                    angular.forEach(newProducts, function (newProduct, index) {
                        var localProduct = plantService.findProductById(newProduct.id);
                        if (check(localProduct, newProduct)) {
                            var promise = updateProducts(localProduct, newProduct, index);
                            promises.push(promise);
                        }
                    });
                    $q.all(promises).then(function () {
                        console.log('所有圖片更新完畢, 總共更新：', promises.length + '個商品');
                        plantService.initial.standardizationProducts();
                        deferred.resolve();
                    });
                }
                return deferred.promise;
            },
            //修正已經得到的json
            standardizationProducts: function () {
                var products = [];
                plantService.pots = [];
                plantService.plants = [];

                angular.forEach(plantService.products, function (product, index) {
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
                    //把商品分類
                    switch (product.category) {
                    case 0:
                        plantService.pots.push(product);
                        break;
                    default:
                        plantService.plants.push(product);
                    }
                    products.push(product);
                });
                plantService.products = products;
                plantService.initial.saveProducts();
            },


            //下載植物的所有圖片
            removeImages: function (product) {
                var deferred = $q.defer();
                if (product.images_local) {
                    angular.forEach(product.images_local, function (image, key) {
                        service_utility.deleteFile(image).then(function () {
                            deferred.resolve();
                        });
                    });
                }
                return deferred.promise;
            },

            //下載植物的所有圖片
            downloadImages: function (product, index) {
                var deferred = $q.defer();
                var promises = [];
                if (!product.images_local) {
                    product.images_local = [];
                }
                angular.forEach(product.images, function (image, key) {
                    var promise = service_utility.downloadFile(image, 'products')
                        .then(function (filePath) {
                            product.images_local[key] = filePath;
                            plantService.products[index] = product;
                            console.log('下載' + filePath + '成功');
                        });
                    promises.push(promise);
                });

                //下載完成後加入下載完成的標記
                $q.all(promises).then(function () {
                    plantService.products[index].downloaded = true;
                    deferred.resolve();
                });
                return deferred.promise;
            },

            //下載植物裡面的所有圖片
            downloadAllImages: function () {
                var deferred = $q.defer();
                var promises = [];
                angular.forEach(plantService.products, function (product, index) {
                    var promise = plantService.initial.downloadImages(product, index);
                    promises.push(promise);
                });
                $q.all(promises).then(function () {
                    plantService.initial.standardizationProducts();
                    deferred.resolve();
                });
                return deferred.promise;
            },
            removeAllImages: function () {
                var deferred = $q.defer();
                var promises = [];
                angular.forEach(plantService.products, function (product, index) {
                    var promise = plantService.initial.removeImages(product);
                    promises.push(promise);
                });
                $q.all(promises).then(function () {
                    deferred.resolve();
                });
                return deferred.promise;
            },
            //把plants存入localStorage
            saveProducts: function () {
                var products = JSON.stringify(plantService.products)
                localStorage.setItem('products', products);
            },
            //取得目前lacalStorage的Plants
            getProductsFromLocal: function () {
                return JSON.parse(localStorage.getItem('products'));
            },
            clearAll: function () {
                plantService.initial.removeAllImages().then(function () {
                    localStorage.clear();
                    window.location.reload();
                });
            }
        };
        //初始化植物列表

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