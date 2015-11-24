MIN_DOWNLOADER_NUMBER_OF_ONE_COLUMN = 5;
OPTION_LIST_PREFIX = 'do_';
OPTION_TABLE_PREFIX = 'dt_';

window.addEventListener("load", init);

function $(id) {
return document.getElementById(id);
}

function i18nReplace(id, messageName) {
return $(id).innerHTML = chrome.i18n.getMessage(messageName);
}

function isLinuxPlatform() {
return navigator.userAgent.toLowerCase().indexOf('linux') > -1;
}

var defaultDownloader =
  localStorage['defaultDownloader'] || 'chrome_downloader';
var bg = chrome.extension.getBackgroundPage();
var downloaderManager = bg.downloaderManager;

// Number of downloaders, including user added downloaders
var numDownloaders = bg.enabledDownloaders.length;

// Number of downloaders, including user added and/or deleted downloaders
var numDownloadersEverAdded = numDownloaders;

function setDownloadPath() {
localStorage['downloadPath'] = bg.setDownloadPath();
$('downloadPath').value = localStorage['downloadPath'];
}

function init() {
bg.updateEnabledDownloaders();
var downloadPath = $('downloadPath');
if (localStorage['downloadPath'])
  downloadPath.value = localStorage['downloadPath'];
else {
  downloadPath.value = bg.getDefaultDownloadPath();
  localStorage['downloadPath'] = downloadPath.value;
}
$('setDownloadPath').onclick = setDownloadPath;
$('openDownloadPath').onclick = bg.openDownloadPath;

optionList.init();
if (isLinuxPlatform()) {
  optionTable.init();
}

// Set page style on Windows and Linux platform
if (isLinuxPlatform()) {
  $('closeBtn').style.cssFloat = 'right';
} else {
  $('closeBtn').style.margin = '34px 0 0 20px';
  $('bottomDiv').style.height = '0';
}
}

// Save settting and close option page
function saveAndClose() {
localStorage['defaultDownloader'] = defaultDownloader;

if (isLinuxPlatform()) {
  optionTable.saveDownloader();
}

// Close option page
chrome.tabs.getSelected(null, function(tab) {
  chrome.tabs.remove(tab.id);
});
}

