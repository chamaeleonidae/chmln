
let chmln_object = window.chmln;

if (typeof chmln_object === 'undefined' || !chmln_object.identify) {
  chmln_object = chmln_object || (window.chmln = {});
  const defaultFunctions = "identify alias track clear set show on off custom help _data".split(" ");
  for (var i = 0; i < defaultFunctions.length; i++) {
    (!function() {
      const placeholder_function = chmln_object[defaultFunctions[i]+"_a"] = [];
      chmln_object[defaultFunctions[i]] = function() { placeholder_function.push(arguments); };
    }());
  }

  chmln_object.init = (token, { fastUrl } = {}) => {
    const d = document;
    const w = window;
    const t = token;
    const s = d.createElement("script");
    chmln_object.accountToken = t;
    chmln_object.location = w.location.href.toString();
    chmln_object.now = new Date;
    chmln_object.fastUrl = fastUrl || 'https://fast.chameleon.io/';
    s.src = chmln_object.fastUrl + "messo/" + t + "/messo.min.js";
    s.async = true;
    d.head.appendChild(s);
  };
}

module.exports = chmln_object;
