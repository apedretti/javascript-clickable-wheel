/*
*
* Clickable Wheel Menu 
* 
* 2013
* Alejandro Pedretti
* http://alejandropedretti.com.ar/
* 
* 
* Robert Penner's easing functions: https://github.com/danro/jquery-easing/blob/master/jquery.easing.js
* 
*/

/*************************************
CONFIG
******************/
Wheel.config = {
	
	/* Wheel images name
	*/
	names : {
		shadow: "shadow.png",
		wheel: "wheel.png",
		button: "button",	
		over: "over.png"	
	},
		
	//Delta of movement (in degrees) that is still considered as selecting one button.
	buttonAngleTreshold : 2, 
	//Delta of time (in milliseconds) that is considered as selecting one button.
	buttonSelectTreshold : 200,
	//Delta of time (in milliseconds) that is considered as clicking a button.
	buttonClickingTreshold : 200, 
	//Time (milliseconds) a clicked button will be overed.
	buttonClickedTime: 350,
	
	/* Wheel deceleration effect
		'easeOutSine', 'easeOutQuad', 'easeOutQuart', 'easeOutQuint', 'easeOutExpo'
	*/
	decelerationEffect: 'easeOutExpo', 
	 
	/* We're gonna calculate SPEED as degrees by milliseconds. Now, in order to get the wheel speed, we
		sample x (speedSamplesLength) amount of speeds, separating every sample by an interval (speedSampleInterval).
		Now, when asking for the speed getter, you'll get the max speed of the last x samples.  
	*/
	speedSampleInterval : 20,
	speedSamplesLength : 5,
	speedMax : 1.5,

	/*In order to recreate the INERTIA, we're:
		1. Calculating a speed before to release the weel.
		2. Deliberately define a constant deceleration.
		3. When the wheel is released, whe calculate the time it'd take the wheel to stop using that deceleration.
		4. Then we use that time, not with a linear function but with an euler logaritm. Supposedly, this should give us
			an 'easing' efect; although truth is that here's were teory leaves reality. 
	*/	
	deceleration : 2 / 1000, //(degrees by millisecond) See point 2.
	inertiaTimeStep : 0,
	
	centerInButton: true,
	centerInButtonDelay: 600

};

/********************************
CLASS METHODS
*****************/
Wheel.init = function(selector, config){

	jQuery.extend(Wheel.config, config);
	
	var elem = $(selector);
	if (elem.length < 1){
		return false;
	}
	
	elem.each(function(){
		var w = new Wheel($(this));
		if (Wheel.config.centerInButton){
			w.centerInCurrentButton(0);
		}
	});

}

// getAngle - Angle relative to x = x2 - x1 and y = y2 - y1
Wheel.getAngle = function(x, y){
	var degrees = Math.atan2(x, y) * 180 / Math.PI + 90;
	degrees = Math.round(degrees);
	if (degrees < 0) degrees += 360;
	return degrees; 
};

// getNextId - Secuential ID 
Wheel.currentId = 0;
Wheel.getNextId = function(){
	var id = Wheel.currentId;
	Wheel.currentId++;
	return id;
};

Wheel.round = function(num, decimals){
	var _decimals = 1;
	if (decimals == undefined){
		_decimals = 100;
	}
	else{
		for (i=0; i<decimals; i++){
			_decimals *= 10;
		}
	}
	//console.log(_decimals);
	return Math.round(num*_decimals)/_decimals;
}

