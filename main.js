//CryptoJS.AES.encrypt("<key>", "b3st p@Ssw0rD 3vR")
var encrypted = "U2FsdGVkX18+FwHnuntCaRg1rHOHxqDFH1X8KQeZytjZjFnmGgIjftHHq+6i3ke30Q+Lyf2uT4XWf1WxeHuKOA==";
var apikey = "";
var keyIsValid = false;

const apikeyInput = document.getElementById("apikey");
const secretPwdInput = document.getElementById("secretpwd");
apikeyInput.addEventListener("keyup", ({key}) => {
    if (key === "Enter") {
        if (updateAPIKey(document.getElementById("apikey").value) == false) {
            alert("bad api key");
        } else {
            success();
        }
    }
})
secretPwdInput.addEventListener("keyup", ({key}) => {
    if (key === "Enter") {
        if (decryptAndUpdate() == false) {
            alert("bad secret");
        } else {
            success();
        }
    }
})

var body = document.body;
var html = document.documentElement;
var documentHeight = Math.max( 
    body.scrollHeight, body.offsetHeight, 
    html.clientHeight, html.scrollHeight, html.offsetHeight
);

// TODO: test this
addEventListener("resize", (_event) => {
    documentHeight = Math.max( 
        body.scrollHeight, body.offsetHeight, 
        html.clientHeight, html.scrollHeight, html.offsetHeight
    );
});

// TODO: instead of updating the current speed, update a target speed and lerp to the target (smooooth)
addEventListener("wheel", (event) => {
    if (event.deltaY > 0) {
        speed += DEFAULT_SPEED;
        if (speed > 6 * DEFAULT_SPEED)
            speed = 6 * DEFAULT_SPEED;
    } else if (event.deltaY < 0) {
        speed -= DEFAULT_SPEED;
        if (speed < -DEFAULT_SPEED)
            speed = -DEFAULT_SPEED;
    }
});

// ---------------- //
// debug / timing purposes:
var timedata = [["avg", "exact", "speed"]];

// ---------------- //
// cookie controls:
// see https://www.w3schools.com/js/js_cookies.asp

function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function checkCookie() {
    let user = getCookie("username");
    if (user != "") {
        alert("Welcome again " + user);
    } else {
        user = prompt("Please enter your name:", "");
        if (user != "" && user != null) {
            setCookie("username", user, 365);
        }
    }
}

// ---------------- //
// logic

function updateAPIKey(key) {
    apikey = key;
    if (testAPIKey() == false) {
        document.getElementById("apikey").value = "";
        return false;
    } else {
        // ...
        return true;
    }
}

var startDownloadingImages = false;
function decryptAndUpdate() {
    let decrypted = CryptoJS.AES.decrypt(encrypted, document.getElementById("secretpwd").value);
    try {
        apikey = decrypted.toString(CryptoJS.enc.Utf8);
        if (testAPIKey() == false) {
            document.getElementById("secretpwd").value = "";
            return false;
        } else {
            setTimeout(() => {
                startDownloadingImages = true;
            }, 900);
            return true;
        }
    } catch(err) {
        console.log(err);
        apikey = "";
        testAPIKey();
        document.getElementById("secretpwd").value = "";
        return false;
    }
}

function testAPIKey() {
    if (apikey.length >= 10 && apikey[7] == '-') {
        return true; // eh, probably fine
    } else {
        return false; // invalid api key
    }
}

function success() {
    console.log("success");

    document.getElementById("login").style.opacity = "0.0";
    setTimeout(() => {
        document.getElementById("login").hidden = true;
    }, 900);

    keyIsValid = true;
}

// set cookie for 10+ years >:)
const COOKIE_TIME = 30 * 12 * 10;

function initCookieID() {
    if (getCookie("id") == "") {
        setCookie("id", 1, COOKIE_TIME);
        return 1;
    } else {
        console.log("cookie id: " + getCookie("id"));
        return parseInt(getCookie("id"));
    }
}

var waitingForNextImage = false; // only load one image at a time
var lastImgTime = Date.now();
var avgTimeSinceLastRequest = 2; // default is 2s because it's normal-ish

