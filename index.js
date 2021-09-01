const initializeChameleonBuilder = (token, { forceOverride } = {}) => {
  if (forceOverride) {
    chmln = undefined;
  } else if (typeof chmln !== 'undefined') {
    console.log(`Failed to instantiate the global "chmln" variable to initiate the chameleon builder.\nPlease make sure you don\'t have anything assigned to that or use the force param to override any previous declaration.\n\ne.g.   chmln.init('token', { forceOverride: true });`);
    return;
  }

  var d = document;
  var w = window;
  var t = token,
  c="chmln",m="identify alias track clear set show on off custom help _data".split(" "),
  i=d.createElement("script");if(w[c]||(w[c]={}),!w[c].root){w[c].accountToken=t,w[c].location=w.location.href.toString(),
      w[c].now=new Date;for(var s=0;s<m.length;s++){!function(){var t=w[c][m[s]+"_a"]=[];w[c][m[s]]=function(){t.push(arguments);};}();}
      i.src="https://fast.trychameleon.com/messo/"+t+"/messo.min.js",
      i.async=!0,d.head.appendChild(i);}
}

const identify = (id, options) => {
  if (!chmln || !chmln.identify) {
    console.log(`Failed to identify the user [${id}] because the chameleon builder was not initialized correctly`);
    return;
  }

  chmln.identify(id, options || {});
}

const track = (eventName) => {
  if (!chmln || !chmln.track) {
    console.log(`Failed to track event [${eventName}] because the chameleon builder was not initialized correctly`);
    return;
  }

  chmln.track(eventName);
}

module.exports = {
  init: initializeChameleonBuilder,
  identify,
  track
};