/********************************
CLASS Wheel
*****************/
function Wheel(param_img){

	if (param_img instanceof jQuery){
		img = param_img[0];
	}

	//Creating Wrapper
	var wrapper = document.createElement("div");
	wrapper.className = "wm_container wm_hide";
	wrapper.id = "wm_" + Wheel.getNextId();
	var imgHeight = img.height == 0 ? img.width : img.height;
	var imgWidth = img.width;
	wrapper.style.height = imgHeight + "px";
	wrapper.style.width = imgWidth + "px";
	this.wrapperId = wrapper.id;
	this.elem = $(wrapper);
	//console.log(img);
	img.parentNode.insertBefore(wrapper, img.nextSibling);

	var folderName = img.getAttribute("data-folder");
	
	//Creating the wheel	
	var imgWheel = document.createElement("img");
	imgWheel.className = "wm_wheel wm_rotate";
	imgWheel.src = folderName + "/" + Wheel.config.names.wheel;
	imgWheel.height = imgHeight;
	imgWheel.width = imgWidth;
	this.image = $(imgWheel);

	//Creating the shadow	
	this.hasBackground = img.getAttribute("data-background");
	this.hasBackground = this.hasBackground != null && this.hasBackground == "yes";
	if (this.hasBackground){
		var imgShadow = document.createElement("img");
		imgShadow.className = "wm_shadow";
		imgShadow.src = folderName + "/" + Wheel.config.names.shadow;
		imgShadow.height = imgHeight;
		imgShadow.width = imgWidth;
	}

	//Creating the over layer
	this.hasOver = img.getAttribute("data-over");
	this.hasOver = this.hasOver != null && this.hasOver == "yes";
	if (this.hasOver){
		var imgOver = document.createElement("img");
		imgOver.className = "wm_over";
		imgOver.src = folderName + "/" + Wheel.config.names.over;
		imgOver.height = imgHeight;
		imgOver.width = imgWidth;
	}
	
	//Creating the event handler layer
	var divHandler = document.createElement("div");
	divHandler.className = "wm_event_handler";
	divHandler.style.height = imgHeight + "px";
	divHandler.style.width = imgWidth + "px";
	
	
	//Creating the buttons (if any)
	this.buttonsLength = img.getAttribute("data-buttons");
	//this.hasButtons = this.buttons != null && this.buttons.length > 0;
	this.hasButtons = this.buttonsLength != null && this.buttonsLength > 0;
	if (this.hasButtons){
		this.buttons = img.parentNode.getElementsByTagName("a")
		this.buttonAngle = 0;
		var imgButton;
		//console.log(this.buttons);
		//var buttonsLength = this.buttons.length;
		this.buttonAngle = 360 / this.buttonsLength;
		var currentButton;
		for (i=0;i<this.buttonsLength;i++){
			currentButton = this.buttons[i].parentNode.removeChild(this.buttons[i]);
			currentButton.id = this.wrapperId + "_button_" + currentButton.getAttribute("data-button");
			wrapper.appendChild(currentButton);	
			imgButton = document.createElement("img");
			imgButton.id = "wm_button_"+i;
			imgButton.className = "wm_buttons wm_rotate wm_hide";
			imgButton.src = folderName+"/"+Wheel.config.names.button+ "_"+(i+1)+".png";
			imgButton.height = imgHeight;
			imgButton.width = imgWidth;
			wrapper.appendChild(imgButton);
		}
	}

	if (this.hasBackground) wrapper.appendChild(imgShadow);
	wrapper.appendChild(imgWheel);
	if (this.hasOver) wrapper.appendChild(imgOver);
	wrapper.appendChild(divHandler);

	//Making visible the wrapper (and invisible the param_img)
	param_img.hide();
	this.elem.removeClass("wm_hide");
	
	//Defaults
	this.currentAngle = 0;
	this.touched = false;
	this.width = this.height = -1;
	this.corners = { top:0, right:0, bottom:0, left:0 };
	this.middle = { x:-1, y:-1 };
	this.position = { x:-1, y:-1 };
	this.lastPosition = { x:-1, y:-1 };
	this.startingAngle = 0;
	this.startingHoldingAngle = 0;

	//Button related defaults
	this.selectedButton = -1;
	this.lastButtonAngle;
	this.lastButtonAngleTime = 0;
	this.startingTouchingTime = 0;
	this.timeout;
	
	//Speed related defaults
	this.speedTimer;
	this.lastSpeedSampleTime = 0;
	this.lastSpeedSampleAngle = 0;
	this.speedSamples = new Array(Wheel.config.speedSamplesLength);
	this.currentSpeedSample = 0;

	//Inertia related defaults
	this.inertiaTime = 0;
	this.inertiaDegrees = 0;
	this.inertiaStartingTime = 0;
	this.inertiaStartingAngle = 0;
	
	this.initData();

	var wheel = this;
	
	//Killing the events that clicking a img might fire
	this.elem.find("img").on("dragstart", function(){ 
		return false; 
	});
	$(document).on("vmousemove", function(event){
		if (wheel.touched){
			wheel.setPosition(event.pageX, event.pageY);		
			wheel.rotateToCurrentPosition();
			return false;
		}
	});
	$(divHandler).on("vmousedown", function(event){
		//console.log("vmousedown");
		if (wheel.inside(event.pageX, event.pageY)){

			var now = new Date().getTime();

			//'Starting' logic; setting up
			wheel.setPosition(event.pageX, event.pageY);
			wheel.startingHoldingAngle = Wheel.getAngle(wheel.position.x, wheel.position.y);
			wheel.touched = true;
			wheel.elem.addClass("touched");

			//Buttons logic (if any)
			wheel.startingTouchingTime = now;
			if (wheel.hasButtons){
				wheel.lastButtonAngle = wheel.startingHoldingAngle;
				wheel.resetLastButtonAngleTime();
				wheel.timeout = setTimeout(function(){
					wheel.buttonShouldSelect();
				}, 10);
			}
			
			wheel.lastSpeedSampleTime = now;
			wheel.lastSpeedSampleAngle = wheel.currentAngle;
			wheel.speedTimer = setTimeout(function(){
				wheel.updateSpeed();
			}, Wheel.config.speedSampleInterval);
			
		}
	});
	$(document).on("vmouseup", function(event){
		//console.log("vmouseup");

		if (wheel.touched){
			
			//consolelog("speed: " + wheel.getSpeed()); 
			if (Math.abs(wheel.getSpeed()) > 0){
				wheel.setInertia();
				var inertiaTimer = setTimeout(function(){
					wheel.updateInertia();
				}, Wheel.config.inertiaTimeStep);
			}
			else if (Wheel.config.centerInButton){
				wheel.centerInCurrentButton();				
			}

			//'Ending' logic; clearing up
			wheel.startingAngle = wheel.currentAngle;
			wheel.touched = false;
			wheel.elem.removeClass("touched");
			wheel.speedSamples = new Array(Wheel.config.speedSamplesLength);
			
			var justClicking = wheel.buttonShouldClick();
			if (!justClicking){
				if (wheel.selectedButton > -1){
					wheel.buttonDeselect();
					wheel.buttonClick();			
				}
			}
			clearTimeout(wheel.timeout);
			clearTimeout(wheel.speedTimer);
		}
	});
	//console.log("Wheel created out of: " + this.elem);
};

