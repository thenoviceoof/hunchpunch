/**
 * Access features of the Hunch API via JavaScript. Also provides convenience methods for working with Hunch iFrame apps.
 * v1.0
 *
 * By Hunch.com
 *
 */

(function(window,document,undefined) {

    if (!window.Hunch) window.Hunch = {
        _domain: {
            hostname: 'http://hunch.com',
            api: 'http://api.hunch.com'
        }
    };

    var Hunch = window.Hunch,
        auth_token = '',
        old_heights = [],
        old_height,
        guid = 0;

    //
    // Utils
    //
    function _apiCallWrapper(method) {
        return function(args, callback) {
            Hunch.api(method, args, callback);
        };
    }

    function getGuid() {
        return guid++;
    };

    function createFrame(id, url) {
        $('#' + id).remove();
        var root = document.createElement('div');
        root.setAttribute('id', id);
        document.body.appendChild(root);
        Hunch.insertIframe({
            url: url,
            root: root,
            height: 0,
            width: 0
        });
    }

    var camelCase = {
        _rdashAlpha: /-([a-z])/ig,
        _rfunc: function(all, letter) { return letter.toUpperCase(); },
        convert: function(text) {
            return text.replace(this._rdashAlpha, this._rfunc);
        }
    };

    Hunch._callbacks = {};

    // Kudos to https://github.com/facebook/connect-js/blob/master/src/core/content.js
    // for determining all the arcane iFrame gotchas
    Hunch.insertIframe = function(opts) {
        opts.id = opts.id || getGuid();
        opts.name = opts.name || getGuid();
        var guid = getGuid(),
            srcSet = false,
            onloadDone = false;
        Hunch._callbacks[guid] = function() {
            if (srcSet && !onloadDone) {
                onloadDone = true;
                opts.onload && opts.onload(opts.root.firstChild);
            }
        };
        if (document.attachEvent) {
            var html = (
                '<iframe' +
                    ' id="' + opts.id + '"' +
                    ' name="' + opts.name + '"' +
                    (opts.className ? ' class="' + opts.className + '"' : '') +
                    ' style="border:none;' +
                    'width: 0px;' +
                    'height: 0px;' +
                    '"' +
                    ' src="' + opts.url + '"' +
                    ' frameborder="0"' +
                    ' scrolling="no"' +
                    ' allowtransparency="true"' +
                    ' onload="Hunch._callbacks[' + guid + ']()"' +
                    '></iframe>'
            );
            opts.root.innerHTML = '<iframe src="javascript:false"'+
                ' frameborder="0"'+
                ' scrolling="no"'+
                ' style="height:1px"></iframe>';
            srcSet = true;

            window.setTimeout(function() {
                opts.root.innerHTML = html;
            }, 0);
        } else {
            var node = document.createElement('iframe');
            node.id = opts.id;
            node.name = opts.name;
            node.onload = Hunch._callbacks[guid];
            node.style.border = 'none';
            node.style.overflow = 'hidden';
            if (opts.className) {
                node.className = opts.className;
            }
            node.style.height = '0px';
            node.style.width = '0px';
            opts.root.appendChild(node);
            srcSet = true;

            node.src = opts.url;
        }
    };

    Hunch.resizeWindow = function() {
        var height = document.body.scrollHeight;
        if (height == old_height) return;
        old_height = height;
        createFrame('hunch-resize-helper',
                    Hunch._domain.hostname + '/app/helper/?height=' + height);
    };

    Hunch.scrollTop = function() {
        createFrame('hunch-scroll-helper',
                    Hunch._domain.hostname + '/app/helper/?scrollTop=1');
    };


    //
    // Auth
    //

    Hunch.login = function() {

    };

    Hunch.setAuthToken = function(_auth_token) {
        auth_token = _auth_token;
    };

    //
    // API
    //

    Hunch.api = function(method, args, callback, errorcallback) {
        //TODO - maybe support no args and just a callback? requires isFunction
        args = args || {};
        var key = args.key;
        args.auth_token = auth_token;

        var url = Hunch._domain.api + '/api/v1/' + method + '/',
        request = {
            url: url,
            data: args,
            dataType: 'jsonp',
            success: function (data, textStatus) {
                if (key !== undefined) {
                    data.key = key;
                }
                callback(data, textStatus);
            },
        };
        $.ajax(request);
    };

    var apiMethods = [
        'get-recommendations',
        'get-recommendees',
        'get-results',
        'set-result-alias',
        'flag-result',
        'create-result',
        'edit-result',
        'delete-result',
        'get-similar-results',

        // topics
        'search-topics',
        'get-topics',

        // users
        'get-auth-token',
        'check-auth-status',
        'get-user-info',
        'get-preferences',
        'get-friends',
        'get-tastemates',
        'get-activity',
        'set-preference',
        'delete-preference',
        'set-pro-cons',
        'set-user-alias',

        // teach hunch about you
        'get-predictions',
        'get-question',
        'teach-hunch-about-you'
    ];

    for (var i=0, len=apiMethods.length; i<len; i++) {
        Hunch.api[camelCase.convert(apiMethods[i])] = _apiCallWrapper(apiMethods[i]);
    }

    Hunch.utils = {
        extend: function(x) {
        }
    };

    // this is useful when the library is being loaded asynchronously
    // do it in a setTimeout to wait until the current event loop as finished.
    window.setTimeout(function() { if (window.hnAsyncInit) { hnAsyncInit(); }}, 0);
})(this, this.document);