var optionList = {
init: function() {
  i18nReplace('pageTitle', 'page_title');
  i18nReplace('downloader', 'downloader');
  i18nReplace('saveAndClose', 'save_and_close');
  i18nReplace('downloadPathTitle', 'download_path_title');
  i18nReplace('defaultPath', 'default_path');
  i18nReplace('setDownloadPath', 'set_download_path');
  i18nReplace('openDownloadPath', 'open_download_path');

  optionList.createDownloaderOption();
},

createDownloaderOption: function() {
  var enableOptions = bg.enabledDownloaders;
  var exist_no_gui_downloader = false;
  for (var i = 0; i < enableOptions.length; i++) {
	var item = enableOptions[i];
	if (item.name == 'aria2c' || item.name == 'axel' ||
		item.name == 'curl' || item.name == 'wget')
	  exist_no_gui_downloader = true;
	var imageUrl =
		item.isLinux ? item.image : chrome.extension.getURL(item.image);
	var command = item.isLinux ? item.command : null;
	if ((isLinuxPlatform() && (item.isLinux || item.isSystem)) ||
		(!isLinuxPlatform() && !item.isLinux))
	  optionList.addDownloaderOption(
		  imageUrl, item.name, command, i, item.isUserAdded);
  }
  if (exist_no_gui_downloader)
	$('downloadPathSetting').style.display = 'block';
  else
	$('downloadPathSetting').style.display = 'none';
  optionList.updateDownloaderOptionView();
},

// Show in 2 columns if has more than 5 downloaders
updateDownloaderOptionView: function() {
  var length = numDownloaders;
  var container = $('downloaderOption');
  if (length > MIN_DOWNLOADER_NUMBER_OF_ONE_COLUMN) {
	container.className = 'column-show';
	// If amount of downloaders less than 11, then show 5 downloaders in the
	// first column, show others in the second column
	if (length < (MIN_DOWNLOADER_NUMBER_OF_ONE_COLUMN * 2 + 1)) {
	  container.style.height = '175px';
	} else {
	  container.style.height = 'auto';
	}
  } else {
	container.style.height = 'auto';
	container.removeAttribute('class');
  }
},

addDownloaderOption: function(imageUrl, name, command, id, isAdded) {
  var option = document.createElement('div');
  option.id = OPTION_LIST_PREFIX + id;
  option.name = name;
  option.command = command;
  var label = optionList.createDownloaderOptionNode(
	  imageUrl, name, command, isAdded);
  option.appendChild(label);
  $('downloaderOption').appendChild(option);
},

createDownloaderOptionNode: function(imageUrl, name, command, isAdded) {
  var label = document.createElement('label');
  var radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = 'downloader';
  radio.value = name;
  if (defaultDownloader == radio.value) {
	radio.checked = true;
  }
  label.appendChild(radio);
  (function(radio) {
	radio.onchange = function() {
	  if (radio.checked) {
		defaultDownloader = radio.value;
	  }
	}
  })(radio);

  var img = document.createElement('img');
  img.src = imageUrl;
  img.className = 'itemImg';
  label.appendChild(img);

  var span = document.createElement('span');
  if (!isAdded)
	name = chrome.i18n.getMessage(name);
  span.innerText = name;
  span.setAttribute('title', name);
  label.appendChild(span);
  return label;
},

updateDownloaderOption: function(imageUrl, name, command, id) {
  var option = $(OPTION_LIST_PREFIX + id);
  option.name = name;
  option.command = command;
  while (option.childNodes.length > 0) {
	option.removeChild(option.firstChild);
  }
  var label =
	  optionList.createDownloaderOptionNode(imageUrl, name, command, true);
  option.appendChild(label);
},

deleteDownloaderOption: function(id) {
  var waitToRemove = $(OPTION_LIST_PREFIX + id);
  var downloaderOption = $('downloaderOption');
  var radio = waitToRemove.querySelector('input');

  // If the removed downloader is selected to be default downloader, then
  // restore chrome downloader as default downloader
  if (radio.checked) {
	downloaderOption.querySelector('input[value="chrome_downloader"]')
	  .checked = true;
  }

  // Remove downloader option
  downloaderOption.removeChild(waitToRemove);

  // Update downloader option view
  numDownloaders--;
  optionList.updateDownloaderOptionView();
},

checkRepeatDownloaderOption: function(name, command, id) {
  var downloaderOptions = $('downloaderOption').childNodes;
  for (var i = 0; i < downloaderOptions.length; i++) {
	var item = downloaderOptions[i];
	var itemId = parseInt(item.id.split('_')[1]);
	if ((item.name == name || item.command == command) && itemId != id)
	  return true;
  }
  return false;
}

};

