const init = (token, { fastUrl } = {}) => {
  if (typeof chmln !== 'undefined') {
    console.log(`The global variable \`chmln\` is already defined.\nPlease make sure you're not adding Chameleon to the page other than with this library.`);
    return;
  }

  var d = document;
  var w = window;
  var t = token,
  c="chmln",m="identify alias track clear set show on off custom help _data".split(" "),
  i=d.createElement("script");if(w[c]||(w[c]={}),!w[c].root){w[c].accountToken=t,w[c].location=w.location.href.toString(),w[c].fastUrl=fastUrl||'https://fast.trychameleon.com/',
      w[c].now=new Date;for(var s=0;s<m.length;s++){!function(){var t=w[c][m[s]+"_a"]=[];w[c][m[s]]=function(){t.push(arguments);};}();}
      i.src=w[c].fastUrl+"messo/"+t+"/messo.min.js",
      i.async=!0,d.head.appendChild(i);}
}

const identify = (id, options) => {
  if (!window.chmln || !window.chmln.identify) {
    console.log(`Failed to identify the user [${id}] because the chameleon.io script was not initialized yet.`);
    return;
  }

  window.chmln.identify(id, options || {});
}

const track = api_factory('track');
const clear = api_factory('clear');
const set = api_factory('set');
const show = api_factory('set');
const on = api_factory('on');
const off = api_factory('off');

const api_factory = (method_name) => {
  return function() {
    if (!chmln || !chmln[method_name]) {
      console.log(`Failed to call [${method_name}] because the chameleon.io script was not initialized yet.`);
      return;
    }

    window.chmln[method_name].apply(this, arguments);
  }
}


module.exports = {
  init,
  identify,
  track,
  clear,
  set,
  show,
  on,
  off
};
