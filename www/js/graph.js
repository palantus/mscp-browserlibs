function GraphCoord(x, y, text){
    this.x = x;
    this.y = y;
	this.text = text;
}
	
function GraphDrawer(){
		
    this.vlines = false;
    this.hlines = true;
	this.xLabelSpacing = 40;
	this.drawZeroOnX = true;
		
    this.draw = function(ctx, width, height, values){
        var x0 = 30;
        var y0 = height-30;

        ctx.beginPath();
			
        ctx.lineWidth = 2;
			
        ctx.moveTo(x0, y0);
        ctx.lineTo(30, 30);
        ctx.lineTo(35, 40);
        ctx.moveTo(30, 30);
        ctx.lineTo(25, 40);
        ctx.moveTo(x0, y0);
        ctx.lineTo(width - 30, y0);
        ctx.lineTo(width - 40, y0 - 5);
        ctx.moveTo(width - 30, y0);
        ctx.lineTo(width - 40, y0 + 5);
        ctx.moveTo(x0, y0);
			
        ctx.stroke();
        ctx.beginPath();

        ctx.lineWidth = 1;
			
        var pDis = (width - 60) / values.length;
			
        var maxY = 0;
        var minY = Number.MAX_VALUE;
        for(var i = 0; i < values.length; i++){
            maxY = values[i].y > maxY ? values[i].y : maxY;
            minY = values[i].y < minY ? values[i].y : minY;
        }
			
        ctx.textAlign = "right";
        yTextSpacing = 15;
        iVal = yTextSpacing/(y0-30);
        for(var i = y0; i > 30; i -= yTextSpacing){
        	var val = ((y0-i)/(y0-30))*(maxY-minY) + minY;
            var txt = maxY < 100 ? Math.round(10 * val) / 10 : Math.round(val);
            ctx.fillText(txt, 25, i);
            if(this.hlines){
                ctx.moveTo(x0, i);
                ctx.lineTo(width-40, i);
            }	
        }
			
        ctx.stroke();
        ctx.beginPath();
        ctx.strokeStyle = "#0000ff";
        ctx.lineWidth = 2;
        
        //xTextSpacing = 40;//var textEvery = parseInt(values.length/20);
        lastText = x0;
			
        ctx.moveTo(x0, y0 - ((values[0].y/maxY)*(height-60)));
        
		ctx.textAlign = "center";
			
		/* First value on the X-axis */
		/*
		if(values != undefined && values.length > 0)
			ctx.fillText(values[0].text != undefined ? values[0].text : values[0].x, x0+pDis, y0+15);
		else*/
		if(this.drawZeroOnX !== true && values != undefined && values.length > 0)
			ctx.fillText(values[0].text != undefined ? values[0].text : values[0].x, x0, y0+15);
		else
			ctx.fillText(0, x0, y0+15); //Put a zero on the X axis
        
        for(var i = 1; i < values.length; i++){
            var xVal = parseInt(x0 + (i * pDis));
            var yVal = parseInt(y0 - (((values[i].y - minY)/(maxY-minY))*(height-60)));
            ctx.lineTo(xVal, yVal);
            
            if(xVal > lastText + this.xLabelSpacing){
                ctx.fillText(values[i].text != undefined ? values[i].text : values[i].x, xVal, y0+15);
                lastText = xVal;
                
                if(this.vlines){
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.strokeStyle = "black";
                    ctx.lineWidth = 1;
                    ctx.moveTo(xVal, y0);
                    ctx.lineTo(xVal, 30);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.strokeStyle = "#0000ff";
                    ctx.lineWidth = 2;
                    ctx.moveTo(xVal, yVal);
                }
            }
        }

        ctx.stroke();
    }
}