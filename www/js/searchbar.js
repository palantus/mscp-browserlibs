/*

Options:
 - delayedSearch (number of ms to wait while typing - undefined for instant)
 - onSearch
 - style
 - dropDownItems
		can be array like: [{title: "Item 1", query: "val1"}, {title: "Item 2", query: "val2"}]
		or function called for data: function(callback){...}
 - delayIfCharsBelow		: number of chars below which auto search is delayed. Default 0.
 - delayIfCharsBelowFactor : factor multiplied on delay if number of chars is below delayIfCharsBelow. Default 2.


 Notes:
 - In onSearch, you can access a tablecreator on the same popup like: this.popupCreator.contentObjects[1].reloadData(query);
 - You can use $(SEARCHBAR).trigger("dosearch") to force a search

*/
function SearchBar(language){
	this.type = "SearchBar";
	this.options = {};
	this.element = null;
	this.isNested = false;
	this.language = language ? language : "en";

	this.translations = {
							da: {
								search: "Søg"
							},
							en: {
								search: "Search"
							}
						}
}

SearchBar.prototype.init = function(_options){
	this.options = _options;

	if(_options !== undefined && _options.language !== undefined)
		this.language = _options.language;

	var t = this;
	return this;
}

SearchBar.prototype.show = function(){
	var t = this;
	if(typeof(this.options.elementRef) === "string")
		this.element = $("#" + this.options.elementRef);
	else if(typeof(this.options.elementRef) === "object")
		this.element = this.options.elementRef;
	else {
		this.element = $("<div></div>");
		$("body").append(this.element);
	}

	this.element.addClass("sbcontainer");

	if(t.options.style !== undefined)
		this.element.css(t.options.style);

	//this.element.append("Søg: ");

	var bar = $("<input class='sbbar' placeholder='" + this.label("search") + "...'></input>");
	bar.attr("tabindex",-1);

	bar.keydown(function(e){
		if(e.which === 40){
			t.showDropDown();
		} else if(e.keyCode == 13){
			t.invokeSearch();
		}
	});

	bar.on("dosearch", function(){
		clearTimeout(t.delayTimer);
		t.invokeSearch();
	});

	bar[0].oninput = function () {
		if(typeof(t.options.delayedSearch) === "number"){
			clearTimeout(t.delayTimer);
			var delay = t.options.delayedSearch;

			if(isNaN(t.options.delayIfCharsBelow) || t.element.find(".sbbar").val().length < t.options.delayIfCharsBelow)
				delay *= !isNaN(t.options.delayIfCharsBelow) ? t.options.delayIfCharsBelow : 2;

			t.delayTimer = setTimeout(function() {
				t.invokeSearch();
			}, delay);
		} else {
			t.invokeSearch();
		}
	};

	this.element.append(bar);

	if(this.options.dropDownItems !== undefined){
		bar.addClass("sbbarwithdownarrow");

		var downArrow = $("<img/>", {src: "/mscp/libs/img/downarrow.png", "class": "sbdownarrow"});
		//downArrow.html("&#x25BC;");
		downArrow.click(function(){
			var dd = t.element.find(".sbdropdown");
			if(dd.is(":visible")){
				t.hideDropDown();
			} else {
				t.showDropDown();
			}
		});

		this.element.append(downArrow);

		var dropDown = $("<div/>", {"class": "sbdropdown"});
		dropDown.append("<table><tbody></tbody></table> ");
		this.element.append(dropDown);
	}
}

SearchBar.prototype.invokeSearch = function(){
	if(typeof(this.options.onSearch) === "function")
		this.options.onSearch.call(this, this.element.find(".sbbar").val());
}

SearchBar.prototype.hideDropDown = function(){
	var dd = this.element.find(".sbdropdown");
	var bar = this.element.find(".sbbar");

	dd.slideUp("fast");
	bar.prop('disabled', false);
	if(typeof(isMobile) !== "function" || !isMobile())
		bar.focus();
}

SearchBar.prototype.showDropDown = function(){
	var t = this;
	var dd = this.element.find(".sbdropdown");
	var bar = this.element.find(".sbbar");

	dd.css("top", bar.position().top + bar.outerHeight() + 1);
	dd.css("left", bar.position().left);
	dd.css("width", bar.outerWidth());

	var tbody = dd.find("tbody");
	tbody.empty();

	this.getDropDownItems(function(dropDownItems){
		if($.isArray(dropDownItems)){
			for(i in dropDownItems){
				var tr = $("<tr/>");
				tr.data("item", dropDownItems[i]);
				tr.data("searchidx", i);
				tr.data("sb", t);
				tr.click(t.onDropDownEvent);
				tr.keydown(t.onDropDownEvent);
				tr.attr("tabindex",-1);

				var td = $("<td/>");
				td.html(dropDownItems[i].title !== undefined ? dropDownItems[i].title : dropDownItems[i].Title);
				tr.append(td);
				tbody.append(tr);
			}
			dd.show();
		}
		bar.prop('disabled', true);
		dd.find("tbody tr:first").focus();
	});
}

SearchBar.prototype.getDropDownItems = function(callback){
	if($.isArray(this.options.dropDownItems)){
		callback(this.options.dropDownItems);
	} else if(typeof(this.options.dropDownItems) === "function"){
		this.options.dropDownItems.call(this, function(data){
			callback(data);
		});
	}
}

SearchBar.prototype.onDropDownEvent = function(e){
	var idx = parseInt($(this).data("searchidx"));
	var query = $(this).data("item").query;
	if(query === undefined)
		query = $(this).data("item").Query;
	var t = $(this).data("sb");

	var inp = $(this).closest(".sbcontainer").find(".sbbar");
	var dd = $(this).closest(".sbcontainer").find(".sbdropdown");

	var numItems = dd.find("tbody tr").length;

	if(e == undefined || e.which == 13 || (e.type == "click" && e.button == 0)){
		inp.val(query);
		t.hideDropDown();
		t.invokeSearch();
	} else if(e.which == 39){ //right
		if(numItems > idx + 4)
			dd.find("tbody tr")[idx+4].focus();
		else if(numItems > 0)
			dd.find("tbody tr")[numItems-1].focus();
		e.preventDefault();
		return false;
	} else if(e.which == 40){ //down
		if(numItems > idx + 1)
			dd.find("tbody tr")[idx+1].focus();
		e.preventDefault();
		return false;
	} else if(e.which == 37){ //left
		if(numItems > 0 && idx >= 4)
			dd.find("tbody tr")[idx-4].focus();
		else if(numItems > 0)
			dd.find("tbody tr")[0].focus();
		e.preventDefault();
	} else if(e.which == 38){ //up
		if(numItems > 0 && idx > 0)
			dd.find("tbody tr")[idx-1].focus();
		else {
			t.hideDropDown();
		}
		e.preventDefault();
	}
}

SearchBar.prototype.label = function(text){
	return this.translations[this.language][text];
}
