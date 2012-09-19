const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
Cu.import("resource://gre/modules/Services.jsm");

function log(aMsg) {
	Services.console.logStringMessage(aMsg);
}

function install(data, reason) {
}

function uninstall(data, reason) {
}

function startup(data, reason) {
	// load into existing windows
	var winEnum = Services.wm.getEnumerator("navigator:browser");
	while (winEnum.hasMoreElements()) {
		var win = winEnum.getNext().QueryInterface(Ci.nsIDOMWindow);
		if (win)
			loadIntoWindow(win);
	}
	// load into new windows
	Services.wm.addListener(windowListener);
}

function shutdown(data, reason) {
	if (reason == APP_SHUTDOWN)
		return;
	// stop listening for new windows
	Services.wm.removeListener(windowListener);
	// unload from existing windows
	var winEnum = Services.wm.getEnumerator("navigator:browser");
	while (winEnum.hasMoreElements()) {
		var win = winEnum.getNext().QueryInterface(Ci.nsIDOMWindow);
		if (win)
			unloadFromWindow(win);
	}
}

var windowListener = {
	onOpenWindow: function(aWindow) {
		var win = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).
		                  getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
		win.addEventListener("load", function() {
			win.removeEventListener("load", arguments.callee, false);
			if (win)
				loadIntoWindow(win);
		}, false);
	},
	onCloseWindow: function(aWindow) {
		var win = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).
		                  getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
		if (win)
			unloadFromWindow(win);
	},
	onWindowTitleChange: function(aWindow) {
	},
};

// called when opening a browser window
function loadIntoWindow(aWindow) {
	// add menu item
	aWindow._viewSourceMenuId = aWindow.NativeWindow.menu.add(getString("menu"), null, function() {
		viewSource(aWindow);
	});
}

// called when closing a browser window
function unloadFromWindow(aWindow) {
	// remove menu item
	aWindow.NativeWindow.menu.remove(aWindow._viewSourceMenuId);
}

function viewSource(aWindow) {
	// get the current selected xul:browser element
	var browser = aWindow.BrowserApp.selectedBrowser;
	var url = browser.currentURI.spec;
	if (url.indexOf("view-source:") == 0)
		return;
	// add 'view-source' protocol to the current URI
	var params = {};
		// no effect?
		// params.title = "View Source: " + url;
		// params.parentId = aWindow.BrowserApp.selectedTab.id;
	aWindow.BrowserApp.addTab("view-source:" + url, params);
}

var gStringBundle;

function getString(aName) {
	if (!gStringBundle) {
		var uri = "chrome://viewsourcemobile/locale/main.properties";
		gStringBundle = Services.strings.createBundle(uri);
	}
	try {
		return gStringBundle.GetStringFromName(aName);
	}
	catch (ex) {
		return aName;
	}
}

