function CardUI(){
	this.menu = [{text:"", level: 0, parentId: null}];
	this.curItem = 0;
	this.canvas = null;
	this.context = null;
	this.nextId = 1;
	this.cols = [];
	this.backButton = null;
	this.fadeTime = 200;
	this.drawNum = 0;
	this.nextDrawDirection = undefined;
	this.visible = true;
	this.rootId = "";
}

CardUI.prototype.init = function(rootElementId){
	
	if(rootElementId !== undefined){
		this.rootId = "#" + rootElementId;
		$(this.rootId).addClass("CardUI");
	} else {
		this.rootId = "#CardUI-" + new Date().getTime();
		var rootElement = $("<div class='CardUI'></div>");
		rootElement.attr("id", this.rootId.substring(1));
		$("body").append(rootElement);
	}
	
	$(this.rootId).append('<div class="CardUI-column"><div class="CardUI-col1 CardUI-col-container"></div><div class="CardUI-div-center-helper"></div></div><div class="CardUI-column"><div class="CardUI-col2 CardUI-col-container"></div><div class="CardUI-div-center-helper"></div></div><div class="CardUI-column"><div class="CardUI-col3 CardUI-col-container"></div><div class="CardUI-div-center-helper"></div></div>');

	
	this.cols[0] = $(this.rootId + " div.CardUI-col1");
	this.cols[1] = $(this.rootId + " div.CardUI-col2");
	this.cols[2] = $(this.rootId + " div.CardUI-col3");
	this.backButton = $("#CardUI-BackButton");
	
	var t = this;
	$("#CardUI-BackButton").click(function(e){
		t.onItemClick(t.menu[t.curItem].parentId);
	});
	
	$(window).resize(function() {
		t.refreshPositions();
	});
	$(this.rootId).fadeIn("fast");
}

CardUI.prototype.addCard = function(parentId, menu){
	var card = new Card(menu, this);
	card.id = this.nextId;
	card.parentId = parentId;
	card.level = this.menu[parentId].level+1;
	
	if(!card.buttons)
		card.buttons = [];
	if(!card.inputs)
		card.inputs = [];
	
	this.menu[card.id] = card;
	this.nextId++;
	return card;
}

CardUI.prototype.setVisible = function(visible){
	this.visible = visible;
	if(visible === false)
		$(this.rootId).fadeOut("fast");
	else
		$(this.rootId).fadeIn("fast");
}

CardUI.prototype.setChildsVisibility = function(parentId, visible){
	if(parentId){
		var childs = this.getChilds(parentId);
		for(i in childs)
			childs[i].visible = visible;
	}
}

CardUI.prototype.setCardVisibility = function(cardId, visible){
	if(cardId)
		this.menu[cardId].visible = visible;
}

CardUI.prototype.removeAllChilds = function(parentId){
	for(var i = 0; i < this.menu.length; i++){
		if(this.menu[i] != undefined && this.menu[i].parentId == parentId){
			this.removeCard(this.menu[i].id);
		}
	}
}

CardUI.prototype.removeCardByIdx = function(parentId, idx){
	var localIdx = 0;
	for(var i = 0; i < this.menu.length; i++){
		if(this.menu[i] != undefined && this.menu[i].parentId == parentId){
			if(localIdx == idx){
				this.removeCard(this.menu[i].id);
				return true;
			} 
			localIdx++;
		}
	}
	return false;
}

CardUI.prototype.removeCard = function(id){
	if(id && this.menu[id]){
		this.menu[id] = undefined;
		this.removeAllChilds(id);
	}
}

CardUI.prototype.parent = function(id){
	return this.menu[id].parentId;
}

CardUI.prototype.get = function(id){
	return this.menu[id];
}

CardUI.prototype.isCardVisible = function(id){
	return this.menu[id].uiLastDrawNum == this.drawNum;
}

CardUI.prototype.getChilds = function(parentId){
	var res = [];
	for(var i = 0; i < this.menu.length; i++)
		if(this.menu[i] != undefined && this.menu[i].parentId == parentId)
			res[res.length] = this.menu[i];
	return res;
}

CardUI.prototype.onItemClick = function(itemId){
	if(typeof(this.menu[itemId].onClick) === "function")
		this.menu[itemId].onClick.call(this.menu[itemId]);
		
	if(this.menu[itemId].preventDefaultClickAction !== true){
		var newCurItem = 0;
		if(itemId == this.curItem){
			newCurItem = this.parent(itemId);
			if(typeof(this.menu[itemId].onToggleOff) === "function")
				this.menu[itemId].onToggleOff.call(this.menu[itemId]);
		} else if(itemId == this.parent(this.curItem)){
			newCurItem = this.parent(this.parent(this.curItem));
			if(typeof(this.menu[itemId].onToggleOff) === "function")
				this.menu[itemId].onToggleOff.call(this.menu[itemId]);
		} else {
			newCurItem = itemId;
			if(typeof(this.menu[itemId].onToggleOn) === "function")
				this.menu[itemId].onToggleOn.call(this.menu[itemId]);
		}
			
		this.setCurItem(newCurItem);
		this.draw();
	}
	
	if(typeof(this.menu[itemId].afterClick) === "function")
		this.menu[itemId].afterClick.call(this.menu[itemId]);
}

