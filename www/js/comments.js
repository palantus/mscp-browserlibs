/*
	Usage: 
	
		
	Additional options:
		- onClickOverride: will be called instead of onClick if set. Can be used to call onClick with specific parameters.
		
*/

function Comments(){
	this.type = "Comments";
	this.options = {};
	this.element = null;
	this.popup = null;
}

Comments.prototype.init = function(_options){
	this.options = _options;
	var t = this;
	
	var t = this;
	if(typeof(this.options.elementRef) === "string")
		this.element = $("#" + this.options.elementRef);
	else if(typeof(this.options.element) === "object")
		this.element = this.options.element;
		
	if(!this.element)
		console.log("ERROR: No element for Comments options");
	
	this.element.addClass("cmt");
	
	return this;
}

Comments.prototype.show = function(){
	var t = this;
		
	t.element.empty();
		
	var addLink = $("<button/>", {class: "cmtbutton cmtnew", html: "Ny", href: "#"});
	addLink.click(function(){
		/*
		var newComment = prompt("Skriv din nye kommentar");
		if(newComment){
			if(typeof(t.options.onAdd) === "function"){
				t.options.onAdd.call(t, newComment, function(){
					t.show();
				});
			}
		}
		*/
		t.writeComment(function(newComment){
			if(typeof(t.options.onAdd) === "function"){
				t.options.onAdd.call(t, newComment, function(){
					t.show();
				});
			}
		});
		
	});
	this.element.append(addLink);
		
	if($.isArray(t.options.comments)){
		this.comments = t.options.comments;
		t.appendComments();
	} else if(typeof(t.options.getComments) === "function"){
		t.options.getComments.call(t, function(_data){
			t.comments = _data;
			t.appendComments();
		});
	}
}

Comments.prototype.appendComments = function(){
	var t = this;
	for(var i = 0; i < this.comments.length; i++){
		var userId = this.comments[i].userId ? this.comments[i].userId : this.comments[i].UserId;
		var timestamp = this.comments[i].timestamp ? this.comments[i].timestamp : this.comments[i].Timestamp;
		var comment = this.comments[i].comment ? this.comments[i].comment : this.comments[i].Comment;
		
		var myComment = t.options.myUserId === undefined || t.options.myUserId === userId;
		
		var commentDiv = $("<div/>", {class:"cmtcommentcontainer" + (myComment?" mycomment":"")});
		commentDiv.data("comment", this.comments[i]);
		commentDiv.append($("<span/>", {html: timestamp, class:"cmttimestamp"}));
		commentDiv.append($("<span/>", {html: userId + ":", class:"cmtuserid"}));
		commentDiv.append($("<span/>", {html: comment, class:"cmtcomment"}));
		
		
		if(myComment){
			commentDiv.click(function(){
				var item = $(this).data("comment");
				if(item){
					var comment = item.comment || item.Comment;
					/*
					var res = prompt("Rediger", comment);
					if(res){
						var newComment = $.extend({}, comment, {comment: res, Comment: res});
						if(typeof(t.options.onEdit) === "function"){
							t.options.onEdit.call(t, item, newComment, function(){
								t.show();
							});
						}
					}
					*/
					t.writeComment(function(newComment){
						var newComment = $.extend({}, comment, {comment: newComment, Comment: newComment});
						if(typeof(t.options.onEdit) === "function"){
							t.options.onEdit.call(t, item, newComment, function(){
								t.show();
							});
						}
					}, comment);
				}
			});
			
			var deleteBtn = $("<button/>", {class:"cmtbuttonsmall cmtdelete", html: "Slet"});
			deleteBtn.data("comment", this.comments[i]);
			deleteBtn.click(function(e){
				var delCmt = $(this).data("comment");
				var delUserId = delCmt.userId ? delCmt.userId : delCmt.UserId;
				if(t.options.myUserId !== undefined && t.options.myUserId !== delUserId){
					new Notifier().show("Man kan ikke slette andres kommentarer");
				} else if(confirm("Er du sikker på at du vil slette denne kommentar?")){
					if(typeof(t.options.onDelete) === "function"){
						t.options.onDelete.call(t, $(this).data("comment"), function(){
							t.show();
						});
					}
				}
			});
			
			commentDiv.append(deleteBtn);
		}
		
		this.element.append(commentDiv);
	}
}

Comments.prototype.writeComment = function(callback, origComment){
	var t = this;
	var popupCreator = new PopupCreator();
	popupCreator.init({
		title: "Skriv kommentar",
		content: ""
					+ "<textarea style='width: 400px; height: 70px; display: block;'></textarea>"
					+ "<button id='ok' style=''>Gem</button>"
					+ "<button id='cancel'>Fortryd</button>",
		onShow: function(){
			var t = this;
			this.element.find("textarea").focus();
			
			if(origComment !== undefined){
				this.element.find("textarea").val(origComment);
			}

			this.element.find("textarea").keydown(function(e){
				if(e.which == 13){
					t.element.find("#ok").click();
				}
			});
			
			this.element.find("#ok").click(function(){
				var newTitle = t.element.find("textarea").val();
				if(newTitle){
					t.close();
					callback.call(t, newTitle);
				}
			});
			
			this.element.find("#cancel").click(function(){
				t.close();
			});
		}
	});
	popupCreator.show();
}