var currNumImages = 0;
var nextImageTopLoc = -25;
function getNextImageTopLoc() {
    // TODO: maybe remove this
    return nextImageTopLoc;
}
var nextImageID = initCookieID();
function downloadNextImage() {
    if (waitingForNextImage) return;
    waitingForNextImage = true;

    let pathstr = "https://pixabay.com/api/?key=" + apikey + "&id=" + String(nextImageID);
    fetch(pathstr).then(async (response) => {
        if (!response.ok) {
            if (response.status == 400) {
                let text = await response.text();
                console.log("error 400: " + text);
            } else {
                console.log("unknown error");
            }
            
            // do next image immediately
            waitingForNextImage = false; 
            return;
        }
        
        let json = await response.json();

        // make sure we don't blow our api key budget of 100 requests per 60s
        let exactTimeSinceLastRequest = (Date.now() - lastImgTime) / 1000;
        avgTimeSinceLastRequest = 0.7 * avgTimeSinceLastRequest + 0.3 * exactTimeSinceLastRequest;
        console.log("timeSinceLastRequest (avg): " + avgTimeSinceLastRequest + " s, (exact): " + exactTimeSinceLastRequest + " s");
        if (avgTimeSinceLastRequest < (0.60 + 0.02)) {
            speed -= 1;
        }
        lastImgTime = Date.now();

        timedata.push([avgTimeSinceLastRequest, exactTimeSinceLastRequest, speed]);

        let img = new Image();
        img.onload = () => {
            let myElem = document.getElementById("img"+String(json.hits[0].id));
            myElem.style.top = getNextImageTopLoc() + "px";
            myElem.style.opacity = "1.0";
            myElem.hidden = false;

            nextImageTopLoc = getNextImageTopLoc() + parseInt(myElem.height);

            console.log("loaded: id=" + json.hits[0].id + " @top=" + myElem.style.top + " w/ height=" + myElem.height);

            waitingForNextImage = false; 
        }
        img.onabort = () => {
            waitingForNextImage = false; 
        }
        img.onerror = () => {
            waitingForNextImage = false; 
        }
        img.id = "img" + String(json.hits[0].id);
        img.src = json.hits[0].largeImageURL;
        img.style.position = "absolute"; 
        img.style.width = "100%"; 
        img.style.opacity = "0.0";
        img.hidden = true;

        // TODO: add metadata in a fancy way in the bottom left corner of each image that pops up and 
        // looks fancy fancy fancy (also maybe generate a fancy quote from wikipedia?)

        let div = document.createElement("div");
        div.appendChild(img);

        document.getElementById("photos").appendChild(div);

    });

    nextImageID += 1;
    setCookie("id", nextImageID, COOKIE_TIME);

    currNumImages += 1;
    if (currNumImages < 3) {
        // spawn the initial few
        // TODO: load the images quickly, but in order
        downloadNextImage();
    }
}

const PREEMPTIVE_PX = 400;
const DEFAULT_SPEED = 3;
var speed = DEFAULT_SPEED;
requestAnimationFrame(update);
function update() {
    // move images upwards at 1px/s
    let children = document.getElementById("photos").children;
    let garbage = [];
    for (let child of children) {
        if (child.hidden == false) {
            let img = child.firstChild;
            img.style.top = String(parseInt(img.style.top) - speed) + "px";

            if (parseInt(img.style.top) < -documentHeight * 8) {
                garbage.push(img);
            }
        }
    }
    
    // clean up any garbage nodes
    for(let i = 0; i < garbage.length; i++) {
        let item = garbage[i].parentNode;
        document.getElementById("photos").removeChild(item);
    }

    if (startDownloadingImages) {
        nextImageTopLoc -= speed;
        if ((nextImageTopLoc - PREEMPTIVE_PX * DEFAULT_SPEED) < documentHeight) {
            downloadNextImage();
        }
    }

    if (nextImageID == 300) {
        console.log("DATA:");
        console.table(timedata);
        timedata = [];
    }
    
    requestAnimationFrame(update);
}