var optionTable = {
modifyTempValue: '',

init: function() {
  // i18n
  i18nReplace('downloaderSetting', 'downloader_setting');
  i18nReplace('downloaderIcon', 'downloader_icon');
  i18nReplace('downloaderName', 'downloader_name');
  i18nReplace('downloaderCommand', 'downloader_command');
  i18nReplace('addDownloader', 'add_downloader');
  i18nReplace('urlAddress', 'url_address');
  i18nReplace('addURLOkBtn', 'add_url_ok_btn');
  i18nReplace('addURLCancelBtn', 'add_url_cancel_btn');

  // Use placeholder attribute to show prompting message
  $('settingName').setAttribute('placeholder',
	chrome.i18n.getMessage('setting_name'));
  $('settingCommand').setAttribute('placeholder',
	chrome.i18n.getMessage('setting_command'));
  $('iconURL').setAttribute('placeholder',
	chrome.i18n.getMessage('icon_url'));

  // Show title and content of "Add more downloaders"
  $('downloaderSettingTitle').style.display = 'block';
  $('downloaderContainer').style.display = 'block';

  // Read custom downloaders and add into option table
  optionTable.createDownloaderTable();
  optionTable.addEventListener();
},

createDownloaderTable: function() {
  var enableOptions = bg.enabledDownloaders;
  for (var i = 0; i < enableOptions.length; i++) {
	var item = enableOptions[i];
	if (item.isUserAdded) {
	  var projId = item.command.split(' ')[0];
	  if (bg.plugin.CheckObject(projId)) {
		optionTable.insertOneRowInTable(
			item.image, item.name, item.command, i);
	   }
	}
  }
  optionTable.setRowBackgroundColor();
},

changeIcon: function(obj) {
  if (obj.src.indexOf('images/icon-normal.png') != -1) {
	obj.src = 'images/icon-over.png';
  } else if (obj.src.indexOf('images/icon-over.png') != -1) {
	obj.src = 'images/icon-normal.png';
  }
},

addEventListener: function() {
  $('settingImg').addEventListener('mouseover', function() {
	optionTable.changeIcon(this);
  }, false);

  $('settingImg').addEventListener('mouseout', function() {
	optionTable.changeIcon(this);
  }, false);

  $('settingImg').addEventListener('click', function() {
	var src = $('settingImg').src;
	$('iconURL').value =
		(src.indexOf('images/icon-over.png') != -1) ? '' : src;
	optionTable.showAddURLDialog(-1);
  }, false);

  // Confirm to add downloader icon
  $('addURLOkBtn').addEventListener('click', function() {
	var url = $('iconURL').value;
	if (url == '')
	  url = chrome.extension.getURL('images/icon-normal.png');
	else if (!/(https?)|(chrome-extension):\/\//.test(url))
	  url = 'http://' + url;
	var id = $('addURLDialog').downloaderId;
	if (id == -1) {
	  $('settingImg').src = url;
	} else {
	  var row = $(OPTION_TABLE_PREFIX + id);
	  row.cells[0].firstChild.src = url;
	  var name = row.cells[1].firstChild.value;
	  var command = row.cells[2].firstChild.value;
	  optionList.updateDownloaderOption(url, name, command, id);
	}
	optionTable.closeAddURLDialog();
  }, false);

  // Cancel to add downloader icon
  $('addURLCancelBtn').addEventListener('click', function() {
	optionTable.closeAddURLDialog();
  }, false);

  // Add downloader
  $('addDownloader').addEventListener('click', function() {
	var imgsrc = $('settingImg').src;
	var name = $('settingName').value;
	var command = $('settingCommand').value;
	if (name == '' || command == '')
	  return;
	if (command.trim().split(' ').length == 1)
	  command += ' $URL';

	var isInstallation =
		optionTable.addDownloaderToSettingTable(imgsrc, name, command);
	if (isInstallation) {
	  optionList.addDownloaderOption(
		  imgsrc, name, command, numDownloadersEverAdded, true);
	  numDownloadersEverAdded++;

	  // Always put default downloader in the last of downloader list
	  var defaultChromeDownloader =
		  $('downloaderOption').lastElementChild.previousElementSibling;
	  $('downloaderOption').appendChild(defaultChromeDownloader);

	  // Update downloader option view
	  numDownloaders++;
	  optionList.updateDownloaderOptionView();
	}
  }, false);
},

addDownloaderToSettingTable: function(imgsrc, name, command) {
  var projId = command.split(' ')[0];
  if (!bg.plugin.CheckObject(projId)) {
	// Check if the downloader is valid
	optionTable.showTip('tip_failed', 'can_not_add_downloader', '160');
	return false;
  } else if (optionTable.checkRepeatDownloader(name, command, -1)) {
	// Check if the downloader has added.
	optionTable.showTip('tip_failed', 'repeat_add_downloader', '180');
	return false;
  }

  optionTable.insertOneRowInTable(
	  imgsrc, name, command, numDownloadersEverAdded);
  optionTable.setRowBackgroundColor();
  optionTable.cleanAddedDownloaderSettingData();
  return true;
},

checkRepeatDownloader: function(name, command, id) {
  var rows = $('downloaderlist').rows;
  for (var i = 0; i < rows.length; ++i) {
	var row = rows[i];
	var rowName = row.cells[1].firstChild.value;
	var rowCommand = row.cells[2].firstChild.value;
	var rowId = parseInt(row.id.split('_')[1]);
	if ((name == rowName || command == rowCommand) && rowId != id)
	  return true;
  }
  return (optionList.checkRepeatDownloaderOption(name, command, id));
},

insertOneRowInTable: function(imgsrc, name, command, id) {
  var downloaderItem = $('downloaderlist');
  var row = downloaderItem.insertRow(-1);
  row.id = OPTION_TABLE_PREFIX + id;
  optionTable.insertImageToTheRow(row, imgsrc, id);
  optionTable.insertNameOrLinkToTheRow(row, 1, name);
  optionTable.insertNameOrLinkToTheRow(row, 2, command);
  optionTable.insertOptionsToTheRow(row); // Insert "Delete" link
},

setRowBackgroundColor: function() {
  var table = $('downloaderlist');
  var downloaderContainerItem = $('downloaderContainerItem');
  var rows = table.rows;
  var i = 0;
  for(; i < rows.length; ++i) {
	if ((i + 1) % 2 != 0) {
	  rows[i].style.backgroundColor = 'White';
	} else {
	  rows[i].style.backgroundColor = '#f6fbff';
	}
  }
  if (i % 2 != 0) {
   downloaderContainerItem.style.backgroundColor ='#f6fbff';
  } else {
	downloaderContainerItem.style.backgroundColor ='White';
  }
},

insertImageToTheRow: function(row, src, id) {
  var cell = row.insertCell(0);
  cell.className = 'th0';
  var img = document.createElement('img');
  img.className = 'itemImg';
  img.src = src;
  img.onmouseover = function() {
	optionTable.changeIcon(this);
  };
  img.onmouseout = function() {
	optionTable.changeIcon(this);
  }
  img.onclick = function() {
	$('iconURL').value = (src.indexOf('chrome-extension') == 0) ? '' : src;
	optionTable.showAddURLDialog(id);
  }
  cell.appendChild(img);
},

insertNameOrLinkToTheRow: function(row, cellCount, value) {
  var cell = row.insertCell(cellCount);
  cell.className = 'th' + cellCount;
  var input = document.createElement('input');
  input.onblur = optionTable.modifyDownloader;
  input.onfocus= optionTable.setOnfocusCss;
  input.onmouseover = optionTable.setMouseOverCss;
  input.onmouseout = optionTable.setMouseOutCss;
  input.className = cellCount == 1 ? 'itemName' : 'itemCommand';
  input.style.border = '0';
  input.style.background = '0';
  input.value = value;
  cell.appendChild(input);
},

setMouseOverCss: function(event) {
  var obj = event.target;
  optionTable.setInputCss(obj);
},

setMouseOutCss: function(event) {
  var obj = event.target;
  if (document.activeElement != obj) {
	optionTable.removeInputCss(obj);
  }
},

setOnfocusCss: function(event) {
  var obj = event.target;
  obj.style.cssText='-webkit-box-shadow: 0px 0px 10px #c3e5fa;';
  optionTable.setInputCss(obj);
  optionTable.modifyTempValue = obj.value;
},

setInputCss: function(obj) {
  obj.style.height = '22px';
  obj.style.border = '1px solid #c1d1e0';
  obj.style.background = '-webkit-gradient(linear, left top, left bottom,' +
	'from(#edf5f5), to(#fff))';
},

removeInputCss: function(obj) {
  obj.style.cssText='';
  obj.style.border = '0';
  obj.style.background = '0';
},

insertOptionsToTheRow: function(row) {
  var cell = row.insertCell(3);
  cell.className = 'th3';
  var aDelete = document.createElement('A');
  aDelete.innerText =  chrome.i18n.getMessage('delete');
  aDelete.href = 'javascript:';
  aDelete.style.paddingLeft = '15px';
  aDelete.onclick = optionTable.deleteDownloader;
  cell.appendChild(aDelete);
},

modifyDownloader: function(event) {
  var obj = event.target;
  var tr = obj.parentNode.parentNode;
  var id = parseInt(tr.id.split('_')[1]);
  var imgSrc = tr.getElementsByTagName('img')[0].src;
  var inputArr = tr.getElementsByTagName('input');
  var name = inputArr[0].value;
  var command = inputArr[1].value;
  var projId = command.split(' ')[0];

  optionTable.removeInputCss(obj);
  if ('' == projId || '' == name) {
	optionTable.restoreCommandValue(obj);
  } else if (!bg.plugin.CheckObject(projId)) {
	optionTable.showTip('tip_failed', 'can_not_add_downloader', '160');
	optionTable.restoreCommandValue(obj);
  } else if (optionTable.checkRepeatDownloader(name, command, id)) {
	optionTable.showTip('tip_failed', 'repeat_add_downloader', '180');
	optionTable.restoreCommandValue(obj);
  } else {
	optionList.updateDownloaderOption(imgSrc, name, command, id);
  }
},

// Restore original value
restoreCommandValue: function(obj) {
  obj.value = optionTable.modifyTempValue;
  obj.focus();
},

deleteDownloader: function(event) {
  var obj = event.target;
  var tr = obj.parentNode.parentNode;
  var id = parseInt(tr.id.split('_')[1]);
  var tbody = tr.parentNode;
  tbody.removeChild(tr);
  optionTable.setRowBackgroundColor();
  optionList.deleteDownloaderOption(id);
},

showAddURLDialog: function(id) {
  var addURLDialog = $('addURLDialog');
  addURLDialog.downloaderId = id;
  addURLDialog.style.display = 'block';
  addURLDialog.style.top = (document.body.scrollTop +
	  (document.documentElement.clientHeight - 200 -
	  addURLDialog.offsetHeight) / 2) + 'px';
  addURLDialog.style.left = (document.body.scrollLeft +
	  (document.documentElement.clientWidth -
	  addURLDialog.offsetWidth) / 2) + 'px';
},

closeAddURLDialog: function() {
  $('addURLDialog').style.display = 'none';
},

saveDownloader: function() {
  // Upate local storage
  for (var name in localStorage) {
	if (name.indexOf('downloaderConfigure') == 0)
	  localStorage.removeItem(name);
  }
  var rows = $('downloaderlist').rows;
  for (var i = 0; i < rows.length; ++i) {
	var row = rows[i];
	var imgsrc = row.cells[0].firstChild.src;
	var name = row.cells[1].firstChild.value;
	var command = row.cells[2].firstChild.value;
	localStorage['downloaderConfigure' + name] = [imgsrc, name, command];
  }

  // Update enabled downloaders
  downloaderManager.updateCustomDownloaders();
  bg.updateEnabledDownloaders();
},

cleanAddedDownloaderSettingData: function() {
  $('settingImg').src = 'images/icon-normal.png';
  $('settingName').value = '';
  $('settingCommand').value = '';
},

showTip: function(className, message, width) {
  if ($('tipTextContainer')) {
	return;
  }
  var tipContainer = $('tipContainer');
  var div = document.createElement('DIV');
  div.className = className;
  div.style.width = width + 'px';
  div.id = 'tipTextContainer';
  div.innerText = chrome.i18n.getMessage(message);
  tipContainer.appendChild(div);
  div.style.left = (document.body.clientWidth - div.clientWidth) / 2 + 'px';
  window.setTimeout(function() {
	tipContainer.removeChild(div);
  }, 2000);
}

};
