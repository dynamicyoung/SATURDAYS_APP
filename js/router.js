var plant = angular.module('plant', ['ui.router', 'ngAnimate', 'rn-lazy', 'ngSanitize', 'pascalprecht.translate', 'iso.directives', 'angular-images-loaded', 'ng-fastclick'])
    //ui-router設定

.config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
    $urlRouterProvider.otherwise('/');

    $stateProvider
        .state('domain', {
            url: "/",
            templateUrl: "template/shop.html"
        })
        .state('products', {
            url: "/products",
            templateUrl: "template/shop.html"
        })
        .state('pots', {
            url: "/pots",
            templateUrl: "template/pots.html"
        })
        .state('seed', {
            url: "/seed",
            templateUrl: "template/seed.html"
        })
        .state('pot-detail', {
            url: "/pots/:productName",
            templateUrl: "template/detail.html",
            controller: 'DetailController',
        })
        .state('seed-detail', {
            url: "/seed/:productName",
            templateUrl: "template/detail.html",
            controller: 'DetailController',
        })
        .state('detail', {
            url: "/products/:productName",
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