Wheel.prototype.updateInertia = function(){
	
	var now = new Date().getTime();
	var currentTime = now - this.inertiaStartingTime;	
	var beginningValue = this.inertiaStartingAngle;
	var changeInValue = this.inertiaDegrees - this.inertiaStartingAngle;
	var duration = this.inertiaTime;

	//console.log(changeInValue); 

	var degrees;
	if (Wheel.config.decelerationEffect == 'easeOutExpo') {
		degrees = Wheel.easing.easeOutExpo(currentTime, beginningValue, changeInValue, duration);
	}
	else if (Wheel.config.decelerationEffect == 'easeOutSine') {
		degrees = Wheel.easing.easeOutSine(currentTime, beginningValue, changeInValue, duration);
	}
	else if (Wheel.config.decelerationEffect == 'easeOutQuad') {
		degrees = Wheel.easing.easeOutQuad(currentTime, beginningValue, changeInValue, duration);
	}
	else if (Wheel.config.decelerationEffect == 'easeOutQuart') {
		degrees = Wheel.easing.easeOutQuart(currentTime, beginningValue, changeInValue, duration);
	}
	else if (Wheel.config.decelerationEffect == 'easeOutQuint') {
		degrees = Wheel.easing.easeOutQuint(currentTime, beginningValue, changeInValue, duration);
	}
	
	degrees = Wheel.round(degrees);
	//degrees = this.inertiaStartingAngle + degrees;

	if (currentTime > this.inertiaTime){
		this.rotateToAngle(beginningValue + changeInValue);
		clearTimeout(this.inertiaTimer);
		this.startingAngle = this.currentAngle;
	}
	else{
		this.rotateToAngle(degrees);
		var wheel = this;
		this.inertiaTimer = setTimeout(function(){
			wheel.updateInertia();
		}, Wheel.config.inertiaTimeStep);
	}
};

