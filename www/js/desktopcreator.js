/*
var desktop = new DesktopCreator();
desktop.init({
		elementRef: "desktop",
		desktopShortcuts: [
							{title: "Settings", isFolder: true,
									content: [
												{title: "Site", icon: "/img/settings.png", popup: {title: "Site settings", content: "Site settings"}},
												{title: "Personal", popup: {title: "Personal", content: "Personal settings"}}
											 ]},
							{title: "Task List", icon: "/img/desktop/checklist.png",
									popup: {	title: "Task List",
												content: [new SearchBar().init({dropDownItems: items}), new TableCreator().init({})],
												onShow: function(){this.element.find(".sbbar").focus();}
											}
							}
						  ]
	});
desktop.show();

options:
- gotoURL
- openURL - url or the following object:
					{
						specs: specs for openURL window - eg.: "toolbar=no,scrollbars=no,resizable=yes,top=500,left=500,width=400,height=400"
						center: true/false (requires width and height)
						width: width in pixels (only for center - otherwise use specs)
						height: height in pixels(only for center - otherwise use specs)
				 	}

shortcut options:
- title
- isFolder
- content (if folder)
- icon
- popup
- onBeforeShow: function called before showing icon (also if drawing it again). "this" is the DesktopCreator and the first arg is the shortcut.

API:
- runApp: Runs an app (clicks shortcut). Requires that the shortcut has an 'id' option set. Use as "runApp(ID, args)".
          Args will be added to the shortcut object. It can be accessed from a popup by using POPUP.options.desktopShortcut.ARG.

Notes:
- content can be an array, which will then all be appended
- popups can access desktop with this.options.desktop and desktop shortcut with this.options.desktopShortcut (i.e. desktop is set to DesktopCreator on Popup).

*/

function DesktopCreator(){
	this.type = "DesktopCreator";
	this.options = {};
	this.element = null;
	this.isNested = false;
}

DesktopCreator.prototype.init = function(_options){
	this.options = _options;
	var t = this;

	if(typeof(this.options.elementRef) === "string")
		this.element = $("#" + this.options.elementRef);
	else if(typeof(this.options.elementRef) === "object")
		this.element = this.options.elementRef;
	else {
		this.element = $("<div></div>");
		$("body").append(this.element);
	}

	if(!this.isNested){
		$(document).keydown(function(e) {
			if($("input:focus,textarea:focus").length > 0)
				return;

			if(!e.altKey && !e.ctrlKey && !e.shiftKey
				&& (	   (e.keyCode >= 65 && e.keyCode <= 90) //a-z
						|| (e.keyCode >= 48 && e.keyCode <= 57) //0-9
						|| (e.keyCode == 192 || e.keyCode == 222 || e.keyCode == 221) //ae, oe, aa
						|| e.keyCode == 32 //space
					))
			{
				var c = String.fromCharCode(e.keyCode).toLowerCase();
				if($(".dcsearchbox").is(":visible")){
					var searchBox = $(".dcsearchbox");
					if(!searchBox.is(":focus")){
						searchBox.val(searchBox.val() + c);
						t.filter(searchBox.val());
					}
				} else {
					var searchBox = $("<input class='dcsearchbox' type='text'>");
					searchBox.on("change paste keyup", function(){
						t.filter($(".dcsearchbox").val());
					});
					searchBox.val(c);
					$("body").append(searchBox);
					t.filter(c);
				}
			}
			if (e.keyCode == 27 && !$(".dcsearchbox").is(":visible") && !$(".pcpopup").is(":visible")){ //ESC
				t.element.find("div.dcfolderexpandedd:visible").each(function(){
					$(this).data("desktop").shortcutClicked.call(this);
				});
			}
			if ((e.keyCode == 27) && $(".dcsearchbox").is(":visible")){ //ESC
				$(".dcsearchbox").remove();
				t.filter();
			}
			if ((e.keyCode == 8) && $(".dcsearchbox").is(":visible")){ //backspace
				var c = $(".dcsearchbox").val();
				if(c.length > 1){
					c = c.length > 0 ? c.substring(0, c.length -1) : "";
					$(".dcsearchbox").val(c);
					t.filter(c);
				} else {
					$(".dcsearchbox").remove();
					t.filter();
				}
			}
			if (e.keyCode == 13 && $(".dcsearchbox").is(":visible")){ //Enter
				var firstElement = t.element.find("div.dcshortcut:visible:not(.dcfolderexpandedd):first");
				if(firstElement.length > 0){
					if(t.element.find("div.dcshortcut:visible:focus").length > 0);
						firstElement.focus();
					firstElement.data("desktop").shortcutClicked.call(firstElement);
					$(".dcsearchbox").remove();
					t.filter();
				}
			} else if (e.keyCode == 13 && !$(".dcsearchbox").is(":visible")){ //Enter
				var firstElement = t.element.find("div.dcshortcut:visible:not(.dcfolderexpandedd):focus");
				if(firstElement.length > 0){
					firstElement.data("desktop").shortcutClicked.call(firstElement);
				}
			}
		});
	}

	$(document).keydown(function (e) {
		if (e.which === 8 && $("input:focus").length < 1 && $("textarea:focus").length < 1) { //backspace
			return false;
		}
	});
}

