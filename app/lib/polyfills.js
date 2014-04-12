if (!Date.now) {
   Date.now = function now() {
      return new Date().getTime();
   };
}

// le sigh, IE, oh IE, how we fight... fix Function.prototype.bind as needed
if (!Function.prototype.bind) {
   //credits: taken from bind_even_never in this discussion: https://prototype.lighthouseapp.com/projects/8886/tickets/215-optimize-bind-bindaseventlistener#ticket-215-9
   Function.prototype.bind = function(context) {
      var fn = this, args = Array.prototype.slice.call(arguments, 1);
      return function(){
         return fn.apply(context, Array.prototype.concat.apply(args, arguments));
      };
   };
}

if ( !Array.prototype.forEach ) {
   // credits: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/forEach
   Array.prototype.forEach = function(fn, scope) {
      for(var i = 0, len = this.length; i < len; ++i) {
         fn.call(scope, this[i], i, this);
      }
   }
}


/* helper to show gritter notification */
function gritter_alert(def_title, def_content) {
    var gritter_time = 3000;
    $.gritter.add({
        title: def_title,
        text: def_content,
        class_name: 'hidden-xs',
        image: 'img/gritter/avatar_cathead.png',
        sticky: false,
        time: gritter_time
    });
}

function blink(that){
    $(that).focus();
    for(i=0; i < 5; i++) {
        $(that).fadeOut(300).fadeIn(100);
    }
};