plant
    .directive('repeatDone', function ($timeout) {
        return function (scope, element, attrs) {
            if (scope.$last) { // all are rendered
                scope.$eval(attrs.repeatDone);
            }
        };
    })
    .directive('carouselTop', function ($timeout, $rootScope) {
        return function (scope, element, attrs) {
            if (scope.$last) { // all are rendered
                scope.container = element.parents('.swiper-container');
                $rootScope.galleryTop = new Swiper(scope.container, {
                    nextButton: '.swiper-button-next',
                    prevButton: '.swiper-button-prev',
                    spaceBetween: 50,
                    preventClicks: true,
                    lazyLoading: true
                });
            }
        };
    })
    .directive('carouselBottom', function ($timeout, $rootScope) {
        return function (scope, element, attrs) {
            if (scope.$last) { // all are rendered
                scope.container = element.parents('.swiper-container');
                $rootScope.galleryBottom = new Swiper(scope.container, {
                    spaceBetween: 20,
                    direction: 'horizontal',
                    slidesPerView: 'auto',
                    preventClicks: true,
                    lazyLoading: true
                });
                var calcCount = function (width) {
                    //目前carousel的高度 / （slide寬度 ＋間距） 最小正整數
                    return (Math.floor($rootScope.galleryBottom.size / ($rootScope.galleryBottom.params.spaceBetween + width)));
                };
                var firstSlide = $($rootScope.galleryBottom.slides[0]).addClass('active');
                //用index來比較他是向左滑向右滑
                var compareIndex = function (index) {
                    var direction = 'next';
                    if (scope.prevIndex) {
                        if (index > scope.prevIndex) {
                            direction = 'next';
                        } else if (index < scope.prevIndex) {
                            direction = 'prev';
                        } else {
                            direction = undefined;
                        }
                    }
                    scope.prevIndex = index;
                    return direction;
                };

                //兩個carousel做關聯
                $rootScope.galleryTop.params.onSlideChangeEnd = function (swiper) {
                    var $slides = $($rootScope.galleryBottom.slides);
                    var $slide = $($rootScope.galleryBottom.slides[swiper.activeIndex]);
                    $slides.removeClass('active');
                    $slide.addClass('active');
                    switch (compareIndex(swiper.activeIndex)) {
                        case 'next':
                            if (swiper.activeIndex >= calcCount(100)) {
                                $rootScope.galleryBottom.slideNext();
                            }
                            break;
                        case 'prev':
                            if (swiper.activeIndex < calcCount(100)) {
                                $rootScope.galleryBottom.slidePrev();
                            }
                            break;
                    }
                };
                $rootScope.galleryBottom.params.onClick = function (swiper, e) {
                    e.preventDefault();
                    $rootScope.galleryTop.slideTo(swiper.clickedIndex);
                };
            }
        };
    })
    .directive('carouselBrowse', function ($timeout, $rootScope) {
        return function (scope, element, attrs) {
            if (scope.$last) { // all are rendered
                scope.container = element.parents('.swiper-container');
                $rootScope.galleryBrowse = new Swiper(scope.container, {
                    nextButton: '.swiper-button-next-browse',
                    prevButton: '.swiper-button-prev-browse',
                    spaceBetween: 20,
                    direction: 'horizontal',
                    slidesPerView: 'auto',
                    touchRatio: 1,
                    slideToClickedSlide: true,
                });
            }
        };
    })
    .directive('panZoom', function ($timeout, $rootScope) {
        return function (scope, element, attrs) {
            element.panzoom();
            element.panzoom("option", {
                increment: 0.6,
                minScale: 1,
                maxScale: 3,
                duration: 300,
                ease: "cubic-bezier(0.4, 0, 0.2, 1)"
            });
            $rootScope.$on('destroyPicture', function (event, data) {
                element.panzoom("reset");
            });
        };
    })
    .constant('msdElasticConfig', {
        append: ''
    })
    .directive('msdElastic', [
    '$timeout', '$window', 'msdElasticConfig',
    function ($timeout, $window, config) {
            'use strict';
            return {
                require: 'ngModel',
                restrict: 'A, C',
                link: function (scope, element, attrs, ngModel) {

                    // cache a reference to the DOM element
                    var ta = element[0],
                        $ta = element;

                    // ensure the element is a textarea, and browser is capable
                    if (ta.nodeName !== 'TEXTAREA' || !$window.getComputedStyle) {
                        return;
                    }

                    // set these properties before measuring dimensions
                    $ta.css({
                        'overflow': 'hidden',
                        'overflow-y': 'hidden',
                        'word-wrap': 'break-word'
                    });

                    // force text reflow
                    var text = ta.value;
                    ta.value = '';
                    ta.value = text;

                    var append = attrs.msdElastic ? attrs.msdElastic.replace(/\\n/g, '\n') : config.append,
                        $win = angular.element($window),
                        mirrorInitStyle = 'position: absolute; top: -999px; right: auto; bottom: auto;' +
                        'left: 0; overflow: hidden; -webkit-box-sizing: content-box;' +
                        '-moz-box-sizing: content-box; box-sizing: content-box;' +
                        'min-height: 0 !important; height: 0 !important; padding: 0;' +
                        'word-wrap: break-word; border: 0;',
                        $mirror = angular.element('<textarea tabindex="-1" ' +
                            'style="' + mirrorInitStyle + '"/>').data('elastic', true),
                        mirror = $mirror[0],
                        taStyle = getComputedStyle(ta),
                        resize = taStyle.getPropertyValue('resize'),
                        borderBox = taStyle.getPropertyValue('box-sizing') === 'border-box' ||
                        taStyle.getPropertyValue('-moz-box-sizing') === 'border-box' ||
                        taStyle.getPropertyValue('-webkit-box-sizing') === 'border-box',
                        boxOuter = !borderBox ? {
                            width: 0,
                            height: 0
                        } : {
                            width: parseInt(taStyle.getPropertyValue('border-right-width'), 10) +
                                parseInt(taStyle.getPropertyValue('padding-right'), 10) +
                                parseInt(taStyle.getPropertyValue('padding-left'), 10) +
                                parseInt(taStyle.getPropertyValue('border-left-width'), 10),
                            height: parseInt(taStyle.getPropertyValue('border-top-width'), 10) +
                                parseInt(taStyle.getPropertyValue('padding-top'), 10) +
                                parseInt(taStyle.getPropertyValue('padding-bottom'), 10) +
                                parseInt(taStyle.getPropertyValue('border-bottom-width'), 10)
                        },
                        minHeightValue = parseInt(taStyle.getPropertyValue('min-height'), 10),
                        heightValue = parseInt(taStyle.getPropertyValue('height'), 10),
                        minHeight = Math.max(minHeightValue, heightValue) - boxOuter.height,
                        maxHeight = parseInt(taStyle.getPropertyValue('max-height'), 10),
                        mirrored,
                        active,
                        copyStyle = ['font-family',
                           'font-size',
                           'font-weight',
                           'font-style',
                           'letter-spacing',
                           'line-height',
                           'text-transform',
                           'word-spacing',
                           'text-indent'];

                    // exit if elastic already applied (or is the mirror element)
                    if ($ta.data('elastic')) {
                        return;
                    }

                    // Opera returns max-height of -1 if not set
                    maxHeight = maxHeight && maxHeight > 0 ? maxHeight : 9e4;

                    // append mirror to the DOM
                    if (mirror.parentNode !== document.body) {
                        angular.element(document.body).append(mirror);
                    }

                    // set resize and apply elastic
                    $ta.css({
                        'resize': (resize === 'none' || resize === 'vertical') ? 'none' : 'horizontal'
                    }).data('elastic', true);

                    /*
                     * methods
                     */

                    function initMirror() {
                        var mirrorStyle = mirrorInitStyle;

                        mirrored = ta;
                        // copy the essential styles from the textarea to the mirror
                        taStyle = getComputedStyle(ta);
                        angular.forEach(copyStyle, function (val) {
                            mirrorStyle += val + ':' + taStyle.getPropertyValue(val) + ';';
                        });
                        mirror.setAttribute('style', mirrorStyle);
                    }

                    function adjust() {
                        var taHeight,
                            taComputedStyleWidth,
                            mirrorHeight,
                            width,
                            overflow;

                        if (mirrored !== ta) {
                            initMirror();
                        }

                        // active flag prevents actions in function from calling adjust again
                        if (!active) {
                            active = true;

                            mirror.value = ta.value + append; // optional whitespace to improve animation
                            mirror.style.overflowY = ta.style.overflowY;

                            taHeight = ta.style.height === '' ? 'auto' : parseInt(ta.style.height, 10);

                            taComputedStyleWidth = getComputedStyle(ta).getPropertyValue('width');

                            // ensure getComputedStyle has returned a readable 'used value' pixel width
                            if (taComputedStyleWidth.substr(taComputedStyleWidth.length - 2, 2) === 'px') {
                                // update mirror width in case the textarea width has changed
                                width = parseInt(taComputedStyleWidth, 10) - boxOuter.width;
                                mirror.style.width = width + 'px';
                            }

                            mirrorHeight = mirror.scrollHeight;

                            if (mirrorHeight > maxHeight) {
                                mirrorHeight = maxHeight;
                                overflow = 'scroll';
                            } else if (mirrorHeight < minHeight) {
                                mirrorHeight = minHeight;
                            }
                            mirrorHeight += boxOuter.height;
                            ta.style.overflowY = overflow || 'hidden';

                            if (taHeight !== mirrorHeight) {
                                ta.style.height = mirrorHeight + 'px';
                                scope.$emit('elastic:resize', $ta);
                            }

                            // small delay to prevent an infinite loop
                            $timeout(function () {
                                active = false;
                            }, 1);

                        }
                    }

                    function forceAdjust() {
                        active = false;
                        adjust();
                    }

                    /*
                     * initialise
                     */

                    // listen
                    if ('onpropertychange' in ta && 'oninput' in ta) {
                        // IE9
                        ta['oninput'] = ta.onkeyup = adjust;
                    } else {
                        ta['oninput'] = adjust;
                    }

                    $win.bind('resize', forceAdjust);

                    scope.$watch(function () {
                        return ngModel.$modelValue;
                    }, function (newValue) {
                        forceAdjust();
                    });

                    scope.$on('elastic:adjust', function () {
                        initMirror();
                        forceAdjust();
                    });

                    $timeout(adjust);

                    /*
                     * destroy
                     */

                    scope.$on('$destroy', function () {
                        $mirror.remove();
                        $win.unbind('resize', forceAdjust);
                    });
                }
            };
    }
  ])
    //ng-max, ng-min
    .directive('watchValue', function ($timeout) {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, element, attrs, ngModel) {
                scope.$watch(function () {
                    return ngModel.$modelValue;
                }, function (newValue, oldValue) {

                    var max = parseInt(attrs.ngmax);
                    var min = parseInt(attrs.ngmin);
                    switch (max) {
                        case 0:
                            element.val(0);
                            ngModel.$setViewValue(0);
                            element.tooltip({
                                placement: 'top',
                                title: '已達庫存量'
                            });
                            element.tooltip('show');
                            break;
                        case 1:
                            element.val(1);
                            ngModel.$setViewValue(1);
                            element.tooltip({
                                placement: 'top',
                                title: '最後一個'
                            });
                            element.tooltip('show');
                            break;
                        default:
                            if (ngModel.$modelValue >= max) {
                                //如果超過庫存上限
                                element.val(max);
                                ngModel.$setViewValue(max);
                                element.tooltip({
                                    placement: 'top',
                                    title: '已達庫存量'
                                });
                                element.tooltip('show');
                            } else if (ngModel.$modelValue < 0) {
                                //如果輸入的數字小於０：把它變成最小
                                element.val(min);
                                ngModel.$setViewValue(min);
                            } else if (ngModel.$modelValue >= min && ngModel.$modelValue < max) {
                                //輸入數字介於之間
                                element.tooltip('destroy');
                            } else {
                                ngModel.$setViewValue(min);
                            }
                    }
                });
            }
        }
    })
    //touch事件
    .directive("ngTap", [function () {
        return function (scope, element, attrs) {
            element.bind("touchstart click", function (e) {
                e.preventDefault();
                element.addClass('activated');
                scope.$apply(attrs["ngTap"], element);
            });
            element.bind('touchmove', function (e) {
                element.removeClass('activated');
            });
            element.bind('touchend', function (e) {
                element.removeClass('activated');
            });
        }
    }])
    .directive('imagesLoaded', ['$timeout', 'imagesLoaded',
    function ($timeout, imagesLoaded) {
            'use strict';
            return {
                restrict: 'AC',
                link: function (scope, element, attrs) {
                    var events = scope.$eval(attrs.imagesLoaded) || scope.$eval(attrs.imagesLoadedEvents),
                        className = attrs.imagesLoadedClass || 'images-loaded',
                        classUsed = element.hasClass(className);

                    var init = function () {
                        $timeout(function () {
                            scope.$imagesLoaded = false;

                            scope.$emit('imagesLoaded:started', {
                                scope: scope,
                                element: element
                            });

                            if (classUsed) {
                                element.addClass(className);
                            }

                            var imgLoad = imagesLoaded(element[0], function () {
                                scope.$imagesLoaded = true;

                                scope.$emit('imagesLoaded:loaded', {
                                    scope: scope,
                                    element: element
                                });

                                element.removeClass(className + ' images-loaded: ' + attrs.imagesLoaded + ';');

                                if (!scope.$$phase) {
                                    scope.$apply();
                                }
                            });

                            if (typeof (events) !== undefined) {
                                angular.forEach(events, function (fn, eventName) {
                                    imgLoad.on(eventName, fn);
                                });
                            }
                        });
                    };

                    if (attrs.imagesLoadedWatch) {
                        scope.$watch(attrs.imagesLoadedWatch, function (n) {
                            init();
                        });

                    } else {
                        init();
                    }
                }
            };
    }])
