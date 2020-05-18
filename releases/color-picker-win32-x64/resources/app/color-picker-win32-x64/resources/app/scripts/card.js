const { remote } = require('electron');
var tinycolor = require("tinycolor2");

var color = remote.BrowserWindow.getFocusedWindow().getTitle();
document.getElementById("color").style.background = color;
document.getElementById("hex").innerHTML = color;

if (tinycolor(color).isLight()) {
    document.querySelector("#color div").classList.add("invert");
}

document.getElementById("close").addEventListener("click", e => {
    remote.BrowserWindow.getFocusedWindow().close();
});

document.getElementById("copy-btn").addEventListener("click", e => {
    const el = document.createElement('textarea');
    el.value = document.getElementById("hex").innerHTML;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
});