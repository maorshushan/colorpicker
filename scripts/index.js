const { remote, clipboard } = require('electron');
var tinycolor = require("tinycolor2");
var robot = require('robotjs');
var Mousetrap = require('mousetrap');

var currWin = remote.BrowserWindow.getFocusedWindow();


// Button binding:
document.getElementById("min-btn").addEventListener("click", e => {
    currWin.minimize();
});

document.getElementById("close-btn").addEventListener("click", e => {
    currWin.close();
});


var spectrumCanvas = document.getElementById('spectrum-canvas');
var spectrumCtx = spectrumCanvas.getContext('2d');
var spectrumCursor = document.getElementById('spectrum-cursor');
var spectrumRect = spectrumCanvas.getBoundingClientRect();

var hueCanvas = document.getElementById('hue-canvas');
var hueCtx = hueCanvas.getContext('2d');
var hueCursor = document.getElementById('hue-cursor');
var hueRect = hueCanvas.getBoundingClientRect();

var currentColor = '#fff';
var hue = 1;
var saturation = 0.4;
var lightness = .5;

var rgbFields = document.getElementById('rgb-fields');
var hexField = document.getElementById('hex-field');

var rgb = document.getElementById('rgb-value');
var hex = document.getElementById('hex-value');
var preview = document.querySelector('#color-preview circle');

function ColorPicker() {
    createShadeSpectrum();
    createHueSpectrum();
};

ColorPicker.prototype.defaultSwatches = [
    '#FFFFFF',
    '#FFFB0D',
    '#0532FF',
    '#FF9300',
    '#00F91A',
    '#FF2700',
    '#000000',
    '#686868',
    '#EE5464',
    '#D27AEE',
    '#5BA8C4',
    '#E64AA9'
];




function refreshElementRects() {
    spectrumRect = spectrumCanvas.getBoundingClientRect();
    hueRect = hueCanvas.getBoundingClientRect();
}

function createShadeSpectrum(color) {
    canvas = spectrumCanvas;
    ctx = spectrumCtx;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!color) color = '#f00';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var whiteGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    whiteGradient.addColorStop(0, "#fff");
    whiteGradient.addColorStop(1, "transparent");
    ctx.fillStyle = whiteGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var blackGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    blackGradient.addColorStop(0, "transparent");
    blackGradient.addColorStop(1, "#000");
    ctx.fillStyle = blackGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    canvas.addEventListener('mousedown', function (e) {
        startGetSpectrumColor(e);
    });
};

function createHueSpectrum() {
    var canvas = hueCanvas;
    var ctx = hueCtx;
    var hueGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    hueGradient.addColorStop(0.00, "hsl(0,100%,50%)");
    hueGradient.addColorStop(0.17, "hsl(298.8, 100%, 50%)");
    hueGradient.addColorStop(0.33, "hsl(241.2, 100%, 50%)");
    hueGradient.addColorStop(0.50, "hsl(180, 100%, 50%)");
    hueGradient.addColorStop(0.67, "hsl(118.8, 100%, 50%)");
    hueGradient.addColorStop(0.83, "hsl(61.2,100%,50%)");
    hueGradient.addColorStop(1.00, "hsl(360,100%,50%)");
    ctx.fillStyle = hueGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    canvas.addEventListener('mousedown', function (e) {
        startGetHueColor(e);
    });
};

function colorToHue(color) {
    var color = tinycolor(color);
    var hueString = tinycolor('hsl ' + color.toHsl().h + ' 1 .5').toHslString();
    return hueString;
};

function colorToPos(color) {
    var color = tinycolor(color);
    var hsl = color.toHsl();
    hue = hsl.h;
    var hsv = color.toHsv();
    var x = spectrumRect.width * hsv.s;
    var y = spectrumRect.height * (1 - hsv.v);
    var hueY = hueRect.height - ((hue / 360) * hueRect.height);
    updateSpectrumCursor(x, y);
    updateHueCursor(hueY);
    setCurrentColor(color);
    createShadeSpectrum(colorToHue(color));
};

function setColorValues(color) {
    //convert to tinycolor object
    var color = tinycolor(color);
    var rgbValues = color.toRgb();
    var hexValue = color.toHex();
    //set inputs
    // red.value = rgbValues.r;
    // green.value = rgbValues.g;
    // blue.value = rgbValues.b;
    hex.innerHTML = "#" + hexValue;
    preview.style.fill = "#" + hexValue;
    rgb.innerHTML = "rgb(" + rgbValues.r + ", " + rgbValues.g + ", " + rgbValues.b + ")";
};

