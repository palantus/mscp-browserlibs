/*
	Todo:
		- select resulterer i en højere row når man klikker på den
		- select skal implementeres som en custom dropdown, så jeg slipper af med den "pil ned"
		- skal give mulighed for at smide en lookup på et tekstfelt (overvej så om "select" skal fjernes til fordel for denne).

	Usage:
		- setValue

	Additional options:
		- onEdit
		- element
		- type: can be one of: text, textarea, select, taglist, checkbox
		- valueSource: sync funktion til at returnere værdien for et felt
		- width
		- sameWidth: bredden af edit feltet bliver sat til den samme som det oprindelige felt. Hvis ikke denne (og width) sættes, bliver bredden 100%.
		- onTagAdd
		- onTagRemove
		- maxLength: max length of string fields

*/

function FieldEdit(language){
	this.type = "FieldEdit";
	this.options = {};
	this.element = null;
	this.valueElement = null;
	this.saveBtn = null;
	this.popup = null;
	this.language = language ? language : "en";

	this.translations = {
							da: {save: "Gem"},
							en: {save: "Save"}
						}
}

FieldEdit.prototype.init = async function(_options){
	this.options = _options;
	var t = this;

	if(typeof(this.options.elementRef) === "string")
		this.element = $("#" + this.options.elementRef);
	else if(typeof(this.options.element) === "object")
		this.element = this.options.element;

	if(!this.element)
		console.log("ERROR: No element for FieldEdit options");

	this.element.addClass("fe");
	this.element.addClass("feedit");

	this.element.data("fe", this);

	if(typeof(this.options.values) === "function"){
    let vals = await this.options.values(this, function(values){
			t.options.values = values;
		});
		
		if(vals)
			t.options.values = vals;
	}

	return this;
}

FieldEdit.prototype.attach = function(){
	var t = this;

	this.element.mouseenter(function(){
		if(!t.valueChanged() || !t.valueElement){
			clearTimeout(t.mouseOutTimer);
			if(!$(".feedit .fevalueelement").is(":focus"))
				t.show();
		}
	});
	this.element.click(function(){
		clearTimeout(t.mouseOutTimer);
		if(!$(".feedit .fevalueelement").is(":focus"))
			t.show();
	});

	this.element.empty();
	if(this.options.valueDisplay !== undefined)
		this.element.append(this.options.valueDisplay ? this.options.valueDisplay : "&nbsp;");
	else
		this.element.append(this.options.value ? this.options.value : "&nbsp;");
}

