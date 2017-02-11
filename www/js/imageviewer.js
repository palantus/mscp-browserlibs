function ImageViewer(){
	this.imagelist = [];
	this.element = null;
	this.curIdx = -1;
}

ImageViewer.prototype.init = function(images){
	var t = this;
	images = $.extend(true, [], images);
	this.imagelist = !$.isArray(images) ? [images] : images;

	for(var i = 0; i < this.imagelist.length; i++)
		this.imagelist[i].id = guid();

	$(document).keydown(function(e) {
		if (e.keyCode == 27) //ESC
			t.close();
		else if(e.keyCode == 37) // Left
			t.prev();
		else if(e.keyCode == 39) // Right
			t.next();
	});
}

ImageViewer.prototype.show = function(index){
	var t = this;
	index = parseInt(index);
	if(this.element == null){
		this.element = $("<div class='ImageViewer'></div>");
		$("body").append(this.element);

		this.element.click(".imageviewer", function(e){
			if(e.clientX < $(window).innerWidth() / 3)
				t.prev();
			else if(e.clientX > $(window).innerWidth() * (2/3))
				t.next();
			else
				t.close();
		});
	}

	this.element.empty();

	this.curIdx = index === undefined ? 0 : index;
	var curImage = {};
	if($.isArray(this.imagelist) && this.curIdx < this.imagelist.length)
		curImage = this.imagelist[this.curIdx];
	else
		return;

	var img = $("<img></img>", {src: "/mscp/libs/img/loading2.gif"});	
	this.element.append(img);

	this.loadAdjacentImages(this.curIdx);
}

ImageViewer.prototype.next = function(){
	if(this.curIdx + 1 < this.imagelist.length)
		this.show(this.curIdx + 1);
}

ImageViewer.prototype.prev = function(){
	if(this.curIdx - 1 >= 0)
		this.show(this.curIdx - 1);
}

ImageViewer.prototype.close = function(index){
	if(this.element != null)
		this.element.remove();
}

ImageViewer.prototype.loadAdjacentImages = function(index){
	var t = this;
	index = parseInt(index);

	var imageLoaded = function() {
		t.element.removeClass("imgloading");
		if(t.imagelist[t.curIdx].id == $(this).data("id"))
			t.element.find("img")[0].src = this.src;

		for(var i = 0; i < t.imagelist.length; i++){
			if(t.imagelist[i].id == $(this).data("id"))
    			t.imagelist[i].image = this;
		}
    }

    var tmpIndicesToLoad = [index, index+1, index-1, index+2];
    var indicesToLoad = [];
    for(var i = 0; i < tmpIndicesToLoad.length; i++){
    	if(tmpIndicesToLoad[i] >= 0 && tmpIndicesToLoad[i] < this.imagelist.length)
    		indicesToLoad.push(tmpIndicesToLoad[i]);
    }

    console.log(indicesToLoad);

    for(var i = 0; i < indicesToLoad.length; i++){
		if(this.imagelist[indicesToLoad[i]].image !== undefined){
			// Already loaded into image
			if(indicesToLoad[i] == this.curIdx)
				t.element.find("img")[0].src = this.imagelist[indicesToLoad[i]].image.src;
		} else {
	    	var tmpImg = new Image() ;
	        tmpImg.onload = imageLoaded ;
	        tmpImg.src = this.imagelist[indicesToLoad[i]].src;
	        this.imagelist[indicesToLoad[i]].src = tmpImg.src;
	        $(tmpImg).data("id", this.imagelist[indicesToLoad[i]].id);
	        if(indicesToLoad[i] == this.curIdx){
		        this.element.addClass("imgloading");
		    }
		}
    }
}

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
             .toString(16)
             .substring(1);
};

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
}