//setInertia = how much time is necessary to stop the wheel (based on current speed and constant deceleration)
Wheel.prototype.setInertia = function(){
	
	var now = new Date().getTime();
	this.inertiaStartingTime = now;
	this.inertiaStartingAngle = this.currentAngle;

	var speed = this.getSpeed(); //clockwise is negative
	this.inertiaTime = Math.round(Math.abs(speed) / Wheel.config.deceleration);
	var rotatingDegrees = Math.round(speed * this.inertiaTime) * -1; //now clowckwise is positivie
	this.inertiaDegrees = this.inertiaStartingAngle + rotatingDegrees;
	if (Wheel.config.centerInButton){
		this.inertiaDegrees = this.centerInButton(this.inertiaDegrees); 
	}
	this.inertiaDegrees = Wheel.round(this.inertiaDegrees);
	
	//consolelog("speed: " + this.getSpeed());
	//console.log("deceleration(ms): " + this.inertiaTime);
	//consolelog("total degrees: " + degrees);	
	//consolelog("inertiaDegrees: " + this.inertiaDegrees);	
};

Wheel.prototype.centerInButton = function(degrees){

	//consolelog("param degrees: " + degrees);	
	if (this.hasButtons){
		var halfabutton = this.buttonAngle / 2;
		degrees = Math.floor(degrees / this.buttonAngle) * this.buttonAngle + halfabutton;	
		//consolelog("result degrees: " + degrees);	
	}
	return degrees;	
}

Wheel.prototype.centerInCurrentButton = function(delay){
	delay = delay == undefined ? Wheel.config.centerInButtonDelay : delay;
	var now = new Date().getTime();
	this.inertiaStartingTime = now;
	this.inertiaStartingAngle = this.currentAngle;
	this.inertiaDegrees = this.centerInButton(this.currentAngle);  	
	this.inertiaTime = delay;
	var wheel = this;
	this.inertiaTimer = setTimeout(function(){
		wheel.updateInertia();
	}, Wheel.config.inertiaTimeStep);
}

Wheel.prototype.updateSpeed = function(){
	
	//Getting current speed	
	var now = new Date().getTime();
	var deltaT = now - this.lastSpeedSampleTime;
	var deltaA = this.lastSpeedSampleAngle - this.currentAngle;
	if (Math.abs(deltaA) > 180){
		deltaA = deltaA - (360 * deltaA/Math.abs(deltaA));
		deltaA = Math.round(deltaA);
	}
	//console.log("this.lastSpeedSampleAngle: " + this.lastSpeedSampleAngle + " this.currentAngle: " + this.currentAngle);
	var currentSpeed = Wheel.round(deltaA/deltaT);
	//console.log("currentSpeed: " + currentSpeed + " (" + deltaA + " @" + deltaT + ")");
	//console.log(deltaA);
	//Adding speed to the samples array
	this.speedSamples[this.currentSpeedSample] = currentSpeed;

	//Updating samples array cursor
	this.currentSpeedSample++;
	if (this.currentSpeedSample > Wheel.config.speedSamplesLength){
		this.currentSpeedSample = 0;
	}

	//Firing this function again
	var wheel = this;
	wheel.speedTimer = setTimeout(function(){
		wheel.updateSpeed();
	}, Wheel.config.speedSampleInterval);

	//Updating sampling
	this.lastSpeedSampleTime = now;
	this.lastSpeedSampleAngle = this.currentAngle;
};

