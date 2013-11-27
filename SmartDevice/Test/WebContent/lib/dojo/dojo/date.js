//>>built
define("dojo/date",["./has","./_base/lang"],function(m,l){var g={getDaysInMonth:function(b){var a=b.getMonth();return 1==a&&g.isLeapYear(b)?29:[31,28,31,30,31,30,31,31,30,31,30,31][a]},isLeapYear:function(b){b=b.getFullYear();return!(b%400)||!(b%4)&&!!(b%100)},getTimezoneName:function(b){var a=b.toString(),c="",d=a.indexOf("(");if(-1<d)c=a.substring(++d,a.indexOf(")"));else if(d=/([A-Z\/]+) \d{4}$/,a=a.match(d))c=a[1];else if(a=b.toLocaleString(),d=/ ([A-Z\/]+)$/,a=a.match(d))c=a[1];return"AM"==c||
"PM"==c?"":c},compare:function(b,a,c){b=new Date(+b);a=new Date(+(a||new Date));"date"==c?(b.setHours(0,0,0,0),a.setHours(0,0,0,0)):"time"==c&&(b.setFullYear(0,0,0),a.setFullYear(0,0,0));return b>a?1:b<a?-1:0},add:function(b,a,c){var d=new Date(+b),e=!1,f="Date";switch(a){case "day":break;case "weekday":var h;(a=c%5)?h=parseInt(c/5):(a=0<c?5:-5,h=0<c?(c-5)/5:(c+5)/5);var g=b.getDay(),k=0;6==g&&0<c?k=1:0==g&&0>c&&(k=-1);g+=a;if(0==g||6==g)k=0<c?2:-2;c=7*h+a+k;break;case "year":f="FullYear";e=!0;break;
case "week":c*=7;break;case "quarter":c*=3;case "month":e=!0;f="Month";break;default:f="UTC"+a.charAt(0).toUpperCase()+a.substring(1)+"s"}if(f)d["set"+f](d["get"+f]()+c);e&&d.getDate()<b.getDate()&&d.setDate(0);return d},difference:function(b,a,c){a=a||new Date;c=c||"day";var d=a.getFullYear()-b.getFullYear(),e=1;switch(c){case "quarter":b=b.getMonth();a=a.getMonth();b=Math.floor(b/3)+1;a=Math.floor(a/3)+1;e=a+4*d-b;break;case "weekday":d=Math.round(g.difference(b,a,"day"));c=parseInt(g.difference(b,
a,"week"));e=d%7;if(0==e)d=5*c;else{var f=0,h=b.getDay();a=a.getDay();c=parseInt(d/7);e=d%7;b=new Date(b);b.setDate(b.getDate()+7*c);b=b.getDay();if(0<d)switch(!0){case 6==h:f=-1;break;case 0==h:f=0;break;case 6==a:f=-1;break;case 0==a:f=-2;break;case 5<b+e:f=-2}else if(0>d)switch(!0){case 6==h:f=0;break;case 0==h:f=1;break;case 6==a:f=2;break;case 0==a:f=1;break;case 0>b+e:f=2}d=d+f-2*c}e=d;break;case "year":e=d;break;case "month":e=a.getMonth()-b.getMonth()+12*d;break;case "week":e=parseInt(g.difference(b,
a,"day")/7);break;case "day":e/=24;case "hour":e/=60;case "minute":e/=60;case "second":e/=1E3;case "millisecond":e*=a.getTime()-b.getTime()}return Math.round(e)}};l.mixin(l.getObject("dojo.date",!0),g);return g});
//@ sourceMappingURL=date.js.map