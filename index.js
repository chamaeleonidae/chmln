const init = (token, { fastUrl, forceOverride } = {}) => {
  if (forceOverride) {
    chmln = undefined;
  } else if (typeof chmln !== 'undefined') {
    console.log(`The global variable \`chmln\` is already defined.\nPlease make sure you're not adding Chameleon to the page other than with this library. Alternatively, you can use the forceOverride option to remove any previous declaration.\n\ne.g.   chmln.init('token', { forceOverride: true });`);
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
  if (!chmln || !chmln.identify) {
    console.log(`Failed to identify the user [${id}] because the chameleon.io script was not initialized yet.`);
    return;
  }

  chmln.identify(id, options || {});
}

const track = (eventName) => {
  if (!chmln || !chmln.track) {
    console.log(`Failed to track event [${eventName}] because the chameleon.io script was not initialized yet.`);
    return;
  }

  chmln.track(eventName);
}

const on = (eventName, callback) => {
  if (!chmln || !chmln.on) {
    console.log(`Failed to listen to event [${eventName}] because the chameleon.io script was not initialized yet.`);
    return;
  }

  chmln.on(eventName, callback);
}

module.exports = {
  init,
  identify,
  track,
  on
};
