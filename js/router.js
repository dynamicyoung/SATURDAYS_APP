var plant = angular.module('plant', ['ui.router', 'ngAnimate', 'rn-lazy', 'ngSanitize'])
    //ui-router設定
    .config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
        //        $locationProvider.html5Mode(true);
        $stateProvider
            .state('domain', {
                url: "/",
                templateUrl: "template/shop.html"
            })
            .state('products', {
                url: "/products",
                templateUrl: "template/shop.html"
            })
            .state('detail', {
                url: "/products/:plantName",
                templateUrl: "template/detail.html",
                controller: 'DetailController',
            })
            .state('checkout', {
                url: "/checkout",
                templateUrl: "template/checkout.html",
                controller: 'CheckoutController'
            })
            .state('tutorial', {
                url: "/tutorial/:tabName",
                templateUrl: "template/tutorial.html",
                controller: 'TeachController'
            })
            .state('about', {
                url: "/about/:tabName",
                templateUrl: "template/about.html",
                controller: 'AboutController'
            })
            .state('contact', {
                url: "/contact",
                templateUrl: "template/contact.html",
                controller: 'ContactController'
            })
            .state('search', {
                url: "/search",
                templateUrl: "template/search.html",
                controller: 'SearchController'
            })
            .state('result', {
                url: "/result",
                templateUrl: "template/result.html",
                controller: 'ResultController'
            })
            .state('complete', {
                url: "/payment/complete/?success&order_number&balance&paymentId&token&PayerID",
                templateUrl: "template/checkout.html",
                controller: 'CheckoutController'
            })
            .state('paid', {
                url: "/paid",
                templateUrl: "template/paid.html",
                controller: 'PaidController'
            })
            .state('error', {
                url: "/error",
                templateUrl: "template/error.html"
            });

        $urlRouterProvider.otherwise("/products");

    });