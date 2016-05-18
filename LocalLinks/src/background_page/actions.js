function openLinkInCurrentTab(url) {
    chrome.tabs.getSelected(null, function (selected_tab) {
        chrome.tabs.update(selected_tab.id, {url: url});
    });
}

function openLinkInNewForegroundTab(url) {
    chrome.tabs.getSelected(null, function (selected_tab) {
        chrome.tabs.create(
            _propertiesForNewTab(url, selected_tab, {selected: true})
        );
    });
}

function openLinkInNewBackgroundTab(url) {
    chrome.tabs.getSelected(null, function (selected_tab) {
        chrome.tabs.create(
            _propertiesForNewTab(url, selected_tab, {selected: false})
        );
    });
}

function _propertiesForNewTab(url,
                              base_tab,
                              overriding_properties // optional
) {
    if (typeof overriding_properties === 'undefined') {
        overriding_properties = {};
    }

    // I want to emulate native Chrome behavior.
    // So I will open new tab adjacent to base.
    return $.extend(true, // deep copy
        {
            windowId: base_tab.windowId,
            index: base_tab.index + 1,
            url: url,
        }, overriding_properties);
}

// Dynamically append '<script>' tag with given URL.
function load_jquery_script(jquery_script_url) {
    var jquery_script = document.createElement('script');
    jquery_script.type = 'text/javascript';
    jquery_script.src = jquery_script_url;
    document.getElementsByTagName("head")[0].appendChild(jquery_script);
}

// Gets parsed manifest, traverses into 'content_scripts' section
// in search for jQuery library path.
// Return first found path.
function load_jquery_lib(manifest) {
    var jquery_lib_path_re = new RegExp('^lib/jquery.*js$');

    /* Related manifest part:
     * {
     *   content_scripts: [{
     *     js: ['smth.js']
     *   }]
     * }
     */
    var all_content_scripts = manifest.content_scripts;
    for (var i = 0; i < all_content_scripts.length; ++i) {
        var content_script_js = all_content_scripts[i].js;
        for (var i = 0; i < content_script_js.length; ++i) {
            var js_path = content_script_js[i];
            if (jquery_lib_path_re.test(js_path)) {
                var jquery_script_url = chrome.extension.getURL(js_path);
                load_jquery_script(jquery_script_url);
                return;
            }
        }
    }
}

var manifest_url = chrome.extension.getURL('manifest.json');
var xhr = new XMLHttpRequest();
xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
        var manifest = JSON.parse(xhr.responseText);
        load_jquery_lib(manifest);
    }
}
xhr.open('GET', manifest_url, /* open synchronously */ false);
xhr.send();
