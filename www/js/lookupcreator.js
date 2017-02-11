/*
new LookupCreator().init({
	lookupButton: this.element.find(".samplelookup"),
	tableOptions: {dataSource: function(cb, query){cb(this.filterDataFromQuery(data, query));}},
	searchBar: true,
	onLookup: function(row){
		t.element.find(".sampleinput").val(row.test);
	}
});
*/
function LookupCreator(){
	this.type = "LookupCreator";
	this.options = {};
	this.popup = null;
}

LookupCreator.prototype.init = function(_options){
	this.options = _options;
	var t = this;
	
	if(this.options.lookupButton){
		this.options.lookupButton.click(function(){
			t.show();
		});
	}
	
	return this;
}

LookupCreator.prototype.show = function(){
	var t = this;
	var tcOptions = {type: "TableCreator", clickable: true, linesPerPage: 10, hideHeader: true};

	for(key in this.options.tableOptions)
		tcOptions[key] = this.options.tableOptions[key];
	
	tcOptions.onClick = function(row){
		if(typeof(t.options.onLookup) === "function"){
			t.popup.close();
			t.options.onLookup.call(t, row);
		}
	}
	
	var popupOptions = {};

	for(key in this.options.popupOptions)
		popupOptions[key] = this.options.popupOptions[key];
	
	if(!popupOptions.title)
		popupOptions.title = "Lookup";
		
	if(!popupOptions.content){
		if(this.options.searchBar === true){
			var searchBarOptions = {
										type: "SearchBar",
										delayedSearch: 100,
										onSearch: function(query){
											this.popupCreator.contentObjects[1].reloadData(query);
										}
								   }

			for(key in this.options.searchBarOptions)
				searchBarOptions[key] = this.options.searchBarOptions[key];
				
			popupOptions.content = [
										searchBarOptions, 
										tcOptions
								   ];
		} else {
			popupOptions.content = tcOptions;
		}
	}
		
	this.popup = new PopupCreator();
	this.popup.init(popupOptions);
	this.popup.show(function(){
		if(t.options.searchBar === true)
			t.popup.element.find(".sbbar").focus();
	});
}