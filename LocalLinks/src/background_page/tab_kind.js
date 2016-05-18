var CURRENT_TAB = 'current_tab';
var NEW_FOREGROUND_TAB = 'new_foreground_tab';
var NEW_BACKGROUND_TAB = 'new_background_tab';
function openIn(target_tab) {
    switch (target_tab) {
        case CURRENT_TAB:
            return openLinkInCurrentTab;
        case NEW_FOREGROUND_TAB:
            return openLinkInNewForegroundTab;
        case NEW_BACKGROUND_TAB:
            return openLinkInNewBackgroundTab;
    }
}

chrome.extension.onRequest.addListener(function (request) {
    openIn(request.target_tab)(request.url);
});
