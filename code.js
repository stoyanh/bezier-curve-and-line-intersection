const controlPointRaduis = 4;
const lineControlPointRadius = 2;
const INVALID_IDX = -1;

var addingControlPoints = false;
var lineDrawingModeActive = false;
var currentControlPoints = [];
var currentLinePoints = [];
var ctx = null;
var canvas = null;

var movingControlPointIdx = INVALID_IDX;

function start() 
{
	canvas = document.getElementById("canvas");
	if (!canvas)
	{
		alert("Cannot retrieve canvas!");
		return;
	}

	ctx = canvas.getContext("2d");
	if (!ctx)
	{
		alert("Cannot load context!");
		return;
	}

	//add event listeners
	canvas.addEventListener("click", handleMouseClick);
	canvas.addEventListener("mousedown", handleMouseDown);
	canvas.addEventListener("mousemove", handleMouseMove);
	canvas.addEventListener("mouseup", handleMouseUp);
}

function handleMouseClick(event)
{
	if (!addingControlPoints && !lineDrawingModeActive)
		return;

	var point = mousePoint(event);

	if (addingControlPoints)
	{
		currentControlPoints.push(point);
		drawControlPoint(point);
	}
	else if (lineDrawingModeActive)
	{
		currentLinePoints.push(point);
		drawLineControlPoint(point);
		if (currentLinePoints.length == 2)
		{
			drawLine(currentLinePoints[0], currentLinePoints[1]);
			toggleLineDrawingMode();
		}
	}
}

function handleMouseDown(event)
{
	if (addingControlPoints)
		return;

	var point = mousePoint(event);
	movingControlPointIdx = INVALID_IDX;

	var radiusPow = Math.pow(controlPointRaduis, 2);
	const tolerance = 5;
	for (var i = 0; i < currentControlPoints.length; ++i)
	{
		var xExpr = Math.pow(point.x - currentControlPoints[i].x, 2);
		var yExpr = Math.pow(point.y - currentControlPoints[i].y, 2);
		if (xExpr + yExpr <= radiusPow + tolerance)
		{
			movingControlPointIdx = i;
			break;
		}
	}
}


function handleMouseMove(event)
{
	if (movingControlPointIdx == INVALID_IDX)
		return;

	var point = mousePoint(event);
	currentControlPoints[movingControlPointIdx] = point;
	redrawCanvas();
}


function handleMouseUp(event)
{
	movingControlPointIdx = INVALID_IDX;
}

function mousePoint(event)
{
	var canvasRect = canvas.getBoundingClientRect();
	var x = event.clientX - canvasRect.left;
	var y = event.clientY - canvasRect.top;

	return new point(x, y);
}

function drawLineControlPoint(point)
{
	drawCircle(point, lineControlPointRadius);
}

function drawControlPoint(point)
{
	drawCircle(point, controlPointRaduis);
}

function drawControlPoints(controlPoints)
{
	for (var i = 0; i < controlPoints.length; ++i)
		drawControlPoint(controlPoints[i]);
}

function redrawCanvas()
{
	const resetPoints = false;
	clearCanvas(resetPoints);
	if (currentControlPoints.length > 0)
	{
		drawCurve();
		drawControlPoints(currentControlPoints);
		connectControlPoints(currentControlPoints);
	}

	redrawLine();
}

function clearCanvas(resetPoints=true)
{
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	if (resetPoints)
	{
		clearControlPoints();
		clearLinePoints();
	}
}

function redrawLine()
{
	if (currentLinePoints.length != 2)
	{
		clearLinePoints();
		return;
	}

	drawLineControlPoint(currentLinePoints[0]);
	drawLineControlPoint(currentLinePoints[1]);

	drawLine(currentLinePoints[0], currentLinePoints[1]);
}

