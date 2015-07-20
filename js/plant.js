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

//判斷目前瀏覽裝置為何
function checkDevice() {
    if (/ipad/i.test(navigator.userAgent.toLowerCase())) {
        return "ipad"; // 目前是用ipad瀏覽
    } else if (/iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(navigator.userAgent.toLowerCase())) {
        return "mobile"; // 目前是用手機瀏覽
    } else {
        return "pc"; // 目前是用電腦瀏覽
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
    var $nav_div = $('.nav-div')
    var $nav = $('.navbar-plant');
    var start = $nav.offset().top;
    var prev = 0;
    var reversePoint = 0;
    var direction;
    var threshold = 200;
    var device = checkDevice();
    //affix
    $nav.affix({
        offset: {
            top: $nav.offset().top
        }
    });
    //只有是行動裝置時才讓navbar伸縮
    if (device === 'mobile' || device === 'ipad') {
        $(window).scroll(function () {
            var offsetTop = $(this).scrollTop();
            //滑動的距離超過threshold時讓他伸縮
            var distance = function () {
                var temp = Math.abs(reversePoint) - Math.abs(offsetTop);
                return Math.abs(temp);
            };
            //判斷滑上滑下
            if (offsetTop > start) {
                if (offsetTop > prev) {
                    if (distance() > threshold) {
                        $nav.removeClass('slidedown').addClass('slideup');
                    }
                    if (direction !== 'down') {
                        direction = 'down';
                        reversePoint = offsetTop;
                    }
                } else {
                    if (distance() > threshold) {
                        $nav.removeClass('slideup').addClass('slidedown');
                    }
                    if (direction !== 'up') {
                        direction = 'up';
                        reversePoint = offsetTop;
                    }
                }
            } else {
                $nav.removeClass('slideup').addClass('slidedown');
            }
            prev = offsetTop;
        });
    }
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

//SHARE
function shareTwitter() {
    var url = 'http://twitter.com/home/?status='.concat(decodeURIComponent(document.title)).concat(' ').concat(decodeURIComponent(location.href));
    window.open(url, '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=300,width=600');
}

function shareGoogle() {
    var url = 'https://plus.google.com/share?url='.concat(decodeURIComponent(location.href));
    window.open(url, '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600');
    return false;
};

function shareFacebook() {
    var url = 'http://www.facebook.com/share.php?u='.concat(decodeURIComponent(location.href));
    window.open(url, '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=300,width=600');
    return false;
};

function shareWeibo() {
    var url = 'http://v.t.sina.com.cn/share/share.php?title=' + decodeURIComponent(document.title) + '&url=' + decodeURIComponent(location.href);
    window.open(url, '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600');
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