// FROM HERE I CAN GET THE CURRENT COLOR
function setCurrentColor(color) {
    color = tinycolor(color);
    currentColor = color;
    spectrumCursor.style.backgroundColor = color;
    hueCursor.style.backgroundColor = 'hsl(' + color.toHsl().h + ', 100%, 50%)';
};

function updateHueCursor(y) {
    hueCursor.style.top = y + 'px';
}

function updateSpectrumCursor(x, y) {
    //assign position
    spectrumCursor.style.left = x + 'px';
    spectrumCursor.style.top = y + 'px';
};

var startGetSpectrumColor = function (e) {
    getSpectrumColor(e);
    spectrumCursor.classList.add('dragging');
    window.addEventListener('mousemove', getSpectrumColor);
    window.addEventListener('mouseup', endGetSpectrumColor);
};

function getSpectrumColor(e) {
    // got some help here - http://stackoverflow.com/questions/23520909/get-hsl-value-given-x-y-and-hue
    e.preventDefault();
    //get x/y coordinates
    var x = e.pageX - spectrumRect.left;
    var y = e.pageY - spectrumRect.top;
    //constrain x max
    if (x > spectrumRect.width) { x = spectrumRect.width }
    if (x < 0) { x = 0 }
    if (y > spectrumRect.height) { y = spectrumRect.height }
    if (y < 0) { y = .1 }
    //convert between hsv and hsl
    var xRatio = x / spectrumRect.width * 100;
    var yRatio = y / spectrumRect.height * 100;
    var hsvValue = 1 - (yRatio / 100);
    var hsvSaturation = xRatio / 100;
    lightness = (hsvValue / 2) * (2 - hsvSaturation);
    saturation = (hsvValue * hsvSaturation) / (1 - Math.abs(2 * lightness - 1));
    var color = tinycolor('hsl ' + hue + ' ' + saturation + ' ' + lightness);
    setCurrentColor(color);
    setColorValues(color);
    updateSpectrumCursor(x, y);
};

function endGetSpectrumColor(e) {
    spectrumCursor.classList.remove('dragging');
    window.removeEventListener('mousemove', getSpectrumColor);
};

function startGetHueColor(e) {
    getHueColor(e);
    hueCursor.classList.add('dragging');
    window.addEventListener('mousemove', getHueColor);
    window.addEventListener('mouseup', endGetHueColor);
};

function getHueColor(e) {
    e.preventDefault();
    var y = e.pageY - hueRect.top;
    if (y > hueRect.height) { y = hueRect.height };
    if (y < 0) { y = 0 };
    var percent = y / hueRect.height;
    hue = 360 - (360 * percent);
    var hueColor = tinycolor('hsl ' + hue + ' 1 .5').toHslString();
    var color = tinycolor('hsl ' + hue + ' ' + saturation + ' ' + lightness).toHslString();
    createShadeSpectrum(hueColor);
    updateHueCursor(y, hueColor)
    setCurrentColor(color);
    setColorValues(color);
};

function endGetHueColor(e) {
    hueCursor.classList.remove('dragging');
    window.removeEventListener('mousemove', getHueColor);
};

new ColorPicker();
colorToPos("#FFF");
setColorValues("#FFF");

// Bottom actions:
document.getElementById("dropper").addEventListener("click", e => {
    document.getElementById("dropper").classList.add("selected");
    currWin.on('blur', eyedropper);
});

function eyedropper() {
    let hex = robot.getPixelColor(robot.getMousePos().x, robot.getMousePos().y);
    currWin.removeListener('blur', eyedropper);
    console.log("#" + hex);
    colorToPos("#" + hex);
    setColorValues("#" + hex);
    document.getElementById("dropper").classList.remove("selected");
}

document.getElementById("copy").addEventListener("click", e => {
    clipboard.writeText(hex.innerHTML);
});

document.getElementById("plus").addEventListener("click", e => {
    openColorCard(hex.innerHTML);
});

function openColorCard(hexColor) {
    const BrowserWindow = remote.BrowserWindow;
    let win = new BrowserWindow({
        width: 100,
        height: 150,
        frame: false,
        resizable: false,
        transparent: false,
        alwaysOnTop: true,
        maximizable: false,
        icon: './assets/icons/edit-tools.png',
        title: hexColor,
        webPreferences: {
            nodeIntegration: true
        }
    });

    win.loadFile('./sec_windows/color_card.html');
}


Mousetrap.bind(['command+v', 'ctrl+v'], function () {
    let color = tinycolor(clipboard.readText());

    if (color.isValid()) {
        setColorValues(color);
        colorToPos(color);
    }

    // return false to prevent default browser behavior
    // and stop event from bubbling
    return false;
});