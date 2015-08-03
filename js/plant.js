var serverurl = 'https://saturdays.takko.me';
//產生亂數字串
function makeText(min, max) {
    var text = "";
    var random = Math.floor(Math.random() * max + min);
    var possible = "QWERTYUIOPASDFGHJKLZXCVBNM1234567890qazwsxedcrfvtgbyhnujmikolp";
    for (var i = 0; i < random; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

////判斷目前瀏覽裝置為何
//function checkDevice() {
//    if (/ipad/i.test(navigator.userAgent.toLowerCase())) {
//        return "ipad"; // 目前是用ipad瀏覽
//    } else if (/iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(navigator.userAgent.toLowerCase())) {
//        return "mobile"; // 目前是用手機瀏覽
//    } else {
//        return "pc"; // 目前是用電腦瀏覽
//    }
//}

function getPlatform() {
    if (cordova.platformId === 'ios') {
        return 'ios';
    } else {
        return 'android';
    }
}

//取得cookies:getCookie('csrftoken')
function getCookie(c_name) {
    if (document.cookie.length > 0) {
        c_start = document.cookie.indexOf(c_name + "=");
        if (c_start != -1) {
            c_start = c_start + c_name.length + 1;
            c_end = document.cookie.indexOf(";", c_start);
            if (c_end == -1) c_end = document.cookie.length;
            return unescape(document.cookie.substring(c_start, c_end));
        }
    }
    return "";
};

//affix
$(document).ready(function () {

    var affix = {
        initial: function () {
            this.$nav_div = $('.nav-div');
            this.$nav = $('.navbar-plant');
            this.offsetTop = this.$nav.offset().top;
            this.prev = 0;
            this.reversePoint = 0;
            this.direction;
            this.threshold = 200;
            this.interval;
            $('body').on("scroll", this.bindScroll);
        },
        bindScroll: function () {
            console.log($('body').scrollTop());
            var scrollTop = $('body').scrollTop();
            //滑動的距離超過threshold時讓他伸縮
            var distance = function () {
                var temp = Math.abs(affix.reversePoint) - Math.abs(scrollTop);
                return Math.abs(temp);
            };
            if (scrollTop > affix.offsetTop) {
                affix.$nav.addClass('affix');
            } else {
                affix.$nav.removeClass('affix');
            }
            //判斷滑上滑下
            //            if (scrollTop > affix.offsetTop + 100) {
            //                if (scrollTop > affix.prev) {
            //                    if (distance() > affix.threshold) {
            //                        affix.$nav.removeClass('slidedown').addClass('slideup');
            //                    }
            //                    if (affix.direction !== 'down') {
            //                        affix.direction = 'down';
            //                        affix.reversePoint = scrollTop;
            //                    }
            //                } else {
            //                    if (distance() > affix.threshold) {
            //                        affix.$nav.removeClass('slideup').addClass('slidedown');
            //                    }
            //                    if (affix.direction !== 'up') {
            //                        affix.direction = 'up';
            //                        affix.reversePoint = scrollTop;
            //                    }
            //                }
            //            } else {
            //                affix.$nav.removeClass('slideup').addClass('slidedown');
            //            }
            //            affix.prev = scrollTop;
        }
    }
    affix.initial();
});

//取得url參數
function getUrlParams(qs) {
    qs = qs.split("+").join(" ");
    var params = {},
        tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;
    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }
    return params;
};

//把太陽的數字轉Array
function getNumberSun(num) {
    var data = [];
    var check = ((Math.ceil(num) - num) <= 0) ? true : false;
    if (check) {
        for (var i = 0; i < num; i++) {
            var temp = {
                value: true
            };
            data.push(temp);
        }
    } else {
        for (var i = 0; i < Math.ceil(num); i++) {
            var temp = {
                value: (i === Math.ceil(num) - 1) ? false : true
            };
            data.push(temp);
        }
    }
    return data;
};

//把水滴的數字改為array
function getNumberWater(num) {
    var data = [];
    for (var i = 0; i < 3; i++) {
        var temp = {
            value: (i <= num - 1) ? true : false
        };
        data.push(temp);
    }
    return data;
};

//判斷是否為空
function isEmpty(value) {
    return angular.isUndefined(value) || value === '' || value === null || value !== value;
};

//String to JSON
function strToJson(array) {
    var temp = [];
    angular.forEach(array, function (item, key) {
        var str = item.toString();
        temp.push($.parseJSON(str));
    });
    return temp;
};


function getNowUrl() {
    var path = decodeURIComponent(location.href.substr(location.href.indexOf("#") + 1));
    return serverurl + path;
}

//SHARE
function shareTwitter() {
    window.open = cordova.InAppBrowser.open;
    var url = 'http://twitter.com/home/?status=' + getNowUrl();
    window.open(url, '_system', 'location=yes');
}

function shareGoogle() {
    window.open = cordova.InAppBrowser.open;
    var url = 'https://plus.google.com/share?url=' + getNowUrl();
    window.open(url, '_system', 'location=yes');
    return false;
};

function shareFacebook() {
    window.open = cordova.InAppBrowser.open;
    var url = 'http://www.facebook.com/share.php?u=' + getNowUrl();
    window.open(url, '_system', 'location=yes');
    return false;
};

function shareWeibo() {
    window.open = cordova.InAppBrowser.open;
    var url = 'http://v.t.sina.com.cn/share/share.php?title=' + 'SATURDAYS' + '&url=' + getNowUrl();
    window.open(url, '_system', 'location=yes');
    return false;
};

//檢查字串
function isEmpty(string, min, max) {
    if (string) {
        if (min && max) {
            if (string.length >= min && string.length <= max) {
                return true;
            } else {
                return false;
            }
        } else {
            return true;
        }
    } else {
        return false;
    }
}