CardUI.prototype.setCurItem = function(itemId){
	if(itemId != undefined && itemId != null){
		var from = this.menu[this.curItem].level
		var to = this.menu[itemId].level
		var direction = to>from?1:to<from?-1:0;
	
		this.curItem = itemId;
		this.selectedItem = null;
		this.nextDrawDirection = direction;
		
		if(typeof(this.menu[itemId].onSetToCur) === "function")
			this.menu[itemId].onSetToCur.call(this.menu[itemId]);
	}
}

CardUI.prototype.showSimpleDialog = function(options, onClose){
	this.init();
	options.dialog = true;
	options.clickable = false;
	options.closeButton = true;
	options.onClose = function(card){card.ui.setVisible(false); if(typeof(onClose) == "function") onClose(card);};
	this.removeAllChilds(0);
	this.addCard(0, options);
	this.draw();
}

CardUI.prototype.draw = function(){
	if(this.nextDrawDirection == 1)
		this.cols[2].hide();
		
	this.doDraw();
	
	if(this.nextDrawDirection == 1)
		this.cols[2].fadeIn(this.fadeTime);
		
	this.nextDrawDirection = undefined;
}

CardUI.prototype.contentAppend = function(parent, newChild){
	if(parent.children().length > 0) 
		parent.append("<div class='CardUI-separator'></div>"); 
	parent.append(newChild);
}

CardUI.prototype.doDraw = function(){
	if(!this.visible)
		return;

	this.drawNum++;
	for(var i = -2; i <= 0; i++){
		this.cols[i+2].empty();
		var lvl = this.menu[this.curItem].level + i;
		if(lvl<0){
			$(this.rootId + " div.CardUI-column").eq(i+2).hide();
			continue;
		}
		$(this.rootId + " div.CardUI-column").eq(i+2).show();
		
		var items;
		var selectedOnThisLevel = null;
		
		if(lvl == this.menu[this.curItem].level - 2){
			items = this.getChilds(this.parent(this.parent(this.curItem)));
			selectedOnThisLevel = this.parent(this.curItem);
		} else if(lvl == this.menu[this.curItem].level - 1){
			items = this.getChilds(this.parent(this.curItem));
			selectedOnThisLevel = this.curItem;
		} else if(lvl == this.menu[this.curItem].level){
			items = this.getChilds(this.curItem);
		}
		
		for(var k = 0; k < items.length; k++){
			if(items[k].visible === false || items[k].isRow === true)
				continue;
				
			var item = items[k];
			
			item.uiLastDrawNum = this.drawNum;
			
			var div = $(document.createElement("div"));
			div.attr("id", "UICard-" + item.id);
			div.addClass("CardUI-card");
			div.data("id", item.id);

			if(selectedOnThisLevel == item.id)
				div.addClass("CardUI-selectedItem");
			
			this.drawCard(item.id, div, true);
		
			this.cols[i+2].append(div);
		}
		this.refreshPositions();
	}
}

CardUI.prototype.refreshPositions = function(){
	var t = this;
	setTimeout(function() {
		var col1 = $(t.rootId + " div.CardUI-column:nth-child(1)");
		var col2 = $(t.rootId + " div.CardUI-column:nth-child(2)");
		var col3 = $(t.rootId + " div.CardUI-column:nth-child(3)");
		col1.css("left", 0);
		col2.css("left", col1.width());
		col3.css("left", col2.width() + (col1.is(":visible") ? col1.width() : 0));
		col1.css("top", Math.max(0, $(window).height() / 2 - col1.height() / 2));
		col2.css("top", Math.max(0, $(window).height() / 2 - col2.height() / 2));
		col3.css("top", Math.max(0, $(window).height() / 2 - col3.height() / 2));
	}, 0);
}