Wheel.prototype.getSpeed = function(){
	var maxSpeed = 0;
	for (i = 0; i < this.speedSamples.length; i++){
		if (Math.abs(this.speedSamples[i]) > Math.abs(maxSpeed)){
			maxSpeed = this.speedSamples[i];
		}
	}
	if (Math.abs(maxSpeed) > Wheel.config.speedMax){
		maxSpeed = Wheel.config.speedMax * (maxSpeed/Math.abs(maxSpeed));
	}
	//console.log("maxSpeed: " + maxSpeed);
	return maxSpeed;
};

Wheel.prototype.resetLastButtonAngle = function(){
	this.lastButtonAngle = Wheel.getAngle(this.position.x, this.position.y);
	this.resetLastButtonAngleTime();
};

Wheel.prototype.resetLastButtonAngleTime = function(){
	var d = new Date();
	this.lastButtonAngleTime = d.getTime(); 
};

Wheel.prototype.buttonShouldClick = function(){
	//console.log("buttonShouldClick");
	var d = new Date();
	var t = d.getTime();
	if (this.startingTouchingTime + Wheel.config.buttonClickingTreshold > t){
		this.buttonSelect();
		var wheel = this;
		setTimeout(function(){
			wheel.buttonDeselect();
			wheel.buttonClick();
		}, Wheel.config.buttonClickedTime);	
		return true;
	}
	return false;
};

Wheel.prototype.buttonShouldSelect = function(){
	var d = new Date();
	var t = d.getTime();
	var currentHoldingAngle = Wheel.getAngle(this.position.x, this.position.y);
	var deltaAngle = currentHoldingAngle - this.lastButtonAngle;
	deltaAngle = Math.abs(deltaAngle);
	var wheel = this;
	if (deltaAngle < Wheel.config.buttonAngleTreshold){
		//console.log("inside button angle treshold");
		if (t > this.lastButtonAngleTime+Wheel.config.buttonSelectTreshold){
			this.buttonSelect();
			this.resetLastButtonAngle();
			//this.selectedButton = -1;
		}
		else{
			this.timeout = setTimeout(function(){
				wheel.buttonShouldSelect();
			}, 10);	
		}
	}
	else{
		clearTimeout(wheel.timeout);
		this.buttonDeselect();
		this.resetLastButtonAngle();
	}
};

Wheel.prototype.buttonSelect = function(){
	this.selectedButton = this.buttonCurrent();
	//console.log(this.buttonCurrent());
	var wheel = this;
	var selectedButtonImage = $("#"+wheel.wrapperId+" #wm_button_"+wheel.selectedButton);
	selectedButtonImage.removeClass("wm_hide");
	selectedButtonImage.addClass("wm_show");
};

Wheel.prototype.buttonDeselect = function(){
	this.selectedButton=-1;
	var selectedButtonImage = this.elem.find(".wm_buttons.wm_show");
	selectedButtonImage.removeClass("wm_show");
	selectedButtonImage.addClass("wm_hide");
};

Wheel.prototype.buttonClick = function(){
	
	//console.log("buttonClick");
	
	//Getting button
	var clickedButton = this.buttonCurrent();
	clickedButton = this.elem.find("#"+this.wrapperId+"_button_"+clickedButton);

	//Firing either 'href' attribute if setted, or the click delegate attached if not
	var buttonHref = clickedButton.attr('href');
	if (buttonHref != undefined && buttonHref != '#'){
		window.location.href = buttonHref;
	}
	else{
		clickedButton.click();
	}
};

Wheel.prototype.buttonCurrent = function(){
	var currentHoldingAngle = Wheel.getAngle(this.position.x, this.position.y);
	currentHoldingAngle = currentHoldingAngle - this.currentAngle;
	//consolelog("currentHoldingAngle 1: "+ currentHoldingAngle);
	if(Math.abs(currentHoldingAngle) > 360){
		currentHoldingAngle = currentHoldingAngle % 360;
	}
	if (currentHoldingAngle < 0){
		currentHoldingAngle = Math.abs(currentHoldingAngle);
		currentHoldingAngle = 360 - currentHoldingAngle;
	}
	//consolelog("currentHoldingAngle 2: "+ currentHoldingAngle);
	//We're using 0 as starting index for buttons, 1 as starting index for the pictures
	var selectedButton = Math.floor(currentHoldingAngle / this.buttonAngle);
	//console.log("buttonCurrent: " + selectedButton);
	return selectedButton;
};