FieldEdit.prototype.show = function(setFocus){
	var originalWidth = this.element.width();
	var originalHeight = this.element.height();

	var t = this;

	var value = null;
	if(typeof(this.options.valueSource) === "function")
		value = this.options.valueSource.call(this);
	else
		value = this.options.value;

	switch(this.options.type){
		case "text" :
			this.valueElement = $("<textarea/>", {class: "fevalueelement", val: value, rows: 1});
			break;
		case "textarea" :
			this.valueElement = $("<textarea/>", {class: "fevalueelement", val: value});
			this.valueElement.on("input", function(){
				var height = $(this).height();
				var numLB = $(this).val().split("\n").length;
				if(height <  numLB * 20)
					$(this).height(numLB * 20);
				t.saveBtn.css("top", $(this).height());
			});
			break;
		case "checkbox" :
			this.valueElement = $("<input/>", {class: "fevalueelement", type: "checkbox", checked: value});
			break;
		case "taglist" :
			this.valueElement = $("<span/>", {class: "fevalueelement fetaglist"});
			if(typeof(t.options.value) === "string"){
				var tags = t.options.value.split(",");
				for(var i = 0; i < tags.length; i++){
					var newTagElement = $("<span/>", {html: $.trim(tags[i])});
					var removeBtn = $("<img/>", {src: "/mscp/libs/img/close.png"});
					removeBtn.data("tag", $.trim(tags[i]));
					removeBtn.click(function(e){
						var tag = $(this).data("tag");
						if(typeof(t.options.onTagRemove) === "function")
							t.options.onTagRemove.call(t, tag, t.element);
					});
					newTagElement.append(removeBtn);
					this.valueElement.append(newTagElement);
				}
			}
			var newTagBtn = $("<img/>", {src: "/mscp/libs/img/add.png", class: "fetaglistnew"});
			newTagBtn.click(function(e){
				var tag = $(this).data("tag");
				t.hide();
				if(typeof(t.options.onTagAdd) === "function")
					t.options.onTagAdd.call(t, t.element);
			});
			this.valueElement.append(newTagBtn);
			break;
		case "select" :
			this.valueElement = $("<select/>", {class: "fevalueelement"});
			for(i in t.options.values){
				if(typeof(t.options.values[i]) === "object"){
					var id = t.options.values[i].Id !== undefined? t.options.values[i].Id : t.options.values[i].id;
					var lbl = t.options.values[i].Label !== undefined ? t.options.values[i].Label : t.options.values[i].label
					this.valueElement.append("<option value='" + id + "'>" + lbl + "</option>");
				} else {
					this.valueElement.append("<option value='" + i + "'>" + t.options.values[i] + "</option>");
				}
			}
			this.valueElement.val(value);
			break;
		default:
			console.log("Unknown type: " + this.options.type);
			return;
	}

	if(!isNaN(t.options.maxLength))
		this.valueElement.attr("maxlength", t.options.maxLength);

	this.element.empty();
	this.element.append(this.valueElement);

	this.element.mouseleave(function(){
		if(t.element !== null && !t.valueElement.is(":focus") && !t.valueChanged())
			t.hide();
	});
	this.element.focusout(function(){
		if(!t.valueChanged()){
			t.saveBtn.hide();
			if(t.element !== null && !t.element.is(":focus"))
				t.hide();
		}
	});
	this.element.focusin(function(){
		t.saveBtn.show();
	});

	this.element.keydown(function(e){
		var keyCode = e.keyCode || e.which;
		if(keyCode == 13){ //ENTER
			if(t.options.type == "text"){
				e.stopPropagation();
				t.save();
			}
		} else if(keyCode == 27){ //ESC
			e.stopPropagation();
			t.hide();
		} else if (keyCode == 9) { //Tab
			e.preventDefault();
			var isMe = false;
			if(t.options.rootElement !== undefined)
				var rootElement = t.options.rootElement;
			else if(t.element.closest(".pccontent").length > 0)
				var rootElement = t.element.closest(".pccontent");
			else
				var rootElement = t.element.parent();

			if(e.shiftKey)
				var fields = $(rootElement.find(".fe").get().reverse());
			else
				var fields = rootElement.find(".fe");

			fields.each(function(){
				if(isMe){
					var fe = $(this).data("fe");
					if(fe.options.type !== "taglist"){ //Cannot focus taglist
						fe.show(true);
						return false;
					}
				}
				if($(this)[0] == t.element[0])
					isMe = true;
			});
		}

		return true;
	});

	if(this.element.height() > 0)
		this.valueElement.height(originalHeight > 0 ? originalHeight : "1em");

	if(this.options.sameWidth === true){
		this.valueElement.width(originalWidth);
	} else if(this.options.width !== undefined){
		this.valueElement.width(this.options.width);
	}

	this.valueElement.css({
							"font-family": this.element.css("font-family"),
							"font-size": this.element.css("font-size"),
							"font-style": this.element.css("font-style"),
							"font-variant": this.element.css("font-variant"),
							"font-weight": this.element.css("font-weight")
						});

	this.saveBtn = $("<button/>", {class: "fesave febuttonsmall", html: this.label("save")});
	this.saveBtn.mousedown(function(){
		t.save();
	});
	this.saveBtn.css("top", this.element.height());
	this.saveBtn.hide();
	this.element.append(this.saveBtn);

	if(setFocus)
		this.valueElement.focus();
}

FieldEdit.prototype.valueChanged = function(){
	var curVal = this.getValue();
	var savedVal = this.options.value;

	if(curVal == savedVal || (!curVal && !savedVal) || this.options.type == "taglist")
		return false;

	return true;
}

FieldEdit.prototype.getValue = function(){
	var value = null;

	if(this.valueElement){
		if(this.options.type === "checkbox")
			value = this.valueElement.is(":checked");
		else
			value = this.valueElement.val();
	}
	return value;
}

FieldEdit.prototype.save = function(){
	var value = this.getValue();
	if(typeof(this.options.onSave) === "function")
		this.options.onSave.call(this, value, this.options.value, this.element);
	this.options.value = value;
	this.hide();
}

FieldEdit.prototype.setValue = function(value){
	this.options.value = value;
	this.hide();
}

FieldEdit.prototype.hide = function(){
	if(this.element !== null){
		this.element.empty();
		this.element.off("focusin");
		this.element.off("focusout");
		this.element.off("mouseleave");
		this.element.off("keydown");

		if(this.options.valueDisplay !== undefined)
			this.element.append(this.options.valueDisplay ? this.options.valueDisplay : "&nbsp;");
		else
			this.element.append(this.options.value && this.options.value !== null ? this.options.value : "&nbsp;");
	}
}

FieldEdit.prototype.label = function(text){
	return this.translations[this.language][text];
}