CardUI.prototype.drawCard = function(cardId, div, doNotRefreshPositions){
	var setAsFocus = null;
	if(div === undefined)
		div = $('#UICard-' + cardId);
	
	if(div.length < 1)
		console.log("Could not find div from id " + cardId);
	
	var item = this.menu[cardId];
		
	div.empty();
		
	if(!isNaN(item.maxWidth))
		div.css("max-width", item.maxWidth + "px");
	
	if(item.clickable !== false){
		div.addClass("CardUI-clickable");
		var t = this;
		div.click(function(e){
			if(e.target.nodeName != "BUTTON" && e.target.nodeName != "INPUT" && e.target.nodeName != "A")
				t.onItemClick($(this).data("id"));
		});
	}
	
	if(item.title){
		var title = $("<div class='CardUI-card-title'></div>");
		title.append(item.title);
		this.contentAppend(div, title);
	}
	
	if($.isArray(item.content) && item.tabs !== undefined){
		//Tabs
		/*
		var content = $("<div class='CardUI-card-content'></div>");
		content.append(item.content[0]);
		this.contentAppend(div, content);
		*/
	}
	else if(item.content){
		var content = $("<div class='CardUI-card-content'></div>");
		content.append(item.content);
		this.contentAppend(div, content);
	}
	
	//Table
	if(typeof(item.table) == "object"){
		var tab = $("<table class='CardUI-card-table'><thead></thead><tbody></tbody></table>");
		var numColumns = 0;
		if(typeof(item.table.columns) == "object"){
			for(col in item.table.columns){
				tab.find("thead").append("<th>" + item.table.columns[col] + "</th>");
				numColumns++;
			}
		} else if(typeof(item.table.columns) === "number")
			numColumns = item.table.columns;
			
		var row;
		var field;
		if(typeof(item.table.rows) == "object"){
			for(var r = 0; r < item.table.rows.length; r++){
				row = $("<tr></tr>");
				if(item.table.selectable === true){
					row.addClass("selectable");
					if(r == item.table.selectedIdx)
						row.addClass("selected");
					
					row.data("cardId", item.id);
					row.data("ui-idx", r);
					var t = this;
					row.click(function(e){
						var cId = $(this).data("cardId");
						var idx = $(this).data("ui-idx");
						var card = t.get(cId);
						card.table.selectedIdx = card.table.selectedIdx == idx ? undefined : idx;

						if(typeof(card.table.onClick) === "function")
							card.table.onClick.call(card, card.table.rows[idx], idx);
						if(typeof(card.table.onSelect) === "function" && card.table.selectedIdx == idx)
							card.table.onSelect.call(card, card.table.rows[idx], idx);
						if(typeof(card.table.onDeselect) === "function" && card.table.selectedIdx === undefined)
							card.table.onDeselect.call(card, card.table.rows[idx], idx);
						
						t.draw();
					});
				}
					
				for(var tCol = 0; tCol < numColumns; tCol++){
					if(typeof(item.table.columns[tCol]) == "object" && item.table.columns[tCol].visible === false)
						continue;
					if(!$.isArray(item.table.rows[r]) && item.table.rows[r].cells !== undefined && item.table.rows[r].cells[tCol] !== undefined)
						$("<td></td>").appendTo(row).append(item.table.rows[r].cells[tCol]);
					else if(typeof(item.table.rows[r][tCol]) === "object" && item.table.rows[r][tCol].text !== undefined)
						$("<td></td>").appendTo(row).append(item.table.rows[r][tCol].text);
					else
						$("<td></td>").appendTo(row).append(item.table.rows[r][tCol]);
				}
				
				tab.find("tbody").append(row);
			}
		}
		this.contentAppend(div, tab);
	}
	
	
	if(item.inputs && item.inputs.length > 0){
		var table = $("<table class='CardUI-inputtable'></table>");
		for(var inp = 0; inp < item.inputs.length; inp++){
			var id = "input" + item.id + "-" + inp;
			
			var tr = $(document.createElement("tr"));
			
			tr.append("<td>" + (item.inputs[inp].label ? item.inputs[inp].label : "") + "</td>");
			
			var input = $(document.createElement("input"));
			input.addClass("CardUI-card");
			input.attr("type", item.inputs[inp].type);
			input.attr("id", id);
			input.data("id", item.id);
			input.data("inputIdx", inp);
			
			if(item.inputs[inp].value !== undefined)
				input.val(item.inputs[inp].value);
			
			//item.inputs[inp]._element = input;
			
			var td = $(document.createElement("td"));
			td.append(input);
			tr.append(td);
			table.append(tr);
			
			if(setAsFocus === null)
				setAsFocus = input;
		}
		this.contentAppend(div, table);
	}
	
	if(item.buttons && item.buttons.length > 0){
		var buttonDiv = $("<div class='NewUI-CardButtonGroup'></div>");
		for(var b = 0; b < item.buttons.length; b++){
			var btn = $(document.createElement("button"));
			btn.addClass("CardUI-clickable");
			btn.addClass("CardUI-card");
			btn.html(item.buttons[b].title);

			btn.data("cardId", item.id);
			btn.data("buttonIdx", b);
			var t = this;
			btn.click(function(e){
				var card = t.menu[$(this).data("cardId")];
				var button = card.buttons[$(this).data("buttonIdx")];
				t.handleButtonClick(card, button);
				
			});
			
			buttonDiv.append(btn);
			
			if(setAsFocus === null)
				setAsFocus = btn;
		}
		
		this.contentAppend(div, buttonDiv);
		
		/*if(item.buttons.length > 0)
			div.find("button:last-child").addClass("CardUI-card-last");*/
	}
		
	//Close button - needs to be last, because it sholdn't have a separator!
	if(item.closeButton === true){
		var btn = $(document.createElement("div"));
		btn.addClass("CardUI-closeButton");
		btn.data("cardId", item.id);
		btn.data("type", "close");
		var t = this;
		btn.click(function(e){
			var card = t.menu[$(this).data("cardId")];
			t.setCurItem(t.parent(card.parentId));
			
			if(typeof(card.onClose) === "function")
				card.onClose(card);
			
			t.draw();
		});
		
		div.prepend(btn);
	}

	if(item.maximize)
		div.addClass("CardUI-maximized-card");

	if(item.dialog){
		div.addClass("CardUI-dialog-card");
		if($(this.rootId + " div.overlay").length < 1)
			$(this.rootId).append("<div class='overlay' onclick=\"$('" + this.rootId + " div.CardUI-dialog-card .CardUI-closeButton').click();\"></div<");
		
		
		if(!isNaN(item.width))
			div.css("width", item.width);
		if(!isNaN(item.height))
			div.css("height", item.height);
			
		div.hide();
		var t = this;
		setTimeout(function(){
			var d = $("div.CardUI-dialog-card");
			var card = d.data("cardId");
			
			d.css("left", $(window).width() / 2 - d.width() / 2);
			d.css("top", $(window).height() / 2 - d.height() / 2);
			
			$(t.rootId + " div.overlay").fadeIn("fast");
			div.show();
		}, 0);
	} else {
		$(this.rootId + " div.overlay").fadeOut("fast");
	}
	
	if(doNotRefreshPositions !== true)
		this.refreshPositions();
	
	if(setAsFocus !== null)	
		setTimeout(function(){setAsFocus.focus();}, 0);
}