function toggleControlPointsAddingState()
{
	setControlPointsAddingStatesActive(!addingControlPoints);
	var button = document.getElementById("adding");
	if (addingControlPoints)
		button.innerHTML = "Stop adding control points";
	else
		button.innerHTML = "Start adding control points";
}

function setControlPointsAddingStatesActive(active)
{
	addingControlPoints = active;
	if (addingControlPoints)
		clearControlPoints();
}

function toggleLineDrawingMode()
{
	lineDrawingModeActive = !lineDrawingModeActive;
	if (lineDrawingModeActive)
	{
		addingControlPoints = false;
		clearLinePoints();
		redrawCanvas();
	}
}

function drawLine(from, to, color="black")
{
	ctx.beginPath();
	ctx.strokeStyle = color;
	ctx.moveTo(from.x, from.y);
	ctx.lineTo(to.x, to.y);
	ctx.stroke();
}

function drawCircle(center, radius)
{
	ctx.beginPath();
	ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI, false);
	ctx.lineWidth = 2;
	ctx.fillStyle = "green";
	ctx.fill();
	ctx.strokeStyle = "green";
	ctx.stroke();
}

function drawCurve()
{
	if (currentControlPoints.length == 0)
		return;

	drawCurveWithParams(0, 1, currentControlPoints);

	connectControlPoints(currentControlPoints);
	setControlPointsAddingStatesActive(false);
}

function drawCurveWithParams(from, to, points, color="black")
{
	ctx.strokeStyle = color;
	for (var t = from; t < to; t += 0.001)
	{
		var point = calculatePointForT(t, points);
		ctx.strokeRect(point.x, point.y, 1, 1);
	}
}

function clearControlPoints()
{
	currentControlPoints = [];
}

function clearLinePoints()
{
	currentLinePoints = [];
}

function connectControlPoints(controlPoints)
{
	var points = controlPoints;
	if (points.length == 0)
	{
		alert("Control points missing");
		return;
	}

	ctx.beginPath();
	ctx.strokeStyle = "red";
	ctx.lineWidth = 1;

	for (var i = 0; i < points.length - 1; ++i)
	{
		ctx.moveTo(points[i].x, points[i].y);
		ctx.lineTo(points[i + 1].x, points[i + 1].y);
		ctx.stroke();
	}
}

function pointsBoundingRect(points)
{
	if (!Array.isArray(points) || points.length == 0)
	{
		alert("Incorrect input(bounding rect function)");
		return;
	}

	var xMin = points[0].x;
	var yMin = points[0].y;
	var xMax = xMin, yMax = yMin;

	for (var i = 0; i < points.length; ++i)
	{
		var x = points[i].x;
		var y = points[i].y;
		if (x < xMin)
			xMin = x;
		if (x > xMax)
			xMax = x;
		if (y < yMin)
			yMin = y;
		if (y > yMax)
			yMax = y;
	}

	return {
		bottom: new point(xMin, yMin),
		top: new point(xMax, yMax)
	}
}

function lineIntersectsRect(lineStart, lineEnd, rect)
{
	var lineXmin = lineStart.x;
	var lineXmax = lineEnd.x;

	if (lineXmin > lineXmax)
	{
		lineXmin = lineEnd.x;
		lineXmax = lineStart.x;
	}

	if (lineXmax > rect.top.x)
		lineXmax = rect.top.x;

	if (lineXmin < rect.bottom.x)
		lineXmin = rect.bottom.x;

	if (lineXmin > lineXmax)
		return false;


	var minY = lineStart.y;
	var maxY = lineEnd.y;

	var dx = lineEnd.x - lineStart.x;
	if (Math.abs(dx) > 0.000001)
	{
		//line equation
		var a = (lineEnd.y - lineStart.y) / dx;
		var b = lineStart.y - a * lineStart.x;
		minY = a * lineXmin + b;
		maxY = a * lineXmax + b;
	}

	if (minY > maxY)
	{
		var tmp = minY;
		minY = maxY;
		maxY = tmp;
	}

	if (maxY > rect.top.y)
		maxY = rect.top.y;

	if (minY < rect.bottom.y)
		minY = rect.bottom.y;

	if (minY > maxY)
		return false;

	return true;
}

