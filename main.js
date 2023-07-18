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

// ---------------- //
// cookie controls:
// see https://www.w3schools.com/js/js_cookies.asp

function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    console.log(document.cookie);
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

function decryptAndUpdate() {
    let decrypted = CryptoJS.AES.decrypt(encrypted, document.getElementById("secretpwd").value);
    try {
        apikey = decrypted.toString(CryptoJS.enc.Utf8);
        if (testAPIKey() == false) {
            document.getElementById("secretpwd").value = "";
            return false;
        }   else {
            setTimeout(() => {
                downloadNextImage();
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

function downloadNextImage() {
    // set cookie for 10+ years >:)
    const COOKIE_TIME = 30 * 12 * 10;

    let id;
    if (getCookie("id") == "") {
        setCookie("id", 1, COOKIE_TIME);
        id = 1;
    } else {
        console.log(getCookie("id"));
        id = parseInt(getCookie("id"));
    }
    
    let pathstr = "https://pixabay.com/api/?key=" + apikey + "&id=" + String(id);
    console.log(pathstr);

    fetch(pathstr).then(async (response) => {
        let json = await response.json()
        console.log(json);
        document.getElementById("photos").innerHTML += '<img src="' + json.hits[0].largeImageURL + '" style="width: 100%; opacity: 0.0;">';
        setTimeout(() => {
            document.getElementById("photos").lastChild.style.opacity = "1.0";
        }, 10);

        // TODO: add metadata in a fancy way in the bottom left corner of each image
    });

    setCookie("id", id + 1, COOKIE_TIME);
}