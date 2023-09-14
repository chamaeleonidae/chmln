
const chmln_object = {
  init: (token, { fastUrl } = {}) => {
    if (typeof window.chmln !== 'undefined') {
      console.log(`The global variable \`chmln\` is already defined.\nPlease make sure you're not adding Chameleon to the page other than with this library.`);
      return;
    }
  
    var d = document;
    var w = window;
    var t = token,
    c="chmln",m="identify alias track clear set show on off custom help _data".split(" "),
    i=d.createElement("script");
    if(w[c]||(w[c]=chmln_object),!w[c].root){w[c].accountToken=t,w[c].location=w.location.href.toString(),w[c].fastUrl=fastUrl||'https://fast.trychameleon.com/',
        w[c].now=new Date;for(var s=0;s<m.length;s++){!function(){var t=w[c][m[s]+"_a"]=[];w[c][m[s]]=function(){t.push(arguments);};}();}
        i.src=w[c].fastUrl+"messo/"+t+"/messo.min.js",
        i.async=!0,d.head.appendChild(i),w[c].init=null;}
  }
};

module.exports = chmln_object;