function drawBoundingRect(rect)
{
	ctx.beginPath();
	ctx.strokeStyle = "black";
	ctx.lineWidth = 1;
	var width = rect.top.x - rect.bottom.x;
	var height = rect.top.y - rect.bottom.y;

	ctx.rect(rect.bottom.x, rect.bottom.y, width, height);
	ctx.stroke();
}

function drawIntersectionRect(rect)
{
	ctx.fillStyle = "green";
	ctx.fillRect(rect.bottom.x, rect.bottom.y, 4, 4);
}

function isRectSmallEnough(rect)
{
	var width = rect.top.x - rect.bottom.x;
	var height = rect.top.y - rect.bottom.y;

	return width * height <= 4;
}

function findIntersections()
{
	if (currentLinePoints.length != 2 || currentControlPoints.length <= 0)
	{
		alert("Line or curve not drawn");
		return;
	}

	var lineStart = currentLinePoints[0];
	var lineEnd = currentLinePoints[1];

	var points = currentControlPoints.slice();
	var rect = pointsBoundingRect(points);

	var rectData = {boundingRect: rect, controlPoints: points};

	var rectsData = [rectData];
	while (rectsData.length != 0)
	{
		var rectData = rectsData.shift();
		var rect = rectData.boundingRect;
		var controlPoints = rectData.controlPoints;
		if (!lineIntersectsRect(lineStart, lineEnd, rect))
			continue;

		if (isRectSmallEnough(rect))
		{
			drawIntersectionRect(rect);
			continue;
		}

		drawBoundingRect(rect);
		var pointsLeft = controlPointsForCurveInRange(0, 0.5, controlPoints);
		var pointsRight = controlPointsForCurveInRange(0.501, 1, controlPoints);
		var rectLeft = pointsBoundingRect(pointsLeft);
		var rectRight = pointsBoundingRect(pointsRight);

		rectsData.push({
			boundingRect: rectLeft,
			controlPoints: pointsLeft
		});

		rectsData.push({
			boundingRect: rectRight,
			controlPoints: pointsRight
		});
	}
}

function controlPointsForCurveInRange(tMin, tMax, points)
{
	//using blossom

	var controlPoints = [];
	var iterationCount = 0;
	var pointsCount = points.length;

	var parameters = new Array(pointsCount - 1);
	for (var i = 0; i < pointsCount; ++i)
	{
		parameters.fill(tMin, 0, parameters.length - i);
		parameters.fill(tMax, parameters.length - i, pointsCount);
		var newPoint = calculatePointForParameters(parameters, points);
		controlPoints.push(newPoint);
	}

	return controlPoints;
}

function calculatePointForT(t, controlPoints)
{
	var parametersArray = new Array(controlPoints.length - 1).fill(t);
	return calculatePointForParameters(parametersArray, controlPoints);
}

function calculatePointForParameters(parameters, controlPoints)
{
		//De Casteljau's algorithm
	if (!Array.isArray(parameters) || parameters.length != (controlPoints.length - 1))
	{
		alert("Invalid input(calulate curve point)");
		return;
	}

	if (controlPoints.length == 1)
		return controlPoints[0];

	var points = controlPoints.slice();
	var iteration = 0;
	while (points.length != 1)
	{
		var t = parameters[iteration];
		var newPoints = [];
		for (var i = 1; i < points.length; ++i)
		{
			var x = (1 - t) * points[i - 1].x + t * points[i].x;
			var y = (1 - t) * points[i - 1].y + t * points[i].y;

			newPoints.push(new point(x, y)); 
		}

		++iteration;
		points = newPoints.slice();
	}

	return points[0];
}

function point(x, y)
{
	this.x = x;
	this.y = y;
}