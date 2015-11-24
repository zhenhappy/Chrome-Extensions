var matchPatterns=[
	/http:\/\/\w+\.openv\.com\/(play|zj\/)?(pro_)?(hd_)?(zj_)?play.+\.html/i,
	/http:\/\/\w+\.tudou\.com\/program(s)?|playlist\/\w+/i,
	/http:\/\/\w+\.youku\.com\/v_show|playlist_show|v_playlist\/\w+/i,
	/http:\/\/\w+\.56\.com\/(\w(\d){2}|play)\/\w+/i,
	/http:\/\/\w+\.ku6\.com\/(show\/\w+|special\/show_\w*\/.*|special\/show_\w+)\.html/i,
	/http:\/\/6\.cn\/(watch|playlist|profile|plist)\/\w+/i,
	/http:\/\/video\.qq\.com\/v1\/videopl(\?v=\w+|\/vbar\?\w=\w+)/i,
	/http:\/\/\w+\.(blog\.)?sohu\.com\/\w+\/(\w+\/\w+|\w+.shtml)/i,
];
function matchVideoSite(url){
	for (var i=0;i<matchPatterns.length;i++){
		if (matchPatterns[i].test(url)){
			return true;
		}
	}
	return false;
}
function showPageAction(tab){
	var pageUrl=tab.url;
	if (matchVideoSite(pageUrl)){
		chrome.pageAction.show(tab.id);
	}
}

chrome.tabs.onUpdated.addListener(function(tabId,changedInfo, tab) {
	showPageAction(tab);
});
chrome.pageAction.onClicked.addListener(function(tab) {
	var targetUrl = 'http://www.flvcd.com/parse.php?kw='+encodeURIComponent(tab.url);
	chrome.tabs.create({url: targetUrl, windowId: tab.windowId, index:tab.index+1});
	//chrome.tabs.update(tab.id, {'url':targetUrl, 'selected':true});
});