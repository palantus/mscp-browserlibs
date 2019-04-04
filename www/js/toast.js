"use strict"

/*
	Usage:
		toast("Hello")
		toast({timeout: 3}, "hello")
		toast({timeout: 3, text: "hello"})
		toast({title: "Toast title", timeout: null}, "Notification with title")

		See toast.html under test for other usages (like progressbars)

	Options:
		timeout: Timeout in seconds
		text: toast text
		title: toast title (optional)
		showClose: boolean to indicate wether a close button is shown
		uniqueId: any kind of id. When creating new toasts, duplicates are ignored. Find existing toast with Toaster.findId(id)

	Methods:
		kill
		body
*/

class Toaster{
	constructor(){
		this.tickInterval = setInterval(() => this.tick(), 200)
		this.notifications = []

		this.element = $("<div/>", {"class": "stackoftoasts"})
		$("body").append(this.element)
		this.element.show();
	}

	showToast(toast){
		let existingToast = this.findId(toast.id)
		if(existingToast)
			return existingToast;

		this.notifications.push(toast)
		this.element.prepend(toast.element);
		toast.element.fadeIn("fast");
		return toast;
	}

	tick(){
		for(let i = this.notifications.length - 1; i >= 0; i--){
			let timeout = this.notifications[i].timeout
			if(!isNaN(timeout) && timeout > 0 && timeout <= new Date().getTime()){
				this.kill(this.notifications[i])
			}
		}

		for(let t of this.notifications){
			t.tick();
		}
	}

	kill(toast){
		let idx = this.notifications.findIndex((n) => n === toast)
		if(idx >= 0){
			toast.element.fadeOut("fast");
			this.notifications.splice(idx, 1)
		}
	}

	findId(id){
		return this.notifications.find((n) => n.id === id) || null
	}
}

class Toast{
	constructor(options, text){
		if(!Toaster.instance){
			Toaster.instance = new Toaster();
		}

		if(typeof text === "string"){
			this.options = options;
			this.options.body = text
		} else if(typeof options === "string"){
			this.options = {body: options}
		} else if(typeof options === "object"){
			this.options = options
		} else {
			this.options = {}
		}

		let removeAfter = this.options.timeout !== undefined ? this.options.timeout : 5
		this.timeout = (removeAfter != null && !isNaN(removeAfter)) ? new Date().getTime() + (removeAfter * 1000) : null
		this.id = this.options.id || this.getNewId()
	}

	show(){
		this.element = $(`
				<div class="toast">
					<div class="topbar">
						<span class="title"></span>
						<button class="close">×</button>
					</div>
					<div class="body"/>
				</div>
			`);
		this.element.hide();
		this.element.find(".topbar").toggle(!this.timeout || this.options.showClose === true || this.options.title !== undefined)
		this.element.find(".topbar .close").toggle(!this.timeout || this.options.showClose === true).click(() => Toaster.instance.kill(this))
		this.element.find(".topbar .title").toggle(this.options.title !== undefined ).html(this.options.title)

		this.element.find(".body").html(this.options.body);

		if(typeof this.options.onClick === "functions"){
			this.element.addClass("clickable")
		}

		if($("div.tbcbar").length > 0)
			this.element.css("transform", "translate(0px,-30px)");

		this.element.click(() => this.clicked())

		return Toaster.instance.showToast(this)
	}

	clicked(){
		if(typeof this.options.onClick === "function"){
			this.options.onClick.call(this, this)
		}
	}

	body(text){
		this.element.find(".body").html(text)
		return this;
	}

	tick(){

	}

	kill(){
		Toaster.instance.kill(this)
		return this;
	}

	getNewId() {
		let s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
	}
}

class ToastProgress extends Toast{

	constructor(options, text){
			super(options, text)

			if(this.options.expectedDuration){
				this.options.eta = new Date().getTime() + this.options.expectedDuration
			}
			this.options.showClose = true;
			this.timeout = null;
			this.done = false;
	}

	show(){
		super.show()
		this.startTime = new Date().getTime();
		this.element.append(`<div class="progress-bar"><span style="background: rgba(50, 0, 150, 0.3)"></span><div></div></div>`)

		this.updateProgress()
		return this;
	}

	eta(eta){
		this.options.eta = eta;
		return this;
	}

	progress(progress){
		this.options.progress = progress
		return this;
	}

	tick(){
		super.tick()
		this.updateProgress();
	}

	updateProgress(){
		if(this.done) return;
		if(this.options.eta <= 0) return;

		let now = new Date().getTime() - this.startTime;
		let then = this.options.eta - this.startTime;
		if(!isNaN(this.options.progress) || this.options.eta === undefined){
			let pct = this.options.progress || 0;

			this.element.find(".progress-bar span").css("width", `${pct}%`)
			this.element.find(".progress-bar div").html(pct < 100 ? `${pct}%` : "completed")
			this.done = pct >= 100;
		} else {
			let pct = Math.min(100, parseInt((now / then) * 100));
			let msLeft = Math.max(0, this.options.eta - new Date().getTime())

			this.element.find(".progress-bar span").css("width", `${pct}%`)
			this.element.find(".progress-bar div").html(this.millisecondsToStr(msLeft))
		}
	}

	finished(){
		this.done = true;
		this.element.find(".progress-bar span").css("width", `100%`)
		this.element.find(".progress-bar div").html("completed")
		return this;
	}

	millisecondsToStr (milliseconds) {
		/*
    function numberEnding (number) {
        return (number > 1) ? 's' : '';
    }

    var temp = Math.floor(milliseconds / 1000);
    var years = Math.floor(temp / 31536000);
    if (years) {
        return years + ' year' + numberEnding(years);
    }
    //TODO: Months! Maybe weeks?
    var days = Math.floor((temp %= 31536000) / 86400);
    if (days) {
        return days + ' day' + numberEnding(days);
    }
    var hours = Math.floor((temp %= 86400) / 3600);
    if (hours) {
        return hours + ' hour' + numberEnding(hours);
    }
    var minutes = Math.floor((temp %= 3600) / 60);
    if (minutes) {
        return minutes + ' minute' + numberEnding(minutes);
    }
    var seconds = temp % 60;
    if (seconds) {
        return seconds + ' second' + numberEnding(seconds);
    }
    return '<1 second'; //'just now' //or other string you like;
		*/

		let ret = ""
    let temp = Math.floor(milliseconds / 1000);
		let hours = Math.floor((temp %= 86400) / 3600);
		if(hours)
			ret += `${hours}h`

    var minutes = Math.floor((temp %= 3600) / 60);
		if(minutes)
			ret += `${ret?' ':''}${minutes}m`

    var seconds = temp % 60;
		if(seconds)
			ret += `${ret?' ':''}${seconds}s`

		return  ret ? "~" + ret : "< 1s"
	}
}

var toast = (options, text) => new Toast(options, text).show();
var toastProgress = (options, text) => new ToastProgress(options, text).show();