Wheel.prototype.setPosition = function(pageX, pageY){
	this.lastPosition.x = this.position.x;
	this.lastPosition.y = this.position.y;
	this.position.x = pageX - this.middle.x;
	this.position.y = this.middle.y - pageY;
};

Wheel.prototype.rotateToCurrentPosition = function(){
	var currentHoldingAngle = Wheel.getAngle(this.position.x, this.position.y);
	//console.log("currentHoldingAngle: " + currentHoldingAngle);
	var deltaAngle = currentHoldingAngle - this.startingHoldingAngle;
	//console.log("deltaAngle: " + deltaAngle);
	var rotateAngle = deltaAngle + this.startingAngle;
	//console.log("rotateAngle: " + rotateAngle);
	rotateAngle = Math.round(rotateAngle);
	this.rotateToAngle(rotateAngle);	
};

Wheel.prototype.rotateToAngle = function(rotateAngle){
	//CSS rotation
	var rotate = "rotate("+rotateAngle+"deg)";
	//var wheel = document.getElementById(this.wheelId);
	var wrapper = document.getElementById(this.wrapperId);
	var rotatingElems = wrapper.getElementsByClassName("wm_rotate");
	for(i=0;i<rotatingElems.length;i++){
		rotatingElems[i].style.transform = rotate; 
		rotatingElems[i].style.WebkitTransform = rotate; 
		rotatingElems[i].style.MozTransform = rotate; 
		rotatingElems[i].style.OTransform = rotate; 
	}
	this.currentAngle =  rotateAngle;
	//console.log("rotate to: " + this.currentAngle);
};

Wheel.prototype.initData = function(){
	this.height = this.elem.outerHeight();
	this.width = this.elem.outerWidth();
	this.corners = this.elem.offset();
	//console.log(this.elem.offset());
	//console.log(this.elem.outerHeight() +" "+ this.elem.outerWidth());
	this.corners.right = this.corners.left + this.width;
	this.corners.bottom = this.corners.top + this.height; 
	this.middle.x = this.corners.left + this.width/2;
	this.middle.y = this.corners.top + this.height/2;
	//consolelog("corners top:"+this.corners.top+" left:"+this.corners.left);
	//consolelog("middle X:"+this.middle.x+" Y:"+this.middle.y);
};

Wheel.prototype.inside = function(x, y, margin){
	/*console.log(x + " " +y);
	console.log((this.corners.left - margin) + " "+ (this.corners.top - margin) + " " + (this.corners.right + margin * 2) + " "+ (this.corners.bottom + margin *2))
	console.log(x > (this.corners.left - margin));
	console.log(y > (this.corners.top - margin)); 
	console.log( x < (this.corners.right + margin * 2));
	console.log( y < (this.corners.bottom + margin * 2));
	*/
	if (margin == undefined){ margin = 0 }
	if (x > (this.corners.left - margin)	&&  
		y > (this.corners.top - margin) 	&&
		x < (this.corners.right + margin) 	&& 
		y < (this.corners.bottom + margin)	){
		//console.log("inside: yes");
		return true;
	}
	//console.log("inside: no");
	return false;
};

/********************************************
EASING FUNCTIONS

All of them, off course, decelerate.

Common signature: (currentTime, beginningValue, changeInValue, duration)
var t = currentTime;
var b = beginningValue;
var c = changeInValue;
var d = duration;

*************************/

Wheel.easing = {
	
	easeOutSine : function (t, b, c, d) {
		return c * Math.sin(t/d * (Math.PI/2)) + b;
	},
 
	easeOutQuad : function (t, b, c, d) {
		return -c *(t/=d)*(t-2) + b;
	},

	easeOutQuart : function (t, b, c, d) {
		return -c * ((t=t/d-1)*t*t*t - 1) + b;
	},

	easeOutQuint : function (t, b, c, d) {
		return c*((t=t/d-1)*t*t*t*t + 1) + b;
	},

	easeOutExpo : function (t, b, c, d) {
		return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
	}


};
