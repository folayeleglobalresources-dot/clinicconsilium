(function(){document.documentElement.classList.add('js-reveal');
var els=document.querySelectorAll('.card,.photo-tile,.service-visual,.people-tile,.section-head,.cta,.feature-band');
els.forEach(function(e){e.classList.add('reveal')});
if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in')});return}
var o=new IntersectionObserver(function(r){r.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');o.unobserve(x.target)}})},{threshold:.12});
els.forEach(function(e){o.observe(e)});
setTimeout(function(){els.forEach(function(e){e.classList.add('in')})},4000)})();