DesktopCreator.prototype.show = function(callback){
	this.element.addClass("dcdesktop");
	this.element.empty();
	var t = this;

	this.options.desktopShortcuts = this.options.desktopShortcuts.sort(function(s1, s2){return s1.title > s2.title ? 1 : -1;});

	for(var i = 0; i < this.options.desktopShortcuts.length; i++){
		var cur = this.options.desktopShortcuts[i];

		if(cur.visible === false)
			continue;

		if(typeof(cur.onBeforeShow) === "function")
			cur.onBeforeShow.call(this, cur);

		var shortcut = $("<div class='dcshortcut'></div>");
		var icon = $("<img></img>");
		if(cur.isFolder === true && cur.icon === undefined)
			icon.prop("src", "/img/folder.png");
		else if(cur.icon === undefined)
			icon.prop("src", "/img/unknown.png");
		else
			icon.prop("src", cur.icon);
		icon.prop("title", cur.title);

		var txt = $("<p></p>");
		txt.html(cur.title);

		shortcut.append(icon);
		shortcut.append(txt);

		shortcut.data("shortcut", cur);
		shortcut.data("desktop", t);

		if(cur.isFolder)
			shortcut.addClass("dcfolder");

		shortcut.attr("tabindex", i+2);

		icon.click(this.shortcutClicked);
		txt.click(this.shortcutClicked);
		shortcut.click(function(e){
			if($(e.target).hasClass("dcshortcut") && $(e.target).is($(this)))
				t.shortcutClicked.call(this);
		});

		this.element.append(shortcut);
	}

	//Set the height of shortcuts to the height of the tallest one (necessary when window is too narrow):
	setTimeout(function(){
		var maxHeight = 0;
		t.element.find(".dcshortcut").each(function(){
			maxHeight = Math.max(maxHeight, $(this).height());
		});
		if(maxHeight > 0)
			t.element.find(".dcshortcut").height(maxHeight);
	}, 1);
}

DesktopCreator.prototype.runApp = function(id, args){
  var t = this;
	this.element.find(".dcshortcut").each(function(){
		var c = $(this).data("shortcut");
		if(c.id == id){
			//$(this).click();
			t.shortcutClicked.call($(this), args);
		}
	});
}

DesktopCreator.prototype.shortcutClicked = function(args){
	var folder = $(this).hasClass("dcshortcut") ? $(this) :
						$(this).parent().hasClass("dcshortcut") ? $(this).parent() : $(this);
	var c = folder.data("shortcut");
	var t = folder.data("desktop");

	if(args !== undefined){
		c = $.extend(true, {}, c, args);
	}

	if(c.isFolder){

		if(folder.hasClass("dcfolderexpandedd")){
			folder.find("img").show();
			folder.find(".dcfoldercontent").remove();
			folder.removeClass("dcfolderexpandedd");
		} else {
			folder.removeAttr("tabindex");
			folder.find("img").hide();
			var folderContent = $("<div class='dcfoldercontent'></div>");

			var desktop = new DesktopCreator();
			desktop.isNested = true;
			desktop.init({elementRef: folderContent, desktopShortcuts: c.content});
			desktop.show();

			folder.addClass("dcfolderexpandedd");
			folder.append(folderContent);
			if(t.element.find("div.dcshortcut:visible:focus").length > 0);
				folder.find(".dcshortcut:first").focus();
		}

	} else {
		if(typeof(c.onClick) === "function")
			c.onClick.call(c);

		if(c.popup !== undefined){
			var pc = new PopupCreator();
			var pcOptions = jQuery.extend(true, {desktop: t, desktopShortcut: c}, c.popup)
			if(c.icon !== undefined && pcOptions.icon === undefined)
				pcOptions.icon = c.icon;
			pc.init(pcOptions);
			pc.show();
		}

		if(c.gotoURL !== undefined)
			window.location = c.gotoURL;
    if(c.openURL !== undefined){
			let woptions = typeof c.openURL == "string" ? {url: c.openURL} : c.openURL;
			if(woptions.center === true)
				DesktopCreator.popupCenter(woptions.url, c.title || "Popup", woptions.width || 500, woptions.height || 500)
			else
				window.open(woptions.url,'_blank', woptions.specs);
		}
	}
	t.filter.call(t);
}

DesktopCreator.prototype.filter = function(filter){
	var curTabIdx = 2;
	this.element.find("div.dcshortcut").each(function(){
		if(!$(this).hasClass("dcfolderexpandedd")){
			$(this).attr("tabindex", curTabIdx);
		} else {
			$(this).removeAttr("tabindex");
		}
		curTabIdx++;

		if(filter !== undefined && filter !== ""
				&& $(this).data("shortcut").title.toLowerCase().indexOf(filter.toLowerCase()) < 0
				&& (!$(this).data("shortcut").isFolder || !$(this).hasClass("dcfolderexpandedd")))
			$(this).hide();
		else
			$(this).show();
	});
}

DesktopCreator.popupCenter = function(url, title, w, h) {
    // Fixes dual-screen position                         Most browsers      Firefox
    var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : window.screenX;
    var dualScreenTop = window.screenTop != undefined ? window.screenTop : window.screenY;

    var width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    var height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

    var left = ((width / 2) - (w / 2)) + dualScreenLeft;
    var top = ((height / 2) - (h / 2)) + dualScreenTop;
    var newWindow = window.open(url, title, 'scrollbars=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);

    // Puts focus on the newWindow
    if (window.focus) {
        newWindow.focus();
    }
}
