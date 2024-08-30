
let chmln_object = window.chmln;

if (typeof chmln_object === 'undefined' || !chmln_object.identify) {
  chmln_object = chmln_object || (window.chmln = {});
  const defaultFunctions = ['identify', 'alias', 'track', 'clear', 'set', 'show', 'on', 'off', 'custom', 'help',  _data'];
  for (var i = 0; i < defaultFunctions.length; i++) {
    (!function() {
      const placeholder_function = chmln_object[defaultFunctions[i]+"_a"] = [];
      chmln_object[defaultFunctions[i]] = function() { placeholder_function.push(arguments); };
    }());
  }

  chmln_object.init = (token, { fastUrl } = {}) => {
    const chmlnScriptTag = document.createElement("script");
    
    chmln_object.accountToken = token;
    chmln_object.location = window.location.href.toString();
    chmln_object.now = new Date;
    chmln_object.fastUrl = fastUrl || 'https://fast.chameleon.io/';
    
    chmlnScriptTag.src = chmln_object.fastUrl + "messo/" + token + "/messo.min.js";
    chmlnScriptTag.async = true;
    
    document.head.appendChild(chmlnScriptTag);
  };
}

module.exports = chmln_object;