CardUI.prototype.handleButtonClick = function(card, button){
	if(card.inputs){
		var inputValues = [];
		for(var btnInputIdx = 0; btnInputIdx < card.inputs.length; btnInputIdx++)
			inputValues[btnInputIdx] = card.inputs[btnInputIdx].type == "checkbox" 
												? ($("#input" + card.id + "-" + btnInputIdx).attr('checked') ? true : false)
												: $("#input" + card.id + "-" + btnInputIdx).val();
	}
	
	if(!isNaN(button.goto)){
		this.setCurItem(button.goto);
		this.draw();
	}
	
	if(button.close === true){
		this.setCurItem(this.parent(card.parentId));
		if(typeof(card.onClose) === "function")
					card.onClose.call(card);
		this.draw();
	}
		
	if(!isNaN(button.show)){
		this.setChildsVisibility(this.parent(button.show), false);
		this.setCardVisibility(button.show, true);
		this.setCurItem(this.parent(button.show));
		this.draw();
	}
	
	if(!isNaN(button.showToggle)){
		if(this.isCardVisible(button.showToggle)){
			this.setCardVisibility(button.showToggle, false);
			this.setCurItem(this.parent(this.parent(button.showToggle)));
			this.draw();
		} else {
			this.setChildsVisibility(this.parent(button.showToggle), false);
			this.setCardVisibility(button.showToggle, true);
			this.setCurItem(this.parent(button.showToggle));
			this.draw();
		}
	}
	
	if(typeof(button.onClick) === "function")
		button.onClick.call(card, button, inputValues);
}


function Card(options, cardui){
	this.ui = cardui;
	for(k in options)
		this[k] = options[k];
		
	this.addChild = function(card){return this.ui.addCard(this.id, card);}
	this.removeAllChilds = function(){return this.ui.removeAllChilds(this.id);}
	this.removeCardByIdx = function(idx){return this.ui.removeCardByIdx(this.id, idx);}
	this.removeCard = function(){return this.ui.removeCard(this.id);}
	this.isVisible = function(){return this.ui.isCardVisible(this.id);}
	this.getChilds = function(){return this.ui.getChilds(this.id);}
	this.parent = function(){return this.ui.get(this.parentId);}
	this.setAsCurrent = function(){return this.ui.setCurItem(this.id);}
	this.draw = function(){return this.ui.drawCard(this.id);}
	this.eachChild = function(runForEach){$.each(this.getChilds(), function(idx, card){runForEach.call(this, card, idx);});}
}