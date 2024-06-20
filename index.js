
let chmln_object = window.chmln;

if(typeof chmln_object === 'undefined' || !chmln_object.identify) {
  chmln_object = chmln_object || (window.chmln = {});
  const defaultFunctions = "identify alias track clear set show on off custom help _data".split(" ");
  for(var s=0;s<defaultFunctions.length;s++){
    !function(){
      const t = chmln_object[defaultFunctions[s]+"_a"] = [];
      chmln_object[defaultFunctions[s]] = function() { t.push(arguments); };
    }();
  };

  chmln_object.init = (token, { fastUrl } = {}) => {
    var d = document;
    var w = window;
    var t = token;
    var i = d.createElement("script");
    chmln_object.accountToken = t;
    chmln_object.location = w.location.href.toString();
    chmln_object.now = new Date;
    chmln_object.fastUrl = fastUrl || 'https://fast.chameleon.io/';
    i.src = chmln_object.fastUrl+"messo/"+t+"/messo.min.js";
    i.async = true;
    d.head.appendChild(i);
  }
}

module.exports = chmln_object;
