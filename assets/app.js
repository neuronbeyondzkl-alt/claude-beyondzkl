(()=>{var xh=0,Pl=1,vh=2;var nr=1,yh=2,ds=3,yi=0,qe=1,On=2,Qe=0,ps=1,Ui=2,Il=3,Ll=4,Mh=5;var Fi=100,Sh=101,bh=102,Th=103,wh=104,Ah=200,Eh=201,Ch=202,Rh=203,Dl=204,Nl=205,Ph=206,Ih=207,Lh=208,Dh=209,Nh=210,Uh=211,Fh=212,Oh=213,Bh=214,la=0,ca=1,ha=2,rs=3,ua=4,fa=5,da=6,pa=7,Ul=0,kh=1,zh=2,cn=0,ir=1,sr=2,rr=3,ar=4,or=5,lr=6,cr=7;var Fl=300,Mi=301,Oi=302,Ba=303,ka=304,hr=306,ma=1e3,Dn=1001,ga=1002,Me=1003,Vh=1004;var ur=1005;var De=1006,za=1007;var Si=1008;var hn=1009,Ol=1010,Bl=1011,ms=1012,Va=1013,Tn=1014,un=1015,Ce=1016,Ga=1017,Ha=1018,gs=1020,kl=35902,zl=35899,Vl=1021,Gl=1022,je=1023,Nn=1026,bi=1027,Hl=1028,Wa=1029,Ti=1030,Xa=1031;var qa=1033,fr=33776,dr=33777,pr=33778,mr=33779,Ya=35840,Za=35841,Ja=35842,$a=35843,Ka=36196,Qa=37492,ja=37496,to=37488,eo=37489,gr=37490,no=37491,io=37808,so=37809,ro=37810,ao=37811,oo=37812,lo=37813,co=37814,ho=37815,uo=37816,fo=37817,po=37818,mo=37819,go=37820,_o=37821,xo=36492,vo=36494,yo=36495,Mo=36283,So=36284,_r=36285,bo=36286;var Os=2300,_a=2301,aa=2302,bl=2303,Tl=2400,wl=2401,Al=2402;var Gh=3200;var Wl=0,Hh=1,Kn="",an="srgb",Bs="srgb-linear",ks="linear",ae="srgb";var oa=7680;var Wh=519,Xh=512,qh=513,Yh=514,To=515,Zh=516,Jh=517,wo=518,$h=519,Kh=35044;var Xl="300 es",bn=2e3,zs=2001;function bf(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function Tf(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}function Vs(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Qh(){let i=Vs("canvas");return i.style.display="block",i}var $c={},as=null;function ql(...i){let t="THREE."+i.shift();as?as("log",t,...i):console.log(t,...i)}function jh(i){let t=i[0];if(typeof t=="string"&&t.startsWith("TSL:")){let e=i[1];e&&e.isStackTrace?i[0]+=" "+e.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function Ht(...i){i=jh(i);let t="THREE."+i.shift();if(as)as("warn",t,...i);else{let e=i[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...i)}}function Wt(...i){i=jh(i);let t="THREE."+i.shift();if(as)as("error",t,...i);else{let e=i[0];e&&e.isStackTrace?console.error(e.getError(t)):console.error(t,...i)}}function Ii(...i){let t=i.join(" ");t in $c||($c[t]=!0,Ht(...i))}function tu(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}var eu={[la]:ca,[ha]:da,[ua]:pa,[rs]:fa,[ca]:la,[da]:ha,[pa]:ua,[fa]:rs},Un=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){let n=this._listeners;return n===void 0?!1:n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){let n=this._listeners;if(n===void 0)return;let s=n[t];if(s!==void 0){let r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){let e=this._listeners;if(e===void 0)return;let n=e[t.type];if(n!==void 0){t.target=this;let s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,t);t.target=null}}},Fe=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Kc=1234567,Us=Math.PI/180,os=180/Math.PI;function _s(){let i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Fe[i&255]+Fe[i>>8&255]+Fe[i>>16&255]+Fe[i>>24&255]+"-"+Fe[t&255]+Fe[t>>8&255]+"-"+Fe[t>>16&15|64]+Fe[t>>24&255]+"-"+Fe[e&63|128]+Fe[e>>8&255]+"-"+Fe[e>>16&255]+Fe[e>>24&255]+Fe[n&255]+Fe[n>>8&255]+Fe[n>>16&255]+Fe[n>>24&255]).toLowerCase()}function ne(i,t,e){return Math.max(t,Math.min(e,i))}function Yl(i,t){return(i%t+t)%t}function wf(i,t,e,n,s){return n+(i-t)*(s-n)/(e-t)}function Af(i,t,e){return i!==t?(e-i)/(t-i):0}function Fs(i,t,e){return(1-e)*i+e*t}function Ef(i,t,e,n){return Fs(i,t,1-Math.exp(-e*n))}function Cf(i,t=1){return t-Math.abs(Yl(i,t*2)-t)}function Rf(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*(3-2*i))}function Pf(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*i*(i*(i*6-15)+10))}function If(i,t){return i+Math.floor(Math.random()*(t-i+1))}function Lf(i,t){return i+Math.random()*(t-i)}function Df(i){return i*(.5-Math.random())}function Nf(i){i!==void 0&&(Kc=i);let t=Kc+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function Uf(i){return i*Us}function Ff(i){return i*os}function Of(i){return i>0&&Number.isInteger(i)&&2**Math.round(Math.log2(i))===i}function Bf(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function kf(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function zf(i,t,e,n,s){let r=Math.cos,a=Math.sin,o=r(e/2),l=a(e/2),c=r((t+n)/2),h=a((t+n)/2),f=r((t-n)/2),u=a((t-n)/2),d=r((n-t)/2),g=a((n-t)/2);switch(s){case"XYX":i.set(o*h,l*f,l*u,o*c);break;case"YZY":i.set(l*u,o*h,l*f,o*c);break;case"ZXZ":i.set(l*f,l*u,o*h,o*c);break;case"XZX":i.set(o*h,l*g,l*d,o*c);break;case"YXY":i.set(l*d,o*h,l*g,o*c);break;case"ZYZ":i.set(l*g,l*d,o*h,o*c);break;default:Ht("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function is(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:case Uint8ClampedArray:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function He(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var Zl={DEG2RAD:Us,RAD2DEG:os,generateUUID:_s,clamp:ne,euclideanModulo:Yl,mapLinear:wf,inverseLerp:Af,lerp:Fs,damp:Ef,pingpong:Cf,smoothstep:Rf,smootherstep:Pf,randInt:If,randFloat:Lf,randFloatSpread:Df,seededRandom:Nf,degToRad:Uf,radToDeg:Ff,isPowerOfTwo:Of,ceilPowerOfTwo:Bf,floorPowerOfTwo:kf,setQuaternionFromProperEuler:zf,normalize:He,denormalize:is},jl=class jl{constructor(t=0,e=0){this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=ne(this.x,t.x,e.x),this.y=ne(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=ne(this.x,t,e),this.y=ne(this.y,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(ne(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(ne(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,a=this.y-t.y;return this.x=r*n-a*s+t.x,this.y=r*s+a*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};jl.prototype.isVector2=!0;var Xt=jl,Fn=class{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,a,o){let l=n[s+0],c=n[s+1],h=n[s+2],f=n[s+3],u=r[a+0],d=r[a+1],g=r[a+2],w=r[a+3];if(f!==w||l!==u||c!==d||h!==g){let m=l*u+c*d+h*g+f*w;m<0&&(u=-u,d=-d,g=-g,w=-w,m=-m);let p=1-o;if(m<.9995){let S=Math.acos(m),C=Math.sin(S);p=Math.sin(p*S)/C,o=Math.sin(o*S)/C,l=l*p+u*o,c=c*p+d*o,h=h*p+g*o,f=f*p+w*o}else{l=l*p+u*o,c=c*p+d*o,h=h*p+g*o,f=f*p+w*o;let S=1/Math.sqrt(l*l+c*c+h*h+f*f);l*=S,c*=S,h*=S,f*=S}}t[e]=l,t[e+1]=c,t[e+2]=h,t[e+3]=f}static multiplyQuaternionsFlat(t,e,n,s,r,a){let o=n[s],l=n[s+1],c=n[s+2],h=n[s+3],f=r[a],u=r[a+1],d=r[a+2],g=r[a+3];return t[e]=o*g+h*f+l*d-c*u,t[e+1]=l*g+h*u+c*f-o*d,t[e+2]=c*g+h*d+o*u-l*f,t[e+3]=h*g-o*f-l*u-c*d,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let n=t._x,s=t._y,r=t._z,a=t._order,o=Math.cos,l=Math.sin,c=o(n/2),h=o(s/2),f=o(r/2),u=l(n/2),d=l(s/2),g=l(r/2);switch(a){case"XYZ":this._x=u*h*f+c*d*g,this._y=c*d*f-u*h*g,this._z=c*h*g+u*d*f,this._w=c*h*f-u*d*g;break;case"YXZ":this._x=u*h*f+c*d*g,this._y=c*d*f-u*h*g,this._z=c*h*g-u*d*f,this._w=c*h*f+u*d*g;break;case"ZXY":this._x=u*h*f-c*d*g,this._y=c*d*f+u*h*g,this._z=c*h*g+u*d*f,this._w=c*h*f-u*d*g;break;case"ZYX":this._x=u*h*f-c*d*g,this._y=c*d*f+u*h*g,this._z=c*h*g-u*d*f,this._w=c*h*f+u*d*g;break;case"YZX":this._x=u*h*f+c*d*g,this._y=c*d*f+u*h*g,this._z=c*h*g-u*d*f,this._w=c*h*f-u*d*g;break;case"XZY":this._x=u*h*f-c*d*g,this._y=c*d*f-u*h*g,this._z=c*h*g+u*d*f,this._w=c*h*f+u*d*g;break;default:Ht("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,n=e[0],s=e[4],r=e[8],a=e[1],o=e[5],l=e[9],c=e[2],h=e[6],f=e[10],u=n+o+f;if(u>0){let d=.5/Math.sqrt(u+1);this._w=.25/d,this._x=(h-l)*d,this._y=(r-c)*d,this._z=(a-s)*d}else if(n>o&&n>f){let d=2*Math.sqrt(1+n-o-f);this._w=(h-l)/d,this._x=.25*d,this._y=(s+a)/d,this._z=(r+c)/d}else if(o>f){let d=2*Math.sqrt(1+o-n-f);this._w=(r-c)/d,this._x=(s+a)/d,this._y=.25*d,this._z=(l+h)/d}else{let d=2*Math.sqrt(1+f-n-o);this._w=(a-s)/d,this._x=(r+c)/d,this._y=(l+h)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<1e-8?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(ne(this.dot(t),-1,1)))}rotateTowards(t,e){let n=this.angleTo(t);if(n===0)return this;let s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let n=t._x,s=t._y,r=t._z,a=t._w,o=e._x,l=e._y,c=e._z,h=e._w;return this._x=n*h+a*o+s*c-r*l,this._y=s*h+a*l+r*o-n*c,this._z=r*h+a*c+n*l-s*o,this._w=a*h-n*o-s*l-r*c,this._onChangeCallback(),this}slerp(t,e){let n=t._x,s=t._y,r=t._z,a=t._w,o=this.dot(t);o<0&&(n=-n,s=-s,r=-r,a=-a,o=-o);let l=1-e;if(o<.9995){let c=Math.acos(o),h=Math.sin(c);l=Math.sin(l*c)/h,e=Math.sin(e*c)/h,this._x=this._x*l+n*e,this._y=this._y*l+s*e,this._z=this._z*l+r*e,this._w=this._w*l+a*e,this._onChangeCallback()}else this._x=this._x*l+n*e,this._y=this._y*l+s*e,this._z=this._z*l+r*e,this._w=this._w*l+a*e,this.normalize();return this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){let t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},tc=class tc{constructor(t=0,e=0,n=0){this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(Qc.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(Qc.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=t.elements,a=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(t){let e=this.x,n=this.y,s=this.z,r=t.x,a=t.y,o=t.z,l=t.w,c=2*(a*s-o*n),h=2*(o*e-r*s),f=2*(r*n-a*e);return this.x=e+l*c+a*f-o*h,this.y=n+l*h+o*c-r*f,this.z=s+l*f+r*h-a*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=ne(this.x,t.x,e.x),this.y=ne(this.y,t.y,e.y),this.z=ne(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=ne(this.x,t,e),this.y=ne(this.y,t,e),this.z=ne(this.z,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(ne(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let n=t.x,s=t.y,r=t.z,a=e.x,o=e.y,l=e.z;return this.x=s*l-r*o,this.y=r*a-n*l,this.z=n*o-s*a,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return il.copy(this).projectOnVector(t),this.sub(il)}reflect(t){return this.sub(il.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(ne(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){let s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};tc.prototype.isVector3=!0;var V=tc,il=new V,Qc=new Fn,ec=class ec{constructor(t,e,n,s,r,a,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,l,c)}set(t,e,n,s,r,a,o,l,c){let h=this.elements;return h[0]=t,h[1]=s,h[2]=o,h[3]=e,h[4]=r,h[5]=l,h[6]=n,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],h=n[4],f=n[7],u=n[2],d=n[5],g=n[8],w=s[0],m=s[3],p=s[6],S=s[1],C=s[4],v=s[7],T=s[2],A=s[5],P=s[8];return r[0]=a*w+o*S+l*T,r[3]=a*m+o*C+l*A,r[6]=a*p+o*v+l*P,r[1]=c*w+h*S+f*T,r[4]=c*m+h*C+f*A,r[7]=c*p+h*v+f*P,r[2]=u*w+d*S+g*T,r[5]=u*m+d*C+g*A,r[8]=u*p+d*v+g*P,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8];return e*a*h-e*o*c-n*r*h+n*o*l+s*r*c-s*a*l}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8],f=h*a-o*c,u=o*l-h*r,d=c*r-a*l,g=e*f+n*u+s*d;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let w=1/g;return t[0]=f*w,t[1]=(s*c-h*n)*w,t[2]=(o*n-s*a)*w,t[3]=u*w,t[4]=(h*e-s*l)*w,t[5]=(s*r-o*e)*w,t[6]=d*w,t[7]=(n*l-c*e)*w,t[8]=(a*e-n*r)*w,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,a,o){let l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*a+c*o)+a+t,-s*c,s*l,-s*(-c*a+l*o)+o+e,0,0,1),this}scale(t,e){return Ii("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(sl.makeScale(t,e)),this}rotate(t){return Ii("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(sl.makeRotation(-t)),this}translate(t,e){return Ii("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(sl.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}};ec.prototype.isMatrix3=!0;var Yt=ec,sl=new Yt,jc=new Yt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),th=new Yt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Vf(){let i={enabled:!0,workingColorSpace:Bs,spaces:{},convert:function(s,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===ae&&(s.r=$n(s.r),s.g=$n(s.g),s.b=$n(s.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===ae&&(s.r=ss(s.r),s.g=ss(s.g),s.b=ss(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===Kn?ks:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,a){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,r){return Ii("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(s,r)},toWorkingColorSpace:function(s,r){return Ii("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(s,r)}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[Bs]:{primaries:t,whitePoint:n,transfer:ks,toXYZ:jc,fromXYZ:th,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:an},outputColorSpaceConfig:{drawingBufferColorSpace:an}},[an]:{primaries:t,whitePoint:n,transfer:ae,toXYZ:jc,fromXYZ:th,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:an}}}),i}var jt=Vf();function $n(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function ss(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var Wi,xa=class{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let n;if(t instanceof HTMLCanvasElement)n=t;else{Wi===void 0&&(Wi=Vs("canvas")),Wi.width=t.width,Wi.height=t.height;let s=Wi.getContext("2d");t instanceof ImageData?s.putImageData(t,0,0):s.drawImage(t,0,0,t.width,t.height),n=Wi}return n.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let e=Vs("canvas");e.width=t.width,e.height=t.height;let n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);let s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=$n(r[a]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){let e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor($n(e[n]/255)*255):e[n]=$n(e[n]);return{data:e,width:t.width,height:t.height}}else return Ht("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},Gf=0,ls=class{constructor(t=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:Gf++}),this.uuid=_s(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){let e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<"u"&&e instanceof VideoFrame?t.set(e.displayWidth,e.displayHeight,0):e!==null?t.set(e.width,e.height,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(rl(s[a].image)):r.push(rl(s[a]))}else r=rl(s);n.url=r}return e||(t.images[this.uuid]=n),n}};function rl(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?xa.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(Ht("Texture: Unable to serialize Texture."),{})}var Hf=0,al=new V,$e=class i extends Un{constructor(t=i.DEFAULT_IMAGE,e=i.DEFAULT_MAPPING,n=Dn,s=Dn,r=De,a=Si,o=je,l=hn,c=i.DEFAULT_ANISOTROPY,h=Kn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Hf++}),this.uuid=_s(),this.name="",this.source=new ls(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new Xt(0,0),this.repeat=new Xt(1,1),this.center=new Xt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Yt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(al).x}get height(){return this.source.getSize(al).y}get depth(){return this.source.getSize(al).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(let e in t){let n=t[e];if(n===void 0){Ht(`Texture.setValues(): parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){Ht(`Texture.setValues(): property '${e}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Fl)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case ma:t.x=t.x-Math.floor(t.x);break;case Dn:t.x=t.x<0?0:1;break;case ga:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case ma:t.y=t.y-Math.floor(t.y);break;case Dn:t.y=t.y<0?0:1;break;case ga:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};$e.DEFAULT_IMAGE=null;$e.DEFAULT_MAPPING=Fl;$e.DEFAULT_ANISOTROPY=1;var nc=class nc{constructor(t=0,e=0,n=0,s=1){this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=this.w,a=t.elements;return this.x=a[0]*e+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*e+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*e+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*e+a[7]*n+a[11]*s+a[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r,l=t.elements,c=l[0],h=l[4],f=l[8],u=l[1],d=l[5],g=l[9],w=l[2],m=l[6],p=l[10];if(Math.abs(h-u)<.01&&Math.abs(f-w)<.01&&Math.abs(g-m)<.01){if(Math.abs(h+u)<.1&&Math.abs(f+w)<.1&&Math.abs(g+m)<.1&&Math.abs(c+d+p-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let C=(c+1)/2,v=(d+1)/2,T=(p+1)/2,A=(h+u)/4,P=(f+w)/4,x=(g+m)/4;return C>v&&C>T?C<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(C),s=A/n,r=P/n):v>T?v<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(v),n=A/s,r=x/s):T<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(T),n=P/r,s=x/r),this.set(n,s,r,e),this}let S=Math.sqrt((m-g)*(m-g)+(f-w)*(f-w)+(u-h)*(u-h));return Math.abs(S)<.001&&(S=1),this.x=(m-g)/S,this.y=(f-w)/S,this.z=(u-h)/S,this.w=Math.acos((c+d+p-1)/2),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=ne(this.x,t.x,e.x),this.y=ne(this.y,t.y,e.y),this.z=ne(this.z,t.z,e.z),this.w=ne(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=ne(this.x,t,e),this.y=ne(this.y,t,e),this.z=ne(this.z,t,e),this.w=ne(this.w,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(ne(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};nc.prototype.isVector4=!0;var he=nc,va=class extends Un{constructor(t=1,e=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:De,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=n.depth,this.scissor=new he(0,0,t,e),this.scissorTest=!1,this.viewport=new he(0,0,t,e),this.textures=[];let s={width:t,height:e,depth:n.depth},r=new $e(s),a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(t={}){let e={minFilter:De,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),t!==null&&t.renderTarget===null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,n=t.textures.length;e<n;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;let s=Object.assign({},t.textures[e].image);this.textures[e].source=new ls(s)}if(this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveColorBuffer=t.resolveColorBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,this.storeMultisampledColorBuffer=t.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=t.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=t.storeMultisampledStencilBuffer,t.depthTexture!==null)if(t.depthTexture.renderTarget===t){let e=t.depthTexture.clone();e.renderTarget=null,this.depthTexture=e}else this.depthTexture=t.depthTexture;return this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},Se=class extends va{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}},Gs=class extends $e{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=Me,this.minFilter=Me,this.wrapR=Dn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}};var ya=class extends $e{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=Me,this.minFilter=Me,this.wrapR=Dn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}};var Oa=class Oa{constructor(t,e,n,s,r,a,o,l,c,h,f,u,d,g,w,m){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,l,c,h,f,u,d,g,w,m)}set(t,e,n,s,r,a,o,l,c,h,f,u,d,g,w,m){let p=this.elements;return p[0]=t,p[4]=e,p[8]=n,p[12]=s,p[1]=r,p[5]=a,p[9]=o,p[13]=l,p[2]=c,p[6]=h,p[10]=f,p[14]=u,p[3]=d,p[7]=g,p[11]=w,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Oa().fromArray(this.elements)}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){let e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return this.determinantAffine()===0?(t.set(1,0,0),e.set(0,1,0),n.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();let e=this.elements,n=t.elements,s=1/Xi.setFromMatrixColumn(t,0).length(),r=1/Xi.setFromMatrixColumn(t,1).length(),a=1/Xi.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*a,e[9]=n[9]*a,e[10]=n[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,n=t.x,s=t.y,r=t.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),f=Math.sin(r);if(t.order==="XYZ"){let u=a*h,d=a*f,g=o*h,w=o*f;e[0]=l*h,e[4]=-l*f,e[8]=c,e[1]=d+g*c,e[5]=u-w*c,e[9]=-o*l,e[2]=w-u*c,e[6]=g+d*c,e[10]=a*l}else if(t.order==="YXZ"){let u=l*h,d=l*f,g=c*h,w=c*f;e[0]=u+w*o,e[4]=g*o-d,e[8]=a*c,e[1]=a*f,e[5]=a*h,e[9]=-o,e[2]=d*o-g,e[6]=w+u*o,e[10]=a*l}else if(t.order==="ZXY"){let u=l*h,d=l*f,g=c*h,w=c*f;e[0]=u-w*o,e[4]=-a*f,e[8]=g+d*o,e[1]=d+g*o,e[5]=a*h,e[9]=w-u*o,e[2]=-a*c,e[6]=o,e[10]=a*l}else if(t.order==="ZYX"){let u=a*h,d=a*f,g=o*h,w=o*f;e[0]=l*h,e[4]=g*c-d,e[8]=u*c+w,e[1]=l*f,e[5]=w*c+u,e[9]=d*c-g,e[2]=-c,e[6]=o*l,e[10]=a*l}else if(t.order==="YZX"){let u=a*l,d=a*c,g=o*l,w=o*c;e[0]=l*h,e[4]=w-u*f,e[8]=g*f+d,e[1]=f,e[5]=a*h,e[9]=-o*h,e[2]=-c*h,e[6]=d*f+g,e[10]=u-w*f}else if(t.order==="XZY"){let u=a*l,d=a*c,g=o*l,w=o*c;e[0]=l*h,e[4]=-f,e[8]=c*h,e[1]=u*f+w,e[5]=a*h,e[9]=d*f-g,e[2]=g*f-d,e[6]=o*h,e[10]=w*f+u}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(Wf,t,Xf)}lookAt(t,e,n){let s=this.elements;return sn.subVectors(t,e),sn.lengthSq()===0&&(sn.z=1),sn.normalize(),oi.crossVectors(n,sn),oi.lengthSq()===0&&(Math.abs(n.z)===1?sn.x+=1e-4:sn.z+=1e-4,sn.normalize(),oi.crossVectors(n,sn)),oi.normalize(),kr.crossVectors(sn,oi),s[0]=oi.x,s[4]=kr.x,s[8]=sn.x,s[1]=oi.y,s[5]=kr.y,s[9]=sn.y,s[2]=oi.z,s[6]=kr.z,s[10]=sn.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],h=n[1],f=n[5],u=n[9],d=n[13],g=n[2],w=n[6],m=n[10],p=n[14],S=n[3],C=n[7],v=n[11],T=n[15],A=s[0],P=s[4],x=s[8],b=s[12],M=s[1],E=s[5],L=s[9],N=s[13],I=s[2],F=s[6],q=s[10],W=s[14],st=s[3],Y=s[7],Q=s[11],tt=s[15];return r[0]=a*A+o*M+l*I+c*st,r[4]=a*P+o*E+l*F+c*Y,r[8]=a*x+o*L+l*q+c*Q,r[12]=a*b+o*N+l*W+c*tt,r[1]=h*A+f*M+u*I+d*st,r[5]=h*P+f*E+u*F+d*Y,r[9]=h*x+f*L+u*q+d*Q,r[13]=h*b+f*N+u*W+d*tt,r[2]=g*A+w*M+m*I+p*st,r[6]=g*P+w*E+m*F+p*Y,r[10]=g*x+w*L+m*q+p*Q,r[14]=g*b+w*N+m*W+p*tt,r[3]=S*A+C*M+v*I+T*st,r[7]=S*P+C*E+v*F+T*Y,r[11]=S*x+C*L+v*q+T*Q,r[15]=S*b+C*N+v*W+T*tt,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],a=t[1],o=t[5],l=t[9],c=t[13],h=t[2],f=t[6],u=t[10],d=t[14],g=t[3],w=t[7],m=t[11],p=t[15],S=l*d-c*u,C=o*d-c*f,v=o*u-l*f,T=a*d-c*h,A=a*u-l*h,P=a*f-o*h;return e*(w*S-m*C+p*v)-n*(g*S-m*T+p*A)+s*(g*C-w*T+p*P)-r*(g*v-w*A+m*P)}determinantAffine(){let t=this.elements,e=t[0],n=t[4],s=t[8],r=t[1],a=t[5],o=t[9],l=t[2],c=t[6],h=t[10];return e*(a*h-o*c)-n*(r*h-o*l)+s*(r*c-a*l)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){let s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8],f=t[9],u=t[10],d=t[11],g=t[12],w=t[13],m=t[14],p=t[15],S=e*o-n*a,C=e*l-s*a,v=e*c-r*a,T=n*l-s*o,A=n*c-r*o,P=s*c-r*l,x=h*w-f*g,b=h*m-u*g,M=h*p-d*g,E=f*m-u*w,L=f*p-d*w,N=u*p-d*m,I=S*N-C*L+v*E+T*M-A*b+P*x;if(I===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let F=1/I;return t[0]=(o*N-l*L+c*E)*F,t[1]=(s*L-n*N-r*E)*F,t[2]=(w*P-m*A+p*T)*F,t[3]=(u*A-f*P-d*T)*F,t[4]=(l*M-a*N-c*b)*F,t[5]=(e*N-s*M+r*b)*F,t[6]=(m*v-g*P-p*C)*F,t[7]=(h*P-u*v+d*C)*F,t[8]=(a*L-o*M+c*x)*F,t[9]=(n*M-e*L-r*x)*F,t[10]=(g*A-w*v+p*S)*F,t[11]=(f*v-h*A-d*S)*F,t[12]=(o*b-a*E-l*x)*F,t[13]=(e*E-n*b+s*x)*F,t[14]=(w*C-g*T-m*S)*F,t[15]=(h*T-f*C+u*S)*F,this}scale(t){let e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let n=Math.cos(e),s=Math.sin(e),r=1-n,a=t.x,o=t.y,l=t.z,c=r*a,h=r*o;return this.set(c*a+n,c*o-s*l,c*l+s*o,0,c*o+s*l,h*o+n,h*l-s*a,0,c*l-s*o,h*l+s*a,r*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,a){return this.set(1,n,r,0,t,1,a,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){let s=this.elements,r=e._x,a=e._y,o=e._z,l=e._w,c=r+r,h=a+a,f=o+o,u=r*c,d=r*h,g=r*f,w=a*h,m=a*f,p=o*f,S=l*c,C=l*h,v=l*f,T=n.x,A=n.y,P=n.z;return s[0]=(1-(w+p))*T,s[1]=(d+v)*T,s[2]=(g-C)*T,s[3]=0,s[4]=(d-v)*A,s[5]=(1-(u+p))*A,s[6]=(m+S)*A,s[7]=0,s[8]=(g+C)*P,s[9]=(m-S)*P,s[10]=(1-(u+w))*P,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){let s=this.elements;t.x=s[12],t.y=s[13],t.z=s[14];let r=this.determinantAffine();if(r===0)return n.set(1,1,1),e.identity(),this;let a=Xi.set(s[0],s[1],s[2]).length(),o=Xi.set(s[4],s[5],s[6]).length(),l=Xi.set(s[8],s[9],s[10]).length();r<0&&(a=-a),vn.copy(this);let c=1/a,h=1/o,f=1/l;return vn.elements[0]*=c,vn.elements[1]*=c,vn.elements[2]*=c,vn.elements[4]*=h,vn.elements[5]*=h,vn.elements[6]*=h,vn.elements[8]*=f,vn.elements[9]*=f,vn.elements[10]*=f,e.setFromRotationMatrix(vn),n.x=a,n.y=o,n.z=l,this}makePerspective(t,e,n,s,r,a,o=bn,l=!1){let c=this.elements,h=2*r/(e-t),f=2*r/(n-s),u=(e+t)/(e-t),d=(n+s)/(n-s),g,w;if(l)g=r/(a-r),w=a*r/(a-r);else if(o===bn)g=-(a+r)/(a-r),w=-2*a*r/(a-r);else if(o===zs)g=-a/(a-r),w=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=u,c[12]=0,c[1]=0,c[5]=f,c[9]=d,c[13]=0,c[2]=0,c[6]=0,c[10]=g,c[14]=w,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(t,e,n,s,r,a,o=bn,l=!1){let c=this.elements,h=2/(e-t),f=2/(n-s),u=-(e+t)/(e-t),d=-(n+s)/(n-s),g,w;if(l)g=1/(a-r),w=a/(a-r);else if(o===bn)g=-2/(a-r),w=-(a+r)/(a-r);else if(o===zs)g=-1/(a-r),w=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=0,c[12]=u,c[1]=0,c[5]=f,c[9]=0,c[13]=d,c[2]=0,c[6]=0,c[10]=g,c[14]=w,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}};Oa.prototype.isMatrix4=!0;var ve=Oa,Xi=new V,vn=new ve,Wf=new V(0,0,0),Xf=new V(1,1,1),oi=new V,kr=new V,sn=new V,eh=new ve,nh=new Fn,di=class i{constructor(t=0,e=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){let s=t.elements,r=s[0],a=s[4],o=s[8],l=s[1],c=s[5],h=s[9],f=s[2],u=s[6],d=s[10];switch(e){case"XYZ":this._y=Math.asin(ne(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,d),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(u,c),this._z=0);break;case"YXZ":this._x=Math.asin(-ne(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,d),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-f,r),this._z=0);break;case"ZXY":this._x=Math.asin(ne(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-f,d),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-ne(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(u,d),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(ne(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-f,r)):(this._x=0,this._y=Math.atan2(o,d));break;case"XZY":this._z=Math.asin(-ne(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(u,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,d),this._y=0);break;default:Ht("Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return eh.makeRotationFromQuaternion(t),this.setFromRotationMatrix(eh,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return nh.setFromEuler(this),this.setFromQuaternion(nh,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};di.DEFAULT_ORDER="XYZ";var Hs=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},qf=0,ih=new V,qi=new Fn,Wn=new ve,zr=new V,Is=new V,Yf=new V,Zf=new Fn,sh=new V(1,0,0),rh=new V(0,1,0),ah=new V(0,0,1),oh={type:"added"},Jf={type:"removed"},Yi={type:"childadded",child:null},ol={type:"childremoved",child:null},on=class i extends Un{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:qf++}),this.uuid=_s(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let t=new V,e=new di,n=new Fn,s=new V(1,1,1);function r(){n.setFromEuler(e,!1)}function a(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new ve},normalMatrix:{value:new Yt}}),this.matrix=new ve,this.matrixWorld=new ve,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Hs,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return qi.setFromAxisAngle(t,e),this.quaternion.multiply(qi),this}rotateOnWorldAxis(t,e){return qi.setFromAxisAngle(t,e),this.quaternion.premultiply(qi),this}rotateX(t){return this.rotateOnAxis(sh,t)}rotateY(t){return this.rotateOnAxis(rh,t)}rotateZ(t){return this.rotateOnAxis(ah,t)}translateOnAxis(t,e){return ih.copy(t).applyQuaternion(this.quaternion),this.position.add(ih.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(sh,t)}translateY(t){return this.translateOnAxis(rh,t)}translateZ(t){return this.translateOnAxis(ah,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Wn.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?zr.copy(t):zr.set(t,e,n);let s=this.parent;this.updateWorldMatrix(!0,!1),Is.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Wn.lookAt(Is,zr,this.up):Wn.lookAt(zr,Is,this.up),this.quaternion.setFromRotationMatrix(Wn),s&&(Wn.extractRotation(s.matrixWorld),qi.setFromRotationMatrix(Wn),this.quaternion.premultiply(qi.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(Wt("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(oh),Yi.child=t,this.dispatchEvent(Yi),Yi.child=null):Wt("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Jf),ol.child=t,this.dispatchEvent(ol),ol.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Wn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Wn.multiply(t.parent.matrixWorld)),t.applyMatrix4(Wn),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(oh),Yi.child=t,this.dispatchEvent(Yi),Yi.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){let a=this.children[n].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Is,t,Yf),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Is,Zf,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(t){t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let t=this.pivot;if(t!==null){let e=t.x,n=t.y,s=t.z,r=this.matrix.elements;r[12]+=e-r[0]*e-r[4]*n-r[8]*s,r[13]+=n-r[1]*e-r[5]*n-r[9]*s,r[14]+=s-r[2]*e-r[6]*n-r[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e,n=!1){let s=this.parent;if(t===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),e===!0){let r=this.children;for(let a=0,o=r.length;a<o;a++)r[a].updateWorldMatrix(!1,!0,n)}}toJSON(t){let e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,s.name=this.name,s.castShadow=this.castShadow,s.receiveShadow=this.receiveShadow,s.visible=this.visible,s.frustumCulled=this.frustumCulled,s.renderOrder=this.renderOrder,s.static=this.static,s.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(t),s.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let f=l[c];r(t.shapes,f)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(t.materials,this.material[l]));s.material=o}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];s.animations.push(r(t.animations,l))}}if(e){let o=a(t.geometries),l=a(t.materials),c=a(t.textures),h=a(t.images),f=a(t.shapes),u=a(t.skeletons),d=a(t.animations),g=a(t.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),f.length>0&&(n.shapes=f),u.length>0&&(n.skeletons=u),d.length>0&&(n.animations=d),g.length>0&&(n.nodes=g)}return n.object=s,n;function a(o){let l=[];for(let c in o){let h=o[c];delete h.metadata,l.push(h)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){let s=t.children[n];this.add(s.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};on.DEFAULT_UP=new V(0,1,0);on.DEFAULT_MATRIX_AUTO_UPDATE=!0;on.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Jn=class extends on{constructor(){super(),this.isGroup=!0,this.type="Group"}},$f={type:"move"},cs=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Jn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Jn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new V,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new V),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Jn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new V,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new V,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let e=this._hand;if(e)for(let n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,a=null,o=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){a=!0;for(let w of t.hand.values()){let m=e.getJointPose(w,n),p=this._getHandJoint(c,w);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}let h=c.joints["index-finger-tip"],f=c.joints["thumb-tip"],u=h.position.distanceTo(f.position),d=.02,g=.005;c.inputState.pinching&&u>d+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&u<=d-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:t,target:this})));o!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent($f)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){let n=new Jn;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}},nu={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},li={h:0,s:0,l:0},Vr={h:0,s:0,l:0};function ll(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}var qt=class{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){let s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=an){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,jt.colorSpaceToWorking(this,e),this}setRGB(t,e,n,s=jt.workingColorSpace){return this.r=t,this.g=e,this.b=n,jt.colorSpaceToWorking(this,s),this}setHSL(t,e,n,s=jt.workingColorSpace){if(t=Yl(t,1),e=ne(e,0,1),n=ne(n,0,1),e===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+e):n+e-n*e,a=2*n-r;this.r=ll(a,r,t+1/3),this.g=ll(a,r,t),this.b=ll(a,r,t-1/3)}return jt.colorSpaceToWorking(this,s),this}setStyle(t,e=an){function n(r){r!==void 0&&parseFloat(r)<1&&Ht("Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r,a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:Ht("Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){let r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(r,16),e);Ht("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=an){let n=nu[t.toLowerCase()];return n!==void 0?this.setHex(n,e):Ht("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=$n(t.r),this.g=$n(t.g),this.b=$n(t.b),this}copyLinearToSRGB(t){return this.r=ss(t.r),this.g=ss(t.g),this.b=ss(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=an){return jt.workingToColorSpace(Oe.copy(this),t),Math.round(ne(Oe.r*255,0,255))*65536+Math.round(ne(Oe.g*255,0,255))*256+Math.round(ne(Oe.b*255,0,255))}getHexString(t=an){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=jt.workingColorSpace){jt.workingToColorSpace(Oe.copy(this),e);let n=Oe.r,s=Oe.g,r=Oe.b,a=Math.max(n,s,r),o=Math.min(n,s,r),l,c,h=(o+a)/2;if(o===a)l=0,c=0;else{let f=a-o;switch(c=h<=.5?f/(a+o):f/(2-a-o),a){case n:l=(s-r)/f+(s<r?6:0);break;case s:l=(r-n)/f+2;break;case r:l=(n-s)/f+4;break}l/=6}return t.h=l,t.s=c,t.l=h,t}getRGB(t,e=jt.workingColorSpace){return jt.workingToColorSpace(Oe.copy(this),e),t.r=Oe.r,t.g=Oe.g,t.b=Oe.b,t}getStyle(t=an){jt.workingToColorSpace(Oe.copy(this),t);let e=Oe.r,n=Oe.g,s=Oe.b;return t!==an?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(li),this.setHSL(li.h+t,li.s+e,li.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(li),t.getHSL(Vr);let n=Fs(li.h,Vr.h,e),s=Fs(li.s,Vr.s,e),r=Fs(li.l,Vr.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Oe=new qt;qt.NAMES=nu;var Ws=class extends on{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new di,this.environmentIntensity=1,this.environmentRotation=new di,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),e.object.backgroundBlurriness=this.backgroundBlurriness,e.object.backgroundIntensity=this.backgroundIntensity,e.object.backgroundRotation=this.backgroundRotation.toArray(),e.object.environmentIntensity=this.environmentIntensity,e.object.environmentRotation=this.environmentRotation.toArray(),e}},yn=new V,Xn=new V,cl=new V,qn=new V,Zi=new V,Ji=new V,lh=new V,hl=new V,ul=new V,fl=new V,dl=new he,pl=new he,ml=new he,fi=class i{constructor(t=new V,e=new V,n=new V){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),yn.subVectors(t,e),s.cross(yn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){yn.subVectors(s,e),Xn.subVectors(n,e),cl.subVectors(t,e);let a=yn.dot(yn),o=yn.dot(Xn),l=yn.dot(cl),c=Xn.dot(Xn),h=Xn.dot(cl),f=a*c-o*o;if(f===0)return r.set(0,0,0),null;let u=1/f,d=(c*l-o*h)*u,g=(a*h-o*l)*u;return r.set(1-d-g,g,d)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,qn)===null?!1:qn.x>=0&&qn.y>=0&&qn.x+qn.y<=1}static getInterpolation(t,e,n,s,r,a,o,l){return this.getBarycoord(t,e,n,s,qn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,qn.x),l.addScaledVector(a,qn.y),l.addScaledVector(o,qn.z),l)}static getInterpolatedAttribute(t,e,n,s,r,a){return dl.setScalar(0),pl.setScalar(0),ml.setScalar(0),dl.fromBufferAttribute(t,e),pl.fromBufferAttribute(t,n),ml.fromBufferAttribute(t,s),a.setScalar(0),a.addScaledVector(dl,r.x),a.addScaledVector(pl,r.y),a.addScaledVector(ml,r.z),a}static isFrontFacing(t,e,n,s){return yn.subVectors(n,e),Xn.subVectors(t,e),yn.cross(Xn).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return yn.subVectors(this.c,this.b),Xn.subVectors(this.a,this.b),yn.cross(Xn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return i.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return i.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return i.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return i.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return i.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let n=this.a,s=this.b,r=this.c,a,o;Zi.subVectors(s,n),Ji.subVectors(r,n),hl.subVectors(t,n);let l=Zi.dot(hl),c=Ji.dot(hl);if(l<=0&&c<=0)return e.copy(n);ul.subVectors(t,s);let h=Zi.dot(ul),f=Ji.dot(ul);if(h>=0&&f<=h)return e.copy(s);let u=l*f-h*c;if(u<=0&&l>=0&&h<=0)return a=l/(l-h),e.copy(n).addScaledVector(Zi,a);fl.subVectors(t,r);let d=Zi.dot(fl),g=Ji.dot(fl);if(g>=0&&d<=g)return e.copy(r);let w=d*c-l*g;if(w<=0&&c>=0&&g<=0)return o=c/(c-g),e.copy(n).addScaledVector(Ji,o);let m=h*g-d*f;if(m<=0&&f-h>=0&&d-g>=0)return lh.subVectors(r,s),o=(f-h)/(f-h+(d-g)),e.copy(s).addScaledVector(lh,o);let p=1/(m+w+u);return a=w*p,o=u*p,e.copy(n).addScaledVector(Zi,a).addScaledVector(Ji,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},pi=class{constructor(t=new V(1/0,1/0,1/0),e=new V(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(Mn.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(Mn.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let n=Mn.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let n=t.geometry;if(n!==void 0){let r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)t.isMesh===!0?t.getVertexPosition(a,Mn):Mn.fromBufferAttribute(r,a),Mn.applyMatrix4(t.matrixWorld),this.expandByPoint(Mn);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Gr.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Gr.copy(n.boundingBox)),Gr.applyMatrix4(t.matrixWorld),this.union(Gr)}let s=t.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Mn),Mn.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Ls),Hr.subVectors(this.max,Ls),$i.subVectors(t.a,Ls),Ki.subVectors(t.b,Ls),Qi.subVectors(t.c,Ls),ci.subVectors(Ki,$i),hi.subVectors(Qi,Ki),Ei.subVectors($i,Qi);let e=[0,-ci.z,ci.y,0,-hi.z,hi.y,0,-Ei.z,Ei.y,ci.z,0,-ci.x,hi.z,0,-hi.x,Ei.z,0,-Ei.x,-ci.y,ci.x,0,-hi.y,hi.x,0,-Ei.y,Ei.x,0];return!gl(e,$i,Ki,Qi,Hr)||(e=[1,0,0,0,1,0,0,0,1],!gl(e,$i,Ki,Qi,Hr))?!1:(Wr.crossVectors(ci,hi),e=[Wr.x,Wr.y,Wr.z],gl(e,$i,Ki,Qi,Hr))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Mn).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Mn).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Yn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Yn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Yn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Yn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Yn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Yn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Yn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Yn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Yn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}},Yn=[new V,new V,new V,new V,new V,new V,new V,new V],Mn=new V,Gr=new pi,$i=new V,Ki=new V,Qi=new V,ci=new V,hi=new V,Ei=new V,Ls=new V,Hr=new V,Wr=new V,Ci=new V;function gl(i,t,e,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){Ci.fromArray(i,r);let o=s.x*Math.abs(Ci.x)+s.y*Math.abs(Ci.y)+s.z*Math.abs(Ci.z),l=t.dot(Ci),c=e.dot(Ci),h=n.dot(Ci);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}var Ee=new V,Xr=new Xt,Kf=0,ke=class extends Un{constructor(t,e,n=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Kf++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Kh,this.updateRanges=[],this.gpuType=un,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)Xr.fromBufferAttribute(this,e),Xr.applyMatrix3(t),this.setXY(e,Xr.x,Xr.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)Ee.fromBufferAttribute(this,e),Ee.applyMatrix3(t),this.setXYZ(e,Ee.x,Ee.y,Ee.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)Ee.fromBufferAttribute(this,e),Ee.applyMatrix4(t),this.setXYZ(e,Ee.x,Ee.y,Ee.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)Ee.fromBufferAttribute(this,e),Ee.applyNormalMatrix(t),this.setXYZ(e,Ee.x,Ee.y,Ee.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)Ee.fromBufferAttribute(this,e),Ee.transformDirection(t),this.setXYZ(e,Ee.x,Ee.y,Ee.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=is(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=He(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=is(e,this.array)),e}setX(t,e){return this.normalized&&(e=He(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=is(e,this.array)),e}setY(t,e){return this.normalized&&(e=He(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=is(e,this.array)),e}setZ(t,e){return this.normalized&&(e=He(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=is(e,this.array)),e}setW(t,e){return this.normalized&&(e=He(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=He(e,this.array),n=He(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=He(e,this.array),n=He(n,this.array),s=He(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=He(e,this.array),n=He(n,this.array),s=He(s,this.array),r=He(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return t.name=this.name,t.usage=this.usage,t.gpuType=this.gpuType,t}dispose(){this.dispatchEvent({type:"dispose"})}};var Xs=class extends ke{constructor(t,e,n){super(new Uint16Array(t),e,n)}};var qs=class extends ke{constructor(t,e,n){super(new Uint32Array(t),e,n)}};var We=class extends ke{constructor(t,e,n){super(new Float32Array(t),e,n)}},Qf=new pi,Ds=new V,_l=new V,Li=class{constructor(t=new V,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let n=this.center;e!==void 0?n.copy(e):Qf.setFromPoints(t).getCenter(n);let s=0;for(let r=0,a=t.length;r<a;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Ds.subVectors(t,this.center);let e=Ds.lengthSq();if(e>this.radius*this.radius){let n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(Ds,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(_l.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Ds.copy(t.center).add(_l)),this.expandByPoint(Ds.copy(t.center).sub(_l))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}},jf=0,pn=new ve,xl=new on,ji=new V,rn=new pi,Ns=new pi,Le=new V,Xe=class i extends Un{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:jf++}),this.uuid=_s(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(bf(t)?qs:Xs)(t,1):this.index=t,this}setIndirect(t,e=0){return this.indirect=t,this.indirectOffset=e,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new Yt().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return pn.makeRotationFromQuaternion(t),this.applyMatrix4(pn),this}rotateX(t){return pn.makeRotationX(t),this.applyMatrix4(pn),this}rotateY(t){return pn.makeRotationY(t),this.applyMatrix4(pn),this}rotateZ(t){return pn.makeRotationZ(t),this.applyMatrix4(pn),this}translate(t,e,n){return pn.makeTranslation(t,e,n),this.applyMatrix4(pn),this}scale(t,e,n){return pn.makeScale(t,e,n),this.applyMatrix4(pn),this}lookAt(t){return xl.lookAt(t),xl.updateMatrix(),this.applyMatrix4(xl.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ji).negate(),this.translate(ji.x,ji.y,ji.z),this}setFromPoints(t){let e=this.getAttribute("position");if(e===void 0){let n=[];for(let s=0,r=t.length;s<r;s++){let a=t[s];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new We(n,3))}else{let n=Math.min(t.length,e.count);for(let s=0;s<n;s++){let r=t[s];e.setXYZ(s,r.x,r.y,r.z||0)}t.length>e.count&&Ht("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new pi);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Wt("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new V(-1/0,-1/0,-1/0),new V(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){let r=e[n];rn.setFromBufferAttribute(r),this.morphTargetsRelative?(Le.addVectors(this.boundingBox.min,rn.min),this.boundingBox.expandByPoint(Le),Le.addVectors(this.boundingBox.max,rn.max),this.boundingBox.expandByPoint(Le)):(this.boundingBox.expandByPoint(rn.min),this.boundingBox.expandByPoint(rn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Wt('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Li);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Wt("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new V,1/0);return}if(t){let n=this.boundingSphere.center;if(rn.setFromBufferAttribute(t),e)for(let r=0,a=e.length;r<a;r++){let o=e[r];Ns.setFromBufferAttribute(o),this.morphTargetsRelative?(Le.addVectors(rn.min,Ns.min),rn.expandByPoint(Le),Le.addVectors(rn.max,Ns.max),rn.expandByPoint(Le)):(rn.expandByPoint(Ns.min),rn.expandByPoint(Ns.max))}rn.getCenter(n);let s=0;for(let r=0,a=t.count;r<a;r++)Le.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(Le));if(e)for(let r=0,a=e.length;r<a;r++){let o=e[r],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)Le.fromBufferAttribute(o,c),l&&(ji.fromBufferAttribute(t,c),Le.add(ji)),s=Math.max(s,n.distanceToSquared(Le))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&Wt('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){Wt("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=e.position,s=e.normal,r=e.uv,a=this.getAttribute("tangent");(a===void 0||a.count!==n.count)&&(a=new ke(new Float32Array(4*n.count),4),this.setAttribute("tangent",a));let o=[],l=[];for(let x=0;x<n.count;x++)o[x]=new V,l[x]=new V;let c=new V,h=new V,f=new V,u=new Xt,d=new Xt,g=new Xt,w=new V,m=new V;function p(x,b,M){c.fromBufferAttribute(n,x),h.fromBufferAttribute(n,b),f.fromBufferAttribute(n,M),u.fromBufferAttribute(r,x),d.fromBufferAttribute(r,b),g.fromBufferAttribute(r,M),h.sub(c),f.sub(c),d.sub(u),g.sub(u);let E=1/(d.x*g.y-g.x*d.y);isFinite(E)&&(w.copy(h).multiplyScalar(g.y).addScaledVector(f,-d.y).multiplyScalar(E),m.copy(f).multiplyScalar(d.x).addScaledVector(h,-g.x).multiplyScalar(E),o[x].add(w),o[b].add(w),o[M].add(w),l[x].add(m),l[b].add(m),l[M].add(m))}let S=this.groups;S.length===0&&(S=[{start:0,count:t.count}]);for(let x=0,b=S.length;x<b;++x){let M=S[x],E=M.start,L=M.count;for(let N=E,I=E+L;N<I;N+=3)p(t.getX(N+0),t.getX(N+1),t.getX(N+2))}let C=new V,v=new V,T=new V,A=new V;function P(x){T.fromBufferAttribute(s,x),A.copy(T);let b=o[x];C.copy(b),C.sub(T.multiplyScalar(T.dot(b))).normalize(),v.crossVectors(A,b);let E=v.dot(l[x])<0?-1:1;a.setXYZW(x,C.x,C.y,C.z,E)}for(let x=0,b=S.length;x<b;++x){let M=S[x],E=M.start,L=M.count;for(let N=E,I=E+L;N<I;N+=3)P(t.getX(N+0)),P(t.getX(N+1)),P(t.getX(N+2))}this._transformed=!0}computeVertexNormals(){let t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==e.count)n=new ke(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let u=0,d=n.count;u<d;u++)n.setXYZ(u,0,0,0);let s=new V,r=new V,a=new V,o=new V,l=new V,c=new V,h=new V,f=new V;if(t)for(let u=0,d=t.count;u<d;u+=3){let g=t.getX(u+0),w=t.getX(u+1),m=t.getX(u+2);s.fromBufferAttribute(e,g),r.fromBufferAttribute(e,w),a.fromBufferAttribute(e,m),h.subVectors(a,r),f.subVectors(s,r),h.cross(f),o.fromBufferAttribute(n,g),l.fromBufferAttribute(n,w),c.fromBufferAttribute(n,m),o.add(h),l.add(h),c.add(h),n.setXYZ(g,o.x,o.y,o.z),n.setXYZ(w,l.x,l.y,l.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let u=0,d=e.count;u<d;u+=3)s.fromBufferAttribute(e,u+0),r.fromBufferAttribute(e,u+1),a.fromBufferAttribute(e,u+2),h.subVectors(a,r),f.subVectors(s,r),h.cross(f),n.setXYZ(u+0,h.x,h.y,h.z),n.setXYZ(u+1,h.x,h.y,h.z),n.setXYZ(u+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Le.fromBufferAttribute(t,e),Le.normalize(),t.setXYZ(e,Le.x,Le.y,Le.z)}toNonIndexed(){function t(o,l){let c=o.array,h=o.itemSize,f=o.normalized,u=new c.constructor(l.length*h),d=0,g=0;for(let w=0,m=l.length;w<m;w++){o.isInterleavedBufferAttribute?d=l[w]*o.data.stride+o.offset:d=l[w]*h;for(let p=0;p<h;p++)u[g++]=c[d++]}return new ke(u,h,f)}if(this.index===null)return Ht("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let e=new i,n=this.index.array,s=this.attributes;for(let o in s){let l=s[o],c=t(l,n);e.setAttribute(o,c)}let r=this.morphAttributes;for(let o in r){let l=[],c=r[o];for(let h=0,f=c.length;h<f;h++){let u=c[h],d=t(u,n);l.push(d)}e.morphAttributes[o]=l}e.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let c=a[o];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){let t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,t.name=this.name,Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let n=this.attributes;for(let l in n){let c=n[l];t.data.attributes[l]=c.toJSON(t.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let f=0,u=c.length;f<u;f++){let d=c[f];h.push(d.toJSON(t.data))}h.length>0&&(s[l]=h,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(t.data.boundingSphere=o.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let n=t.index;n!==null&&this.setIndex(n.clone());let s=t.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(e))}let r=t.morphAttributes;for(let c in r){let h=[],f=r[c];for(let u=0,d=f.length;u<d;u++)h.push(f[u].clone(e));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;let a=t.groups;for(let c=0,h=a.length;c<h;c++){let f=a[c];this.addGroup(f.start,f.count,f.materialIndex)}let o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var vl=new V,td=new V,ed=new Yt,Sn=class{constructor(t=new V(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){let s=vl.subVectors(n,e).cross(td.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e,n=!0){let s=t.delta(vl),r=this.normal.dot(s);if(r===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let a=-(t.start.dot(this.normal)+this.constant)/r;return n===!0&&(a<0||a>1)?null:e.copy(t.start).addScaledVector(s,a)}intersectsLine(t){let e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let n=e||ed.getNormalMatrix(t),s=this.coplanarPoint(vl).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(t){return this.normal.fromArray(t.normal),this.constant=t.constant,this}},nd=0,mi=class extends Un{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:nd++}),this.uuid=_s(),this.name="",this.type="Material",this.blending=ps,this.side=yi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Dl,this.blendDst=Nl,this.blendEquation=Fi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new qt(0,0,0),this.blendAlpha=0,this.depthFunc=rs,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Wh,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=oa,this.stencilZFail=oa,this.stencilZPass=oa,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let n=t[e];if(n===void 0){Ht(`Material: parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){Ht(`Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector2&&n&&n.isVector2||s&&s.isEuler&&n&&n.isEuler||s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(r=>r.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let a=[];for(let o in r){let l=r[o];delete l.metadata,a.push(l)}return a}if(e){let r=s(t.textures),a=s(t.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}fromJSON(t,e){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new qt().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.retroreflectivity!==void 0&&(this.retroreflectivity=t.retroreflectivity),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=t.iridescenceThicknessRange),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.clippingPlanes!==void 0&&(this.clippingPlanes=t.clippingPlanes.map(n=>new Sn().fromJSON(n))),t.clipIntersection!==void 0&&(this.clipIntersection=t.clipIntersection),t.clipShadows!==void 0&&(this.clipShadows=t.clipShadows),t.depthPacking!==void 0&&(this.depthPacking=t.depthPacking),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.linecap!==void 0&&(this.linecap=t.linecap),t.linejoin!==void 0&&(this.linejoin=t.linejoin),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=e[t.map]||null),t.matcap!==void 0&&(this.matcap=e[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=e[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=e[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=e[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let n=t.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new Xt().fromArray(n)}return t.displacementMap!==void 0&&(this.displacementMap=e[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=e[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=e[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=e[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=e[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=e[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=e[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=e[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=e[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=e[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=e[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=e[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=e[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=e[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new Xt().fromArray(t.clearcoatNormalScale)),t.iridescenceMap!==void 0&&(this.iridescenceMap=e[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=e[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=e[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=e[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=e[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=e[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=e[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,n=null;if(e!==null){let s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}};var Zn=new V,yl=new V,qr=new V,Yr=new V,Ys=class{constructor(t=new V,e=new V(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Zn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=Zn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(Zn.copy(this.origin).addScaledVector(this.direction,e),Zn.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){yl.copy(t).add(e).multiplyScalar(.5),qr.copy(e).sub(t).normalize(),Yr.copy(this.origin).sub(yl);let r=t.distanceTo(e)*.5,a=-this.direction.dot(qr),o=Yr.dot(this.direction),l=-Yr.dot(qr),c=Yr.lengthSq(),h=Math.abs(1-a*a),f,u,d,g;if(h>0)if(f=a*l-o,u=a*o-l,g=r*h,f>=0)if(u>=-g)if(u<=g){let w=1/h;f*=w,u*=w,d=f*(f+a*u+2*o)+u*(a*f+u+2*l)+c}else u=r,f=Math.max(0,-(a*u+o)),d=-f*f+u*(u+2*l)+c;else u=-r,f=Math.max(0,-(a*u+o)),d=-f*f+u*(u+2*l)+c;else u<=-g?(f=Math.max(0,-(-a*r+o)),u=f>0?-r:Math.min(Math.max(-r,-l),r),d=-f*f+u*(u+2*l)+c):u<=g?(f=0,u=Math.min(Math.max(-r,-l),r),d=u*(u+2*l)+c):(f=Math.max(0,-(a*r+o)),u=f>0?r:Math.min(Math.max(-r,-l),r),d=-f*f+u*(u+2*l)+c);else u=a>0?-r:r,f=Math.max(0,-(a*u+o)),d=-f*f+u*(u+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,f),s&&s.copy(yl).addScaledVector(qr,u),d}intersectSphere(t,e){if(t.radius<0)return null;Zn.subVectors(t.center,this.origin);let n=Zn.dot(this.direction),s=Zn.dot(Zn)-n*n,r=t.radius*t.radius;if(s>r)return null;let a=Math.sqrt(r-s),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,e):this.at(o,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){let n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,a,o,l,c=1/this.direction.x,h=1/this.direction.y,f=1/this.direction.z,u=this.origin;return c>=0?(n=(t.min.x-u.x)*c,s=(t.max.x-u.x)*c):(n=(t.max.x-u.x)*c,s=(t.min.x-u.x)*c),h>=0?(r=(t.min.y-u.y)*h,a=(t.max.y-u.y)*h):(r=(t.max.y-u.y)*h,a=(t.min.y-u.y)*h),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),f>=0?(o=(t.min.z-u.z)*f,l=(t.max.z-u.z)*f):(o=(t.max.z-u.z)*f,l=(t.min.z-u.z)*f),n>l||o>s)||((o>n||n!==n)&&(n=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,Zn)!==null}intersectTriangle(t,e,n,s,r){let a=this.origin,o=this.direction,l=o.x,c=o.y,h=o.z,f=t.x-a.x,u=t.y-a.y,d=t.z-a.z,g=e.x-a.x,w=e.y-a.y,m=e.z-a.z,p=n.x-a.x,S=n.y-a.y,C=n.z-a.z,v=Math.abs(l),T=Math.abs(c),A=Math.abs(h),P,x,b,M,E,L,N,I,F,q,W,st;if(v>=T&&v>=A?(b=l,L=f,F=g,st=p,l>=0?(P=c,x=h,M=u,E=d,N=w,I=m,q=S,W=C):(P=h,x=c,M=d,E=u,N=m,I=w,q=C,W=S)):T>=A?(b=c,L=u,F=w,st=S,c>=0?(P=h,x=l,M=d,E=f,N=m,I=g,q=C,W=p):(P=l,x=h,M=f,E=d,N=g,I=m,q=p,W=C)):(b=h,L=d,F=m,st=C,h>=0?(P=l,x=c,M=f,E=u,N=g,I=w,q=p,W=S):(P=c,x=l,M=u,E=f,N=w,I=g,q=S,W=p)),b===0)return null;let Y=P/b,Q=x/b,tt=1/b,J=M-Y*L,U=E-Q*L,K=N-Y*F,at=I-Q*F,Tt=q-Y*st,X=W-Q*st,j=Tt*at-X*K,ht=J*X-U*Tt,Vt=K*U-at*J;if(s){if(j<0||ht<0||Vt<0)return null}else if((j<0||ht<0||Vt<0)&&(j>0||ht>0||Vt>0))return null;let ut=j+ht+Vt;if(ut===0)return null;let Ft=tt*(j*L+ht*F+Vt*st);return(ut>0?Ft<0:Ft>0)?null:this.at(Ft/ut,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Di=class extends mi{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new qt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new di,this.combine=Ul,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}},ch=new ve,Ri=new Ys,Zr=new Li,hh=new V,Jr=new V,$r=new V,Kr=new V,Ml=new V,Qr=new V,uh=new V,jr=new V,Ke=class extends on{constructor(t=new Xe,e=new Di){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(t,e){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;e.fromBufferAttribute(s,t);let o=this.morphTargetInfluences;if(r&&o){Qr.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=o[l],f=r[l];h!==0&&(Ml.fromBufferAttribute(f,t),a?Qr.addScaledVector(Ml,h):Qr.addScaledVector(Ml.sub(e),h))}e.add(Qr)}return e}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Zr.copy(n.boundingSphere),Zr.applyMatrix4(r),Ri.copy(t.ray).recast(t.near),!(Zr.containsPoint(Ri.origin)===!1&&(Ri.intersectSphere(Zr,hh)===null||Ri.origin.distanceToSquared(hh)>(t.far-t.near)**2))&&(ch.copy(r).invert(),Ri.copy(t.ray).applyMatrix4(ch),!(n.boundingBox!==null&&Ri.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,Ri)))}_computeIntersections(t,e,n){let s,r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,f=r.attributes.normal,u=r.groups,d=r.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,w=u.length;g<w;g++){let m=u[g],p=a[m.materialIndex],S=Math.max(m.start,d.start),C=Math.min(o.count,Math.min(m.start+m.count,d.start+d.count));for(let v=S,T=C;v<T;v+=3){let A=o.getX(v),P=o.getX(v+1),x=o.getX(v+2);s=ta(this,p,t,n,c,h,f,A,P,x),s&&(s.faceIndex=Math.floor(v/3),s.face.materialIndex=m.materialIndex,e.push(s))}}else{let g=Math.max(0,d.start),w=Math.min(o.count,d.start+d.count);for(let m=g,p=w;m<p;m+=3){let S=o.getX(m),C=o.getX(m+1),v=o.getX(m+2);s=ta(this,a,t,n,c,h,f,S,C,v),s&&(s.faceIndex=Math.floor(m/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(a))for(let g=0,w=u.length;g<w;g++){let m=u[g],p=a[m.materialIndex],S=Math.max(m.start,d.start),C=Math.min(l.count,Math.min(m.start+m.count,d.start+d.count));for(let v=S,T=C;v<T;v+=3){let A=v,P=v+1,x=v+2;s=ta(this,p,t,n,c,h,f,A,P,x),s&&(s.faceIndex=Math.floor(v/3),s.face.materialIndex=m.materialIndex,e.push(s))}}else{let g=Math.max(0,d.start),w=Math.min(l.count,d.start+d.count);for(let m=g,p=w;m<p;m+=3){let S=m,C=m+1,v=m+2;s=ta(this,a,t,n,c,h,f,S,C,v),s&&(s.faceIndex=Math.floor(m/3),e.push(s))}}}};function id(i,t,e,n,s,r,a,o){let l;if(t.side===qe?l=n.intersectTriangle(a,r,s,!0,o):l=n.intersectTriangle(s,r,a,t.side===yi,o),l===null)return null;jr.copy(o),jr.applyMatrix4(i.matrixWorld);let c=e.ray.origin.distanceTo(jr);return c<e.near||c>e.far?null:{distance:c,point:jr.clone(),object:i}}function ta(i,t,e,n,s,r,a,o,l,c){i.getVertexPosition(o,Jr),i.getVertexPosition(l,$r),i.getVertexPosition(c,Kr);let h=id(i,t,e,n,Jr,$r,Kr,uh);if(h){let f=new V;fi.getBarycoord(uh,Jr,$r,Kr,f),s&&(h.uv=fi.getInterpolatedAttribute(s,o,l,c,f,new Xt)),r&&(h.uv1=fi.getInterpolatedAttribute(r,o,l,c,f,new Xt)),a&&(h.normal=fi.getInterpolatedAttribute(a,o,l,c,f,new V),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let u={a:o,b:l,c,normal:new V,materialIndex:0};fi.getNormal(Jr,$r,Kr,u.normal),h.face=u,h.barycoord=f}return h}var hs=class extends $e{constructor(t=null,e=1,n=1,s,r,a,o,l,c=Me,h=Me,f,u){super(null,a,o,l,c,h,s,r,f,u),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Pi=new Li,sd=new Xt(.5,.5),ea=new V,Zs=class{constructor(t=new Sn,e=new Sn,n=new Sn,s=new Sn,r=new Sn,a=new Sn){this.planes=[t,e,n,s,r,a]}set(t,e,n,s,r,a){let o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(t){let e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=bn,n=!1){let s=this.planes,r=t.elements,a=r[0],o=r[1],l=r[2],c=r[3],h=r[4],f=r[5],u=r[6],d=r[7],g=r[8],w=r[9],m=r[10],p=r[11],S=r[12],C=r[13],v=r[14],T=r[15];if(s[0].setComponents(c-a,d-h,p-g,T-S).normalize(),s[1].setComponents(c+a,d+h,p+g,T+S).normalize(),s[2].setComponents(c+o,d+f,p+w,T+C).normalize(),s[3].setComponents(c-o,d-f,p-w,T-C).normalize(),n)s[4].setComponents(l,u,m,v).normalize(),s[5].setComponents(c-l,d-u,p-m,T-v).normalize();else if(s[4].setComponents(c-l,d-u,p-m,T-v).normalize(),e===bn)s[5].setComponents(c+l,d+u,p+m,T+v).normalize();else if(e===zs)s[5].setComponents(l,u,m,v).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Pi.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Pi.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Pi)}intersectsSprite(t){Pi.center.set(0,0,0);let e=sd.distanceTo(t.center);return Pi.radius=.7071067811865476+e,Pi.applyMatrix4(t.matrixWorld),this.intersectsSphere(Pi)}intersectsSphere(t){let e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){let e=this.planes;for(let n=0;n<6;n++){let s=e[n];if(ea.x=s.normal.x>0?t.max.x:t.min.x,ea.y=s.normal.y>0?t.max.y:t.min.y,ea.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(ea)<0)return!1}return!0}containsPoint(t){let e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var Ma=class extends mi{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new qt(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}},fh=new ve,El=new Ys,na=new Li,ia=new V,Js=class extends on{constructor(t=new Xe,e=new Ma){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){let n=this.geometry,s=this.matrixWorld,r=t.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),na.copy(n.boundingSphere),na.applyMatrix4(s),na.radius+=r,t.ray.intersectsSphere(na)===!1)return;fh.copy(s).invert(),El.copy(t.ray).applyMatrix4(fh);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=n.index,f=n.attributes.position;if(c!==null){let u=Math.max(0,a.start),d=Math.min(c.count,a.start+a.count);for(let g=u,w=d;g<w;g++){let m=c.getX(g);ia.fromBufferAttribute(f,m),dh(ia,m,l,s,t,e,this)}}else{let u=Math.max(0,a.start),d=Math.min(f.count,a.start+a.count);for(let g=u,w=d;g<w;g++)ia.fromBufferAttribute(f,g),dh(ia,g,l,s,t,e,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}};function dh(i,t,e,n,s,r,a){let o=El.distanceSqToPoint(i);if(o<e){let l=new V;El.closestPointToPoint(i,l),l.applyMatrix4(n);let c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:a})}}var $s=class extends $e{constructor(t=[],e=Mi,n,s,r,a,o,l,c,h){super(t,e,n,s,r,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}};var gi=class extends $e{constructor(t,e,n=Tn,s,r,a,o=Me,l=Me,c,h=Nn,f=1){if(h!==Nn&&h!==bi)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let u={width:t,height:e,depth:f};super(u,s,r,a,o,l,h,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new ls(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){let e=super.toJSON(t);return e.compareFunction=this.compareFunction,e}},Sa=class extends gi{constructor(t,e=Tn,n=Mi,s,r,a=Me,o=Me,l,c=Nn){let h={width:t,height:t,depth:1},f=[h,h,h,h,h,h];super(t,t,e,n,s,r,a,o,l,c),this.image=f,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}},Ks=class extends $e{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}},us=class i extends Xe{constructor(t=1,e=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};let o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);let l=[],c=[],h=[],f=[],u=0,d=0;g("z","y","x",-1,-1,n,e,t,a,r,0),g("z","y","x",1,-1,n,e,-t,a,r,1),g("x","z","y",1,1,t,n,e,s,a,2),g("x","z","y",1,-1,t,n,-e,s,a,3),g("x","y","z",1,-1,t,e,n,s,r,4),g("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new We(c,3)),this.setAttribute("normal",new We(h,3)),this.setAttribute("uv",new We(f,2));function g(w,m,p,S,C,v,T,A,P,x,b){let M=v/P,E=T/x,L=v/2,N=T/2,I=A/2,F=P+1,q=x+1,W=0,st=0,Y=new V;for(let Q=0;Q<q;Q++){let tt=Q*E-N;for(let J=0;J<F;J++){let U=J*M-L;Y[w]=U*S,Y[m]=tt*C,Y[p]=I,c.push(Y.x,Y.y,Y.z),Y[w]=0,Y[m]=0,Y[p]=A>0?1:-1,h.push(Y.x,Y.y,Y.z),f.push(J/P),f.push(1-Q/x),W+=1}}for(let Q=0;Q<x;Q++)for(let tt=0;tt<P;tt++){let J=u+tt+F*Q,U=u+tt+F*(Q+1),K=u+(tt+1)+F*(Q+1),at=u+(tt+1)+F*Q;l.push(J,U,at),l.push(U,K,at),st+=6}o.addGroup(d,st,b),d+=st,u+=W}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};var Qs=class i extends Xe{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};let r=t/2,a=e/2,o=Math.floor(n),l=Math.floor(s),c=o+1,h=l+1,f=t/o,u=e/l,d=[],g=[],w=[],m=[];for(let p=0;p<h;p++){let S=p*u-a;for(let C=0;C<c;C++){let v=C*f-r;g.push(v,-S,0),w.push(0,0,1),m.push(C/o),m.push(1-p/l)}}for(let p=0;p<l;p++)for(let S=0;S<o;S++){let C=S+c*p,v=S+c*(p+1),T=S+1+c*(p+1),A=S+1+c*p;d.push(C,v,A),d.push(v,T,A)}this.setIndex(d),this.setAttribute("position",new We(g,3)),this.setAttribute("normal",new We(w,3)),this.setAttribute("uv",new We(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.widthSegments,t.heightSegments)}};function Bi(i){let t={};for(let e in i){t[e]={};for(let n in i[e]){let s=i[e][n];if(ph(s))s.isRenderTargetTexture?(Ht("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone();else if(Array.isArray(s))if(ph(s[0])){let r=[];for(let a=0,o=s.length;a<o;a++)r[a]=s[a].clone();t[e][n]=r}else t[e][n]=s.slice();else t[e][n]=s}}return t}function ze(i){let t={};for(let e=0;e<i.length;e++){let n=Bi(i[e]);for(let s in n)t[s]=n[s]}return t}function ph(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function rd(i){let t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function Jl(i){let t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:jt.workingColorSpace}var mn={clone:Bi,merge:ze},ad=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,od=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,ge=class extends mi{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=ad,this.fragmentShader=od,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Bi(t.uniforms),this.uniformsGroups=rd(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){let e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(let s in this.uniforms){let a=this.uniforms[s].value;a&&a.isTexture?e.uniforms[s]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[s]={type:"m4",value:a.toArray()}:e.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}fromJSON(t,e){if(super.fromJSON(t,e),t.uniforms!==void 0)for(let n in t.uniforms){let s=t.uniforms[n];switch(this.uniforms[n]={},s.type){case"t":this.uniforms[n].value=e[s.value]||null;break;case"c":this.uniforms[n].value=new qt().setHex(s.value);break;case"v2":this.uniforms[n].value=new Xt().fromArray(s.value);break;case"v3":this.uniforms[n].value=new V().fromArray(s.value);break;case"v4":this.uniforms[n].value=new he().fromArray(s.value);break;case"m3":this.uniforms[n].value=new Yt().fromArray(s.value);break;case"m4":this.uniforms[n].value=new ve().fromArray(s.value);break;default:this.uniforms[n].value=s.value}}if(t.defines!==void 0&&(this.defines=t.defines),t.vertexShader!==void 0&&(this.vertexShader=t.vertexShader),t.fragmentShader!==void 0&&(this.fragmentShader=t.fragmentShader),t.glslVersion!==void 0&&(this.glslVersion=t.glslVersion),t.extensions!==void 0)for(let n in t.extensions)this.extensions[n]=t.extensions[n];return t.lights!==void 0&&(this.lights=t.lights),t.clipping!==void 0&&(this.clipping=t.clipping),this}},fs=class extends ge{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var ba=class extends mi{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Gh,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},Ta=class extends mi{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}};function ts(i,t){return!i||i.constructor===t?i:typeof t.BYTES_PER_ELEMENT=="number"?new t(i):Array.prototype.slice.call(i)}function Sl(i){return i!==void 0&&i.inTangents!==void 0&&i.outTangents!==void 0}var _i=class{constructor(t,e,n,s){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new e.constructor(n),this.sampleValues=e,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,n=this._cachedIndex,s=e[n],r=e[n-1];n:{t:{let a;e:{i:if(!(t<s)){for(let o=n+2;;){if(s===void 0){if(t<r)break i;return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=s,s=e[++n],t<s)break t}a=e.length;break e}if(!(t>=r)){let o=e[1];t<o&&(n=2,r=o);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=r,r=e[--n-1],t>=r)break t}a=n,n=0;break e}break n}for(;n<a;){let o=n+a>>>1;t<e[o]?a=o:n=o+1}if(s=e[n],r=e[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,t,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=t*s;for(let a=0;a!==s;++a)e[a]=n[r+a];return e}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},wa=class extends _i{constructor(t,e,n,s){super(t,e,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Tl,endingEnd:Tl}}intervalChanged_(t,e,n){let s=this.parameterPositions,r=t-2,a=t+1,o=s[r],l=s[a];if(o===void 0)switch(this.getSettings_().endingStart){case wl:r=t,o=2*e-n;break;case Al:r=s.length-2,o=e+s[r]-s[r+1];break;default:r=t,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case wl:a=t,l=2*n-e;break;case Al:a=1,l=n+s[1]-s[0];break;default:a=t-1,l=e}let c=(n-e)*.5,h=this.valueSize;this._weightPrev=c/(e-o),this._weightNext=c/(l-n),this._offsetPrev=r*h,this._offsetNext=a*h}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,h=this._offsetPrev,f=this._offsetNext,u=this._weightPrev,d=this._weightNext,g=(n-e)/(s-e),w=g*g,m=w*g,p=-u*m+2*u*w-u*g,S=(1+u)*m+(-1.5-2*u)*w+(-.5+u)*g+1,C=(-1-d)*m+(1.5+d)*w+.5*g,v=d*m-d*w;for(let T=0;T!==o;++T)r[T]=p*a[h+T]+S*a[c+T]+C*a[l+T]+v*a[f+T];return r}},Aa=class extends _i{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,h=(n-e)/(s-e),f=1-h;for(let u=0;u!==o;++u)r[u]=a[c+u]*f+a[l+u]*h;return r}},Ea=class extends _i{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t){return this.copySampleValue_(t-1)}},Ca=class extends _i{interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,h=this.inTangents,f=this.outTangents;if(!h||!f){let g=(n-e)/(s-e),w=1-g;for(let m=0;m!==o;++m)r[m]=a[c+m]*w+a[l+m]*g;return r}let u=o*2,d=t-1;for(let g=0;g!==o;++g){let w=a[c+g],m=a[l+g],p=d*u+g*2,S=f[p],C=f[p+1],v=t*u+g*2,T=h[v],A=h[v+1],P=cd(n,e,S,T,s);r[g]=iu(P,w,C,A,m)}return r}};function iu(i,t,e,n,s){let r=1-i;return r*r*r*t+3*r*r*i*e+3*r*i*i*n+i*i*i*s}function ld(i,t,e,n,s){let r=1-i;return 3*r*r*(e-t)+6*r*i*(n-e)+3*i*i*(s-n)}function cd(i,t,e,n,s){let r=(i-t)/(s-t);for(let a=0;a<8;a++){let o=iu(r,t,e,n,s)-i;if(Math.abs(o)<1e-10)break;let l=ld(r,t,e,n,s);if(Math.abs(l)<1e-10)break;r=Math.max(0,Math.min(1,r-o/l))}return r}var ln=class{constructor(t,e,n,s){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=ts(e,this.TimeBufferType),this.values=ts(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,n;if(e.toJSON!==this.toJSON)n=e.toJSON(t);else{n={name:t.name,times:ts(t.times,Array),values:ts(t.values,Array)};let s=t.getInterpolation();s!==t.DefaultInterpolation&&(n.interpolation=s),Sl(t.settings)&&(n.settings={inTangents:ts(t.settings.inTangents,Array),outTangents:ts(t.settings.outTangents,Array)})}return n.type=t.ValueTypeName,n}InterpolantFactoryMethodDiscrete(t){return new Ea(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new Aa(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new wa(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodBezier(t){let e=new Ca(this.times,this.values,this.getValueSize(),t);return this.settings&&(e.inTangents=this.settings.inTangents,e.outTangents=this.settings.outTangents),e}setInterpolation(t){let e;switch(t){case Os:e=this.InterpolantFactoryMethodDiscrete;break;case _a:e=this.InterpolantFactoryMethodLinear;break;case aa:e=this.InterpolantFactoryMethodSmooth;break;case bl:e=this.InterpolantFactoryMethodBezier;break}if(e===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return Ht("KeyframeTrack:",n),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Os;case this.InterpolantFactoryMethodLinear:return _a;case this.InterpolantFactoryMethodSmooth:return aa;case this.InterpolantFactoryMethodBezier:return bl}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]+=t}return this}scale(t){if(t!==1){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]*=t;Sl(this.settings)&&(mh(this.settings.inTangents,t),mh(this.settings.outTangents,t))}return this}trim(t,e){let n=this.times,s=n.length,r=0,a=s-1;for(;r!==s&&n[r]<t;)++r;for(;a!==-1&&n[a]>e;)--a;if(++a,r!==0||a!==s){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(Wt("KeyframeTrack: Invalid value size in track.",this),t=!1);let n=this.times,s=this.values,r=n.length;r===0&&(Wt("KeyframeTrack: Track is empty.",this),t=!1);let a=null;for(let o=0;o!==r;o++){let l=n[o];if(typeof l=="number"&&isNaN(l)){Wt("KeyframeTrack: Time is not a valid number.",this,o,l),t=!1;break}if(a!==null&&a>l){Wt("KeyframeTrack: Out of order keys.",this,o,l,a),t=!1;break}a=l}if(s!==void 0&&Tf(s))for(let o=0,l=s.length;o!==l;++o){let c=s[o];if(isNaN(c)){Wt("KeyframeTrack: Value is not a valid number.",this,o,c),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===aa,r=t.length-1,a=1;for(let o=1;o<r;++o){let l=!1,c=t[o],h=t[o+1];if(c!==h&&(o!==1||c!==t[0]))if(s)l=!0;else{let f=o*n,u=f-n,d=f+n;for(let g=0;g!==n;++g){let w=e[f+g];if(w!==e[u+g]||w!==e[d+g]){l=!0;break}}}if(l){if(o!==a){t[a]=t[o];let f=o*n,u=a*n;for(let d=0;d!==n;++d)e[u+d]=e[f+d]}++a}}if(r>0){t[a]=t[r];for(let o=r*n,l=a*n,c=0;c!==n;++c)e[l+c]=e[o+c];++a}return a!==t.length?(this.times=t.slice(0,a),this.values=e.slice(0,a*n)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),n=this.constructor,s=new n(this.name,t,e);return s.createInterpolant=this.createInterpolant,Sl(this.settings)&&(s.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),s}};function mh(i,t){for(let e=0,n=i.length;e!==n;e+=2)i[e]*=t}ln.prototype.ValueTypeName="";ln.prototype.TimeBufferType=Float32Array;ln.prototype.ValueBufferType=Float32Array;ln.prototype.DefaultInterpolation=_a;var xi=class extends ln{constructor(t,e,n){super(t,e,n)}};xi.prototype.ValueTypeName="bool";xi.prototype.ValueBufferType=Array;xi.prototype.DefaultInterpolation=Os;xi.prototype.InterpolantFactoryMethodLinear=void 0;xi.prototype.InterpolantFactoryMethodSmooth=void 0;var Ra=class extends ln{constructor(t,e,n,s){super(t,e,n,s)}};Ra.prototype.ValueTypeName="color";var Pa=class extends ln{constructor(t,e,n,s){super(t,e,n,s)}};Pa.prototype.ValueTypeName="number";var Ia=class extends _i{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-e)/(s-e),c=t*o;for(let h=c+o;c!==h;c+=4)Fn.slerpFlat(r,0,a,c-o,a,c,l);return r}},js=class extends ln{constructor(t,e,n,s){super(t,e,n,s)}InterpolantFactoryMethodLinear(t){return new Ia(this.times,this.values,this.getValueSize(),t)}};js.prototype.ValueTypeName="quaternion";js.prototype.InterpolantFactoryMethodSmooth=void 0;var vi=class extends ln{constructor(t,e,n){super(t,e,n)}};vi.prototype.ValueTypeName="string";vi.prototype.ValueBufferType=Array;vi.prototype.DefaultInterpolation=Os;vi.prototype.InterpolantFactoryMethodLinear=void 0;vi.prototype.InterpolantFactoryMethodSmooth=void 0;var La=class extends ln{constructor(t,e,n,s){super(t,e,n,s)}};La.prototype.ValueTypeName="vector";var Da=class{constructor(t,e,n){let s=this,r=!1,a=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this._abortController=null,this.itemStart=function(h){o++,r===!1&&s.onStart!==void 0&&s.onStart(h,a,o),r=!0},this.itemEnd=function(h){a++,s.onProgress!==void 0&&s.onProgress(h,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,f){return c.push(h,f),this},this.removeHandler=function(h){let f=c.indexOf(h);return f!==-1&&c.splice(f,2),this},this.getHandler=function(h){for(let f=0,u=c.length;f<u;f+=2){let d=c[f],g=c[f+1];if(d.global&&(d.lastIndex=0),d.test(h))return g}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},su=new Da,Na=class{constructor(t){this.manager=t!==void 0?t:su,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(t,e){let n=this;return new Promise(function(s,r){n.load(t,s,e,r)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}abort(){return this}};Na.DEFAULT_MATERIAL_NAME="__DEFAULT";var sa=new V,ra=new Fn,Ln=new V,tr=class extends on{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ve,this.projectionMatrix=new ve,this.projectionMatrixInverse=new ve,this.coordinateSystem=bn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(sa,ra,Ln),Ln.x===1&&Ln.y===1&&Ln.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(sa,ra,Ln.set(1,1,1)).invert()}updateWorldMatrix(t,e,n=!1){super.updateWorldMatrix(t,e,n),this.matrixWorld.decompose(sa,ra,Ln),Ln.x===1&&Ln.y===1&&Ln.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(sa,ra,Ln.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},ui=new V,gh=new Xt,_h=new Xt,Be=class extends tr{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let e=.5*this.getFilmHeight()/t;this.fov=os*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(Us*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return os*2*Math.atan(Math.tan(Us*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){ui.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(ui.x,ui.y).multiplyScalar(-t/ui.z),ui.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(ui.x,ui.y).multiplyScalar(-t/ui.z)}getViewSize(t,e){return this.getViewBounds(t,gh,_h),e.subVectors(_h,gh)}setViewOffset(t,e,n,s,r,a){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,e=t*Math.tan(Us*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*s/l,e-=a.offsetY*n/c,s*=a.width/l,n*=a.height/c}let o=this.filmOffset;o!==0&&(r+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}};var Ni=class extends tr{constructor(t=-1,e=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-t,a=n+t,o=s+e,l=s-e;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}};var es=-90,ns=1,Ua=class extends on{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Be(es,ns,t,e);s.layers=this.layers,this.add(s);let r=new Be(es,ns,t,e);r.layers=this.layers,this.add(r);let a=new Be(es,ns,t,e);a.layers=this.layers,this.add(a);let o=new Be(es,ns,t,e);o.layers=this.layers,this.add(o);let l=new Be(es,ns,t,e);l.layers=this.layers,this.add(l);let c=new Be(es,ns,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let t=this.coordinateSystem,e=this.children.concat(),[n,s,r,a,o,l]=e;for(let c of e)this.remove(c);if(t===bn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===zs)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,l,c,h]=this.children,f=t.getRenderTarget(),u=t.getActiveCubeFace(),d=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;let w=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let m=!1;t.isWebGLRenderer===!0?m=t.state.buffers.depth.getReversed():m=t.reversedDepthBuffer,t.setRenderTarget(n,0,s),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,r),t.setRenderTarget(n,1,s),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,a),t.setRenderTarget(n,2,s),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,o),t.setRenderTarget(n,3,s),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,l),t.setRenderTarget(n,4,s),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,c),n.texture.generateMipmaps=w,t.setRenderTarget(n,5,s),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,h),t.setRenderTarget(f,u,d),t.xr.enabled=g,n.texture.needsPMREMUpdate=!0}},Fa=class extends Be{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t}},er=class{constructor(){this._previousTime=0,this._currentTime=0,this._startTime=performance.now(),this._delta=0,this._elapsed=0,this._timescale=1,this._document=null,this._pageVisibilityHandler=null}connect(t){this._document=t,t.hidden!==void 0&&(this._pageVisibilityHandler=hd.bind(this),t.addEventListener("visibilitychange",this._pageVisibilityHandler,!1))}disconnect(){this._pageVisibilityHandler!==null&&(this._document.removeEventListener("visibilitychange",this._pageVisibilityHandler),this._pageVisibilityHandler=null),this._document=null}getDelta(){return this._delta/1e3}getElapsed(){return this._elapsed/1e3}getTimescale(){return this._timescale}setTimescale(t){return this._timescale=t,this}reset(){return this._currentTime=performance.now()-this._startTime,this}dispose(){this.disconnect()}update(t){return this._pageVisibilityHandler!==null&&this._document.hidden===!0?this._delta=0:(this._previousTime=this._currentTime,this._currentTime=(t!==void 0?t:performance.now())-this._startTime,this._delta=(this._currentTime-this._previousTime)*this._timescale,this._elapsed+=this._delta),this}};function hd(){this._document.hidden===!1&&this.reset()}var $l="\\[\\]\\.:\\/",ud=new RegExp("["+$l+"]","g"),Kl="[^"+$l+"]",fd="[^"+$l.replace("\\.","")+"]",dd=/((?:WC+[\/:])*)/.source.replace("WC",Kl),pd=/(WCOD+)?/.source.replace("WCOD",fd),md=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Kl),gd=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Kl),_d=new RegExp("^"+dd+pd+md+gd+"$"),xd=["material","materials","bones","map"],Cl=class{constructor(t,e,n){let s=n||xe.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,s)}getValue(t,e){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(t,e)}setValue(t,e){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].unbind()}},xe=class i{constructor(t,e,n){this.path=e,this.parsedPath=n||i.parseTrackName(e),this.node=i.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,n){return t&&t.isAnimationObjectGroup?new i.Composite(t,e,n):new i(t,e,n)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(ud,"")}static parseTrackName(t){let e=_d.exec(t);if(e===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+t);let n={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);xd.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+t);return n}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let n=t.skeleton.getBoneByName(e);if(n!==void 0)return n}if(t.children){let n=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===e||o.uuid===e)return o;let l=n(o.children);if(l)return l}return null},s=n(t.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)t[e++]=n[s]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,n=e.objectName,s=e.propertyName,r=e.propertyIndex;if(t||(t=i.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){Ht("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=e.objectIndex;switch(n){case"materials":if(!t.material){Wt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){Wt("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){Wt("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let h=0;h<t.length;h++)if(t[h].name===c){c=h;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){Wt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){Wt("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[n]===void 0){Wt("PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[n]}if(c!==void 0){if(t[c]===void 0){Wt("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[c]}}let a=t[s];if(a===void 0){let c=e.nodeName;Wt("PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",t);return}let o=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?o=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!t.geometry){Wt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){Wt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[r]!==void 0&&(r=t.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};xe.Composite=Cl;xe.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};xe.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};xe.prototype.GetterByBindingType=[xe.prototype._getValue_direct,xe.prototype._getValue_array,xe.prototype._getValue_arrayElement,xe.prototype._getValue_toArray];xe.prototype.SetterByBindingTypeAndVersioning=[[xe.prototype._setValue_direct,xe.prototype._setValue_direct_setNeedsUpdate,xe.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[xe.prototype._setValue_array,xe.prototype._setValue_array_setNeedsUpdate,xe.prototype._setValue_array_setMatrixWorldNeedsUpdate],[xe.prototype._setValue_arrayElement,xe.prototype._setValue_arrayElement_setNeedsUpdate,xe.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[xe.prototype._setValue_fromArray,xe.prototype._setValue_fromArray_setNeedsUpdate,xe.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var hx=new Float32Array(1);var ic=class ic{constructor(t,e,n,s){this.elements=[1,0,0,1],t!==void 0&&this.set(t,e,n,s)}identity(){return this.set(1,0,0,1),this}fromArray(t,e=0){for(let n=0;n<4;n++)this.elements[n]=t[n+e];return this}set(t,e,n,s){let r=this.elements;return r[0]=t,r[2]=e,r[1]=n,r[3]=s,this}};ic.prototype.isMatrix2=!0;var Rl=ic;function Ql(i,t,e,n){let s=vd(n);switch(e){case Vl:return i*t;case Hl:return i*t/s.components*s.byteLength;case Wa:return i*t/s.components*s.byteLength;case Ti:return i*t*2/s.components*s.byteLength;case Xa:return i*t*2/s.components*s.byteLength;case Gl:return i*t*3/s.components*s.byteLength;case je:return i*t*4/s.components*s.byteLength;case qa:return i*t*4/s.components*s.byteLength;case fr:case dr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case pr:case mr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Za:case $a:return Math.max(i,16)*Math.max(t,8)/4;case Ya:case Ja:return Math.max(i,8)*Math.max(t,8)/2;case Ka:case Qa:case to:case eo:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case ja:case gr:case no:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case io:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case so:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case ro:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case ao:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case oo:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case lo:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case co:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case ho:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case uo:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case fo:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case po:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case mo:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case go:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case _o:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case xo:case vo:case yo:return Math.ceil(i/4)*Math.ceil(t/4)*16;case Mo:case So:return Math.ceil(i/4)*Math.ceil(t/4)*8;case _r:case bo:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function vd(i){switch(i){case hn:case Ol:return{byteLength:1,components:1};case ms:case Bl:case Ce:return{byteLength:2,components:1};case Ga:case Ha:return{byteLength:2,components:4};case Tn:case Va:case un:return{byteLength:4,components:1};case kl:case zl:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"186"}}));typeof window<"u"&&(window.__THREE__?Ht("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="186");function Au(){let i=null,t=!1,e=null,n=null;function s(r,a){n=i.requestAnimationFrame(s),e(r,a)}return{start:function(){t!==!0&&e!==null&&i!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function Md(i){let t=new WeakMap;function e(o,l){let c=o.array,h=o.usage,f=c.byteLength,u=i.createBuffer();i.bindBuffer(l,u),i.bufferData(l,c,h),o.onUploadCallback();let d;if(c instanceof Float32Array)d=i.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)d=i.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?d=i.HALF_FLOAT:d=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)d=i.SHORT;else if(c instanceof Uint32Array)d=i.UNSIGNED_INT;else if(c instanceof Int32Array)d=i.INT;else if(c instanceof Int8Array)d=i.BYTE;else if(c instanceof Uint8Array)d=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)d=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:u,type:d,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:f}}function n(o,l,c){let h=l.array,f=l.updateRanges;if(i.bindBuffer(c,o),f.length===0)i.bufferSubData(c,0,h);else{f.sort((d,g)=>d.start-g.start);let u=0;for(let d=1;d<f.length;d++){let g=f[u],w=f[d];w.start<=g.start+g.count+1?g.count=Math.max(g.count,w.start+w.count-g.start):(++u,f[u]=w)}f.length=u+1;for(let d=0,g=f.length;d<g;d++){let w=f[d];i.bufferSubData(c,w.start*h.BYTES_PER_ELEMENT,h,w.start,w.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=t.get(o);l&&(i.deleteBuffer(l.buffer),t.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let h=t.get(o);(!h||h.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let c=t.get(o);if(c===void 0)t.set(o,e(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:s,remove:r,update:a}}var Sd=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,bd=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Td=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,wd=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Ad=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Ed=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Cd=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Rd=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Pd=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,Id=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Ld=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Dd=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Nd=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Ud=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Fd=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Od=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Bd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,kd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,zd=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Vd=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Gd=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Hd=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Wd=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,Xd=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,qd=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Yd=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,Zd=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Jd=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,$d=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Kd=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Qd="gl_FragColor = linearToOutputTexel( gl_FragColor );",jd=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,tp=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,ep=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,np=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,ip=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,sp=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,rp=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,ap=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,op=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,lp=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,cp=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,hp=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,up=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,fp=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,dp=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,pp=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,mp=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,gp=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,_p=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,xp=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,vp=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,yp=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Mp=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Sp=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,bp=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Tp=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,wp=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Ap=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Ep=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Cp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Rp=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Pp=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Ip=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Lp=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Dp=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Np=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Up=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Fp=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Op=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Bp=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,kp=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,zp=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Vp=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Gp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Hp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Wp=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,Xp=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,qp=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Yp=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Zp=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Jp=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,$p=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Kp=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,Qp=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,jp=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,tm=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,em=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,nm=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,im=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,sm=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,rm=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,am=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,om=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,lm=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,cm=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,hm=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,um=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,fm=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,dm=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,pm=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,mm=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,gm=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,_m=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,xm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,vm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,ym=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Mm=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Sm=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,bm=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Tm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,wm=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Am=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Em=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Cm=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Rm=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Pm=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Im=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,Lm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Dm=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Nm=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Um=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Fm=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Om=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Bm=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,km=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,zm=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Vm=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Gm=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Hm=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Wm=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Xm=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,qm=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Ym=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Zm=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Jm=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,$m=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Km=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Qm=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,jm=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,t0=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,e0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Qt={alphahash_fragment:Sd,alphahash_pars_fragment:bd,alphamap_fragment:Td,alphamap_pars_fragment:wd,alphatest_fragment:Ad,alphatest_pars_fragment:Ed,aomap_fragment:Cd,aomap_pars_fragment:Rd,batching_pars_vertex:Pd,batching_vertex:Id,begin_vertex:Ld,beginnormal_vertex:Dd,bsdfs:Nd,iridescence_fragment:Ud,bumpmap_pars_fragment:Fd,clipping_planes_fragment:Od,clipping_planes_pars_fragment:Bd,clipping_planes_pars_vertex:kd,clipping_planes_vertex:zd,color_fragment:Vd,color_pars_fragment:Gd,color_pars_vertex:Hd,color_vertex:Wd,common:Xd,cube_uv_reflection_fragment:qd,defaultnormal_vertex:Yd,displacementmap_pars_vertex:Zd,displacementmap_vertex:Jd,emissivemap_fragment:$d,emissivemap_pars_fragment:Kd,colorspace_fragment:Qd,colorspace_pars_fragment:jd,envmap_fragment:tp,envmap_common_pars_fragment:ep,envmap_pars_fragment:np,envmap_pars_vertex:ip,envmap_physical_pars_fragment:pp,envmap_vertex:sp,fog_vertex:rp,fog_pars_vertex:ap,fog_fragment:op,fog_pars_fragment:lp,gradientmap_pars_fragment:cp,lightmap_pars_fragment:hp,lights_lambert_fragment:up,lights_lambert_pars_fragment:fp,lights_pars_begin:dp,lights_toon_fragment:mp,lights_toon_pars_fragment:gp,lights_phong_fragment:_p,lights_phong_pars_fragment:xp,lights_physical_fragment:vp,lights_physical_pars_fragment:yp,lights_fragment_begin:Mp,lights_fragment_maps:Sp,lights_fragment_end:bp,lightprobes_pars_fragment:Tp,logdepthbuf_fragment:wp,logdepthbuf_pars_fragment:Ap,logdepthbuf_pars_vertex:Ep,logdepthbuf_vertex:Cp,map_fragment:Rp,map_pars_fragment:Pp,map_particle_fragment:Ip,map_particle_pars_fragment:Lp,metalnessmap_fragment:Dp,metalnessmap_pars_fragment:Np,morphinstance_vertex:Up,morphcolor_vertex:Fp,morphnormal_vertex:Op,morphtarget_pars_vertex:Bp,morphtarget_vertex:kp,normal_fragment_begin:zp,normal_fragment_maps:Vp,normal_pars_fragment:Gp,normal_pars_vertex:Hp,normal_vertex:Wp,normalmap_pars_fragment:Xp,clearcoat_normal_fragment_begin:qp,clearcoat_normal_fragment_maps:Yp,clearcoat_pars_fragment:Zp,iridescence_pars_fragment:Jp,opaque_fragment:$p,packing:Kp,premultiplied_alpha_fragment:Qp,project_vertex:jp,dithering_fragment:tm,dithering_pars_fragment:em,roughnessmap_fragment:nm,roughnessmap_pars_fragment:im,shadowmap_pars_fragment:sm,shadowmap_pars_vertex:rm,shadowmap_vertex:am,shadowmask_pars_fragment:om,skinbase_vertex:lm,skinning_pars_vertex:cm,skinning_vertex:hm,skinnormal_vertex:um,specularmap_fragment:fm,specularmap_pars_fragment:dm,tonemapping_fragment:pm,tonemapping_pars_fragment:mm,transmission_fragment:gm,transmission_pars_fragment:_m,uv_pars_fragment:xm,uv_pars_vertex:vm,uv_vertex:ym,worldpos_vertex:Mm,background_vert:Sm,background_frag:bm,backgroundCube_vert:Tm,backgroundCube_frag:wm,cube_vert:Am,cube_frag:Em,depth_vert:Cm,depth_frag:Rm,distance_vert:Pm,distance_frag:Im,equirect_vert:Lm,equirect_frag:Dm,linedashed_vert:Nm,linedashed_frag:Um,meshbasic_vert:Fm,meshbasic_frag:Om,meshlambert_vert:Bm,meshlambert_frag:km,meshmatcap_vert:zm,meshmatcap_frag:Vm,meshnormal_vert:Gm,meshnormal_frag:Hm,meshphong_vert:Wm,meshphong_frag:Xm,meshphysical_vert:qm,meshphysical_frag:Ym,meshtoon_vert:Zm,meshtoon_frag:Jm,points_vert:$m,points_frag:Km,shadow_vert:Qm,shadow_frag:jm,sprite_vert:t0,sprite_frag:e0},yt={common:{diffuse:{value:new qt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Yt},alphaMap:{value:null},alphaMapTransform:{value:new Yt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Yt}},envmap:{envMap:{value:null},envMapRotation:{value:new Yt},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Yt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Yt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Yt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Yt},normalScale:{value:new Xt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Yt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Yt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Yt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Yt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new qt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new V},probesMax:{value:new V},probesResolution:{value:new V}},points:{diffuse:{value:new qt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Yt},alphaTest:{value:0},uvTransform:{value:new Yt}},sprite:{diffuse:{value:new qt(16777215)},opacity:{value:1},center:{value:new Xt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Yt},alphaMap:{value:null},alphaMapTransform:{value:new Yt},alphaTest:{value:0}}},kn={basic:{uniforms:ze([yt.common,yt.specularmap,yt.envmap,yt.aomap,yt.lightmap,yt.fog]),vertexShader:Qt.meshbasic_vert,fragmentShader:Qt.meshbasic_frag},lambert:{uniforms:ze([yt.common,yt.specularmap,yt.envmap,yt.aomap,yt.lightmap,yt.emissivemap,yt.bumpmap,yt.normalmap,yt.displacementmap,yt.fog,yt.lights,{emissive:{value:new qt(0)},envMapIntensity:{value:1}}]),vertexShader:Qt.meshlambert_vert,fragmentShader:Qt.meshlambert_frag},phong:{uniforms:ze([yt.common,yt.specularmap,yt.envmap,yt.aomap,yt.lightmap,yt.emissivemap,yt.bumpmap,yt.normalmap,yt.displacementmap,yt.fog,yt.lights,{emissive:{value:new qt(0)},specular:{value:new qt(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Qt.meshphong_vert,fragmentShader:Qt.meshphong_frag},standard:{uniforms:ze([yt.common,yt.envmap,yt.aomap,yt.lightmap,yt.emissivemap,yt.bumpmap,yt.normalmap,yt.displacementmap,yt.roughnessmap,yt.metalnessmap,yt.fog,yt.lights,{emissive:{value:new qt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Qt.meshphysical_vert,fragmentShader:Qt.meshphysical_frag},toon:{uniforms:ze([yt.common,yt.aomap,yt.lightmap,yt.emissivemap,yt.bumpmap,yt.normalmap,yt.displacementmap,yt.gradientmap,yt.fog,yt.lights,{emissive:{value:new qt(0)}}]),vertexShader:Qt.meshtoon_vert,fragmentShader:Qt.meshtoon_frag},matcap:{uniforms:ze([yt.common,yt.bumpmap,yt.normalmap,yt.displacementmap,yt.fog,{matcap:{value:null}}]),vertexShader:Qt.meshmatcap_vert,fragmentShader:Qt.meshmatcap_frag},points:{uniforms:ze([yt.points,yt.fog]),vertexShader:Qt.points_vert,fragmentShader:Qt.points_frag},dashed:{uniforms:ze([yt.common,yt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Qt.linedashed_vert,fragmentShader:Qt.linedashed_frag},depth:{uniforms:ze([yt.common,yt.displacementmap]),vertexShader:Qt.depth_vert,fragmentShader:Qt.depth_frag},normal:{uniforms:ze([yt.common,yt.bumpmap,yt.normalmap,yt.displacementmap,{opacity:{value:1}}]),vertexShader:Qt.meshnormal_vert,fragmentShader:Qt.meshnormal_frag},sprite:{uniforms:ze([yt.sprite,yt.fog]),vertexShader:Qt.sprite_vert,fragmentShader:Qt.sprite_frag},background:{uniforms:{uvTransform:{value:new Yt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Qt.background_vert,fragmentShader:Qt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Yt}},vertexShader:Qt.backgroundCube_vert,fragmentShader:Qt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Qt.cube_vert,fragmentShader:Qt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Qt.equirect_vert,fragmentShader:Qt.equirect_frag},distance:{uniforms:ze([yt.common,yt.displacementmap,{referencePosition:{value:new V},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Qt.distance_vert,fragmentShader:Qt.distance_frag},shadow:{uniforms:ze([yt.lights,yt.fog,{color:{value:new qt(0)},opacity:{value:1}}]),vertexShader:Qt.shadow_vert,fragmentShader:Qt.shadow_frag}};kn.physical={uniforms:ze([kn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Yt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Yt},clearcoatNormalScale:{value:new Xt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Yt},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Yt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Yt},sheen:{value:0},sheenColor:{value:new qt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Yt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Yt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Yt},transmissionSamplerSize:{value:new Xt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Yt},attenuationDistance:{value:0},attenuationColor:{value:new qt(0)},specularColor:{value:new qt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Yt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Yt},anisotropyVector:{value:new Xt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Yt}}]),vertexShader:Qt.meshphysical_vert,fragmentShader:Qt.meshphysical_frag};var Ao={r:0,b:0,g:0},n0=new ve,Eu=new Yt;Eu.set(-1,0,0,0,1,0,0,0,1);function i0(i,t,e,n,s,r){let a=new qt(0),o=s===!0?0:1,l,c,h=null,f=0,u=null;function d(S){let C=S.isScene===!0?S.background:null;if(C&&C.isTexture){let v=S.backgroundBlurriness>0;C=t.get(C,v)}return C}function g(S){let C=!1,v=d(S);v===null?m(a,o):v&&v.isColor&&(m(v,1),C=!0);let T=i.xr.getEnvironmentBlendMode();T==="additive"?e.buffers.color.setClear(0,0,0,1,r):T==="alpha-blend"&&e.buffers.color.setClear(0,0,0,0,r),(i.autoClear||C)&&(e.buffers.depth.setTest(!0),e.buffers.depth.setMask(!0),e.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function w(S,C){let v=d(C);v&&(v.isCubeTexture||v.mapping===hr)?(c===void 0&&(c=new Ke(new us(1,1,1),new ge({name:"BackgroundCubeMaterial",uniforms:Bi(kn.backgroundCube.uniforms),vertexShader:kn.backgroundCube.vertexShader,fragmentShader:kn.backgroundCube.fragmentShader,side:qe,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(T,A,P){this.matrixWorld.copyPosition(P.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(c)),c.material.uniforms.envMap.value=v,c.material.uniforms.backgroundBlurriness.value=C.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=C.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(n0.makeRotationFromEuler(C.backgroundRotation)).transpose(),v.isCubeTexture&&v.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(Eu),c.material.toneMapped=jt.getTransfer(v.colorSpace)!==ae,(h!==v||f!==v.version||u!==i.toneMapping)&&(c.material.needsUpdate=!0,h=v,f=v.version,u=i.toneMapping),c.layers.enableAll(),S.unshift(c,c.geometry,c.material,0,0,null)):v&&v.isTexture&&(l===void 0&&(l=new Ke(new Qs(2,2),new ge({name:"BackgroundMaterial",uniforms:Bi(kn.background.uniforms),vertexShader:kn.background.vertexShader,fragmentShader:kn.background.fragmentShader,side:yi,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(l)),l.material.uniforms.t2D.value=v,l.material.uniforms.backgroundIntensity.value=C.backgroundIntensity,l.material.toneMapped=jt.getTransfer(v.colorSpace)!==ae,v.matrixAutoUpdate===!0&&v.updateMatrix(),l.material.uniforms.uvTransform.value.copy(v.matrix),(h!==v||f!==v.version||u!==i.toneMapping)&&(l.material.needsUpdate=!0,h=v,f=v.version,u=i.toneMapping),l.layers.enableAll(),S.unshift(l,l.geometry,l.material,0,0,null))}function m(S,C){S.getRGB(Ao,Jl(i)),e.buffers.color.setClear(Ao.r,Ao.g,Ao.b,C,r)}function p(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(S,C=1){a.set(S),o=C,m(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(S){o=S,m(a,o)},render:g,addToRenderList:w,dispose:p}}function s0(i,t){let e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=u(null),r=s,a=!1;function o(E,L,N,I,F){let q=!1,W=f(E,I,N,L);r!==W&&(r=W,c(r.object)),q=d(E,I,N,F),q&&g(E,I,N,F),F!==null&&t.update(F,i.ELEMENT_ARRAY_BUFFER),(q||a)&&(a=!1,v(E,L,N,I),F!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(F).buffer))}function l(){return i.createVertexArray()}function c(E){return i.bindVertexArray(E)}function h(E){return i.deleteVertexArray(E)}function f(E,L,N,I){let F=I.wireframe===!0,q=n[L.id];q===void 0&&(q={},n[L.id]=q);let W=E.isInstancedMesh===!0?E.id:0,st=q[W];st===void 0&&(st={},q[W]=st);let Y=st[N.id];Y===void 0&&(Y={},st[N.id]=Y);let Q=Y[F];return Q===void 0&&(Q=u(l()),Y[F]=Q),Q}function u(E){let L=[],N=[],I=[];for(let F=0;F<e;F++)L[F]=0,N[F]=0,I[F]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:L,enabledAttributes:N,attributeDivisors:I,object:E,attributes:{},index:null}}function d(E,L,N,I){let F=r.attributes,q=L.attributes,W=0,st=N.getAttributes();for(let Y in st)if(st[Y].location>=0){let tt=F[Y],J=q[Y];if(J===void 0&&(Y==="instanceMatrix"&&E.instanceMatrix&&(J=E.instanceMatrix),Y==="instanceColor"&&E.instanceColor&&(J=E.instanceColor)),tt===void 0||tt.attribute!==J||J&&tt.data!==J.data)return!0;W++}return r.attributesNum!==W||r.index!==I}function g(E,L,N,I){let F={},q=L.attributes,W=0,st=N.getAttributes();for(let Y in st)if(st[Y].location>=0){let tt=q[Y];tt===void 0&&(Y==="instanceMatrix"&&E.instanceMatrix&&(tt=E.instanceMatrix),Y==="instanceColor"&&E.instanceColor&&(tt=E.instanceColor));let J={};J.attribute=tt,tt&&tt.data&&(J.data=tt.data),F[Y]=J,W++}r.attributes=F,r.attributesNum=W,r.index=I}function w(){let E=r.newAttributes;for(let L=0,N=E.length;L<N;L++)E[L]=0}function m(E){p(E,0)}function p(E,L){let N=r.newAttributes,I=r.enabledAttributes,F=r.attributeDivisors;N[E]=1,I[E]===0&&(i.enableVertexAttribArray(E),I[E]=1),F[E]!==L&&(i.vertexAttribDivisor(E,L),F[E]=L)}function S(){let E=r.newAttributes,L=r.enabledAttributes;for(let N=0,I=L.length;N<I;N++)L[N]!==E[N]&&(i.disableVertexAttribArray(N),L[N]=0)}function C(E,L,N,I,F,q,W){W===!0?i.vertexAttribIPointer(E,L,N,F,q):i.vertexAttribPointer(E,L,N,I,F,q)}function v(E,L,N,I){w();let F=I.attributes,q=N.getAttributes(),W=L.defaultAttributeValues;for(let st in q){let Y=q[st];if(Y.location>=0){let Q=F[st];if(Q===void 0&&(st==="instanceMatrix"&&E.instanceMatrix&&(Q=E.instanceMatrix),st==="instanceColor"&&E.instanceColor&&(Q=E.instanceColor)),Q!==void 0){let tt=Q.normalized,J=Q.itemSize,U=t.get(Q);if(U===void 0)continue;let K=U.buffer,at=U.type,Tt=U.bytesPerElement,X=at===i.INT||at===i.UNSIGNED_INT||Q.gpuType===Va;if(Q.isInterleavedBufferAttribute){let j=Q.data,ht=j.stride,Vt=Q.offset;if(j.isInstancedInterleavedBuffer){for(let ut=0;ut<Y.locationSize;ut++)p(Y.location+ut,j.meshPerAttribute);E.isInstancedMesh!==!0&&I._maxInstanceCount===void 0&&(I._maxInstanceCount=j.meshPerAttribute*j.count)}else for(let ut=0;ut<Y.locationSize;ut++)m(Y.location+ut);i.bindBuffer(i.ARRAY_BUFFER,K);for(let ut=0;ut<Y.locationSize;ut++)C(Y.location+ut,J/Y.locationSize,at,tt,ht*Tt,(Vt+J/Y.locationSize*ut)*Tt,X)}else{if(Q.isInstancedBufferAttribute){for(let j=0;j<Y.locationSize;j++)p(Y.location+j,Q.meshPerAttribute);E.isInstancedMesh!==!0&&I._maxInstanceCount===void 0&&(I._maxInstanceCount=Q.meshPerAttribute*Q.count)}else for(let j=0;j<Y.locationSize;j++)m(Y.location+j);i.bindBuffer(i.ARRAY_BUFFER,K);for(let j=0;j<Y.locationSize;j++)C(Y.location+j,J/Y.locationSize,at,tt,J*Tt,J/Y.locationSize*j*Tt,X)}}else if(W!==void 0){let tt=W[st];if(tt!==void 0)switch(tt.length){case 2:i.vertexAttrib2fv(Y.location,tt);break;case 3:i.vertexAttrib3fv(Y.location,tt);break;case 4:i.vertexAttrib4fv(Y.location,tt);break;default:i.vertexAttrib1fv(Y.location,tt)}}}}S()}function T(){b();for(let E in n){let L=n[E];for(let N in L){let I=L[N];for(let F in I){let q=I[F];for(let W in q)h(q[W].object),delete q[W];delete I[F]}}delete n[E]}}function A(E){if(n[E.id]===void 0)return;let L=n[E.id];for(let N in L){let I=L[N];for(let F in I){let q=I[F];for(let W in q)h(q[W].object),delete q[W];delete I[F]}}delete n[E.id]}function P(E){for(let L in n){let N=n[L];for(let I in N){let F=N[I];if(F[E.id]===void 0)continue;let q=F[E.id];for(let W in q)h(q[W].object),delete q[W];delete F[E.id]}}}function x(E){for(let L in n){let N=n[L],I=E.isInstancedMesh===!0?E.id:0,F=N[I];if(F!==void 0){for(let q in F){let W=F[q];for(let st in W)h(W[st].object),delete W[st];delete F[q]}delete N[I],Object.keys(N).length===0&&delete n[L]}}}function b(){M(),a=!0,r!==s&&(r=s,c(r.object))}function M(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:b,resetDefaultState:M,dispose:T,releaseStatesOfGeometry:A,releaseStatesOfObject:x,releaseStatesOfProgram:P,initAttributes:w,enableAttribute:m,disableUnusedAttributes:S}}function r0(i,t,e){let n;function s(l){n=l}function r(l,c){i.drawArrays(n,l,c),e.update(c,n,1)}function a(l,c,h){h!==0&&(i.drawArraysInstanced(n,l,c,h),e.update(c,n,h))}function o(l,c,h){if(h===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,c,0,h);let u=0;for(let d=0;d<h;d++)u+=c[d];e.update(u,n,1)}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o}function a0(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){let P=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(P.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(P){return!(P!==je&&n.convert(P)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(P){let x=P===Ce&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(P!==hn&&P!==un&&!x&&n.convert(P)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE))}function l(P){if(P==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";P="mediump"}return P==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp",h=l(c);h!==c&&(Ht("WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let f=e.logarithmicDepthBuffer===!0,u=e.reversedDepthBuffer===!0&&t.has("EXT_clip_control");e.reversedDepthBuffer===!0&&u===!1&&Ht("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let d=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),w=i.getParameter(i.MAX_TEXTURE_SIZE),m=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),p=i.getParameter(i.MAX_VERTEX_ATTRIBS),S=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),C=i.getParameter(i.MAX_VARYING_VECTORS),v=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),T=i.getParameter(i.MAX_SAMPLES),A=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:f,reversedDepthBuffer:u,maxTextures:d,maxVertexTextures:g,maxTextureSize:w,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:S,maxVaryings:C,maxFragmentUniforms:v,maxSamples:T,samples:A}}function o0(i){let t=this,e=null,n=0,s=!1,r=!1,a=new Sn,o=new Yt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(f,u){let d=f.length!==0||u||n!==0||s;return s=u,n=f.length,d},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(f,u){e=h(f,u,0)},this.setState=function(f,u,d){let g=f.clippingPlanes,w=f.clipIntersection,m=f.clipShadows,p=i.get(f);if(!s||g===null||g.length===0||r&&!m)r?h(null):c();else{let S=r?0:n,C=S*4,v=p.clippingState||null;l.value=v,v=h(g,u,C,d);for(let T=0;T!==C;++T)v[T]=e[T];p.clippingState=v,this.numIntersection=w?this.numPlanes:0,this.numPlanes+=S}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(f,u,d,g){let w=f!==null?f.length:0,m=null;if(w!==0){if(m=l.value,g!==!0||m===null){let p=d+w*4,S=u.matrixWorldInverse;o.getNormalMatrix(S),(m===null||m.length<p)&&(m=new Float32Array(p));for(let C=0,v=d;C!==w;++C,v+=4)a.copy(f[C]).applyMatrix4(S,o),a.normal.toArray(m,v),m[v+3]=a.constant}l.value=m,l.needsUpdate=!0}return t.numPlanes=w,t.numIntersection=0,m}}var vs=4,l0=6,c0=20,h0=256,xr=new Ni,ru=new qt,sc=null,rc=0,ac=0,oc=!1,u0=new V,ki=new V,Co=class{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(t,e=0,n=.1,s=100,r={}){let{size:a=256,position:o=u0}=r;sc=this._renderer.getRenderTarget(),rc=this._renderer.getActiveCubeFace(),ac=this._renderer.getActiveMipmapLevel(),oc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(t,n,s,l,o),e>0&&this._blur(l,0,0,e),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=lu(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=ou(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodMeshes.length;t++)this._lodMeshes[t].geometry.dispose()}_cleanup(t){this._renderer.setRenderTarget(sc,rc,ac),this._renderer.xr.enabled=oc,t.scissorTest=!1,xs(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===Mi||t.mapping===Oi?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),sc=this._renderer.getRenderTarget(),rc=this._renderer.getActiveCubeFace(),ac=this._renderer.getActiveMipmapLevel(),oc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:De,minFilter:De,generateMipmaps:!1,type:Ce,format:je,colorSpace:Bs,depthBuffer:!1},s=au(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=au(t,e,n);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=f0(r)),this._blurMaterial=p0(r,t,e),this._ggxMaterial=d0(r,t,e)}return s}_compileMaterial(t){let e=new Ke(new Xe,t);this._renderer.compile(e,xr)}_sceneToCubeUV(t,e,n,s,r){let l=new Be(90,1,e,n),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],f=this._renderer,u=f.autoClear,d=f.toneMapping;f.getClearColor(ru),f.toneMapping=cn,f.autoClear=!1,f.state.buffers.depth.getReversed()&&(f.setRenderTarget(s),f.clearDepth(),f.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Ke(new us,new Di({name:"PMREM.Background",side:qe,depthWrite:!1,depthTest:!1})));let w=this._backgroundBox,m=w.material,p=!1,S=t.background;S?S.isColor&&(m.color.copy(S),t.background=null,p=!0):(m.color.copy(ru),p=!0);for(let C=0;C<6;C++){let v=C%3;v===0?(l.up.set(0,c[C],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x+h[C],r.y,r.z)):v===1?(l.up.set(0,0,c[C]),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y+h[C],r.z)):(l.up.set(0,c[C],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y,r.z+h[C]));let T=this._cubeSize;xs(s,v*T,C>2?T:0,T,T),f.setRenderTarget(s),p&&f.render(w,l),f.render(t,l)}f.toneMapping=d,f.autoClear=u,t.background=S}_textureToCubeUV(t,e){let n=this._renderer,s=t.mapping===Mi||t.mapping===Oi;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=lu()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=ou());let r=s?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=r;let o=r.uniforms;o.envMap.value=t;let l=this._cubeSize;xs(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(a,xr)}_applyPMREM(t){let e=this._renderer,n=e.autoClear;e.autoClear=!1;let s=this._lodMeshes.length;for(let r=1;r<s;r++)this._applyGGXFilter(t,r-1,r);e.autoClear=n}_applyGGXFilter(t,e,n){let s=this._renderer,r=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;let l=a.uniforms,c=n/(this._lodMeshes.length-1),h=e/(this._lodMeshes.length-1),f=Math.sqrt(c*c-h*h),u=c*1.25,d=f*u,{_lodMax:g}=this,w=this._sizeLods[n],m=3*w*(n>g-vs?n-g+vs:0),p=4*(this._cubeSize-w);l.envMap.value=t.texture,l.roughness.value=d,l.mipInt.value=g-e,xs(r,m,p,3*w,2*w),s.setRenderTarget(r),s.render(o,xr),l.envMap.value=r.texture,l.roughness.value=0,l.mipInt.value=g-n,xs(t,m,p,3*w,2*w),s.setRenderTarget(t),s.render(o,xr)}_blur(t,e,n,s){let r=this._pingPongRenderTarget,a=Math.min(s,Math.PI)/Math.SQRT2;this._blurPass(t,r,e,n,a),this._blurPass(r,t,n,n,a)}_blurPass(t,e,n,s,r){let a=this._renderer,o=this._blurMaterial,l=this._lodMeshes[s];l.material=o;let c=o.uniforms;c.envMap.value=t.texture,c.sigma.value=r,c.mipInt.value=this._lodMax-n;let h=this._sizeLods[s],f=3*h*(s>this._lodMax-vs?s-this._lodMax+vs:0),u=4*(this._cubeSize-h);xs(e,f,u,3*h,2*h),a.setRenderTarget(e),a.render(l,xr)}};function f0(i){let t=[],e=[],n=i,s=i-vs+1+l0;for(let r=0;r<s;r++){let a=Math.pow(2,n);t.push(a);let o=1/(a-2),l=-o,c=1+o,h=[l,l,c,l,c,c,l,l,c,c,l,c],f=6,u=6,d=3,g=new Float32Array(d*u*f),w=new Float32Array(d*u*f);for(let p=0;p<f;p++){let S=p%3*2/3-1,C=p>2?0:-1,v=[S,C,0,S+2/3,C,0,S+2/3,C+1,0,S,C,0,S+2/3,C+1,0,S,C+1,0];g.set(v,d*u*p);for(let T=0;T<u;T++){let A=h[T*2]*2-1,P=h[T*2+1]*2-1;p===0?ki.set(1,P,A):p===1?ki.set(-A,1,-P):p===2?ki.set(-A,P,1):p===3?ki.set(-1,P,-A):p===4?ki.set(-A,-1,P):ki.set(A,P,-1),ki.toArray(w,(p*u+T)*d)}}let m=new Xe;m.setAttribute("position",new ke(g,d)),m.setAttribute("outputDirection",new ke(w,d)),e.push(new Ke(m,null)),n>vs&&n--}return{lodMeshes:e,sizeLods:t}}function au(i,t,e){let n=new Se(i,t,e);return n.texture.mapping=hr,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function xs(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function d0(i,t,e){return new ge({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:h0,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Io(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:Qe,depthTest:!1,depthWrite:!1})}function p0(i,t,e){return new ge({name:"SphericalGaussianBlur",defines:{SAMPLES:c0,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Io(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:Qe,depthTest:!1,depthWrite:!1})}function ou(){return new ge({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Io(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Qe,depthTest:!1,depthWrite:!1})}function lu(){return new ge({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Io(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Qe,depthTest:!1,depthWrite:!1})}function Io(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var Ro=class extends Se{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;let n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new $s(s),this._setTextureOptions(e),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new us(5,5,5),r=new ge({name:"CubemapFromEquirect",uniforms:Bi(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:qe,blending:Qe});r.uniforms.tEquirect.value=e;let a=new Ke(s,r),o=e.minFilter;return e.minFilter===Si&&(e.minFilter=De),new Ua(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e=!0,n=!0,s=!0){let r=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,n,s);t.setRenderTarget(r)}};function m0(i){let t=new WeakMap,e=new WeakMap,n=null;function s(u,d=!1){return u==null?null:d?a(u):r(u)}function r(u){if(u&&u.isTexture){let d=u.mapping;if(d===Ba||d===ka)if(t.has(u)){let g=t.get(u).texture;return o(g,u.mapping)}else{let g=u.image;if(g&&g.height>0){let w=new Ro(g.height);return w.fromEquirectangularTexture(i,u),t.set(u,w),u.addEventListener("dispose",c),o(w.texture,u.mapping)}else return null}}return u}function a(u){if(u&&u.isTexture){let d=u.mapping,g=d===Ba||d===ka,w=d===Mi||d===Oi;if(g||w){let m=e.get(u),p=m!==void 0?m.texture.pmremVersion:0;if(u.isRenderTargetTexture&&u.pmremVersion!==p)return n===null&&(n=new Co(i)),m=g?n.fromEquirectangular(u,m):n.fromCubemap(u,m),m.texture.pmremVersion=u.pmremVersion,e.set(u,m),m.texture;if(m!==void 0)return m.texture;{let S=u.image;return g&&S&&S.height>0||w&&S&&l(S)?(n===null&&(n=new Co(i)),m=g?n.fromEquirectangular(u):n.fromCubemap(u),m.texture.pmremVersion=u.pmremVersion,e.set(u,m),u.addEventListener("dispose",h),m.texture):null}}}return u}function o(u,d){return d===Ba?u.mapping=Mi:d===ka&&(u.mapping=Oi),u}function l(u){let d=0,g=6;for(let w=0;w<g;w++)u[w]!==void 0&&d++;return d===g}function c(u){let d=u.target;d.removeEventListener("dispose",c);let g=t.get(d);g!==void 0&&(t.delete(d),g.dispose())}function h(u){let d=u.target;d.removeEventListener("dispose",h);let g=e.get(d);g!==void 0&&(e.delete(d),g.dispose())}function f(){t=new WeakMap,e=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:s,dispose:f}}function g0(i){let t={};function e(n){if(t[n]!==void 0)return t[n];let s=i.getExtension(n);return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){let s=e(n);return s===null&&Ii("WebGLRenderer: "+n+" extension not supported."),s}}}function _0(i,t,e,n){let s={},r=new WeakMap;function a(f){let u=f.target;u.index!==null&&t.remove(u.index);for(let g in u.attributes)t.remove(u.attributes[g]);u.removeEventListener("dispose",a),delete s[u.id];let d=r.get(u);d&&(t.remove(d),r.delete(u)),n.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,e.memory.geometries--}function o(f,u){return s[u.id]===!0||(u.addEventListener("dispose",a),s[u.id]=!0,e.memory.geometries++),u}function l(f){let u=f.attributes;for(let d in u)t.update(u[d],i.ARRAY_BUFFER)}function c(f){let u=[],d=f.index,g=f.attributes.position,w=0;if(g===void 0)return;if(d!==null){let S=d.array;w=d.version;for(let C=0,v=S.length;C<v;C+=3){let T=S[C+0],A=S[C+1],P=S[C+2];u.push(T,A,A,P,P,T)}}else{let S=g.array;w=g.version;for(let C=0,v=S.length/3-1;C<v;C+=3){let T=C+0,A=C+1,P=C+2;u.push(T,A,A,P,P,T)}}let m=new(g.count>=65535?qs:Xs)(u,1);m.version=w;let p=r.get(f);p&&t.remove(p),r.set(f,m)}function h(f){let u=r.get(f);if(u){let d=f.index;d!==null&&u.version<d.version&&c(f)}else c(f);return r.get(f)}return{get:o,update:l,getWireframeAttribute:h}}function x0(i,t,e){let n;function s(f){n=f}let r,a;function o(f){r=f.type,a=f.bytesPerElement}function l(f,u){i.drawElements(n,u,r,f*a),e.update(u,n,1)}function c(f,u,d){d!==0&&(i.drawElementsInstanced(n,u,r,f*a,d),e.update(u,n,d))}function h(f,u,d){if(d===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,u,0,r,f,0,d);let w=0;for(let m=0;m<d;m++)w+=u[m];e.update(w,n,1)}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h}function v0(i){let t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(e.calls++,a){case i.TRIANGLES:e.triangles+=o*(r/3);break;case i.LINES:e.lines+=o*(r/2);break;case i.LINE_STRIP:e.lines+=o*(r-1);break;case i.LINE_LOOP:e.lines+=o*r;break;case i.POINTS:e.points+=o*r;break;default:Wt("WebGLInfo: Unknown draw mode:",a);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function y0(i,t,e){let n=new WeakMap,s=new he;function r(a,o,l){let c=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,f=h!==void 0?h.length:0,u=n.get(o);if(u===void 0||u.count!==f){let b=function(){P.dispose(),n.delete(o),o.removeEventListener("dispose",b)};u!==void 0&&u.texture.dispose();let d=o.morphAttributes.position!==void 0,g=o.morphAttributes.normal!==void 0,w=o.morphAttributes.color!==void 0,m=o.morphAttributes.position||[],p=o.morphAttributes.normal||[],S=o.morphAttributes.color||[],C=0;d===!0&&(C=1),g===!0&&(C=2),w===!0&&(C=3);let v=o.attributes.position.count*C,T=1;v>t.maxTextureSize&&(T=Math.ceil(v/t.maxTextureSize),v=t.maxTextureSize);let A=new Float32Array(v*T*4*f),P=new Gs(A,v,T,f);P.type=un,P.needsUpdate=!0;let x=C*4;for(let M=0;M<f;M++){let E=m[M],L=p[M],N=S[M],I=v*T*4*M;for(let F=0;F<E.count;F++){let q=F*x;d===!0&&(s.fromBufferAttribute(E,F),A[I+q+0]=s.x,A[I+q+1]=s.y,A[I+q+2]=s.z,A[I+q+3]=0),g===!0&&(s.fromBufferAttribute(L,F),A[I+q+4]=s.x,A[I+q+5]=s.y,A[I+q+6]=s.z,A[I+q+7]=0),w===!0&&(s.fromBufferAttribute(N,F),A[I+q+8]=s.x,A[I+q+9]=s.y,A[I+q+10]=s.z,A[I+q+11]=N.itemSize===4?s.w:1)}}u={count:f,texture:P,size:new Xt(v,T)},n.set(o,u),o.addEventListener("dispose",b)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",a.morphTexture,e);else{let d=0;for(let w=0;w<c.length;w++)d+=c[w];let g=o.morphTargetsRelative?1:1-d;l.getUniforms().setValue(i,"morphTargetBaseInfluence",g),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",u.texture,e),l.getUniforms().setValue(i,"morphTargetsTextureSize",u.size)}return{update:r}}function M0(i,t,e,n,s){let r=new WeakMap;function a(c){let h=s.render.frame,f=c.geometry,u=t.get(c,f);if(r.get(u)!==h&&(t.update(u),r.set(u,h)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),r.get(c)!==h&&(e.update(c.instanceMatrix,i.ARRAY_BUFFER),c.instanceColor!==null&&e.update(c.instanceColor,i.ARRAY_BUFFER),r.set(c,h))),c.isSkinnedMesh){let d=c.skeleton;r.get(d)!==h&&(d.update(),r.set(d,h))}return u}function o(){r=new WeakMap}function l(c){let h=c.target;h.removeEventListener("dispose",l),n.releaseStatesOfObject(h),e.remove(h.instanceMatrix),h.instanceColor!==null&&e.remove(h.instanceColor)}return{update:a,dispose:o}}var S0={[ir]:"LINEAR_TONE_MAPPING",[sr]:"REINHARD_TONE_MAPPING",[rr]:"CINEON_TONE_MAPPING",[ar]:"ACES_FILMIC_TONE_MAPPING",[lr]:"AGX_TONE_MAPPING",[cr]:"NEUTRAL_TONE_MAPPING",[or]:"CUSTOM_TONE_MAPPING"};function b0(i,t,e,n,s,r){let a=new Se(t,e,{type:i,depthBuffer:s,stencilBuffer:r,samples:n?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),o=null,l=null,c=new Xe;c.setAttribute("position",new We([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new We([0,2,0,0,2,0],2));let h=new fs({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),f=new Ke(c,h),u=new Ni(-1,1,1,-1,0,1),d=null,g=null,w=!1,m,p=null,S=[],C=!1;this.setSize=function(v,T){a.setSize(v,T),o!==null&&o.setSize(v,T),l!==null&&l.setSize(v,T);for(let A=0;A<S.length;A++){let P=S[A];P.setSize&&P.setSize(v,T)}},this.setEffects=function(v){S=v,C=S.length>0&&S[0].isRenderPass===!0;let T=a.width,A=a.height;S.length>0&&o===null&&(o=new Se(T,A,{type:Ce,depthBuffer:!1,stencilBuffer:!1}),l=new Se(T,A,{type:Ce,depthBuffer:!1,stencilBuffer:!1}));for(let P=0;P<S.length;P++){let x=S[P];x.setSize&&x.setSize(T,A)}},this.begin=function(v,T){if(w||v.toneMapping===cn&&S.length===0)return!1;if(p=T,T!==null){let A=T.width,P=T.height;(a.width!==A||a.height!==P)&&this.setSize(A,P)}return C===!1&&v.setRenderTarget(a),m=v.toneMapping,v.toneMapping=cn,!0},this.hasRenderPass=function(){return C},this.end=function(v,T){v.toneMapping=m,w=!0;let A=a,P=o;for(let x=0;x<S.length;x++){let b=S[x];b.enabled!==!1&&(b.render(v,P,A,T),b.needsSwap!==!1&&(A=P,P=P===o?l:o))}if(d!==v.outputColorSpace||g!==v.toneMapping){d=v.outputColorSpace,g=v.toneMapping,h.defines={},jt.getTransfer(d)===ae&&(h.defines.SRGB_TRANSFER="");let x=S0[g];x&&(h.defines[x]=""),h.needsUpdate=!0}h.uniforms.tDiffuse.value=A.texture,v.setRenderTarget(p),v.render(f,u),p=null,w=!1},this.isCompositing=function(){return w},this.dispose=function(){a.dispose(),o!==null&&o.dispose(),l!==null&&l.dispose(),c.dispose(),h.dispose()}}var Cu=new $e,hc=new gi(1,1),Ru=new Gs,Pu=new ya,Iu=new $s,cu=[],hu=[],uu=new Float32Array(16),fu=new Float32Array(9),du=new Float32Array(4);function Ms(i,t,e){let n=i[0];if(n<=0||n>0)return i;let s=t*e,r=cu[s];if(r===void 0&&(r=new Float32Array(s),cu[s]=r),t!==0){n.toArray(r,0);for(let a=1,o=0;a!==t;++a)o+=e,i[a].toArray(r,o)}return r}function Pe(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function Ie(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function Lo(i,t){let e=hu[t];e===void 0&&(e=new Int32Array(t),hu[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function T0(i,t){let e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function w0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Pe(e,t))return;i.uniform2fv(this.addr,t),Ie(e,t)}}function A0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Pe(e,t))return;i.uniform3fv(this.addr,t),Ie(e,t)}}function E0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Pe(e,t))return;i.uniform4fv(this.addr,t),Ie(e,t)}}function C0(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(Pe(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),Ie(e,t)}else{if(Pe(e,n))return;du.set(n),i.uniformMatrix2fv(this.addr,!1,du),Ie(e,n)}}function R0(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(Pe(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),Ie(e,t)}else{if(Pe(e,n))return;fu.set(n),i.uniformMatrix3fv(this.addr,!1,fu),Ie(e,n)}}function P0(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(Pe(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),Ie(e,t)}else{if(Pe(e,n))return;uu.set(n),i.uniformMatrix4fv(this.addr,!1,uu),Ie(e,n)}}function I0(i,t){let e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function L0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Pe(e,t))return;i.uniform2iv(this.addr,t),Ie(e,t)}}function D0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Pe(e,t))return;i.uniform3iv(this.addr,t),Ie(e,t)}}function N0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Pe(e,t))return;i.uniform4iv(this.addr,t),Ie(e,t)}}function U0(i,t){let e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function F0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Pe(e,t))return;i.uniform2uiv(this.addr,t),Ie(e,t)}}function O0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Pe(e,t))return;i.uniform3uiv(this.addr,t),Ie(e,t)}}function B0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Pe(e,t))return;i.uniform4uiv(this.addr,t),Ie(e,t)}}function k0(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(hc.compareFunction=e.isReversedDepthBuffer()?wo:To,r=hc):r=Cu,e.setTexture2D(t||r,s)}function z0(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||Pu,s)}function V0(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||Iu,s)}function G0(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||Ru,s)}function H0(i){switch(i){case 5126:return T0;case 35664:return w0;case 35665:return A0;case 35666:return E0;case 35674:return C0;case 35675:return R0;case 35676:return P0;case 5124:case 35670:return I0;case 35667:case 35671:return L0;case 35668:case 35672:return D0;case 35669:case 35673:return N0;case 5125:return U0;case 36294:return F0;case 36295:return O0;case 36296:return B0;case 35678:case 36198:case 36298:case 36306:case 35682:return k0;case 35679:case 36299:case 36307:return z0;case 35680:case 36300:case 36308:case 36293:return V0;case 36289:case 36303:case 36311:case 36292:return G0}}function W0(i,t){i.uniform1fv(this.addr,t)}function X0(i,t){let e=Ms(t,this.size,2);i.uniform2fv(this.addr,e)}function q0(i,t){let e=Ms(t,this.size,3);i.uniform3fv(this.addr,e)}function Y0(i,t){let e=Ms(t,this.size,4);i.uniform4fv(this.addr,e)}function Z0(i,t){let e=Ms(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function J0(i,t){let e=Ms(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function $0(i,t){let e=Ms(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function K0(i,t){i.uniform1iv(this.addr,t)}function Q0(i,t){i.uniform2iv(this.addr,t)}function j0(i,t){i.uniform3iv(this.addr,t)}function tg(i,t){i.uniform4iv(this.addr,t)}function eg(i,t){i.uniform1uiv(this.addr,t)}function ng(i,t){i.uniform2uiv(this.addr,t)}function ig(i,t){i.uniform3uiv(this.addr,t)}function sg(i,t){i.uniform4uiv(this.addr,t)}function rg(i,t,e){let n=this.cache,s=t.length,r=Lo(e,s);Pe(n,r)||(i.uniform1iv(this.addr,r),Ie(n,r));let a;this.type===i.SAMPLER_2D_SHADOW?a=hc:a=Cu;for(let o=0;o!==s;++o)e.setTexture2D(t[o]||a,r[o])}function ag(i,t,e){let n=this.cache,s=t.length,r=Lo(e,s);Pe(n,r)||(i.uniform1iv(this.addr,r),Ie(n,r));for(let a=0;a!==s;++a)e.setTexture3D(t[a]||Pu,r[a])}function og(i,t,e){let n=this.cache,s=t.length,r=Lo(e,s);Pe(n,r)||(i.uniform1iv(this.addr,r),Ie(n,r));for(let a=0;a!==s;++a)e.setTextureCube(t[a]||Iu,r[a])}function lg(i,t,e){let n=this.cache,s=t.length,r=Lo(e,s);Pe(n,r)||(i.uniform1iv(this.addr,r),Ie(n,r));for(let a=0;a!==s;++a)e.setTexture2DArray(t[a]||Ru,r[a])}function cg(i){switch(i){case 5126:return W0;case 35664:return X0;case 35665:return q0;case 35666:return Y0;case 35674:return Z0;case 35675:return J0;case 35676:return $0;case 5124:case 35670:return K0;case 35667:case 35671:return Q0;case 35668:case 35672:return j0;case 35669:case 35673:return tg;case 5125:return eg;case 36294:return ng;case 36295:return ig;case 36296:return sg;case 35678:case 36198:case 36298:case 36306:case 35682:return rg;case 35679:case 36299:case 36307:return ag;case 35680:case 36300:case 36308:case 36293:return og;case 36289:case 36303:case 36311:case 36292:return lg}}var uc=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=H0(e.type)}},fc=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=cg(e.type)}},dc=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){let s=this.seq;for(let r=0,a=s.length;r!==a;++r){let o=s[r];o.setValue(t,e[o.id],n)}}},lc=/(\w+)(\])?(\[|\.)?/g;function pu(i,t){i.seq.push(t),i.map[t.id]=t}function hg(i,t,e){let n=i.name,s=n.length;for(lc.lastIndex=0;;){let r=lc.exec(n),a=lc.lastIndex,o=r[1],l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===s){pu(e,c===void 0?new uc(o,i,t):new fc(o,i,t));break}else{let f=e.map[o];f===void 0&&(f=new dc(o),pu(e,f)),e=f}}}var ys=class{constructor(t,e){this.seq=[],this.map={};let n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){let o=t.getActiveUniform(e,a),l=t.getUniformLocation(e,o.name);hg(o,l,this)}let s=[],r=[];for(let a of this.seq)a.type===t.SAMPLER_2D_SHADOW||a.type===t.SAMPLER_CUBE_SHADOW||a.type===t.SAMPLER_2D_ARRAY_SHADOW?s.push(a):r.push(a);s.length>0&&(this.seq=s.concat(r))}setValue(t,e,n,s){let r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){let s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,a=e.length;r!==a;++r){let o=e[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,s)}}static seqWithValue(t,e){let n=[];for(let s=0,r=t.length;s!==r;++s){let a=t[s];a.id in e&&n.push(a)}return n}};function mu(i,t,e){let n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}var ug=37297,fg=0;function dg(i,t){let e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let a=s;a<r;a++){let o=a+1;n.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return n.join(`
`)}var gu=new Yt;function pg(i){jt._getMatrix(gu,jt.workingColorSpace,i);let t=`mat3( ${gu.elements.map(e=>e.toFixed(4))} )`;switch(jt.getTransfer(i)){case ks:return[t,"LinearTransferOETF"];case ae:return[t,"sRGBTransferOETF"];default:return Ht("WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function _u(i,t,e){let n=i.getShaderParameter(t,i.COMPILE_STATUS),r=(i.getShaderInfoLog(t)||"").trim();if(n&&r==="")return"";let a=/ERROR: 0:(\d+)/.exec(r);if(a){let o=parseInt(a[1]);return e.toUpperCase()+`

`+r+`

`+dg(i.getShaderSource(t),o)}else return r}function mg(i,t){let e=pg(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}var gg={[ir]:"Linear",[sr]:"Reinhard",[rr]:"Cineon",[ar]:"ACESFilmic",[lr]:"AgX",[cr]:"Neutral",[or]:"Custom"};function _g(i,t){let e=gg[t];return e===void 0?(Ht("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}var Eo=new V;function xg(){jt.getLuminanceCoefficients(Eo);let i=Eo.x.toFixed(4),t=Eo.y.toFixed(4),e=Eo.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function vg(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(yr).join(`
`)}function yg(i){let t=[];for(let e in i){let n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function Mg(i,t){let e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(t,s),a=r.name,o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),e[a]={type:r.type,location:i.getAttribLocation(t,a),locationSize:o}}return e}function yr(i){return i!==""}function xu(i,t){let e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function vu(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var Sg=/^[ \t]*#include +<([\w\d./]+)>/gm;function pc(i){return i.replace(Sg,Tg)}var bg=new Map;function Tg(i,t){let e=Qt[t];if(e===void 0){let n=bg.get(t);if(n!==void 0)e=Qt[n],Ht('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+t+">")}return pc(e)}var wg=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function yu(i){return i.replace(wg,Ag)}function Ag(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Mu(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}var Eg={[nr]:"SHADOWMAP_TYPE_PCF",[ds]:"SHADOWMAP_TYPE_VSM"};function Cg(i){return Eg[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var Rg={[Mi]:"ENVMAP_TYPE_CUBE",[Oi]:"ENVMAP_TYPE_CUBE",[hr]:"ENVMAP_TYPE_CUBE_UV"};function Pg(i){return i.envMap===!1?"ENVMAP_TYPE_CUBE":Rg[i.envMapMode]||"ENVMAP_TYPE_CUBE"}var Ig={[Oi]:"ENVMAP_MODE_REFRACTION"};function Lg(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":Ig[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}var Dg={[Ul]:"ENVMAP_BLENDING_MULTIPLY",[kh]:"ENVMAP_BLENDING_MIX",[zh]:"ENVMAP_BLENDING_ADD"};function Ng(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":Dg[i.combine]||"ENVMAP_BLENDING_NONE"}function Ug(i){let t=i.envMapCubeUVHeight;if(t===null)return null;let e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:n,maxMip:e}}function Fg(i,t,e,n){let s=i.getContext(),r=e.defines,a=e.vertexShader,o=e.fragmentShader,l=Cg(e),c=Pg(e),h=Lg(e),f=Ng(e),u=Ug(e),d=vg(e),g=yg(r),w=s.createProgram(),m,p,S=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(yr).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(yr).join(`
`),p.length>0&&(p+=`
`)):(m=[Mu(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexNormals?"#define HAS_NORMAL":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(yr).join(`
`),p=[Mu(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+h:"",e.envMap?"#define "+f:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.retroreflection?"#define USE_RETROREFLECTION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas||e.batchingColor?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==cn?"#define TONE_MAPPING":"",e.toneMapping!==cn?Qt.tonemapping_pars_fragment:"",e.toneMapping!==cn?_g("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Qt.colorspace_pars_fragment,mg("linearToOutputTexel",e.outputColorSpace),xg(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(yr).join(`
`)),a=pc(a),a=xu(a,e),a=vu(a,e),o=pc(o),o=xu(o,e),o=vu(o,e),a=yu(a),o=yu(o),e.isRawShaderMaterial!==!0&&(S=`#version 300 es
`,m=[d,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",e.glslVersion===Xl?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Xl?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);let C=S+m+a,v=S+p+o,T=mu(s,s.VERTEX_SHADER,C),A=mu(s,s.FRAGMENT_SHADER,v);s.attachShader(w,T),s.attachShader(w,A),e.index0AttributeName!==void 0?s.bindAttribLocation(w,0,e.index0AttributeName):e.hasPositionAttribute===!0&&s.bindAttribLocation(w,0,"position"),s.linkProgram(w);function P(E){if(i.debug.checkShaderErrors){let L=s.getProgramInfoLog(w)||"",N=s.getShaderInfoLog(T)||"",I=s.getShaderInfoLog(A)||"",F=L.trim(),q=N.trim(),W=I.trim(),st=!0,Y=!0;if(s.getProgramParameter(w,s.LINK_STATUS)===!1)if(st=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,w,T,A);else{let Q=_u(s,T,"vertex"),tt=_u(s,A,"fragment");Wt("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(w,s.VALIDATE_STATUS)+`

Material Name: `+E.name+`
Material Type: `+E.type+`

Program Info Log: `+F+`
`+Q+`
`+tt)}else F!==""?Ht("WebGLProgram: Program Info Log:",F):(q===""||W==="")&&(Y=!1);Y&&(E.diagnostics={runnable:st,programLog:F,vertexShader:{log:q,prefix:m},fragmentShader:{log:W,prefix:p}})}s.deleteShader(T),s.deleteShader(A),x=new ys(s,w),b=Mg(s,w)}let x;this.getUniforms=function(){return x===void 0&&P(this),x};let b;this.getAttributes=function(){return b===void 0&&P(this),b};let M=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return M===!1&&(M=s.getProgramParameter(w,ug)),M},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(w),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=fg++,this.cacheKey=t,this.usedTimes=1,this.program=w,this.vertexShader=T,this.fragmentShader=A,this}var Og=0,mc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t,e,n){let s=this._getShaderCacheForMaterial(t);return s.has(e)===!1&&(s.add(e),e.usedTimes++),s.has(n)===!1&&(s.add(n),n.usedTimes++),this}remove(t){let e=this.materialCache.get(t);for(let n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderStage(t){return this._getShaderStage(t.vertexShader)}getFragmentShaderStage(t){return this._getShaderStage(t.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let e=this.materialCache,n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){let e=this.shaderCache,n=e.get(t);return n===void 0&&(n=new gc(t),e.set(t,n)),n}},gc=class{constructor(t){this.id=Og++,this.code=t,this.usedTimes=0}};function Bg(i){return i===Ti||i===gr||i===_r}function kg(i,t,e,n,s,r){let a=new Hs,o=new mc,l=new Set,c=[],h=new Map,f=n.logarithmicDepthBuffer,u=n.precision,d={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(x){return l.add(x),x===0?"uv":`uv${x}`}function w(x,b,M,E,L,N){let I=E.fog,F=L.geometry,q=x.isMeshStandardMaterial||x.isMeshLambertMaterial||x.isMeshPhongMaterial?E.environment:null,W=x.isMeshStandardMaterial||x.isMeshLambertMaterial&&!x.envMap||x.isMeshPhongMaterial&&!x.envMap,st=t.get(x.envMap||q,W),Y=st&&st.mapping===hr?st.image.height:null,Q=d[x.type];x.precision!==null&&(u=n.getMaxPrecision(x.precision),u!==x.precision&&Ht("WebGLProgram.getParameters:",x.precision,"not supported, using",u,"instead."));let tt=F.morphAttributes.position||F.morphAttributes.normal||F.morphAttributes.color,J=tt!==void 0?tt.length:0,U=0;F.morphAttributes.position!==void 0&&(U=1),F.morphAttributes.normal!==void 0&&(U=2),F.morphAttributes.color!==void 0&&(U=3);let K,at,Tt,X;if(Q){let pe=kn[Q];K=pe.vertexShader,at=pe.fragmentShader}else{K=x.vertexShader,at=x.fragmentShader;let pe=o.getVertexShaderStage(x),le=o.getFragmentShaderStage(x);o.update(x,pe,le),Tt=pe.id,X=le.id}let j=i.getRenderTarget(),ht=i.state.buffers.depth.getReversed(),Vt=L.isInstancedMesh===!0,ut=L.isBatchedMesh===!0,Ft=!!x.map,de=!!x.matcap,nt=!!st,wt=!!x.aoMap,St=!!x.lightMap,ct=!!x.bumpMap&&x.wireframe===!1,Nt=!!x.normalMap,Zt=!!x.displacementMap,se=!!x.emissiveMap,Et=!!x.metalnessMap,Jt=!!x.roughnessMap,D=x.anisotropy>0,re=x.clearcoat>0,zt=x.dispersion>0,R=x.retroreflectivity>0,_=x.iridescence>0,k=x.sheen>0,z=x.transmission>0,$=D&&!!x.anisotropyMap,ft=re&&!!x.clearcoatMap,pt=re&&!!x.clearcoatNormalMap,it=re&&!!x.clearcoatRoughnessMap,ot=_&&!!x.iridescenceMap,mt=_&&!!x.iridescenceThicknessMap,Ot=k&&!!x.sheenColorMap,vt=k&&!!x.sheenRoughnessMap,gt=!!x.specularMap,Bt=!!x.specularColorMap,Gt=!!x.specularIntensityMap,$t=z&&!!x.transmissionMap,B=z&&!!x.thicknessMap,_t=!!x.gradientMap,rt=!!x.alphaMap,xt=x.alphaTest>0,At=!!x.alphaHash,lt=!!x.extensions,kt=cn;x.toneMapped&&(j===null||j.isXRRenderTarget===!0)&&(kt=i.toneMapping);let Lt={shaderID:Q,shaderType:x.type,shaderName:x.name,vertexShader:K,fragmentShader:at,defines:x.defines,customVertexShaderID:Tt,customFragmentShaderID:X,isRawShaderMaterial:x.isRawShaderMaterial===!0,glslVersion:x.glslVersion,precision:u,batching:ut,batchingColor:ut&&L._colorsTexture!==null,instancing:Vt,instancingColor:Vt&&L.instanceColor!==null,instancingMorph:Vt&&L.morphTexture!==null,outputColorSpace:j===null?i.outputColorSpace:j.isXRRenderTarget===!0?j.texture.colorSpace:jt.workingColorSpace,alphaToCoverage:!!x.alphaToCoverage,map:Ft,matcap:de,envMap:nt,envMapMode:nt&&st.mapping,envMapCubeUVHeight:Y,aoMap:wt,lightMap:St,bumpMap:ct,normalMap:Nt,displacementMap:Zt,emissiveMap:se,normalMapObjectSpace:Nt&&x.normalMapType===Hh,normalMapTangentSpace:Nt&&x.normalMapType===Wl,packedNormalMap:Nt&&x.normalMapType===Wl&&Bg(x.normalMap.format),metalnessMap:Et,roughnessMap:Jt,anisotropy:D,anisotropyMap:$,clearcoat:re,clearcoatMap:ft,clearcoatNormalMap:pt,clearcoatRoughnessMap:it,dispersion:zt,retroreflection:R,iridescence:_,iridescenceMap:ot,iridescenceThicknessMap:mt,sheen:k,sheenColorMap:Ot,sheenRoughnessMap:vt,specularMap:gt,specularColorMap:Bt,specularIntensityMap:Gt,transmission:z,transmissionMap:$t,thicknessMap:B,gradientMap:_t,opaque:x.transparent===!1&&x.blending===ps&&x.alphaToCoverage===!1,alphaMap:rt,alphaTest:xt,alphaHash:At,combine:x.combine,mapUv:Ft&&g(x.map.channel),aoMapUv:wt&&g(x.aoMap.channel),lightMapUv:St&&g(x.lightMap.channel),bumpMapUv:ct&&g(x.bumpMap.channel),normalMapUv:Nt&&g(x.normalMap.channel),displacementMapUv:Zt&&g(x.displacementMap.channel),emissiveMapUv:se&&g(x.emissiveMap.channel),metalnessMapUv:Et&&g(x.metalnessMap.channel),roughnessMapUv:Jt&&g(x.roughnessMap.channel),anisotropyMapUv:$&&g(x.anisotropyMap.channel),clearcoatMapUv:ft&&g(x.clearcoatMap.channel),clearcoatNormalMapUv:pt&&g(x.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:it&&g(x.clearcoatRoughnessMap.channel),iridescenceMapUv:ot&&g(x.iridescenceMap.channel),iridescenceThicknessMapUv:mt&&g(x.iridescenceThicknessMap.channel),sheenColorMapUv:Ot&&g(x.sheenColorMap.channel),sheenRoughnessMapUv:vt&&g(x.sheenRoughnessMap.channel),specularMapUv:gt&&g(x.specularMap.channel),specularColorMapUv:Bt&&g(x.specularColorMap.channel),specularIntensityMapUv:Gt&&g(x.specularIntensityMap.channel),transmissionMapUv:$t&&g(x.transmissionMap.channel),thicknessMapUv:B&&g(x.thicknessMap.channel),alphaMapUv:rt&&g(x.alphaMap.channel),vertexTangents:!!F.attributes.tangent&&(Nt||D),vertexNormals:!!F.attributes.normal,vertexColors:x.vertexColors,vertexAlphas:x.vertexColors===!0&&!!F.attributes.color&&F.attributes.color.itemSize===4,pointsUvs:L.isPoints===!0&&!!F.attributes.uv&&(Ft||rt),fog:!!I,useFog:x.fog===!0,fogExp2:!!I&&I.isFogExp2,flatShading:x.wireframe===!1&&(x.flatShading===!0||F.attributes.normal===void 0&&Nt===!1&&(x.isMeshLambertMaterial||x.isMeshPhongMaterial||x.isMeshStandardMaterial||x.isMeshPhysicalMaterial)),sizeAttenuation:x.sizeAttenuation===!0,logarithmicDepthBuffer:f,reversedDepthBuffer:ht,skinning:L.isSkinnedMesh===!0,hasPositionAttribute:F.attributes.position!==void 0,morphTargets:F.morphAttributes.position!==void 0,morphNormals:F.morphAttributes.normal!==void 0,morphColors:F.morphAttributes.color!==void 0,morphTargetsCount:J,morphTextureStride:U,numSunLights:b.sun.length,numDirLights:b.directional.length,numPointLights:b.point.length,numSpotLights:b.spot.length,numSpotLightMaps:b.spotLightMap.length,numRectAreaLights:b.rectArea.length,numHemiLights:b.hemi.length,numSunLightShadows:b.sunShadowMap.length,numDirLightShadows:b.directionalShadowMap.length,numPointLightShadows:b.pointShadowMap.length,numSpotLightShadows:b.spotShadowMap.length,numSpotLightShadowsWithMaps:b.numSpotLightShadowsWithMaps,numLightProbes:b.numLightProbes,numLightProbeGrids:N.length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:x.dithering,shadowMapEnabled:i.shadowMap.enabled&&M.length>0,shadowMapType:i.shadowMap.type,toneMapping:kt,decodeVideoTexture:Ft&&x.map.isVideoTexture===!0&&jt.getTransfer(x.map.colorSpace)===ae,decodeVideoTextureEmissive:se&&x.emissiveMap.isVideoTexture===!0&&jt.getTransfer(x.emissiveMap.colorSpace)===ae,premultipliedAlpha:x.premultipliedAlpha,doubleSided:x.side===On,flipSided:x.side===qe,useDepthPacking:x.depthPacking>=0,depthPacking:x.depthPacking||0,index0AttributeName:x.index0AttributeName,extensionClipCullDistance:lt&&x.extensions.clipCullDistance===!0&&e.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(lt&&x.extensions.multiDraw===!0||ut)&&e.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:e.has("KHR_parallel_shader_compile"),customProgramCacheKey:x.customProgramCacheKey()};return Lt.vertexUv1s=l.has(1),Lt.vertexUv2s=l.has(2),Lt.vertexUv3s=l.has(3),l.clear(),Lt}function m(x){let b=[];if(x.shaderID?b.push(x.shaderID):(b.push(x.customVertexShaderID),b.push(x.customFragmentShaderID)),x.defines!==void 0)for(let M in x.defines)b.push(M),b.push(x.defines[M]);return x.isRawShaderMaterial===!1&&(p(b,x),S(b,x),b.push(i.outputColorSpace)),b.push(x.customProgramCacheKey),b.join()}function p(x,b){x.push(b.precision),x.push(b.outputColorSpace),x.push(b.envMapMode),x.push(b.envMapCubeUVHeight),x.push(b.mapUv),x.push(b.alphaMapUv),x.push(b.lightMapUv),x.push(b.aoMapUv),x.push(b.bumpMapUv),x.push(b.normalMapUv),x.push(b.displacementMapUv),x.push(b.emissiveMapUv),x.push(b.metalnessMapUv),x.push(b.roughnessMapUv),x.push(b.anisotropyMapUv),x.push(b.clearcoatMapUv),x.push(b.clearcoatNormalMapUv),x.push(b.clearcoatRoughnessMapUv),x.push(b.iridescenceMapUv),x.push(b.iridescenceThicknessMapUv),x.push(b.sheenColorMapUv),x.push(b.sheenRoughnessMapUv),x.push(b.specularMapUv),x.push(b.specularColorMapUv),x.push(b.specularIntensityMapUv),x.push(b.transmissionMapUv),x.push(b.thicknessMapUv),x.push(b.combine),x.push(b.fogExp2),x.push(b.sizeAttenuation),x.push(b.morphTargetsCount),x.push(b.morphAttributeCount),x.push(b.numSunLights),x.push(b.numDirLights),x.push(b.numPointLights),x.push(b.numSpotLights),x.push(b.numSpotLightMaps),x.push(b.numHemiLights),x.push(b.numRectAreaLights),x.push(b.numSunLightShadows),x.push(b.numDirLightShadows),x.push(b.numPointLightShadows),x.push(b.numSpotLightShadows),x.push(b.numSpotLightShadowsWithMaps),x.push(b.numLightProbes),x.push(b.shadowMapType),x.push(b.toneMapping),x.push(b.numClippingPlanes),x.push(b.numClipIntersection),x.push(b.depthPacking)}function S(x,b){a.disableAll(),b.instancing&&a.enable(0),b.instancingColor&&a.enable(1),b.instancingMorph&&a.enable(2),b.matcap&&a.enable(3),b.envMap&&a.enable(4),b.normalMapObjectSpace&&a.enable(5),b.normalMapTangentSpace&&a.enable(6),b.clearcoat&&a.enable(7),b.iridescence&&a.enable(8),b.alphaTest&&a.enable(9),b.vertexColors&&a.enable(10),b.vertexAlphas&&a.enable(11),b.vertexUv1s&&a.enable(12),b.vertexUv2s&&a.enable(13),b.vertexUv3s&&a.enable(14),b.vertexTangents&&a.enable(15),b.anisotropy&&a.enable(16),b.alphaHash&&a.enable(17),b.batching&&a.enable(18),b.dispersion&&a.enable(19),b.retroreflection&&a.enable(24),b.batchingColor&&a.enable(20),b.gradientMap&&a.enable(21),b.packedNormalMap&&a.enable(22),b.vertexNormals&&a.enable(23),x.push(a.mask),a.disableAll(),b.fog&&a.enable(0),b.useFog&&a.enable(1),b.flatShading&&a.enable(2),b.logarithmicDepthBuffer&&a.enable(3),b.reversedDepthBuffer&&a.enable(4),b.skinning&&a.enable(5),b.morphTargets&&a.enable(6),b.morphNormals&&a.enable(7),b.morphColors&&a.enable(8),b.premultipliedAlpha&&a.enable(9),b.shadowMapEnabled&&a.enable(10),b.doubleSided&&a.enable(11),b.flipSided&&a.enable(12),b.useDepthPacking&&a.enable(13),b.dithering&&a.enable(14),b.transmission&&a.enable(15),b.sheen&&a.enable(16),b.opaque&&a.enable(17),b.pointsUvs&&a.enable(18),b.decodeVideoTexture&&a.enable(19),b.decodeVideoTextureEmissive&&a.enable(20),b.alphaToCoverage&&a.enable(21),b.numLightProbeGrids>0&&a.enable(22),b.hasPositionAttribute&&a.enable(23),x.push(a.mask)}function C(x){let b=d[x.type],M;if(b){let E=kn[b];M=mn.clone(E.uniforms)}else M=x.uniforms;return M}function v(x,b){let M=h.get(b);return M!==void 0?++M.usedTimes:(M=new Fg(i,b,x,s),c.push(M),h.set(b,M)),M}function T(x){if(--x.usedTimes===0){let b=c.indexOf(x);c[b]=c[c.length-1],c.pop(),h.delete(x.cacheKey),x.destroy()}}function A(x){o.remove(x)}function P(){o.dispose()}return{getParameters:w,getProgramCacheKey:m,getUniforms:C,acquireProgram:v,releaseProgram:T,releaseShaderCache:A,programs:c,dispose:P}}function zg(){let i=new WeakMap;function t(a){return i.has(a)}function e(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,l){i.get(a)[o]=l}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function Vg(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.materialVariant!==t.materialVariant?i.materialVariant-t.materialVariant:i.z!==t.z?i.z-t.z:i.id-t.id}function Su(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function bu(){let i=[],t=0,e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function a(u){let d=0;return u.isInstancedMesh&&(d+=2),u.isSkinnedMesh&&(d+=1),d}function o(u,d,g,w,m,p){let S=i[t];return S===void 0?(S={id:u.id,object:u,geometry:d,material:g,materialVariant:a(u),groupOrder:w,renderOrder:u.renderOrder,z:m,group:p},i[t]=S):(S.id=u.id,S.object=u,S.geometry=d,S.material=g,S.materialVariant=a(u),S.groupOrder=w,S.renderOrder=u.renderOrder,S.z=m,S.group=p),t++,S}function l(u,d,g,w,m,p,S){S.reversedDepth===!0&&(m=-m);let C=o(u,d,g,w,m,p);g.transmission>0?n.push(C):g.transparent===!0?s.push(C):e.push(C)}function c(u,d,g,w,m,p){let S=o(u,d,g,w,m,p);g.transmission>0?n.unshift(S):g.transparent===!0?s.unshift(S):e.unshift(S)}function h(u,d){e.length>1&&e.sort(u||Vg),n.length>1&&n.sort(d||Su),s.length>1&&s.sort(d||Su)}function f(){for(let u=t,d=i.length;u<d;u++){let g=i[u];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:l,unshift:c,finish:f,sort:h}}function Gg(){let i=new WeakMap;function t(n,s){let r=i.get(n),a;return r===void 0?(a=new bu,i.set(n,[a])):s>=r.length?(a=new bu,r.push(a)):a=r[s],a}function e(){i=new WeakMap}return{get:t,dispose:e}}function Hg(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={direction:new V,color:new qt};break;case"SpotLight":e={position:new V,direction:new V,color:new qt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new V,color:new qt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new V,skyColor:new qt,groundColor:new qt};break;case"RectAreaLight":e={color:new qt,position:new V,halfWidth:new V,halfHeight:new V};break}return i[t.id]=e,e}}}function Wg(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Xt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Xt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Xt,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}var Xg=0;function qg(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function Yg(i){let t=new Hg,e=Wg(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new V);let s=new V,r=new ve,a=new ve;function o(c){let h=0,f=0,u=0;for(let L=0;L<9;L++)n.probe[L].set(0,0,0);let d=0,g=0,w=0,m=0,p=0,S=0,C=0,v=0,T=0,A=0,P=0,x=0,b=0,M=0;c.sort(qg);for(let L=0,N=c.length;L<N;L++){let I=c[L],F=I.color,q=I.intensity,W=I.distance,st=null;if(I.shadow&&I.shadow.map&&(I.shadow.map.texture.format===Ti?st=I.shadow.map.texture:st=I.shadow.map.depthTexture||I.shadow.map.texture),I.isAmbientLight)h+=F.r*q,f+=F.g*q,u+=F.b*q;else if(I.isLightProbe){for(let Y=0;Y<9;Y++)n.probe[Y].addScaledVector(I.sh.coefficients[Y],q);M++}else if(I.isSunLight){let Y=t.get(I);if(Y.color.copy(I.color).multiplyScalar(I.intensity),I.castShadow){let Q=I.shadow,tt=e.get(I);tt.shadowIntensity=Q.intensity,tt.shadowBias=Q.bias,tt.shadowNormalBias=Q.normalBias,tt.shadowRadius=Q.radius,tt.shadowMapSize.copy(Q.mapSize).multiply(Q.getFrameExtents()),n.sunShadow[g]=tt,n.sunShadowMap[g]=st;let J=Q.getViewportCount();for(let U=0;U<J;U++)n.sunShadowMatrix[w+U]=Q.getMatrix(U),n.sunShadowCascade[w+U]=Q._cascadeData[U];w+=J,g++}n.sun[d]=Y,d++}else if(I.isDirectionalLight){let Y=t.get(I);if(Y.color.copy(I.color).multiplyScalar(I.intensity),I.castShadow){let Q=I.shadow,tt=e.get(I);tt.shadowIntensity=Q.intensity,tt.shadowBias=Q.bias,tt.shadowNormalBias=Q.normalBias,tt.shadowRadius=Q.radius,tt.shadowMapSize=Q.mapSize,n.directionalShadow[m]=tt,n.directionalShadowMap[m]=st,n.directionalShadowMatrix[m]=I.shadow.matrix,T++}n.directional[m]=Y,m++}else if(I.isSpotLight){let Y=t.get(I);Y.position.setFromMatrixPosition(I.matrixWorld),Y.color.copy(F).multiplyScalar(q),Y.distance=W,Y.coneCos=Math.cos(I.angle),Y.penumbraCos=Math.cos(I.angle*(1-I.penumbra)),Y.decay=I.decay,n.spot[S]=Y;let Q=I.shadow;if(I.map&&(n.spotLightMap[x]=I.map,x++,Q.updateMatrices(I),I.castShadow&&b++),n.spotLightMatrix[S]=Q.matrix,I.castShadow){let tt=e.get(I);tt.shadowIntensity=Q.intensity,tt.shadowBias=Q.bias,tt.shadowNormalBias=Q.normalBias,tt.shadowRadius=Q.radius,tt.shadowMapSize=Q.mapSize,n.spotShadow[S]=tt,n.spotShadowMap[S]=st,P++}S++}else if(I.isRectAreaLight){let Y=t.get(I);Y.color.copy(F).multiplyScalar(q),Y.halfWidth.set(I.width*.5,0,0),Y.halfHeight.set(0,I.height*.5,0),n.rectArea[C]=Y,C++}else if(I.isPointLight){let Y=t.get(I);if(Y.color.copy(I.color).multiplyScalar(I.intensity),Y.distance=I.distance,Y.decay=I.decay,I.castShadow){let Q=I.shadow,tt=e.get(I);tt.shadowIntensity=Q.intensity,tt.shadowBias=Q.bias,tt.shadowNormalBias=Q.normalBias,tt.shadowRadius=Q.radius,tt.shadowMapSize=Q.mapSize,tt.shadowCameraNear=Q.camera.near,tt.shadowCameraFar=Q.camera.far,n.pointShadow[p]=tt,n.pointShadowMap[p]=st,n.pointShadowMatrix[p]=I.shadow.matrix,A++}n.point[p]=Y,p++}else if(I.isHemisphereLight){let Y=t.get(I);Y.skyColor.copy(I.color).multiplyScalar(q),Y.groundColor.copy(I.groundColor).multiplyScalar(q),n.hemi[v]=Y,v++}}C>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=yt.LTC_FLOAT_1,n.rectAreaLTC2=yt.LTC_FLOAT_2):(n.rectAreaLTC1=yt.LTC_HALF_1,n.rectAreaLTC2=yt.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=f,n.ambient[2]=u;let E=n.hash;(E.sunLength!==d||E.directionalLength!==m||E.pointLength!==p||E.spotLength!==S||E.rectAreaLength!==C||E.hemiLength!==v||E.numSunShadows!==g||E.numDirectionalShadows!==T||E.numPointShadows!==A||E.numSpotShadows!==P||E.numSpotMaps!==x||E.numLightProbes!==M)&&(n.sun.length=d,n.directional.length=m,n.spot.length=S,n.rectArea.length=C,n.point.length=p,n.hemi.length=v,n.sunShadow.length=g,n.sunShadowMap.length=g,n.sunShadowMatrix.length=w,n.sunShadowCascade.length=w,n.directionalShadow.length=T,n.directionalShadowMap.length=T,n.directionalShadowMatrix.length=T,n.pointShadow.length=A,n.pointShadowMap.length=A,n.pointShadowMatrix.length=A,n.spotShadow.length=P,n.spotShadowMap.length=P,n.spotLightMatrix.length=P+x-b,n.spotLightMap.length=x,n.numSpotLightShadowsWithMaps=b,n.numLightProbes=M,E.sunLength=d,E.directionalLength=m,E.pointLength=p,E.spotLength=S,E.rectAreaLength=C,E.hemiLength=v,E.numSunShadows=g,E.numDirectionalShadows=T,E.numPointShadows=A,E.numSpotShadows=P,E.numSpotMaps=x,E.numLightProbes=M,n.version=Xg++)}function l(c,h){let f=0,u=0,d=0,g=0,w=0,m=0,p=h.matrixWorldInverse;for(let S=0,C=c.length;S<C;S++){let v=c[S];if(v.isSunLight){let T=n.sun[f];T.direction.setFromMatrixPosition(v.matrixWorld),T.direction.transformDirection(p),f++}else if(v.isDirectionalLight){let T=n.directional[u];T.direction.setFromMatrixPosition(v.matrixWorld),s.setFromMatrixPosition(v.target.matrixWorld),T.direction.sub(s),T.direction.transformDirection(p),u++}else if(v.isSpotLight){let T=n.spot[g];T.position.setFromMatrixPosition(v.matrixWorld),T.position.applyMatrix4(p),T.direction.setFromMatrixPosition(v.matrixWorld),s.setFromMatrixPosition(v.target.matrixWorld),T.direction.sub(s),T.direction.transformDirection(p),g++}else if(v.isRectAreaLight){let T=n.rectArea[w];T.position.setFromMatrixPosition(v.matrixWorld),T.position.applyMatrix4(p),a.identity(),r.copy(v.matrixWorld),r.premultiply(p),a.extractRotation(r),T.halfWidth.set(v.width*.5,0,0),T.halfHeight.set(0,v.height*.5,0),T.halfWidth.applyMatrix4(a),T.halfHeight.applyMatrix4(a),w++}else if(v.isPointLight){let T=n.point[d];T.position.setFromMatrixPosition(v.matrixWorld),T.position.applyMatrix4(p),d++}else if(v.isHemisphereLight){let T=n.hemi[m];T.direction.setFromMatrixPosition(v.matrixWorld),T.direction.transformDirection(p),m++}}}return{setup:o,setupView:l,state:n}}function Tu(i){let t=new Yg(i),e=[],n=[],s=[];function r(u){f.camera=u,e.length=0,n.length=0,s.length=0}function a(u){e.push(u)}function o(u){n.push(u)}function l(u){s.push(u)}function c(){t.setup(e)}function h(u){t.setupView(e,u)}let f={lightsArray:e,shadowsArray:n,lightProbeGridArray:s,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:f,setupLights:c,setupLightsView:h,pushLight:a,pushShadow:o,pushLightProbeGrid:l}}function Zg(i){let t=new WeakMap;function e(s,r=0){let a=t.get(s),o;return a===void 0?(o=new Tu(i),t.set(s,[o])):r>=a.length?(o=new Tu(i),a.push(o)):o=a[r],o}function n(){t=new WeakMap}return{get:e,dispose:n}}var Jg=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,$g=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,Kg=[new V(1,0,0),new V(-1,0,0),new V(0,1,0),new V(0,-1,0),new V(0,0,1),new V(0,0,-1)],Qg=[new V(0,-1,0),new V(0,-1,0),new V(0,0,1),new V(0,0,-1),new V(0,-1,0),new V(0,-1,0)],wu=new ve,vr=new V,cc=new V;function jg(i,t,e){let n=new Zs,s=new Xt,r=new Xt,a=new he,o=new ba,l=new Ta,c={},h=e.maxTextureSize,f={[yi]:qe,[qe]:yi,[On]:On},u=new ge({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Xt},radius:{value:4}},vertexShader:Jg,fragmentShader:$g}),d=u.clone();d.defines.HORIZONTAL_PASS=1;let g=new Xe;g.setAttribute("position",new ke(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let w=new Ke(g,u),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=nr;let p=this.type;this.render=function(A,P,x){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||A.length===0)return;this.type===yh&&(Ht("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=nr);let b=i.getRenderTarget(),M=i.getActiveCubeFace(),E=i.getActiveMipmapLevel(),L=i.state;L.setBlending(Qe),L.buffers.depth.getReversed()===!0?L.buffers.color.setClear(0,0,0,0):L.buffers.color.setClear(1,1,1,1),L.buffers.depth.setTest(!0),L.setScissorTest(!1);let N=p!==this.type;N&&P.traverse(function(I){I.material&&(Array.isArray(I.material)?I.material.forEach(F=>F.needsUpdate=!0):I.material.needsUpdate=!0)});for(let I=0,F=A.length;I<F;I++){let q=A[I],W=q.shadow;if(W===void 0){Ht("WebGLShadowMap:",q,"has no shadow.");continue}if(W.autoUpdate===!1&&W.needsUpdate===!1)continue;s.copy(W.mapSize);let st=W.getFrameExtents();s.multiply(st),r.copy(W.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/st.x),s.x=r.x*st.x,W.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/st.y),s.y=r.y*st.y,W.mapSize.y=r.y));let Y=i.state.buffers.depth.getReversed();if(W.camera._reversedDepth=Y,W.map===null||N===!0){if(W.map!==null&&(W.map.depthTexture!==null&&(W.map.depthTexture.dispose(),W.map.depthTexture=null),W.map.dispose()),this.type===ds){if(q.isPointLight){Ht("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}W.map=new Se(s.x,s.y,{format:Ti,type:Ce,minFilter:De,magFilter:De,generateMipmaps:!1}),W.map.texture.name=q.name+".shadowMap",W.map.depthTexture=new gi(s.x,s.y,un),W.map.depthTexture.name=q.name+".shadowMapDepth",W.map.depthTexture.format=Nn,W.map.depthTexture.compareFunction=null,W.map.depthTexture.minFilter=Me,W.map.depthTexture.magFilter=Me}else q.isPointLight?(W.map=new Ro(s.x),W.map.depthTexture=new Sa(s.x,Tn)):(W.map=new Se(s.x,s.y),W.map.depthTexture=new gi(s.x,s.y,Tn)),W.map.depthTexture.name=q.name+".shadowMap",W.map.depthTexture.format=Nn,this.type===nr?(W.map.depthTexture.compareFunction=Y?wo:To,W.map.depthTexture.minFilter=De,W.map.depthTexture.magFilter=De):(W.map.depthTexture.compareFunction=null,W.map.depthTexture.minFilter=Me,W.map.depthTexture.magFilter=Me);W.camera.updateProjectionMatrix()}W.map.isWebGLCubeRenderTarget!==!0&&(W.map.width!==s.x||W.map.height!==s.y)&&W.map.setSize(s.x,s.y);let Q=W.map.isWebGLCubeRenderTarget?6:W.getViewportCount();q.isPointLight!==!0&&W.updateMatrices(q,x);for(let tt=0;tt<Q;tt++){let J=W.getCamera(tt);if(q.isPointLight){let U=W.camera,K=W.matrix,at=q.distance||U.far;at!==U.far&&(U.far=at,U.updateProjectionMatrix()),vr.setFromMatrixPosition(q.matrixWorld),U.position.copy(vr),cc.copy(U.position),cc.add(Kg[tt]),U.up.copy(Qg[tt]),U.lookAt(cc),U.updateMatrixWorld(),K.makeTranslation(-vr.x,-vr.y,-vr.z),wu.multiplyMatrices(U.projectionMatrix,U.matrixWorldInverse),W._frustum.setFromProjectionMatrix(wu,U.coordinateSystem,U.reversedDepth)}if(W.map.isWebGLCubeRenderTarget)i.setRenderTarget(W.map,tt),i.clear();else{tt===0&&(i.setRenderTarget(W.map),i.clear());let U=W.getViewport(tt);a.set(r.x*U.x,r.y*U.y,r.x*U.z,r.y*U.w),L.viewport(a)}n=W.getFrustum(tt),v(P,x,J,q,this.type)}W.isPointLightShadow!==!0&&this.type===ds&&S(W,x),W.needsUpdate=!1}p=this.type,m.needsUpdate=!1,i.setRenderTarget(b,M,E)};function S(A,P){let x=t.update(w);u.defines.VSM_SAMPLES!==A.blurSamples&&(u.defines.VSM_SAMPLES=A.blurSamples,d.defines.VSM_SAMPLES=A.blurSamples,u.needsUpdate=!0,d.needsUpdate=!0),A.mapPass===null?A.mapPass=new Se(s.x,s.y,{format:Ti,type:Ce}):(A.mapPass.width!==A.map.width||A.mapPass.height!==A.map.height)&&A.mapPass.setSize(A.map.width,A.map.height),u.uniforms.shadow_pass.value=A.map.depthTexture,u.uniforms.resolution.value.set(A.map.width,A.map.height),u.uniforms.radius.value=A.radius,i.setRenderTarget(A.mapPass),i.clear(),i.renderBufferDirect(P,null,x,u,w,null),d.uniforms.shadow_pass.value=A.mapPass.texture,d.uniforms.resolution.value.set(A.map.width,A.map.height),d.uniforms.radius.value=A.radius,i.setRenderTarget(A.map),i.clear(),i.renderBufferDirect(P,null,x,d,w,null)}function C(A,P,x,b){let M=null,E=x.isPointLight===!0?A.customDistanceMaterial:A.customDepthMaterial;if(E!==void 0)M=E;else if(M=x.isPointLight===!0?l:o,i.localClippingEnabled&&P.clipShadows===!0&&Array.isArray(P.clippingPlanes)&&P.clippingPlanes.length!==0||P.displacementMap&&P.displacementScale!==0||P.alphaMap&&P.alphaTest>0||P.map&&P.alphaTest>0||P.alphaToCoverage===!0){let L=M.uuid,N=P.uuid,I=c[L];I===void 0&&(I={},c[L]=I);let F=I[N];F===void 0&&(F=M.clone(),I[N]=F,P.addEventListener("dispose",T)),M=F}if(M.visible=P.visible,M.wireframe=P.wireframe,b===ds?M.side=P.shadowSide!==null?P.shadowSide:P.side:M.side=P.shadowSide!==null?P.shadowSide:f[P.side],M.alphaMap=P.alphaMap,M.alphaTest=P.alphaToCoverage===!0?.5:P.alphaTest,M.map=P.map,M.clipShadows=P.clipShadows,M.clippingPlanes=P.clippingPlanes,M.clipIntersection=P.clipIntersection,M.displacementMap=P.displacementMap,M.displacementScale=P.displacementScale,M.displacementBias=P.displacementBias,M.wireframeLinewidth=P.wireframeLinewidth,M.linewidth=P.linewidth,x.isPointLight===!0&&M.isMeshDistanceMaterial===!0){let L=i.properties.get(M);L.light=x}return M}function v(A,P,x,b,M){if(A.visible===!1)return;if(A.layers.test(P.layers)&&(A.isMesh||A.isLine||A.isPoints)&&(A.castShadow||A.receiveShadow&&M===ds)&&(!A.frustumCulled||A.intersectsFrustum(n))){A.modelViewMatrix.multiplyMatrices(x.matrixWorldInverse,A.matrixWorld);let N=t.update(A),I=A.material;if(Array.isArray(I)){let F=N.groups;for(let q=0,W=F.length;q<W;q++){let st=F[q],Y=I[st.materialIndex];if(Y&&Y.visible){let Q=C(A,Y,b,M);A.onBeforeShadow(i,A,P,x,N,Q,st),i.renderBufferDirect(x,null,N,Q,A,st),A.onAfterShadow(i,A,P,x,N,Q,st)}}}else if(I.visible){let F=C(A,I,b,M);A.onBeforeShadow(i,A,P,x,N,F,null),i.renderBufferDirect(x,null,N,F,A,null),A.onAfterShadow(i,A,P,x,N,F,null)}}let L=A.children;for(let N=0,I=L.length;N<I;N++)v(L[N],P,x,b,M)}function T(A){A.target.removeEventListener("dispose",T);for(let x in c){let b=c[x],M=A.target.uuid;M in b&&(b[M].dispose(),delete b[M])}}}function t_(i,t){function e(){let B=!1,_t=new he,rt=null,xt=new he(0,0,0,0);return{setMask:function(At){rt!==At&&!B&&(i.colorMask(At,At,At,At),rt=At)},setLocked:function(At){B=At},setClear:function(At,lt,kt,Lt,pe){pe===!0&&(At*=Lt,lt*=Lt,kt*=Lt),_t.set(At,lt,kt,Lt),xt.equals(_t)===!1&&(i.clearColor(At,lt,kt,Lt),xt.copy(_t))},reset:function(){B=!1,rt=null,xt.set(-1,0,0,0)}}}function n(){let B=!1,_t=!1,rt=null,xt=null,At=null;return{setReversed:function(lt){if(_t!==lt){let kt=t.get("EXT_clip_control");lt?kt.clipControlEXT(kt.LOWER_LEFT_EXT,kt.ZERO_TO_ONE_EXT):kt.clipControlEXT(kt.LOWER_LEFT_EXT,kt.NEGATIVE_ONE_TO_ONE_EXT),_t=lt;let Lt=At;At=null,this.setClear(Lt)}},getReversed:function(){return _t},setTest:function(lt){lt?j(i.DEPTH_TEST):ht(i.DEPTH_TEST)},setMask:function(lt){rt!==lt&&!B&&(i.depthMask(lt),rt=lt)},setFunc:function(lt){if(_t&&(lt=eu[lt]),xt!==lt){switch(lt){case la:i.depthFunc(i.NEVER);break;case ca:i.depthFunc(i.ALWAYS);break;case ha:i.depthFunc(i.LESS);break;case rs:i.depthFunc(i.LEQUAL);break;case ua:i.depthFunc(i.EQUAL);break;case fa:i.depthFunc(i.GEQUAL);break;case da:i.depthFunc(i.GREATER);break;case pa:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}xt=lt}},setLocked:function(lt){B=lt},setClear:function(lt){At!==lt&&(At=lt,_t&&(lt=1-lt),i.clearDepth(lt))},reset:function(){B=!1,rt=null,xt=null,At=null,_t=!1}}}function s(){let B=!1,_t=null,rt=null,xt=null,At=null,lt=null,kt=null,Lt=null,pe=null;return{setTest:function(le){B||(le?j(i.STENCIL_TEST):ht(i.STENCIL_TEST))},setMask:function(le){_t!==le&&!B&&(i.stencilMask(le),_t=le)},setFunc:function(le,xn,Pn){(rt!==le||xt!==xn||At!==Pn)&&(i.stencilFunc(le,xn,Pn),rt=le,xt=xn,At=Pn)},setOp:function(le,xn,Pn){(lt!==le||kt!==xn||Lt!==Pn)&&(i.stencilOp(le,xn,Pn),lt=le,kt=xn,Lt=Pn)},setLocked:function(le){B=le},setClear:function(le){pe!==le&&(i.clearStencil(le),pe=le)},reset:function(){B=!1,_t=null,rt=null,xt=null,At=null,lt=null,kt=null,Lt=null,pe=null}}}let r=new e,a=new n,o=new s,l=new WeakMap,c=new WeakMap,h={},f={},u={},d=new WeakMap,g=[],w=null,m=!1,p=null,S=null,C=null,v=null,T=null,A=null,P=null,x=new qt(0,0,0),b=0,M=!1,E=null,L=null,N=null,I=null,F=null,q=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),W=!1,st=0,Y=i.getParameter(i.VERSION);Y.indexOf("WebGL")!==-1?(st=parseFloat(/^WebGL (\d)/.exec(Y)[1]),W=st>=1):Y.indexOf("OpenGL ES")!==-1&&(st=parseFloat(/^OpenGL ES (\d)/.exec(Y)[1]),W=st>=2);let Q=null,tt={},J=i.getParameter(i.SCISSOR_BOX),U=i.getParameter(i.VIEWPORT),K=new he().fromArray(J),at=new he().fromArray(U);function Tt(B,_t,rt,xt){let At=new Uint8Array(4),lt=i.createTexture();i.bindTexture(B,lt),i.texParameteri(B,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(B,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let kt=0;kt<rt;kt++)B===i.TEXTURE_3D||B===i.TEXTURE_2D_ARRAY?i.texImage3D(_t,0,i.RGBA,1,1,xt,0,i.RGBA,i.UNSIGNED_BYTE,At):i.texImage2D(_t+kt,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,At);return lt}let X={};X[i.TEXTURE_2D]=Tt(i.TEXTURE_2D,i.TEXTURE_2D,1),X[i.TEXTURE_CUBE_MAP]=Tt(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),X[i.TEXTURE_2D_ARRAY]=Tt(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),X[i.TEXTURE_3D]=Tt(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),j(i.DEPTH_TEST),a.setFunc(rs),ct(!1),Nt(Pl),j(i.CULL_FACE),wt(Qe);function j(B){h[B]!==!0&&(i.enable(B),h[B]=!0)}function ht(B){h[B]!==!1&&(i.disable(B),h[B]=!1)}function Vt(B,_t){return u[B]!==_t?(i.bindFramebuffer(B,_t),u[B]=_t,B===i.DRAW_FRAMEBUFFER&&(u[i.FRAMEBUFFER]=_t),B===i.FRAMEBUFFER&&(u[i.DRAW_FRAMEBUFFER]=_t),!0):!1}function ut(B,_t){let rt=g,xt=!1;if(B){rt=d.get(_t),rt===void 0&&(rt=[],d.set(_t,rt));let At=B.textures;if(rt.length!==At.length||rt[0]!==i.COLOR_ATTACHMENT0){for(let lt=0,kt=At.length;lt<kt;lt++)rt[lt]=i.COLOR_ATTACHMENT0+lt;rt.length=At.length,xt=!0}}else rt[0]!==i.BACK&&(rt[0]=i.BACK,xt=!0);xt&&i.drawBuffers(rt)}function Ft(B){return w!==B?(i.useProgram(B),w=B,!0):!1}let de={[Fi]:i.FUNC_ADD,[Sh]:i.FUNC_SUBTRACT,[bh]:i.FUNC_REVERSE_SUBTRACT};de[Th]=i.MIN,de[wh]=i.MAX;let nt={[Ah]:i.ZERO,[Eh]:i.ONE,[Ch]:i.SRC_COLOR,[Dl]:i.SRC_ALPHA,[Nh]:i.SRC_ALPHA_SATURATE,[Lh]:i.DST_COLOR,[Ph]:i.DST_ALPHA,[Rh]:i.ONE_MINUS_SRC_COLOR,[Nl]:i.ONE_MINUS_SRC_ALPHA,[Dh]:i.ONE_MINUS_DST_COLOR,[Ih]:i.ONE_MINUS_DST_ALPHA,[Uh]:i.CONSTANT_COLOR,[Fh]:i.ONE_MINUS_CONSTANT_COLOR,[Oh]:i.CONSTANT_ALPHA,[Bh]:i.ONE_MINUS_CONSTANT_ALPHA};function wt(B,_t,rt,xt,At,lt,kt,Lt,pe,le){if(B===Qe){m===!0&&(ht(i.BLEND),m=!1);return}if(m===!1&&(j(i.BLEND),m=!0),B!==Mh){if(B!==p||le!==M){if((S!==Fi||T!==Fi)&&(i.blendEquation(i.FUNC_ADD),S=Fi,T=Fi),le)switch(B){case ps:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Ui:i.blendFunc(i.ONE,i.ONE);break;case Il:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Ll:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:Wt("WebGLState: Invalid blending: ",B);break}else switch(B){case ps:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Ui:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case Il:Wt("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Ll:Wt("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Wt("WebGLState: Invalid blending: ",B);break}C=null,v=null,A=null,P=null,x.set(0,0,0),b=0,p=B,M=le}return}At=At||_t,lt=lt||rt,kt=kt||xt,(_t!==S||At!==T)&&(i.blendEquationSeparate(de[_t],de[At]),S=_t,T=At),(rt!==C||xt!==v||lt!==A||kt!==P)&&(i.blendFuncSeparate(nt[rt],nt[xt],nt[lt],nt[kt]),C=rt,v=xt,A=lt,P=kt),(Lt.equals(x)===!1||pe!==b)&&(i.blendColor(Lt.r,Lt.g,Lt.b,pe),x.copy(Lt),b=pe),p=B,M=!1}function St(B,_t){B.side===On?ht(i.CULL_FACE):j(i.CULL_FACE);let rt=B.side===qe;_t&&(rt=!rt),ct(rt),B.blending===ps&&B.transparent===!1?wt(Qe):wt(B.blending,B.blendEquation,B.blendSrc,B.blendDst,B.blendEquationAlpha,B.blendSrcAlpha,B.blendDstAlpha,B.blendColor,B.blendAlpha,B.premultipliedAlpha),a.setFunc(B.depthFunc),a.setTest(B.depthTest),a.setMask(B.depthWrite),r.setMask(B.colorWrite);let xt=B.stencilWrite;o.setTest(xt),xt&&(o.setMask(B.stencilWriteMask),o.setFunc(B.stencilFunc,B.stencilRef,B.stencilFuncMask),o.setOp(B.stencilFail,B.stencilZFail,B.stencilZPass)),se(B.polygonOffset,B.polygonOffsetFactor,B.polygonOffsetUnits),B.alphaToCoverage===!0?j(i.SAMPLE_ALPHA_TO_COVERAGE):ht(i.SAMPLE_ALPHA_TO_COVERAGE)}function ct(B){E!==B&&(B?i.frontFace(i.CW):i.frontFace(i.CCW),E=B)}function Nt(B){B!==xh?(j(i.CULL_FACE),B!==L&&(B===Pl?i.cullFace(i.BACK):B===vh?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):ht(i.CULL_FACE),L=B}function Zt(B){B!==N&&(W&&i.lineWidth(B),N=B)}function se(B,_t,rt){B?(j(i.POLYGON_OFFSET_FILL),(I!==_t||F!==rt)&&(I=_t,F=rt,a.getReversed()&&(_t=-_t),i.polygonOffset(_t,rt))):ht(i.POLYGON_OFFSET_FILL)}function Et(B){B?j(i.SCISSOR_TEST):ht(i.SCISSOR_TEST)}function Jt(B){B===void 0&&(B=i.TEXTURE0+q-1),Q!==B&&(i.activeTexture(B),Q=B)}function D(B,_t,rt){rt===void 0&&(Q===null?rt=i.TEXTURE0+q-1:rt=Q);let xt=tt[rt];xt===void 0&&(xt={type:void 0,texture:void 0},tt[rt]=xt),(xt.type!==B||xt.texture!==_t)&&(Q!==rt&&(i.activeTexture(rt),Q=rt),i.bindTexture(B,_t||X[B]),xt.type=B,xt.texture=_t)}function re(){let B=tt[Q];B!==void 0&&B.type!==void 0&&(i.bindTexture(B.type,null),B.type=void 0,B.texture=void 0)}function zt(){try{i.compressedTexImage2D(...arguments)}catch(B){Wt("WebGLState:",B)}}function R(){try{i.compressedTexImage3D(...arguments)}catch(B){Wt("WebGLState:",B)}}function _(){try{i.texSubImage2D(...arguments)}catch(B){Wt("WebGLState:",B)}}function k(){try{i.texSubImage3D(...arguments)}catch(B){Wt("WebGLState:",B)}}function z(){try{i.compressedTexSubImage2D(...arguments)}catch(B){Wt("WebGLState:",B)}}function $(){try{i.compressedTexSubImage3D(...arguments)}catch(B){Wt("WebGLState:",B)}}function ft(){try{i.texStorage2D(...arguments)}catch(B){Wt("WebGLState:",B)}}function pt(){try{i.texStorage3D(...arguments)}catch(B){Wt("WebGLState:",B)}}function it(){try{i.texImage2D(...arguments)}catch(B){Wt("WebGLState:",B)}}function ot(){try{i.texImage3D(...arguments)}catch(B){Wt("WebGLState:",B)}}function mt(B){return f[B]!==void 0?f[B]:i.getParameter(B)}function Ot(B,_t){f[B]!==_t&&(i.pixelStorei(B,_t),f[B]=_t)}function vt(B){K.equals(B)===!1&&(i.scissor(B.x,B.y,B.z,B.w),K.copy(B))}function gt(B){at.equals(B)===!1&&(i.viewport(B.x,B.y,B.z,B.w),at.copy(B))}function Bt(B,_t){let rt=c.get(_t);rt===void 0&&(rt=new WeakMap,c.set(_t,rt));let xt=rt.get(B);xt===void 0&&(xt=i.getUniformBlockIndex(_t,B.name),rt.set(B,xt))}function Gt(B,_t){let xt=c.get(_t).get(B);l.get(_t)!==xt&&(i.uniformBlockBinding(_t,xt,B.__bindingPointIndex),l.set(_t,xt))}function $t(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),h={},f={},Q=null,tt={},u={},d=new WeakMap,g=[],w=null,m=!1,p=null,S=null,C=null,v=null,T=null,A=null,P=null,x=new qt(0,0,0),b=0,M=!1,E=null,L=null,N=null,I=null,F=null,K.set(0,0,i.canvas.width,i.canvas.height),at.set(0,0,i.canvas.width,i.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:j,disable:ht,bindFramebuffer:Vt,drawBuffers:ut,useProgram:Ft,setBlending:wt,setMaterial:St,setFlipSided:ct,setCullFace:Nt,setLineWidth:Zt,setPolygonOffset:se,setScissorTest:Et,activeTexture:Jt,bindTexture:D,unbindTexture:re,compressedTexImage2D:zt,compressedTexImage3D:R,texImage2D:it,texImage3D:ot,pixelStorei:Ot,getParameter:mt,updateUBOMapping:Bt,uniformBlockBinding:Gt,texStorage2D:ft,texStorage3D:pt,texSubImage2D:_,texSubImage3D:k,compressedTexSubImage2D:z,compressedTexSubImage3D:$,scissor:vt,viewport:gt,reset:$t}}function e_(i,t,e,n,s,r,a){let o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Xt,h=new WeakMap,f=new Set,u,d=new WeakMap,g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function w(R,_){return g?new OffscreenCanvas(R,_):Vs("canvas")}function m(R,_,k){let z=1,$=zt(R);if(($.width>k||$.height>k)&&(z=k/Math.max($.width,$.height)),z<1)if(typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&R instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&R instanceof ImageBitmap||typeof VideoFrame<"u"&&R instanceof VideoFrame){let ft=Math.floor(z*$.width),pt=Math.floor(z*$.height);u===void 0&&(u=w(ft,pt));let it=_?w(ft,pt):u;return it.width=ft,it.height=pt,it.getContext("2d").drawImage(R,0,0,ft,pt),Ht("WebGLRenderer: Texture has been resized from ("+$.width+"x"+$.height+") to ("+ft+"x"+pt+")."),it}else return"data"in R&&Ht("WebGLRenderer: Image in DataTexture is too big ("+$.width+"x"+$.height+")."),R;return R}function p(R){return R.generateMipmaps}function S(R){i.generateMipmap(R)}function C(R){return R.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:R.isWebGL3DRenderTarget?i.TEXTURE_3D:R.isWebGLArrayRenderTarget||R.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function v(R,_,k,z,$,ft=!1){if(R!==null){if(i[R]!==void 0)return i[R];Ht("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+R+"'")}let pt;z&&(pt=t.get("EXT_texture_norm16"),pt||Ht("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let it=_;if(_===i.RED&&(k===i.FLOAT&&(it=i.R32F),k===i.HALF_FLOAT&&(it=i.R16F),k===i.UNSIGNED_BYTE&&(it=i.R8),k===i.UNSIGNED_SHORT&&pt&&(it=pt.R16_EXT),k===i.SHORT&&pt&&(it=pt.R16_SNORM_EXT)),_===i.RED_INTEGER&&(k===i.UNSIGNED_BYTE&&(it=i.R8UI),k===i.UNSIGNED_SHORT&&(it=i.R16UI),k===i.UNSIGNED_INT&&(it=i.R32UI),k===i.BYTE&&(it=i.R8I),k===i.SHORT&&(it=i.R16I),k===i.INT&&(it=i.R32I)),_===i.RG&&(k===i.FLOAT&&(it=i.RG32F),k===i.HALF_FLOAT&&(it=i.RG16F),k===i.UNSIGNED_BYTE&&(it=i.RG8),k===i.UNSIGNED_SHORT&&pt&&(it=pt.RG16_EXT),k===i.SHORT&&pt&&(it=pt.RG16_SNORM_EXT)),_===i.RG_INTEGER&&(k===i.UNSIGNED_BYTE&&(it=i.RG8UI),k===i.UNSIGNED_SHORT&&(it=i.RG16UI),k===i.UNSIGNED_INT&&(it=i.RG32UI),k===i.BYTE&&(it=i.RG8I),k===i.SHORT&&(it=i.RG16I),k===i.INT&&(it=i.RG32I)),_===i.RGB_INTEGER&&(k===i.UNSIGNED_BYTE&&(it=i.RGB8UI),k===i.UNSIGNED_SHORT&&(it=i.RGB16UI),k===i.UNSIGNED_INT&&(it=i.RGB32UI),k===i.BYTE&&(it=i.RGB8I),k===i.SHORT&&(it=i.RGB16I),k===i.INT&&(it=i.RGB32I)),_===i.RGBA_INTEGER&&(k===i.UNSIGNED_BYTE&&(it=i.RGBA8UI),k===i.UNSIGNED_SHORT&&(it=i.RGBA16UI),k===i.UNSIGNED_INT&&(it=i.RGBA32UI),k===i.BYTE&&(it=i.RGBA8I),k===i.SHORT&&(it=i.RGBA16I),k===i.INT&&(it=i.RGBA32I)),_===i.RGB&&(k===i.UNSIGNED_SHORT&&pt&&(it=pt.RGB16_EXT),k===i.SHORT&&pt&&(it=pt.RGB16_SNORM_EXT),k===i.UNSIGNED_INT_5_9_9_9_REV&&(it=i.RGB9_E5),k===i.UNSIGNED_INT_10F_11F_11F_REV&&(it=i.R11F_G11F_B10F)),_===i.RGBA){let ot=ft?ks:jt.getTransfer($);k===i.FLOAT&&(it=i.RGBA32F),k===i.HALF_FLOAT&&(it=i.RGBA16F),k===i.UNSIGNED_BYTE&&(it=ot===ae?i.SRGB8_ALPHA8:i.RGBA8),k===i.UNSIGNED_SHORT&&pt&&(it=pt.RGBA16_EXT),k===i.SHORT&&pt&&(it=pt.RGBA16_SNORM_EXT),k===i.UNSIGNED_SHORT_4_4_4_4&&(it=i.RGBA4),k===i.UNSIGNED_SHORT_5_5_5_1&&(it=i.RGB5_A1)}return(it===i.R16F||it===i.R32F||it===i.RG16F||it===i.RG32F||it===i.RGBA16F||it===i.RGBA32F)&&t.get("EXT_color_buffer_float"),it}function T(R,_){let k;return R?_===null||_===Tn||_===gs?k=i.DEPTH24_STENCIL8:_===un?k=i.DEPTH32F_STENCIL8:_===ms&&(k=i.DEPTH24_STENCIL8,Ht("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):_===null||_===Tn||_===gs?k=i.DEPTH_COMPONENT24:_===un?k=i.DEPTH_COMPONENT32F:_===ms&&(k=i.DEPTH_COMPONENT16),k}function A(R,_){return p(R)===!0||R.isFramebufferTexture&&R.minFilter!==Me&&R.minFilter!==De?Math.log2(Math.max(_.width,_.height))+1:R.mipmaps!==void 0&&R.mipmaps.length>0?R.mipmaps.length:R.isCompressedTexture&&Array.isArray(R.image)?_.mipmaps.length:1}function P(R){let _=R.target;_.removeEventListener("dispose",P),b(_),_.isVideoTexture&&h.delete(_),_.isHTMLTexture&&f.delete(_)}function x(R){let _=R.target;_.removeEventListener("dispose",x),E(_)}function b(R){let _=n.get(R);if(_.__webglInit===void 0)return;let k=R.source,z=d.get(k);if(z){let $=z[_.__cacheKey];$.usedTimes--,$.usedTimes===0&&M(R),Object.keys(z).length===0&&d.delete(k)}n.remove(R)}function M(R){let _=n.get(R);i.deleteTexture(_.__webglTexture);let k=R.source,z=d.get(k);delete z[_.__cacheKey],a.memory.textures--}function E(R){let _=n.get(R);if(R.depthTexture&&(R.depthTexture.dispose(),n.remove(R.depthTexture)),R.isWebGLCubeRenderTarget)for(let z=0;z<6;z++){if(Array.isArray(_.__webglFramebuffer[z]))for(let $=0;$<_.__webglFramebuffer[z].length;$++)i.deleteFramebuffer(_.__webglFramebuffer[z][$]);else i.deleteFramebuffer(_.__webglFramebuffer[z]);_.__webglDepthbuffer&&i.deleteRenderbuffer(_.__webglDepthbuffer[z])}else{if(Array.isArray(_.__webglFramebuffer))for(let z=0;z<_.__webglFramebuffer.length;z++)i.deleteFramebuffer(_.__webglFramebuffer[z]);else i.deleteFramebuffer(_.__webglFramebuffer);if(_.__webglDepthbuffer&&i.deleteRenderbuffer(_.__webglDepthbuffer),_.__webglMultisampledFramebuffer&&i.deleteFramebuffer(_.__webglMultisampledFramebuffer),_.__webglColorRenderbuffer)for(let z=0;z<_.__webglColorRenderbuffer.length;z++)_.__webglColorRenderbuffer[z]&&i.deleteRenderbuffer(_.__webglColorRenderbuffer[z]);_.__webglDepthRenderbuffer&&i.deleteRenderbuffer(_.__webglDepthRenderbuffer)}let k=R.textures;for(let z=0,$=k.length;z<$;z++){let ft=n.get(k[z]);ft.__webglTexture&&(i.deleteTexture(ft.__webglTexture),a.memory.textures--),n.remove(k[z])}n.remove(R)}let L=0;function N(){L=0}function I(){return L}function F(R){L=R}function q(){let R=L;return R>=s.maxTextures&&Ht("WebGLTextures: Trying to use "+(R+1)+" texture units while this GPU supports only "+s.maxTextures),L+=1,R}function W(R){let _=[];return _.push(R.wrapS),_.push(R.wrapT),_.push(R.wrapR||0),_.push(R.magFilter),_.push(R.minFilter),_.push(R.anisotropy),_.push(R.internalFormat),_.push(R.format),_.push(R.type),_.push(R.generateMipmaps),_.push(R.premultiplyAlpha),_.push(R.flipY),_.push(R.unpackAlignment),_.push(R.colorSpace),_.join()}function st(R,_){let k=n.get(R);if(R.isVideoTexture&&D(R),R.isRenderTargetTexture===!1&&R.isExternalTexture!==!0&&R.version>0&&k.__version!==R.version){let z=R.image;if(z===null)Ht("WebGLRenderer: Texture marked for update but no image data found.");else if(z.complete===!1)Ht("WebGLRenderer: Texture marked for update but image is incomplete");else{ht(k,R,_);return}}else R.isExternalTexture&&(k.__webglTexture=R.sourceTexture?R.sourceTexture:null);e.bindTexture(i.TEXTURE_2D,k.__webglTexture,i.TEXTURE0+_)}function Y(R,_){let k=n.get(R);if(R.isRenderTargetTexture===!1&&R.version>0&&k.__version!==R.version){ht(k,R,_);return}else R.isExternalTexture&&(k.__webglTexture=R.sourceTexture?R.sourceTexture:null);e.bindTexture(i.TEXTURE_2D_ARRAY,k.__webglTexture,i.TEXTURE0+_)}function Q(R,_){let k=n.get(R);if(R.isRenderTargetTexture===!1&&R.version>0&&k.__version!==R.version){ht(k,R,_);return}e.bindTexture(i.TEXTURE_3D,k.__webglTexture,i.TEXTURE0+_)}function tt(R,_){let k=n.get(R);if(R.isCubeDepthTexture!==!0&&R.version>0&&k.__version!==R.version){Vt(k,R,_);return}e.bindTexture(i.TEXTURE_CUBE_MAP,k.__webglTexture,i.TEXTURE0+_)}let J={[ma]:i.REPEAT,[Dn]:i.CLAMP_TO_EDGE,[ga]:i.MIRRORED_REPEAT},U={[Me]:i.NEAREST,[Vh]:i.NEAREST_MIPMAP_NEAREST,[ur]:i.NEAREST_MIPMAP_LINEAR,[De]:i.LINEAR,[za]:i.LINEAR_MIPMAP_NEAREST,[Si]:i.LINEAR_MIPMAP_LINEAR},K={[Xh]:i.NEVER,[$h]:i.ALWAYS,[qh]:i.LESS,[To]:i.LEQUAL,[Yh]:i.EQUAL,[wo]:i.GEQUAL,[Zh]:i.GREATER,[Jh]:i.NOTEQUAL};function at(R,_){if(_.type===un&&t.has("OES_texture_float_linear")===!1&&(_.magFilter===De||_.magFilter===za||_.magFilter===ur||_.magFilter===Si||_.minFilter===De||_.minFilter===za||_.minFilter===ur||_.minFilter===Si)&&Ht("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(R,i.TEXTURE_WRAP_S,J[_.wrapS]),i.texParameteri(R,i.TEXTURE_WRAP_T,J[_.wrapT]),(R===i.TEXTURE_3D||R===i.TEXTURE_2D_ARRAY)&&i.texParameteri(R,i.TEXTURE_WRAP_R,J[_.wrapR]),i.texParameteri(R,i.TEXTURE_MAG_FILTER,U[_.magFilter]),i.texParameteri(R,i.TEXTURE_MIN_FILTER,U[_.minFilter]),_.compareFunction&&(i.texParameteri(R,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(R,i.TEXTURE_COMPARE_FUNC,K[_.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(_.magFilter===Me||_.minFilter!==ur&&_.minFilter!==Si||_.type===un&&t.has("OES_texture_float_linear")===!1)return;if(_.anisotropy>1||n.get(_).__currentAnisotropy){let k=t.get("EXT_texture_filter_anisotropic");i.texParameterf(R,k.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(_.anisotropy,s.getMaxAnisotropy())),n.get(_).__currentAnisotropy=_.anisotropy}}}function Tt(R,_){let k=!1;R.__webglInit===void 0&&(R.__webglInit=!0,_.addEventListener("dispose",P));let z=_.source,$=d.get(z);$===void 0&&($={},d.set(z,$));let ft=W(_);if(ft!==R.__cacheKey){$[ft]===void 0&&($[ft]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,k=!0),$[ft].usedTimes++;let pt=$[R.__cacheKey];pt!==void 0&&($[R.__cacheKey].usedTimes--,pt.usedTimes===0&&M(_)),R.__cacheKey=ft,R.__webglTexture=$[ft].texture}return k}function X(R,_,k){return Math.floor(Math.floor(R/k)/_)}function j(R,_,k,z){let ft=R.updateRanges;if(ft.length===0)e.texSubImage2D(i.TEXTURE_2D,0,0,0,_.width,_.height,k,z,_.data);else{ft.sort((Ot,vt)=>Ot.start-vt.start);let pt=0;for(let Ot=1;Ot<ft.length;Ot++){let vt=ft[pt],gt=ft[Ot],Bt=vt.start+vt.count,Gt=X(gt.start,_.width,4),$t=X(vt.start,_.width,4);gt.start<=Bt+1&&Gt===$t&&X(gt.start+gt.count-1,_.width,4)===Gt?vt.count=Math.max(vt.count,gt.start+gt.count-vt.start):(++pt,ft[pt]=gt)}ft.length=pt+1;let it=e.getParameter(i.UNPACK_ROW_LENGTH),ot=e.getParameter(i.UNPACK_SKIP_PIXELS),mt=e.getParameter(i.UNPACK_SKIP_ROWS);e.pixelStorei(i.UNPACK_ROW_LENGTH,_.width);for(let Ot=0,vt=ft.length;Ot<vt;Ot++){let gt=ft[Ot],Bt=Math.floor(gt.start/4),Gt=Math.ceil(gt.count/4),$t=Bt%_.width,B=Math.floor(Bt/_.width),_t=Gt,rt=1;e.pixelStorei(i.UNPACK_SKIP_PIXELS,$t),e.pixelStorei(i.UNPACK_SKIP_ROWS,B),e.texSubImage2D(i.TEXTURE_2D,0,$t,B,_t,rt,k,z,_.data)}R.clearUpdateRanges(),e.pixelStorei(i.UNPACK_ROW_LENGTH,it),e.pixelStorei(i.UNPACK_SKIP_PIXELS,ot),e.pixelStorei(i.UNPACK_SKIP_ROWS,mt)}}function ht(R,_,k){let z=i.TEXTURE_2D;(_.isDataArrayTexture||_.isCompressedArrayTexture)&&(z=i.TEXTURE_2D_ARRAY),_.isData3DTexture&&(z=i.TEXTURE_3D);let $=Tt(R,_),ft=_.source;e.bindTexture(z,R.__webglTexture,i.TEXTURE0+k);let pt=n.get(ft);if(ft.version!==pt.__version||$===!0){if(e.activeTexture(i.TEXTURE0+k),(typeof ImageBitmap<"u"&&_.image instanceof ImageBitmap)===!1){let rt=jt.getPrimaries(jt.workingColorSpace),xt=_.colorSpace===Kn?null:jt.getPrimaries(_.colorSpace),At=_.colorSpace===Kn||rt===xt?i.NONE:i.BROWSER_DEFAULT_WEBGL;e.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,_.flipY),e.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),e.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,At)}e.pixelStorei(i.UNPACK_ALIGNMENT,_.unpackAlignment);let ot=m(_.image,!1,s.maxTextureSize);ot=re(_,ot);let mt=r.convert(_.format,_.colorSpace),Ot=r.convert(_.type),vt=v(_.internalFormat,mt,Ot,_.normalized,_.colorSpace,_.isVideoTexture);at(z,_);let gt,Bt=_.mipmaps,Gt=_.isVideoTexture!==!0,$t=pt.__version===void 0||$===!0,B=ft.dataReady,_t=A(_,ot);if(_.isDepthTexture)vt=T(_.format===bi,_.type),$t&&(Gt?e.texStorage2D(i.TEXTURE_2D,1,vt,ot.width,ot.height):e.texImage2D(i.TEXTURE_2D,0,vt,ot.width,ot.height,0,mt,Ot,null));else if(_.isDataTexture)if(Bt.length>0){Gt&&$t&&e.texStorage2D(i.TEXTURE_2D,_t,vt,Bt[0].width,Bt[0].height);for(let rt=0,xt=Bt.length;rt<xt;rt++)gt=Bt[rt],Gt?B&&e.texSubImage2D(i.TEXTURE_2D,rt,0,0,gt.width,gt.height,mt,Ot,gt.data):e.texImage2D(i.TEXTURE_2D,rt,vt,gt.width,gt.height,0,mt,Ot,gt.data);_.generateMipmaps=!1}else Gt?($t&&e.texStorage2D(i.TEXTURE_2D,_t,vt,ot.width,ot.height),B&&j(_,ot,mt,Ot)):e.texImage2D(i.TEXTURE_2D,0,vt,ot.width,ot.height,0,mt,Ot,ot.data);else if(_.isCompressedTexture)if(_.isCompressedArrayTexture){Gt&&$t&&e.texStorage3D(i.TEXTURE_2D_ARRAY,_t,vt,Bt[0].width,Bt[0].height,ot.depth);for(let rt=0,xt=Bt.length;rt<xt;rt++)if(gt=Bt[rt],_.format!==je)if(mt!==null)if(Gt){if(B)if(_.layerUpdates.size>0){let At=Ql(gt.width,gt.height,_.format,_.type);for(let lt of _.layerUpdates){let kt=gt.data.subarray(lt*At/gt.data.BYTES_PER_ELEMENT,(lt+1)*At/gt.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,rt,0,0,lt,gt.width,gt.height,1,mt,kt)}}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,rt,0,0,0,gt.width,gt.height,ot.depth,mt,gt.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,rt,vt,gt.width,gt.height,ot.depth,0,gt.data,0,0);else Ht("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Gt?B&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,rt,0,0,0,gt.width,gt.height,ot.depth,mt,Ot,gt.data):e.texImage3D(i.TEXTURE_2D_ARRAY,rt,vt,gt.width,gt.height,ot.depth,0,mt,Ot,gt.data);_.layerUpdates.size>0&&_.clearLayerUpdates()}else{Gt&&$t&&e.texStorage2D(i.TEXTURE_2D,_t,vt,Bt[0].width,Bt[0].height);for(let rt=0,xt=Bt.length;rt<xt;rt++)gt=Bt[rt],_.format!==je?mt!==null?Gt?B&&e.compressedTexSubImage2D(i.TEXTURE_2D,rt,0,0,gt.width,gt.height,mt,gt.data):e.compressedTexImage2D(i.TEXTURE_2D,rt,vt,gt.width,gt.height,0,gt.data):Ht("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Gt?B&&e.texSubImage2D(i.TEXTURE_2D,rt,0,0,gt.width,gt.height,mt,Ot,gt.data):e.texImage2D(i.TEXTURE_2D,rt,vt,gt.width,gt.height,0,mt,Ot,gt.data)}else if(_.isDataArrayTexture)if(Gt){if($t&&e.texStorage3D(i.TEXTURE_2D_ARRAY,_t,vt,ot.width,ot.height,ot.depth),B)if(_.layerUpdates.size>0){let rt=Ql(ot.width,ot.height,_.format,_.type);for(let xt of _.layerUpdates){let At=ot.data.subarray(xt*rt/ot.data.BYTES_PER_ELEMENT,(xt+1)*rt/ot.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,xt,ot.width,ot.height,1,mt,Ot,At)}_.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,ot.width,ot.height,ot.depth,mt,Ot,ot.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,vt,ot.width,ot.height,ot.depth,0,mt,Ot,ot.data);else if(_.isData3DTexture)Gt?($t&&e.texStorage3D(i.TEXTURE_3D,_t,vt,ot.width,ot.height,ot.depth),B&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,ot.width,ot.height,ot.depth,mt,Ot,ot.data)):e.texImage3D(i.TEXTURE_3D,0,vt,ot.width,ot.height,ot.depth,0,mt,Ot,ot.data);else if(_.isFramebufferTexture){if($t)if(Gt)e.texStorage2D(i.TEXTURE_2D,_t,vt,ot.width,ot.height);else{let rt=ot.width,xt=ot.height;for(let At=0;At<_t;At++)e.texImage2D(i.TEXTURE_2D,At,vt,rt,xt,0,mt,Ot,null),rt>>=1,xt>>=1}}else if(_.isHTMLTexture){if("texElementImage2D"in i){let rt=i.canvas;if(rt.hasAttribute("layoutsubtree")||rt.setAttribute("layoutsubtree","true"),ot.parentNode!==rt){rt.appendChild(ot),f.add(_),rt.onpaint=xt=>{let At=xt.changedElements;for(let lt of f)At.includes(lt.image)&&(lt.needsUpdate=!0)},rt.requestPaint();return}if(i.texElementImage2D.length===3)i.texElementImage2D(i.TEXTURE_2D,i.RGBA8,ot);else{let At=i.RGBA,lt=i.RGBA,kt=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,0,At,lt,kt,ot)}i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(Bt.length>0){if(Gt&&$t){let rt=zt(Bt[0]);e.texStorage2D(i.TEXTURE_2D,_t,vt,rt.width,rt.height)}for(let rt=0,xt=Bt.length;rt<xt;rt++)gt=Bt[rt],Gt?B&&e.texSubImage2D(i.TEXTURE_2D,rt,0,0,mt,Ot,gt):e.texImage2D(i.TEXTURE_2D,rt,vt,mt,Ot,gt);_.generateMipmaps=!1}else if(Gt){if($t){let rt=zt(ot);e.texStorage2D(i.TEXTURE_2D,_t,vt,rt.width,rt.height)}B&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,mt,Ot,ot)}else e.texImage2D(i.TEXTURE_2D,0,vt,mt,Ot,ot);p(_)&&S(z),pt.__version=ft.version,_.onUpdate&&_.onUpdate(_)}R.__version=_.version}function Vt(R,_,k){if(_.image.length!==6)return;let z=Tt(R,_),$=_.source;e.bindTexture(i.TEXTURE_CUBE_MAP,R.__webglTexture,i.TEXTURE0+k);let ft=n.get($);if($.version!==ft.__version||z===!0){e.activeTexture(i.TEXTURE0+k);let pt=jt.getPrimaries(jt.workingColorSpace),it=_.colorSpace===Kn?null:jt.getPrimaries(_.colorSpace),ot=_.colorSpace===Kn||pt===it?i.NONE:i.BROWSER_DEFAULT_WEBGL;e.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,_.flipY),e.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),e.pixelStorei(i.UNPACK_ALIGNMENT,_.unpackAlignment),e.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,ot);let mt=_.isCompressedTexture||_.image[0].isCompressedTexture,Ot=_.image[0]&&_.image[0].isDataTexture,vt=[];for(let lt=0;lt<6;lt++)!mt&&!Ot?vt[lt]=m(_.image[lt],!0,s.maxCubemapSize):vt[lt]=Ot?_.image[lt].image:_.image[lt],vt[lt]=re(_,vt[lt]);let gt=vt[0],Bt=r.convert(_.format,_.colorSpace),Gt=r.convert(_.type),$t=v(_.internalFormat,Bt,Gt,_.normalized,_.colorSpace),B=_.isVideoTexture!==!0,_t=ft.__version===void 0||z===!0,rt=$.dataReady,xt=A(_,gt);at(i.TEXTURE_CUBE_MAP,_);let At;if(mt){B&&_t&&e.texStorage2D(i.TEXTURE_CUBE_MAP,xt,$t,gt.width,gt.height);for(let lt=0;lt<6;lt++){At=vt[lt].mipmaps;for(let kt=0;kt<At.length;kt++){let Lt=At[kt];_.format!==je?Bt!==null?B?rt&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,kt,0,0,Lt.width,Lt.height,Bt,Lt.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,kt,$t,Lt.width,Lt.height,0,Lt.data):Ht("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):B?rt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,kt,0,0,Lt.width,Lt.height,Bt,Gt,Lt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,kt,$t,Lt.width,Lt.height,0,Bt,Gt,Lt.data)}}}else{if(At=_.mipmaps,B&&_t){At.length>0&&xt++;let lt=zt(vt[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,xt,$t,lt.width,lt.height)}for(let lt=0;lt<6;lt++)if(Ot){B?rt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,0,0,0,vt[lt].width,vt[lt].height,Bt,Gt,vt[lt].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,0,$t,vt[lt].width,vt[lt].height,0,Bt,Gt,vt[lt].data);for(let kt=0;kt<At.length;kt++){let pe=At[kt].image[lt].image;B?rt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,kt+1,0,0,pe.width,pe.height,Bt,Gt,pe.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,kt+1,$t,pe.width,pe.height,0,Bt,Gt,pe.data)}}else{B?rt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,0,0,0,Bt,Gt,vt[lt]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,0,$t,Bt,Gt,vt[lt]);for(let kt=0;kt<At.length;kt++){let Lt=At[kt];B?rt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,kt+1,0,0,Bt,Gt,Lt.image[lt]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,kt+1,$t,Bt,Gt,Lt.image[lt])}}}p(_)&&S(i.TEXTURE_CUBE_MAP),ft.__version=$.version,_.onUpdate&&_.onUpdate(_)}R.__version=_.version}function ut(R,_,k,z,$,ft){let pt=r.convert(k.format,k.colorSpace),it=r.convert(k.type),ot=v(k.internalFormat,pt,it,k.normalized,k.colorSpace),mt=n.get(_),Ot=n.get(k);if(Ot.__renderTarget=_,!mt.__hasExternalTextures){let vt=Math.max(1,_.width>>ft),gt=Math.max(1,_.height>>ft);$===i.TEXTURE_3D||$===i.TEXTURE_2D_ARRAY?e.texImage3D($,ft,ot,vt,gt,_.depth,0,pt,it,null):e.texImage2D($,ft,ot,vt,gt,0,pt,it,null)}e.bindFramebuffer(i.FRAMEBUFFER,R),Jt(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,z,$,Ot.__webglTexture,0,Et(_)):($===i.TEXTURE_2D||$>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&$<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,z,$,Ot.__webglTexture,ft),e.bindFramebuffer(i.FRAMEBUFFER,null)}function Ft(R,_,k){if(i.bindRenderbuffer(i.RENDERBUFFER,R),_.depthBuffer){let z=_.depthTexture,$=z&&z.isDepthTexture?z.type:null,ft=T(_.stencilBuffer,$),pt=_.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;Jt(_)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Et(_),ft,_.width,_.height):k?i.renderbufferStorageMultisample(i.RENDERBUFFER,Et(_),ft,_.width,_.height):i.renderbufferStorage(i.RENDERBUFFER,ft,_.width,_.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,pt,i.RENDERBUFFER,R)}else{let z=_.textures;for(let $=0;$<z.length;$++){let ft=z[$],pt=r.convert(ft.format,ft.colorSpace),it=r.convert(ft.type),ot=v(ft.internalFormat,pt,it,ft.normalized,ft.colorSpace);Jt(_)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Et(_),ot,_.width,_.height):k?i.renderbufferStorageMultisample(i.RENDERBUFFER,Et(_),ot,_.width,_.height):i.renderbufferStorage(i.RENDERBUFFER,ot,_.width,_.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function de(R,_,k){let z=_.isWebGLCubeRenderTarget===!0;if(e.bindFramebuffer(i.FRAMEBUFFER,R),!(_.depthTexture&&_.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let $=n.get(_.depthTexture);if($.__renderTarget=_,(!$.__webglTexture||_.depthTexture.image.width!==_.width||_.depthTexture.image.height!==_.height)&&(_.depthTexture.image.width=_.width,_.depthTexture.image.height=_.height,_.depthTexture.needsUpdate=!0),z){if($.__webglInit===void 0&&($.__webglInit=!0,_.depthTexture.addEventListener("dispose",P)),$.__webglTexture===void 0){$.__webglTexture=i.createTexture(),e.bindTexture(i.TEXTURE_CUBE_MAP,$.__webglTexture),at(i.TEXTURE_CUBE_MAP,_.depthTexture);let mt=r.convert(_.depthTexture.format),Ot=r.convert(_.depthTexture.type),vt;_.depthTexture.format===Nn?vt=i.DEPTH_COMPONENT24:_.depthTexture.format===bi&&(vt=i.DEPTH24_STENCIL8);for(let gt=0;gt<6;gt++)i.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+gt,0,vt,_.width,_.height,0,mt,Ot,null)}}else st(_.depthTexture,0);let ft=$.__webglTexture,pt=Et(_),it=z?i.TEXTURE_CUBE_MAP_POSITIVE_X+k:i.TEXTURE_2D,ot=_.depthTexture.format===bi?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(_.depthTexture.format===Nn)Jt(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,ot,it,ft,0,pt):i.framebufferTexture2D(i.FRAMEBUFFER,ot,it,ft,0);else if(_.depthTexture.format===bi)Jt(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,ot,it,ft,0,pt):i.framebufferTexture2D(i.FRAMEBUFFER,ot,it,ft,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function nt(R){let _=n.get(R),k=R.isWebGLCubeRenderTarget===!0;if(_.__boundDepthTexture!==R.depthTexture){let z=R.depthTexture;if(_.__depthDisposeCallback&&_.__depthDisposeCallback(),z){let $=()=>{delete _.__boundDepthTexture,delete _.__depthDisposeCallback,z.removeEventListener("dispose",$)};z.addEventListener("dispose",$),_.__depthDisposeCallback=$}_.__boundDepthTexture=z}if(R.depthTexture&&!_.__autoAllocateDepthBuffer)if(k)for(let z=0;z<6;z++)de(_.__webglFramebuffer[z],R,z);else{let z=R.texture.mipmaps;z&&z.length>0?de(_.__webglFramebuffer[0],R,0):de(_.__webglFramebuffer,R,0)}else if(k){_.__webglDepthbuffer=[];for(let z=0;z<6;z++)if(e.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer[z]),_.__webglDepthbuffer[z]===void 0)_.__webglDepthbuffer[z]=i.createRenderbuffer(),Ft(_.__webglDepthbuffer[z],R,!1);else{let $=R.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ft=_.__webglDepthbuffer[z];i.bindRenderbuffer(i.RENDERBUFFER,ft),i.framebufferRenderbuffer(i.FRAMEBUFFER,$,i.RENDERBUFFER,ft)}}else{let z=R.texture.mipmaps;if(z&&z.length>0?e.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer[0]):e.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer),_.__webglDepthbuffer===void 0)_.__webglDepthbuffer=i.createRenderbuffer(),Ft(_.__webglDepthbuffer,R,!1);else{let $=R.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ft=_.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,ft),i.framebufferRenderbuffer(i.FRAMEBUFFER,$,i.RENDERBUFFER,ft)}}e.bindFramebuffer(i.FRAMEBUFFER,null)}function wt(R,_,k){let z=n.get(R);_!==void 0&&ut(z.__webglFramebuffer,R,R.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),k!==void 0&&nt(R)}function St(R){let _=R.texture,k=n.get(R),z=n.get(_);R.addEventListener("dispose",x);let $=R.textures,ft=R.isWebGLCubeRenderTarget===!0,pt=$.length>1;if(pt||(z.__webglTexture===void 0&&(z.__webglTexture=i.createTexture()),z.__version=_.version,a.memory.textures++),ft){k.__webglFramebuffer=[];for(let it=0;it<6;it++)if(_.mipmaps&&_.mipmaps.length>0){k.__webglFramebuffer[it]=[];for(let ot=0;ot<_.mipmaps.length;ot++)k.__webglFramebuffer[it][ot]=i.createFramebuffer()}else k.__webglFramebuffer[it]=i.createFramebuffer()}else{if(_.mipmaps&&_.mipmaps.length>0){k.__webglFramebuffer=[];for(let it=0;it<_.mipmaps.length;it++)k.__webglFramebuffer[it]=i.createFramebuffer()}else k.__webglFramebuffer=i.createFramebuffer();if(pt)for(let it=0,ot=$.length;it<ot;it++){let mt=n.get($[it]);mt.__webglTexture===void 0&&(mt.__webglTexture=i.createTexture(),a.memory.textures++)}if(R.samples>0&&Jt(R)===!1){k.__webglMultisampledFramebuffer=i.createFramebuffer(),k.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,k.__webglMultisampledFramebuffer);for(let it=0;it<$.length;it++){let ot=$[it];k.__webglColorRenderbuffer[it]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,k.__webglColorRenderbuffer[it]);let mt=r.convert(ot.format,ot.colorSpace),Ot=r.convert(ot.type),vt=v(ot.internalFormat,mt,Ot,ot.normalized,ot.colorSpace,R.isXRRenderTarget===!0),gt=Et(R);i.renderbufferStorageMultisample(i.RENDERBUFFER,gt,vt,R.width,R.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+it,i.RENDERBUFFER,k.__webglColorRenderbuffer[it])}i.bindRenderbuffer(i.RENDERBUFFER,null),R.depthBuffer&&(k.__webglDepthRenderbuffer=i.createRenderbuffer(),Ft(k.__webglDepthRenderbuffer,R,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(ft){e.bindTexture(i.TEXTURE_CUBE_MAP,z.__webglTexture),at(i.TEXTURE_CUBE_MAP,_);for(let it=0;it<6;it++)if(_.mipmaps&&_.mipmaps.length>0)for(let ot=0;ot<_.mipmaps.length;ot++)ut(k.__webglFramebuffer[it][ot],R,_,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+it,ot);else ut(k.__webglFramebuffer[it],R,_,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+it,0);p(_)&&S(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(pt){for(let it=0,ot=$.length;it<ot;it++){let mt=$[it],Ot=n.get(mt),vt=i.TEXTURE_2D;(R.isWebGL3DRenderTarget||R.isWebGLArrayRenderTarget)&&(vt=R.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(vt,Ot.__webglTexture),at(vt,mt),ut(k.__webglFramebuffer,R,mt,i.COLOR_ATTACHMENT0+it,vt,0),p(mt)&&S(vt)}e.unbindTexture()}else{let it=i.TEXTURE_2D;if((R.isWebGL3DRenderTarget||R.isWebGLArrayRenderTarget)&&(it=R.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(it,z.__webglTexture),at(it,_),_.mipmaps&&_.mipmaps.length>0)for(let ot=0;ot<_.mipmaps.length;ot++)ut(k.__webglFramebuffer[ot],R,_,i.COLOR_ATTACHMENT0,it,ot);else ut(k.__webglFramebuffer,R,_,i.COLOR_ATTACHMENT0,it,0);p(_)&&S(it),e.unbindTexture()}R.depthBuffer&&nt(R)}function ct(R){let _=R.textures;for(let k=0,z=_.length;k<z;k++){let $=_[k];if(p($)){let ft=C(R),pt=n.get($).__webglTexture;e.bindTexture(ft,pt),S(ft),e.unbindTexture()}}}let Nt=[],Zt=[];function se(R){if(R.samples>0){if(Jt(R)===!1){let _=R.textures,k=R.width,z=R.height,$=i.COLOR_BUFFER_BIT,ft=R.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,pt=n.get(R),it=_.length>1;if(it)for(let mt=0;mt<_.length;mt++)e.bindFramebuffer(i.FRAMEBUFFER,pt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+mt,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,pt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+mt,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,pt.__webglMultisampledFramebuffer);let ot=R.texture.mipmaps;ot&&ot.length>0?e.bindFramebuffer(i.DRAW_FRAMEBUFFER,pt.__webglFramebuffer[0]):e.bindFramebuffer(i.DRAW_FRAMEBUFFER,pt.__webglFramebuffer);for(let mt=0;mt<_.length;mt++){if(R.resolveDepthBuffer&&(R.depthBuffer&&($|=i.DEPTH_BUFFER_BIT),R.stencilBuffer&&R.resolveStencilBuffer&&($|=i.STENCIL_BUFFER_BIT)),it){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,pt.__webglColorRenderbuffer[mt]);let Ot=n.get(_[mt]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Ot,0)}i.blitFramebuffer(0,0,k,z,0,0,k,z,$,i.NEAREST),l===!0&&(Nt.length=0,Zt.length=0,Nt.push(i.COLOR_ATTACHMENT0+mt),R.depthBuffer&&R.storeMultisampledDepthBuffer===!1&&(Nt.push(ft),Zt.push(ft),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,Zt)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,Nt))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),it)for(let mt=0;mt<_.length;mt++){e.bindFramebuffer(i.FRAMEBUFFER,pt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+mt,i.RENDERBUFFER,pt.__webglColorRenderbuffer[mt]);let Ot=n.get(_[mt]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,pt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+mt,i.TEXTURE_2D,Ot,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,pt.__webglMultisampledFramebuffer)}else if(R.depthBuffer&&R.storeMultisampledDepthBuffer===!1&&l){let _=R.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[_])}}}function Et(R){return Math.min(s.maxSamples,R.samples)}function Jt(R){let _=n.get(R);return R.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&_.__useRenderToTexture!==!1}function D(R){let _=a.render.frame;h.get(R)!==_&&(h.set(R,_),R.update())}function re(R,_){let k=R.colorSpace,z=R.format,$=R.type;return R.isCompressedTexture===!0||R.isVideoTexture===!0||k!==Bs&&k!==Kn&&(jt.getTransfer(k)===ae?(z!==je||$!==hn)&&Ht("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Wt("WebGLTextures: Unsupported texture color space:",k)),_}function zt(R){return typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement?(c.width=R.naturalWidth||R.width,c.height=R.naturalHeight||R.height):typeof VideoFrame<"u"&&R instanceof VideoFrame?(c.width=R.displayWidth,c.height=R.displayHeight):(c.width=R.width,c.height=R.height),c}this.allocateTextureUnit=q,this.resetTextureUnits=N,this.getTextureUnits=I,this.setTextureUnits=F,this.setTexture2D=st,this.setTexture2DArray=Y,this.setTexture3D=Q,this.setTextureCube=tt,this.rebindTextures=wt,this.setupRenderTarget=St,this.updateRenderTargetMipmap=ct,this.updateMultisampleRenderTarget=se,this.setupDepthRenderbuffer=nt,this.setupFrameBufferTexture=ut,this.useMultisampledRTT=Jt,this.isReversedDepthBuffer=function(){return e.buffers.depth.getReversed()}}function n_(i,t){function e(n,s=Kn){let r,a=jt.getTransfer(s);if(n===hn)return i.UNSIGNED_BYTE;if(n===Ga)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Ha)return i.UNSIGNED_SHORT_5_5_5_1;if(n===kl)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===zl)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===Ol)return i.BYTE;if(n===Bl)return i.SHORT;if(n===ms)return i.UNSIGNED_SHORT;if(n===Va)return i.INT;if(n===Tn)return i.UNSIGNED_INT;if(n===un)return i.FLOAT;if(n===Ce)return i.HALF_FLOAT;if(n===Vl)return i.ALPHA;if(n===Gl)return i.RGB;if(n===je)return i.RGBA;if(n===Nn)return i.DEPTH_COMPONENT;if(n===bi)return i.DEPTH_STENCIL;if(n===Hl)return i.RED;if(n===Wa)return i.RED_INTEGER;if(n===Ti)return i.RG;if(n===Xa)return i.RG_INTEGER;if(n===qa)return i.RGBA_INTEGER;if(n===fr||n===dr||n===pr||n===mr)if(a===ae)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===fr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===dr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===pr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===mr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===fr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===dr)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===pr)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===mr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Ya||n===Za||n===Ja||n===$a)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Ya)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Za)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Ja)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===$a)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Ka||n===Qa||n===ja||n===to||n===eo||n===gr||n===no)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Ka||n===Qa)return a===ae?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===ja)return a===ae?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===to)return r.COMPRESSED_R11_EAC;if(n===eo)return r.COMPRESSED_SIGNED_R11_EAC;if(n===gr)return r.COMPRESSED_RG11_EAC;if(n===no)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===io||n===so||n===ro||n===ao||n===oo||n===lo||n===co||n===ho||n===uo||n===fo||n===po||n===mo||n===go||n===_o)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===io)return a===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===so)return a===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===ro)return a===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===ao)return a===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===oo)return a===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===lo)return a===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===co)return a===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===ho)return a===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===uo)return a===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===fo)return a===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===po)return a===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===mo)return a===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===go)return a===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===_o)return a===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===xo||n===vo||n===yo)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===xo)return a===ae?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===vo)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===yo)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Mo||n===So||n===_r||n===bo)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===Mo)return r.COMPRESSED_RED_RGTC1_EXT;if(n===So)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===_r)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===bo)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===gs?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}var i_=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,s_=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,_c=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e){if(this.texture===null){let n=new Ks(t.texture);(t.depthNear!==e.depthNear||t.depthFar!==e.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=n}}getMesh(t){if(this.texture!==null&&this.mesh===null){let e=t.cameras[0].viewport,n=new ge({vertexShader:i_,fragmentShader:s_,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new Ke(new Qs(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},xc=class extends Un{constructor(t,e){super();let n=this,s=null,r=1,a=null,o="local-floor",l=1,c=null,h=null,f=null,u=null,d=null,g=null,w=typeof XRWebGLBinding<"u",m=new _c,p={},S=e.getContextAttributes(),C=null,v=null,T=[],A=[],P=new Xt,x=null,b=null,M=new Be;M.viewport=new he;let E=new Be;E.viewport=new he;let L=[M,E],N=new Fa,I=null,F=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(X){let j=T[X];return j===void 0&&(j=new cs,T[X]=j),j.getTargetRaySpace()},this.getControllerGrip=function(X){let j=T[X];return j===void 0&&(j=new cs,T[X]=j),j.getGripSpace()},this.getHand=function(X){let j=T[X];return j===void 0&&(j=new cs,T[X]=j),j.getHandSpace()};function q(X){let j=A.indexOf(X.inputSource);if(j===-1)return;let ht=T[j];ht!==void 0&&(ht.update(X.inputSource,X.frame,c||a),ht.dispatchEvent({type:X.type,data:X.inputSource}))}function W(){s.removeEventListener("select",q),s.removeEventListener("selectstart",q),s.removeEventListener("selectend",q),s.removeEventListener("squeeze",q),s.removeEventListener("squeezestart",q),s.removeEventListener("squeezeend",q),s.removeEventListener("end",W),s.removeEventListener("inputsourceschange",st);for(let X=0;X<T.length;X++){let j=A[X];j!==null&&(A[X]=null,T[X].disconnect(j))}I=null,F=null,m.reset();for(let X in p)delete p[X];if(t.setRenderTarget(C),d=null,u=null,f=null,s=null,v=null,Tt.stop(),n.isPresenting=!1,t.setPixelRatio(x),t.setSize(P.width,P.height,!1),b!==null){let X=b.camera;X.fov=b.fov,X.zoom=b.zoom,X.updateProjectionMatrix(),b=null}n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(X){r=X,n.isPresenting===!0&&Ht("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(X){o=X,n.isPresenting===!0&&Ht("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(X){c=X},this.getBaseLayer=function(){return u!==null?u:d},this.getBinding=function(){return f===null&&w&&(f=new XRWebGLBinding(s,e)),f},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(X){if(s=X,s!==null){if(C=t.getRenderTarget(),s.addEventListener("select",q),s.addEventListener("selectstart",q),s.addEventListener("selectend",q),s.addEventListener("squeeze",q),s.addEventListener("squeezestart",q),s.addEventListener("squeezeend",q),s.addEventListener("end",W),s.addEventListener("inputsourceschange",st),S.xrCompatible!==!0&&await e.makeXRCompatible(),x=t.getPixelRatio(),t.getSize(P),w&&"createProjectionLayer"in XRWebGLBinding.prototype){let ht=null,Vt=null,ut=null;S.depth&&(ut=S.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,ht=S.stencil?bi:Nn,Vt=S.stencil?gs:Tn);let Ft={colorFormat:e.RGBA8,depthFormat:ut,scaleFactor:r};f=this.getBinding(),u=f.createProjectionLayer(Ft),s.updateRenderState({layers:[u]}),t.setPixelRatio(1),t.setSize(u.textureWidth,u.textureHeight,!1),v=new Se(u.textureWidth,u.textureHeight,{format:je,type:hn,depthTexture:new gi(u.textureWidth,u.textureHeight,Vt,void 0,void 0,void 0,void 0,void 0,void 0,ht),stencilBuffer:S.stencil,colorSpace:t.outputColorSpace,samples:S.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1,storeMultisampledDepthBuffer:u.ignoreDepthValues===!1,storeMultisampledStencilBuffer:u.ignoreDepthValues===!1})}else{let ht={antialias:S.antialias,alpha:!0,depth:S.depth,stencil:S.stencil,framebufferScaleFactor:r};d=new XRWebGLLayer(s,e,ht),s.updateRenderState({baseLayer:d}),t.setPixelRatio(1),t.setSize(d.framebufferWidth,d.framebufferHeight,!1),v=new Se(d.framebufferWidth,d.framebufferHeight,{format:je,type:hn,colorSpace:t.outputColorSpace,stencilBuffer:S.stencil,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}v.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await s.requestReferenceSpace(o),Tt.setContext(s),Tt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function st(X){for(let j=0;j<X.removed.length;j++){let ht=X.removed[j],Vt=A.indexOf(ht);Vt>=0&&(A[Vt]=null,T[Vt].disconnect(ht))}for(let j=0;j<X.added.length;j++){let ht=X.added[j],Vt=A.indexOf(ht);if(Vt===-1){for(let Ft=0;Ft<T.length;Ft++)if(Ft>=A.length){A.push(ht),Vt=Ft;break}else if(A[Ft]===null){A[Ft]=ht,Vt=Ft;break}if(Vt===-1)break}let ut=T[Vt];ut&&ut.connect(ht)}}let Y=new V,Q=new V;function tt(X,j,ht){Y.setFromMatrixPosition(j.matrixWorld),Q.setFromMatrixPosition(ht.matrixWorld);let Vt=Y.distanceTo(Q),ut=j.projectionMatrix.elements,Ft=ht.projectionMatrix.elements,de=ut[14]/(ut[10]-1),nt=ut[14]/(ut[10]+1),wt=(ut[9]+1)/ut[5],St=(ut[9]-1)/ut[5],ct=(ut[8]-1)/ut[0],Nt=(Ft[8]+1)/Ft[0],Zt=de*ct,se=de*Nt,Et=Vt/(-ct+Nt),Jt=Et*-ct;if(j.matrixWorld.decompose(X.position,X.quaternion,X.scale),X.translateX(Jt),X.translateZ(Et),X.matrixWorld.compose(X.position,X.quaternion,X.scale),X.matrixWorldInverse.copy(X.matrixWorld).invert(),ut[10]===-1)X.projectionMatrix.copy(j.projectionMatrix),X.projectionMatrixInverse.copy(j.projectionMatrixInverse);else{let D=de+Et,re=nt+Et,zt=Zt-Jt,R=se+(Vt-Jt),_=wt*nt/re*D,k=St*nt/re*D;X.projectionMatrix.makePerspective(zt,R,_,k,D,re),X.projectionMatrixInverse.copy(X.projectionMatrix).invert()}}function J(X,j){j===null?X.matrixWorld.copy(X.matrix):X.matrixWorld.multiplyMatrices(j.matrixWorld,X.matrix),X.matrixWorldInverse.copy(X.matrixWorld).invert()}this.updateCamera=function(X){if(s===null)return;let j=X.near,ht=X.far;m.texture!==null&&(m.depthNear>0&&(j=m.depthNear),m.depthFar>0&&(ht=m.depthFar)),N.near=E.near=M.near=j,N.far=E.far=M.far=ht,(I!==N.near||F!==N.far)&&(s.updateRenderState({depthNear:N.near,depthFar:N.far}),I=N.near,F=N.far),N.layers.mask=X.layers.mask|6,M.layers.mask=N.layers.mask&-5,E.layers.mask=N.layers.mask&-3;let Vt=X.parent,ut=N.cameras;J(N,Vt);for(let Ft=0;Ft<ut.length;Ft++)J(ut[Ft],Vt);ut.length===2?tt(N,M,E):N.projectionMatrix.copy(M.projectionMatrix),b===null&&X.isPerspectiveCamera&&(b={camera:X,fov:X.fov,zoom:X.zoom}),U(X,N,Vt)};function U(X,j,ht){ht===null?X.matrix.copy(j.matrixWorld):(X.matrix.copy(ht.matrixWorld),X.matrix.invert(),X.matrix.multiply(j.matrixWorld)),X.matrix.decompose(X.position,X.quaternion,X.scale),X.updateMatrixWorld(!0),X.projectionMatrix.copy(j.projectionMatrix),X.projectionMatrixInverse.copy(j.projectionMatrixInverse),X.isPerspectiveCamera&&(X.fov=os*2*Math.atan(1/X.projectionMatrix.elements[5]),X.zoom=1)}this.getCamera=function(){return N},this.getFoveation=function(){if(!(u===null&&d===null))return l},this.setFoveation=function(X){l=X,u!==null&&(u.fixedFoveation=X),d!==null&&d.fixedFoveation!==void 0&&(d.fixedFoveation=X)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(N)},this.getCameraTexture=function(X){return p[X]};let K=null;function at(X,j){if(h=j.getViewerPose(c||a),g=j,h!==null){let ht=h.views;d!==null&&(t.setRenderTargetFramebuffer(v,d.framebuffer),t.setRenderTarget(v));let Vt=!1;ht.length!==N.cameras.length&&(N.cameras.length=0,Vt=!0);for(let nt=0;nt<ht.length;nt++){let wt=ht[nt],St=null;if(d!==null)St=d.getViewport(wt);else{let Nt=f.getViewSubImage(u,wt);St=Nt.viewport,nt===0&&(t.setRenderTargetTextures(v,Nt.colorTexture,Nt.depthStencilTexture),t.setRenderTarget(v))}let ct=L[nt];ct===void 0&&(ct=new Be,ct.layers.enable(nt),ct.viewport=new he,L[nt]=ct),ct.matrix.fromArray(wt.transform.matrix),ct.matrix.decompose(ct.position,ct.quaternion,ct.scale),ct.projectionMatrix.fromArray(wt.projectionMatrix),ct.projectionMatrixInverse.copy(ct.projectionMatrix).invert(),ct.viewport.set(St.x,St.y,St.width,St.height),nt===0&&(N.matrix.copy(ct.matrix),N.matrix.decompose(N.position,N.quaternion,N.scale)),Vt===!0&&N.cameras.push(ct)}let ut=s.enabledFeatures;if(ut&&ut.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&w){f=n.getBinding();let nt=f.getDepthInformation(ht[0]);nt&&nt.isValid&&nt.texture&&m.init(nt,s.renderState)}if(ut&&ut.includes("camera-access")&&w){t.state.unbindTexture(),f=n.getBinding();for(let nt=0;nt<ht.length;nt++){let wt=ht[nt].camera;if(wt){let St=p[wt];St||(St=new Ks,p[wt]=St);let ct=f.getCameraImage(wt);St.sourceTexture=ct}}}}for(let ht=0;ht<T.length;ht++){let Vt=A[ht],ut=T[ht];Vt!==null&&ut!==void 0&&ut.update(Vt,j,c||a)}K&&K(X,j),j.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:j}),g=null}let Tt=new Au;Tt.setAnimationLoop(at),this.setAnimationLoop=function(X){K=X},this.dispose=function(){}}},r_=new ve,Lu=new Yt;Lu.set(-1,0,0,0,1,0,0,0,1);function a_(i,t){function e(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function n(m,p){p.color.getRGB(m.fogColor.value,Jl(i)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function s(m,p,S,C,v){p.isNodeMaterial?p.uniformsNeedUpdate=!1:p.isMeshBasicMaterial?r(m,p):p.isMeshLambertMaterial?(r(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshToonMaterial?(r(m,p),f(m,p)):p.isMeshPhongMaterial?(r(m,p),h(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshStandardMaterial?(r(m,p),u(m,p),p.isMeshPhysicalMaterial&&d(m,p,v)):p.isMeshMatcapMaterial?(r(m,p),g(m,p)):p.isMeshDepthMaterial?r(m,p):p.isMeshDistanceMaterial?(r(m,p),w(m,p)):p.isMeshNormalMaterial?r(m,p):p.isLineBasicMaterial?(a(m,p),p.isLineDashedMaterial&&o(m,p)):p.isPointsMaterial?l(m,p,S,C):p.isSpriteMaterial?c(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,e(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,e(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===qe&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,e(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===qe&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,e(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,e(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,e(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);let S=t.get(p),C=S.envMap,v=S.envMapRotation;C&&(m.envMap.value=C,m.envMapRotation.value.setFromMatrix4(r_.makeRotationFromEuler(v)).transpose(),C.isCubeTexture&&C.isRenderTargetTexture===!1&&m.envMapRotation.value.premultiply(Lu),m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,e(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,e(p.aoMap,m.aoMapTransform))}function a(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,e(p.map,m.mapTransform))}function o(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function l(m,p,S,C){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*S,m.scale.value=C*.5,p.map&&(m.map.value=p.map,e(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function c(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,e(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function h(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function f(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function u(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,e(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,e(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function d(m,p,S){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,e(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,e(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,e(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,e(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,e(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===qe&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.retroreflectivity>0&&(m.retroreflectivity.value=p.retroreflectivity),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,e(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,e(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=S.texture,m.transmissionSamplerSize.value.set(S.width,S.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,e(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,e(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,e(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,e(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,e(p.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,p){p.matcap&&(m.matcap.value=p.matcap)}function w(m,p){let S=t.get(p).light;m.referencePosition.value.setFromMatrixPosition(S.matrixWorld),m.nearDistance.value=S.shadow.camera.near,m.farDistance.value=S.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function o_(i,t,e,n){let s={},r={},a=[],o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(v,T){let A=T.program;n.uniformBlockBinding(v,A)}function c(v,T){let A=s[v.id];A===void 0&&(m(v),A=h(v),s[v.id]=A,v.addEventListener("dispose",S));let P=T.program;n.updateUBOMapping(v,P);let x=t.render.frame;r[v.id]!==x&&(u(v),r[v.id]=x)}function h(v){let T=f();v.__bindingPointIndex=T;let A=i.createBuffer(),P=v.__size,x=v.usage;return i.bindBuffer(i.UNIFORM_BUFFER,A),i.bufferData(i.UNIFORM_BUFFER,P,x),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,T,A),A}function f(){for(let v=0;v<o;v++)if(a.indexOf(v)===-1)return a.push(v),v;return Wt("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(v){let T=s[v.id],A=v.uniforms,P=v.__cache;i.bindBuffer(i.UNIFORM_BUFFER,T);for(let x=0,b=A.length;x<b;x++){let M=A[x];if(Array.isArray(M))for(let E=0,L=M.length;E<L;E++)d(M[E],x,E,P);else d(M,x,0,P)}i.bindBuffer(i.UNIFORM_BUFFER,null)}function d(v,T,A,P){if(w(v,T,A,P)===!0){let x=v.__offset,b=v.value;if(Array.isArray(b)){let M=0;for(let E=0;E<b.length;E++){let L=b[E],N=p(L);g(L,v.__data,M),typeof L!="number"&&typeof L!="boolean"&&!L.isMatrix3&&!ArrayBuffer.isView(L)&&(M+=N.storage/Float32Array.BYTES_PER_ELEMENT)}}else g(b,v.__data,0);i.bufferSubData(i.UNIFORM_BUFFER,x,v.__data)}}function g(v,T,A){typeof v=="number"||typeof v=="boolean"?T[0]=v:v.isMatrix3?(T[0]=v.elements[0],T[1]=v.elements[1],T[2]=v.elements[2],T[3]=0,T[4]=v.elements[3],T[5]=v.elements[4],T[6]=v.elements[5],T[7]=0,T[8]=v.elements[6],T[9]=v.elements[7],T[10]=v.elements[8],T[11]=0):ArrayBuffer.isView(v)?T.set(new v.constructor(v.buffer,v.byteOffset,T.length)):v.toArray(T,A)}function w(v,T,A,P){let x=v.value,b=T+"_"+A;if(P[b]===void 0)return typeof x=="number"||typeof x=="boolean"?P[b]=x:ArrayBuffer.isView(x)?P[b]=x.slice():P[b]=x.clone(),!0;{let M=P[b];if(typeof x=="number"||typeof x=="boolean"){if(M!==x)return P[b]=x,!0}else{if(ArrayBuffer.isView(x))return!0;if(M.equals(x)===!1)return M.copy(x),!0}}return!1}function m(v){let T=v.uniforms,A=0,P=16;for(let b=0,M=T.length;b<M;b++){let E=Array.isArray(T[b])?T[b]:[T[b]];for(let L=0,N=E.length;L<N;L++){let I=E[L],F=Array.isArray(I.value)?I.value:[I.value];for(let q=0,W=F.length;q<W;q++){let st=F[q],Y=p(st),Q=A%P,tt=Q%Y.boundary,J=Q+tt;A+=tt,J!==0&&P-J<Y.storage&&(A+=P-J),I.__data=new Float32Array(Y.storage/Float32Array.BYTES_PER_ELEMENT),I.__offset=A,A+=Y.storage}}}let x=A%P;return x>0&&(A+=P-x),v.__size=A,v.__cache={},this}function p(v){let T={boundary:0,storage:0};return typeof v=="number"||typeof v=="boolean"?(T.boundary=4,T.storage=4):v.isVector2?(T.boundary=8,T.storage=8):v.isVector3||v.isColor?(T.boundary=16,T.storage=12):v.isVector4?(T.boundary=16,T.storage=16):v.isMatrix3?(T.boundary=48,T.storage=48):v.isMatrix4?(T.boundary=64,T.storage=64):v.isTexture?Ht("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(v)?(T.boundary=16,T.storage=v.byteLength):Ht("WebGLRenderer: Unsupported uniform value type.",v),T}function S(v){let T=v.target;T.removeEventListener("dispose",S);let A=a.indexOf(T.__bindingPointIndex);a.splice(A,1),i.deleteBuffer(s[T.id]),delete s[T.id],delete r[T.id]}function C(){for(let v in s)i.deleteBuffer(s[v]);a=[],s={},r={}}return{bind:l,update:c,dispose:C}}var l_=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Bn=null;function c_(){return Bn===null&&(Bn=new hs(l_,16,16,Ti,Ce),Bn.name="DFG_LUT",Bn.minFilter=De,Bn.magFilter=De,Bn.wrapS=Dn,Bn.wrapT=Dn,Bn.generateMipmaps=!1,Bn.needsUpdate=!0),Bn}var Po=class{constructor(t={}){let{canvas:e=Qh(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:f=!1,reversedDepthBuffer:u=!1,outputBufferType:d=hn}=t;this.isWebGLRenderer=!0;let g;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");g=n.getContextAttributes().alpha}else g=a;let w=d,m=new Set([qa,Xa,Wa]),p=new Set([hn,Tn,ms,gs,Ga,Ha]),S=new Uint32Array(4),C=new Int32Array(4),v=new V,T=null,A=null,P=[],x=[],b=null;this.domElement=e,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=cn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let M=this,E=!1,L=null,N=null,I=null,F=null;this._outputColorSpace=an;let q=0,W=0,st=null,Y=-1,Q=null,tt=new he,J=new he,U=null,K=new qt(0),at=0,Tt=e.width,X=e.height,j=1,ht=null,Vt=null,ut=new he(0,0,Tt,X),Ft=new he(0,0,Tt,X),de=!1,nt=new Zs,wt=!1,St=!1,ct=new ve,Nt=new V,Zt=new he,se={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Et=!1;function Jt(){return st===null?j:1}let D=n;function re(y,O){return e.getContext(y,O)}let zt,R,_,k,z,$,ft,pt,it,ot,mt,Ot,vt,gt,Bt,Gt,$t,B,_t,rt,xt,At,lt;try{let y={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:f};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${"186"}`),e.addEventListener("webglcontextlost",pe,!1),e.addEventListener("webglcontextrestored",le,!1),e.addEventListener("webglcontextcreationerror",xn,!1),D===null){let O="webgl2";if(D=re(O,y),D===null)throw re(O)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}kt()}catch(y){throw e.removeEventListener("webglcontextlost",pe,!1),e.removeEventListener("webglcontextrestored",le,!1),e.removeEventListener("webglcontextcreationerror",xn,!1),Wt("WebGLRenderer: "+y.message),y}function kt(){zt=new g0(D),zt.init(),xt=new n_(D,zt),R=new a0(D,zt,t,xt),_=new t_(D,zt),R.reversedDepthBuffer&&u&&_.buffers.depth.setReversed(!0),N=D.createFramebuffer(),I=D.createFramebuffer(),F=D.createFramebuffer(),k=new v0(D),z=new zg,$=new e_(D,zt,_,z,R,xt,k),ft=new m0(M),pt=new Md(D),At=new s0(D,pt),it=new _0(D,pt,k,At),ot=new M0(D,it,pt,At,k),B=new y0(D,R,$),Bt=new o0(z),mt=new kg(M,ft,zt,R,At,Bt),Ot=new a_(M,z),vt=new Gg,gt=new Zg(zt),$t=new i0(M,ft,_,ot,g,l),Gt=new jg(M,ot,R),lt=new o_(D,k,R,_),_t=new r0(D,zt,k),rt=new x0(D,zt,k),k.programs=mt.programs,M.capabilities=R,M.extensions=zt,M.properties=z,M.renderLists=vt,M.shadowMap=Gt,M.state=_,M.info=k}w!==hn&&(b=new b0(w,e.width,e.height,o,s,r));let Lt=new xc(M,D);this.xr=Lt,this.getContext=function(){return D},this.getContextAttributes=function(){return D.getContextAttributes()},this.forceContextLoss=function(){let y=zt.get("WEBGL_lose_context");y&&y.loseContext()},this.forceContextRestore=function(){let y=zt.get("WEBGL_lose_context");y&&y.restoreContext()},this.getPixelRatio=function(){return j},this.setPixelRatio=function(y){y!==void 0&&(j=y,this.setSize(Tt,X,!1))},this.getSize=function(y){return y.set(Tt,X)},this.setSize=function(y,O,Z=!0){if(Lt.isPresenting){Ht("WebGLRenderer: Can't change size while VR device is presenting.");return}Tt=y,X=O,e.width=Math.floor(y*j),e.height=Math.floor(O*j),Z===!0&&(e.style.width=y+"px",e.style.height=O+"px"),b!==null&&b.setSize(e.width,e.height),this.setViewport(0,0,y,O)},this.getDrawingBufferSize=function(y){return y.set(Tt*j,X*j).floor()},this.setDrawingBufferSize=function(y,O,Z){Tt=y,X=O,j=Z,e.width=Math.floor(y*Z),e.height=Math.floor(O*Z),this.setViewport(0,0,y,O)},this.setEffects=function(y){if(w===hn){Wt("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(y){for(let O=0;O<y.length;O++)if(y[O].isOutputPass===!0){Ht("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}b.setEffects(y||[])},this.getCurrentViewport=function(y){return y.copy(tt)},this.getViewport=function(y){return y.copy(ut)},this.setViewport=function(y,O,Z,G){y.isVector4?ut.set(y.x,y.y,y.z,y.w):ut.set(y,O,Z,G),_.viewport(tt.copy(ut).multiplyScalar(j).round())},this.getScissor=function(y){return y.copy(Ft)},this.setScissor=function(y,O,Z,G){y.isVector4?Ft.set(y.x,y.y,y.z,y.w):Ft.set(y,O,Z,G),_.scissor(J.copy(Ft).multiplyScalar(j).round())},this.getScissorTest=function(){return de},this.setScissorTest=function(y){_.setScissorTest(de=y)},this.setOpaqueSort=function(y){ht=y},this.setTransparentSort=function(y){Vt=y},this.getClearColor=function(y){return y.copy($t.getClearColor())},this.setClearColor=function(){$t.setClearColor(...arguments)},this.getClearAlpha=function(){return $t.getClearAlpha()},this.setClearAlpha=function(){$t.setClearAlpha(...arguments)},this.clear=function(y=!0,O=!0,Z=!0){let G=0;if(y){let H=!1;if(st!==null){let bt=st.texture.format;H=m.has(bt)}if(H){let bt=st.texture.type,Rt=p.has(bt),Mt=$t.getClearColor(),Pt=$t.getClearAlpha(),Dt=Mt.r,Kt=Mt.g,ee=Mt.b;Rt?(S[0]=Dt,S[1]=Kt,S[2]=ee,S[3]=Pt,D.clearBufferuiv(D.COLOR,0,S)):(C[0]=Dt,C[1]=Kt,C[2]=ee,C[3]=Pt,D.clearBufferiv(D.COLOR,0,C))}else G|=D.COLOR_BUFFER_BIT}O&&(G|=D.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),Z&&(G|=D.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),G!==0&&D.clear(G)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(y){y.setRenderer(this),L=y},this.dispose=function(){e.removeEventListener("webglcontextlost",pe,!1),e.removeEventListener("webglcontextrestored",le,!1),e.removeEventListener("webglcontextcreationerror",xn,!1),$t.dispose(),vt.dispose(),gt.dispose(),z.dispose(),ft.dispose(),ot.dispose(),At.dispose(),lt.dispose(),mt.dispose(),Lt.dispose(),Lt.removeEventListener("sessionstart",Vc),Lt.removeEventListener("sessionend",Gc),Ai.stop()};function pe(y){y.preventDefault(),ql("WebGLRenderer: Context Lost."),E=!0}function le(){ql("WebGLRenderer: Context Restored."),E=!1;let y=k.autoReset,O=Gt.enabled,Z=Gt.autoUpdate,G=Gt.needsUpdate,H=Gt.type;kt(),k.autoReset=y,Gt.enabled=O,Gt.autoUpdate=Z,Gt.needsUpdate=G,Gt.type=H}function xn(y){Wt("WebGLRenderer: A WebGL context could not be created. Reason: ",y.statusMessage)}function Pn(y){let O=y.target;O.removeEventListener("dispose",Pn),gf(O)}function gf(y){_f(y),z.remove(y)}function _f(y){let O=z.get(y).programs;O!==void 0&&(O.forEach(function(Z){mt.releaseProgram(Z)}),y.isShaderMaterial&&mt.releaseShaderCache(y))}this.renderBufferDirect=function(y,O,Z,G,H,bt){O===null&&(O=se);let Rt=H.isMesh&&H.matrixWorld.determinantAffine()<0,Mt=yf(y,O,Z,G,H);_.setMaterial(G,Rt);let Pt=Z.index,Dt=1;if(G.wireframe===!0){if(Pt=it.getWireframeAttribute(Z),Pt===void 0)return;Dt=2}let Kt=Z.drawRange,ee=Z.attributes.position,It=Kt.start*Dt,ce=(Kt.start+Kt.count)*Dt;bt!==null&&(It=Math.max(It,bt.start*Dt),ce=Math.min(ce,(bt.start+bt.count)*Dt)),Pt!==null?(It=Math.max(It,0),ce=Math.min(ce,Pt.count)):ee!=null&&(It=Math.max(It,0),ce=Math.min(ce,ee.count));let Ae=ce-It;if(Ae<0||Ae===1/0)return;At.setup(H,G,Mt,Z,Pt);let _e,fe=_t;if(Pt!==null&&(_e=pt.get(Pt),fe=rt,fe.setIndex(_e)),H.isMesh)G.wireframe===!0?(_.setLineWidth(G.wireframeLinewidth*Jt()),fe.setMode(D.LINES)):fe.setMode(D.TRIANGLES);else if(H.isLine){let Ue=G.linewidth;Ue===void 0&&(Ue=1),_.setLineWidth(Ue*Jt()),H.isLineSegments?fe.setMode(D.LINES):H.isLineLoop?fe.setMode(D.LINE_LOOP):fe.setMode(D.LINE_STRIP)}else H.isPoints?fe.setMode(D.POINTS):H.isSprite&&fe.setMode(D.TRIANGLES);if(H.isBatchedMesh)if(zt.get("WEBGL_multi_draw"))fe.renderMultiDraw(H._multiDrawStarts,H._multiDrawCounts,H._multiDrawCount);else{let Ue=H._multiDrawStarts,Ct=H._multiDrawCounts,Ge=H._multiDrawCount,ie=Pt?pt.get(Pt).bytesPerElement:1,dn=z.get(G).currentProgram.getUniforms();for(let In=0;In<Ge;In++)dn.setValue(D,"_gl_DrawID",In),fe.render(Ue[In]/ie,Ct[In])}else if(H.isInstancedMesh)fe.renderInstances(It,Ae,H.count);else if(Z.isInstancedBufferGeometry){let Ue=Z._maxInstanceCount!==void 0?Z._maxInstanceCount:1/0,Ct=Math.min(Z.instanceCount,Ue);fe.renderInstances(It,Ae,Ct)}else fe.render(It,Ae)};function zc(y,O,Z,G){L!==null&&y.isNodeMaterial&&L.setObject(G,y),wt===!0&&Bt.setState(y,Z,!1),y.transparent===!0&&y.side===On&&y.forceSinglePass===!1?(y.side=qe,y.needsUpdate=!0,Br(y,O,G),y.side=yi,y.needsUpdate=!0,Br(y,O,G),y.side=On):Br(y,O,G)}this.compile=function(y,O,Z=null){Z===null&&(Z=y),L!==null&&L.renderStart(y,O,Z),A=gt.get(Z),A.init(O),x.push(A),Z.traverseVisible(function(H){H.isLight&&H.layers.test(O.layers)&&(A.pushLight(H),H.castShadow&&A.pushShadow(H))}),y!==Z&&y.traverseVisible(function(H){H.isLight&&H.layers.test(O.layers)&&(A.pushLight(H),H.castShadow&&A.pushShadow(H))}),A.setupLights(),L!==null&&L.updateLights(A.state.lightsArray),St=this.localClippingEnabled,wt=Bt.init(this.clippingPlanes,St),wt===!0&&Bt.setGlobalState(this.clippingPlanes,O),L!==null&&Gt.render(A.state.shadowsArray,Z,O);let G=new Set;return y.traverse(function(H){if(!(H.isMesh||H.isPoints||H.isLine||H.isSprite))return;let bt=H.material;if(bt)if(Array.isArray(bt))for(let Rt=0;Rt<bt.length;Rt++){let Mt=bt[Rt];zc(Mt,Z,O,H),G.add(Mt)}else zc(bt,Z,O,H),G.add(bt)}),A=x.pop(),L!==null&&L.renderEnd(),G},this.compileAsync=function(y,O,Z=null){let G=this.compile(y,O,Z);return new Promise(H=>{function bt(){if(G.forEach(function(Rt){let Pt=z.get(Rt).currentProgram;(Pt===void 0||Pt.isReady())&&G.delete(Rt)}),G.size===0){H(y);return}setTimeout(bt,10)}zt.get("KHR_parallel_shader_compile")!==null?bt():setTimeout(bt,10)})};let el=null;function xf(y){el&&el(y)}function Vc(){Ai.stop()}function Gc(){Ai.start()}let Ai=new Au;Ai.setAnimationLoop(xf),typeof self<"u"&&Ai.setContext(self),this.setAnimationLoop=function(y){el=y,Lt.setAnimationLoop(y),y===null?Ai.stop():Ai.start()},Lt.addEventListener("sessionstart",Vc),Lt.addEventListener("sessionend",Gc),this.render=function(y,O){if(O!==void 0&&O.isCamera!==!0){Wt("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(E===!0)return;L!==null&&L.renderStart(y,O);let Z=Lt.enabled===!0&&Lt.isPresenting===!0,G=b!==null&&(st===null||Z)&&b.begin(M,st);if(y.matrixWorldAutoUpdate===!0&&y.updateMatrixWorld(),O.parent===null&&O.matrixWorldAutoUpdate===!0&&O.updateMatrixWorld(),Lt.enabled===!0&&Lt.isPresenting===!0&&(b===null||b.isCompositing()===!1)&&(Lt.cameraAutoUpdate===!0&&Lt.updateCamera(O),O=Lt.getCamera()),y.isScene===!0&&y.onBeforeRender(M,y,O,st),A=gt.get(y,x.length),A.init(O),A.state.textureUnits=$.getTextureUnits(),x.push(A),ct.multiplyMatrices(O.projectionMatrix,O.matrixWorldInverse),nt.setFromProjectionMatrix(ct,bn,O.reversedDepth),St=this.localClippingEnabled,wt=Bt.init(this.clippingPlanes,St),T=vt.get(y,P.length),T.init(),P.push(T),Lt.enabled===!0&&Lt.isPresenting===!0){let Rt=M.xr.getDepthSensingMesh();Rt!==null&&nl(Rt,O,-1/0,M.sortObjects)}nl(y,O,0,M.sortObjects),T.finish(),L!==null&&L.updateLights(A.state.lightsArray),M.sortObjects===!0&&T.sort(ht,Vt),Et=Lt.enabled===!1||Lt.isPresenting===!1||Lt.hasDepthSensing()===!1,Et&&$t.addToRenderList(T,y),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),wt===!0&&Bt.beginShadows();let H=A.state.shadowsArray;if(Gt.render(H,y,O),wt===!0&&Bt.endShadows(),(G&&b.hasRenderPass())===!1){let Rt=T.opaque,Mt=T.transmissive;if(A.setupLights(),O.isArrayCamera){let Pt=O.cameras;if(Mt.length>0)for(let Dt=0,Kt=Pt.length;Dt<Kt;Dt++){let ee=Pt[Dt];Wc(Rt,Mt,y,ee)}Et&&$t.render(y);for(let Dt=0,Kt=Pt.length;Dt<Kt;Dt++){let ee=Pt[Dt];Hc(T,y,ee,ee.viewport)}}else Mt.length>0&&Wc(Rt,Mt,y,O),Et&&$t.render(y),Hc(T,y,O)}st!==null&&W===0&&($.updateMultisampleRenderTarget(st),$.updateRenderTargetMipmap(st)),G&&b.end(M),y.isScene===!0&&y.onAfterRender(M,y,O),At.resetDefaultState(),Y=-1,Q=null,x.pop(),x.length>0?(A=x[x.length-1],$.setTextureUnits(A.state.textureUnits),wt===!0&&Bt.setGlobalState(M.clippingPlanes,A.state.camera)):A=null,P.pop(),P.length>0?T=P[P.length-1]:T=null,L!==null&&L.renderEnd()};function nl(y,O,Z,G){if(y.visible===!1)return;if(y.layers.test(O.layers)){if(y.isGroup)Z=y.renderOrder;else if(y.isLOD)y.autoUpdate===!0&&y.update(O);else if(y.isLightProbeGrid)A.pushLightProbeGrid(y);else if(y.isLight)A.pushLight(y),y.castShadow&&A.pushShadow(y);else if(y.isSprite){if(!y.frustumCulled||y.intersectsFrustum(nt)){G&&Zt.setFromMatrixPosition(y.matrixWorld).applyMatrix4(ct);let Rt=ot.update(y),Mt=y.material;Mt.visible&&T.push(y,Rt,Mt,Z,Zt.z,null,O)}}else if((y.isMesh||y.isLine||y.isPoints)&&(!y.frustumCulled||y.intersectsFrustum(nt))){let Rt=ot.update(y),Mt=y.material;if(G&&(y.boundingSphere!==void 0?(y.boundingSphere===null&&y.computeBoundingSphere(),Zt.copy(y.boundingSphere.center)):(Rt.boundingSphere===null&&Rt.computeBoundingSphere(),Zt.copy(Rt.boundingSphere.center)),Zt.applyMatrix4(y.matrixWorld).applyMatrix4(ct)),Array.isArray(Mt)){let Pt=Rt.groups;for(let Dt=0,Kt=Pt.length;Dt<Kt;Dt++){let ee=Pt[Dt],It=Mt[ee.materialIndex];It&&It.visible&&T.push(y,Rt,It,Z,Zt.z,ee,O)}}else Mt.visible&&T.push(y,Rt,Mt,Z,Zt.z,null,O)}}let bt=y.children;for(let Rt=0,Mt=bt.length;Rt<Mt;Rt++)nl(bt[Rt],O,Z,G)}function Hc(y,O,Z,G){let{opaque:H,transmissive:bt,transparent:Rt}=y;A.setupLightsView(Z),wt===!0&&Bt.setGlobalState(M.clippingPlanes,Z),G&&_.viewport(tt.copy(G)),H.length>0&&Or(H,O,Z),bt.length>0&&Or(bt,O,Z),Rt.length>0&&Or(Rt,O,Z),_.buffers.depth.setTest(!0),_.buffers.depth.setMask(!0),_.buffers.color.setMask(!0),_.setPolygonOffset(!1)}function Wc(y,O,Z,G){if((Z.isScene===!0?Z.overrideMaterial:null)!==null)return;if(A.state.transmissionRenderTarget[G.id]===void 0){let It=zt.has("EXT_color_buffer_half_float")||zt.has("EXT_color_buffer_float");A.state.transmissionRenderTarget[G.id]=new Se(1,1,{generateMipmaps:!0,type:It?Ce:hn,minFilter:Si,samples:Math.max(4,R.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:jt.workingColorSpace})}let bt=A.state.transmissionRenderTarget[G.id],Rt=G.viewport||tt;bt.setSize(Rt.z*M.transmissionResolutionScale,Rt.w*M.transmissionResolutionScale);let Mt=M.getRenderTarget(),Pt=M.getActiveCubeFace(),Dt=M.getActiveMipmapLevel();M.setRenderTarget(bt),M.getClearColor(K),at=M.getClearAlpha(),at<1&&M.setClearColor(16777215,.5),M.clear(),Et&&$t.render(Z);let Kt=M.toneMapping;M.toneMapping=cn;let ee=G.viewport;if(G.viewport!==void 0&&(G.viewport=void 0),A.setupLightsView(G),wt===!0&&Bt.setGlobalState(M.clippingPlanes,G),Or(y,Z,G),$.updateMultisampleRenderTarget(bt),$.updateRenderTargetMipmap(bt),zt.has("WEBGL_multisampled_render_to_texture")===!1){let It=!1;for(let ce=0,Ae=O.length;ce<Ae;ce++){let _e=O[ce],{object:fe,geometry:Ue,material:Ct,group:Ge}=_e;if(Ct.side===On&&fe.layers.test(G.layers)){let ie=Ct.side;Ct.side=qe,Ct.needsUpdate=!0,Xc(fe,Z,G,Ue,Ct,Ge),Ct.side=ie,Ct.needsUpdate=!0,It=!0}}It===!0&&($.updateMultisampleRenderTarget(bt),$.updateRenderTargetMipmap(bt))}M.setRenderTarget(Mt,Pt,Dt),M.setClearColor(K,at),ee!==void 0&&(G.viewport=ee),M.toneMapping=Kt}function Or(y,O,Z){let G=O.isScene===!0?O.overrideMaterial:null;for(let H=0,bt=y.length;H<bt;H++){let Rt=y[H],{object:Mt,geometry:Pt,group:Dt}=Rt,Kt=Rt.material;Kt.allowOverride===!0&&G!==null&&(Kt=G),Mt.layers.test(Z.layers)&&Xc(Mt,O,Z,Pt,Kt,Dt)}}function Xc(y,O,Z,G,H,bt){L!==null&&H.isNodeMaterial&&L.setObject(y,H),y.onBeforeRender(M,O,Z,G,H,bt),y.modelViewMatrix.multiplyMatrices(Z.matrixWorldInverse,y.matrixWorld),y.normalMatrix.getNormalMatrix(y.modelViewMatrix),H.onBeforeRender(M,O,Z,G,y,bt),H.transparent===!0&&H.side===On&&H.forceSinglePass===!1?(H.side=qe,H.needsUpdate=!0,M.renderBufferDirect(Z,O,G,H,y,bt),H.side=yi,H.needsUpdate=!0,M.renderBufferDirect(Z,O,G,H,y,bt),H.side=On):M.renderBufferDirect(Z,O,G,H,y,bt),y.onAfterRender(M,O,Z,G,H,bt)}function Br(y,O,Z){O.isScene!==!0&&(O=se);let G=z.get(y),H=A.state.lights,bt=A.state.shadowsArray,Rt=H.state.version,Mt=mt.getParameters(y,H.state,bt,O,Z,A.state.lightProbeGridArray),Pt=mt.getProgramCacheKey(Mt),Dt=G.programs;G.environment=y.isMeshStandardMaterial||y.isMeshLambertMaterial||y.isMeshPhongMaterial?O.environment:null,G.fog=O.fog;let Kt=y.isMeshStandardMaterial||y.isMeshLambertMaterial&&!y.envMap||y.isMeshPhongMaterial&&!y.envMap;G.envMap=ft.get(y.envMap||G.environment,Kt),G.envMapRotation=G.environment!==null&&y.envMap===null?O.environmentRotation:y.envMapRotation,Dt===void 0&&(y.addEventListener("dispose",Pn),Dt=new Map,G.programs=Dt);let ee=Dt.get(Pt);if(ee!==void 0){if(G.currentProgram===ee&&G.lightsStateVersion===Rt)return Yc(y,Mt),ee}else Mt.uniforms=mt.getUniforms(y),L!==null&&y.isNodeMaterial&&L.build(y,Z,Mt),y.onBeforeCompile(Mt,M),ee=mt.acquireProgram(Mt,Pt),Dt.set(Pt,ee),G.uniforms=Mt.uniforms;let It=G.uniforms;return(!y.isShaderMaterial&&!y.isRawShaderMaterial||y.clipping===!0)&&(It.clippingPlanes=Bt.uniform),Yc(y,Mt),G.needsLights=Sf(y),G.lightsStateVersion=Rt,G.needsLights&&(It.ambientLightColor.value=H.state.ambient,It.lightProbe.value=H.state.probe,It.sunLights.value=H.state.sun,It.sunLightShadows.value=H.state.sunShadow,It.directionalLights.value=H.state.directional,It.directionalLightShadows.value=H.state.directionalShadow,It.spotLights.value=H.state.spot,It.spotLightShadows.value=H.state.spotShadow,It.rectAreaLights.value=H.state.rectArea,It.ltc_1.value=H.state.rectAreaLTC1,It.ltc_2.value=H.state.rectAreaLTC2,It.pointLights.value=H.state.point,It.pointLightShadows.value=H.state.pointShadow,It.hemisphereLights.value=H.state.hemi,It.sunShadowMatrix.value=H.state.sunShadowMatrix,It.sunShadowCascade.value=H.state.sunShadowCascade,It.directionalShadowMatrix.value=H.state.directionalShadowMatrix,It.spotLightMatrix.value=H.state.spotLightMatrix,It.spotLightMap.value=H.state.spotLightMap,It.pointShadowMatrix.value=H.state.pointShadowMatrix),G.lightProbeGrid=A.state.lightProbeGridArray.length>0,G.currentProgram=ee,G.uniformsList=null,ee}function qc(y){if(y.uniformsList===null){let O=y.currentProgram.getUniforms();y.uniformsList=ys.seqWithValue(O.seq,y.uniforms)}return y.uniformsList}function Yc(y,O){let Z=z.get(y);Z.outputColorSpace=O.outputColorSpace,Z.batching=O.batching,Z.batchingColor=O.batchingColor,Z.instancing=O.instancing,Z.instancingColor=O.instancingColor,Z.instancingMorph=O.instancingMorph,Z.skinning=O.skinning,Z.morphTargets=O.morphTargets,Z.morphNormals=O.morphNormals,Z.morphColors=O.morphColors,Z.morphTargetsCount=O.morphTargetsCount,Z.numClippingPlanes=O.numClippingPlanes,Z.numIntersection=O.numClipIntersection,Z.vertexAlphas=O.vertexAlphas,Z.vertexTangents=O.vertexTangents,Z.toneMapping=O.toneMapping}function vf(y,O){if(y.length===0)return null;if(y.length===1)return y[0].texture!==null?y[0]:null;v.setFromMatrixPosition(O.matrixWorld);for(let Z=0,G=y.length;Z<G;Z++){let H=y[Z];if(H.texture!==null&&H.boundingBox.containsPoint(v))return H}return null}function yf(y,O,Z,G,H){O.isScene!==!0&&(O=se),$.resetTextureUnits();let bt=O.fog,Rt=G.isMeshStandardMaterial||G.isMeshLambertMaterial||G.isMeshPhongMaterial?O.environment:null,Mt=st===null?M.outputColorSpace:st.isXRRenderTarget===!0?st.texture.colorSpace:jt.workingColorSpace,Pt=G.isMeshStandardMaterial||G.isMeshLambertMaterial&&!G.envMap||G.isMeshPhongMaterial&&!G.envMap,Dt=ft.get(G.envMap||Rt,Pt),Kt=G.vertexColors===!0&&!!Z.attributes.color&&Z.attributes.color.itemSize===4,ee=!!Z.attributes.tangent&&(!!G.normalMap||G.anisotropy>0),It=!!Z.morphAttributes.position,ce=!!Z.morphAttributes.normal,Ae=!!Z.morphAttributes.color,_e=cn;G.toneMapped&&(st===null||st.isXRRenderTarget===!0)&&(_e=M.toneMapping);let fe=Z.morphAttributes.position||Z.morphAttributes.normal||Z.morphAttributes.color,Ue=fe!==void 0?fe.length:0,Ct=z.get(G),Ge=A.state.lights;if(wt===!0&&(St===!0||y!==Q)){let me=y===Q&&G.id===Y;Bt.setState(G,y,me)}let ie=!1;G.version===Ct.__version?(Ct.needsLights&&Ct.lightsStateVersion!==Ge.state.version||Ct.outputColorSpace!==Mt||H.isBatchedMesh&&Ct.batching===!1||!H.isBatchedMesh&&Ct.batching===!0||H.isBatchedMesh&&Ct.batchingColor===!0&&H._colorsTexture===null||H.isBatchedMesh&&Ct.batchingColor===!1&&H._colorsTexture!==null||H.isInstancedMesh&&Ct.instancing===!1||!H.isInstancedMesh&&Ct.instancing===!0||H.isSkinnedMesh&&Ct.skinning===!1||!H.isSkinnedMesh&&Ct.skinning===!0||H.isInstancedMesh&&Ct.instancingColor===!0&&H.instanceColor===null||H.isInstancedMesh&&Ct.instancingColor===!1&&H.instanceColor!==null||H.isInstancedMesh&&Ct.instancingMorph===!0&&H.morphTexture===null||H.isInstancedMesh&&Ct.instancingMorph===!1&&H.morphTexture!==null||Ct.envMap!==Dt||G.fog===!0&&Ct.fog!==bt||Ct.numClippingPlanes!==void 0&&(Ct.numClippingPlanes!==Bt.numPlanes||Ct.numIntersection!==Bt.numIntersection)||Ct.vertexAlphas!==Kt||Ct.vertexTangents!==ee||Ct.morphTargets!==It||Ct.morphNormals!==ce||Ct.morphColors!==Ae||Ct.toneMapping!==_e||Ct.morphTargetsCount!==Ue||!!Ct.lightProbeGrid!=A.state.lightProbeGridArray.length>0)&&(ie=!0):(ie=!0,Ct.__version=G.version);let dn=Ct.currentProgram;ie===!0&&(dn=Br(G,O,H),L&&G.isNodeMaterial&&L.onUpdateProgram(G,dn,Ct));let In=!1,si=!1,Gi=!1,ue=dn.getUniforms(),Te=Ct.uniforms;if(_.useProgram(dn.program)&&(In=!0,si=!0,Gi=!0),G.id!==Y&&(Y=G.id,si=!0),Ct.needsLights){let me=vf(A.state.lightProbeGridArray,H);Ct.lightProbeGrid!==me&&(Ct.lightProbeGrid=me,si=!0)}if(In||Q!==y){_.buffers.depth.getReversed()&&y.reversedDepth!==!0&&(y._reversedDepth=!0,y.updateProjectionMatrix()),ue.setValue(D,"projectionMatrix",y.projectionMatrix),ue.setValue(D,"viewMatrix",y.matrixWorldInverse);let ai=ue.map.cameraPosition;ai!==void 0&&ai.setValue(D,Nt.setFromMatrixPosition(y.matrixWorld)),R.logarithmicDepthBuffer&&ue.setValue(D,"logDepthBufFC",2/(Math.log(y.far+1)/Math.LN2)),(G.isMeshPhongMaterial||G.isMeshToonMaterial||G.isMeshLambertMaterial||G.isMeshBasicMaterial||G.isMeshStandardMaterial||G.isShaderMaterial)&&ue.setValue(D,"isOrthographic",y.isOrthographicCamera===!0),Q!==y&&(Q=y,si=!0,Gi=!0)}if(Ct.needsLights&&(Ge.state.sunShadowMap.length>0&&ue.setValue(D,"sunShadowMap",Ge.state.sunShadowMap,$),Ge.state.directionalShadowMap.length>0&&ue.setValue(D,"directionalShadowMap",Ge.state.directionalShadowMap,$),Ge.state.spotShadowMap.length>0&&ue.setValue(D,"spotShadowMap",Ge.state.spotShadowMap,$),Ge.state.pointShadowMap.length>0&&ue.setValue(D,"pointShadowMap",Ge.state.pointShadowMap,$)),H.isSkinnedMesh){ue.setOptional(D,H,"bindMatrix"),ue.setOptional(D,H,"bindMatrixInverse");let me=H.skeleton;me&&(me.boneTexture===null&&me.computeBoneTexture(),ue.setValue(D,"boneTexture",me.boneTexture,$))}H.isBatchedMesh&&(ue.setOptional(D,H,"batchingTexture"),ue.setValue(D,"batchingTexture",H._matricesTexture,$),ue.setOptional(D,H,"batchingIdTexture"),ue.setValue(D,"batchingIdTexture",H._indirectTexture,$),ue.setOptional(D,H,"batchingColorTexture"),H._colorsTexture!==null&&ue.setValue(D,"batchingColorTexture",H._colorsTexture,$));let ri=Z.morphAttributes;if((ri.position!==void 0||ri.normal!==void 0||ri.color!==void 0)&&B.update(H,Z,dn),(si||Ct.receiveShadow!==H.receiveShadow)&&(Ct.receiveShadow=H.receiveShadow,ue.setValue(D,"receiveShadow",H.receiveShadow)),(G.isMeshStandardMaterial||G.isMeshLambertMaterial||G.isMeshPhongMaterial)&&G.envMap===null&&O.environment!==null&&(Te.envMapIntensity.value=O.environmentIntensity),Te.dfgLUT!==void 0&&(Te.dfgLUT.value=c_()),si){if(ue.setValue(D,"toneMappingExposure",M.toneMappingExposure),Ct.needsLights&&Mf(Te,Gi),bt&&G.fog===!0&&Ot.refreshFogUniforms(Te,bt),Ot.refreshMaterialUniforms(Te,G,j,X,A.state.transmissionRenderTarget[y.id]),Ct.needsLights&&Ct.lightProbeGrid){let me=Ct.lightProbeGrid;Te.probesSH.value=me.texture,Te.probesMin.value.copy(me.boundingBox.min),Te.probesMax.value.copy(me.boundingBox.max),Te.probesResolution.value.copy(me.resolution)}ys.upload(D,qc(Ct),Te,$)}if(G.isShaderMaterial&&G.uniformsNeedUpdate===!0&&(ys.upload(D,qc(Ct),Te,$),G.uniformsNeedUpdate=!1),G.isSpriteMaterial&&ue.setValue(D,"center",H.center),ue.setValue(D,"modelViewMatrix",H.modelViewMatrix),ue.setValue(D,"normalMatrix",H.normalMatrix),ue.setValue(D,"modelMatrix",H.matrixWorld),G.uniformsGroups!==void 0){let me=G.uniformsGroups;for(let ai=0,Hi=me.length;ai<Hi;ai++){let Jc=me[ai];lt.update(Jc,dn),lt.bind(Jc,dn)}}return dn}function Mf(y,O){y.ambientLightColor.needsUpdate=O,y.lightProbe.needsUpdate=O,y.sunLights.needsUpdate=O,y.sunLightShadows.needsUpdate=O,y.directionalLights.needsUpdate=O,y.directionalLightShadows.needsUpdate=O,y.pointLights.needsUpdate=O,y.pointLightShadows.needsUpdate=O,y.spotLights.needsUpdate=O,y.spotLightShadows.needsUpdate=O,y.rectAreaLights.needsUpdate=O,y.hemisphereLights.needsUpdate=O}function Sf(y){return y.isMeshLambertMaterial||y.isMeshToonMaterial||y.isMeshPhongMaterial||y.isMeshStandardMaterial||y.isShadowMaterial||y.isShaderMaterial&&y.lights===!0}this.getActiveCubeFace=function(){return q},this.getActiveMipmapLevel=function(){return W},this.getRenderTarget=function(){return st},this.setRenderTargetTextures=function(y,O,Z){let G=z.get(y);G.__autoAllocateDepthBuffer=y.resolveDepthBuffer===!1,G.__autoAllocateDepthBuffer===!1&&(G.__useRenderToTexture=!1),z.get(y.texture).__webglTexture=O,z.get(y.depthTexture).__webglTexture=G.__autoAllocateDepthBuffer?void 0:Z,G.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(y,O){let Z=z.get(y);Z.__webglFramebuffer=O,Z.__useDefaultFramebuffer=O===void 0},this.setRenderTarget=function(y,O=0,Z=0){st=y,q=O,W=Z;let G=null,H=!1,bt=!1;if(y){let Mt=z.get(y);if(Mt.__useDefaultFramebuffer!==void 0){_.bindFramebuffer(D.FRAMEBUFFER,Mt.__webglFramebuffer),tt.copy(y.viewport),J.copy(y.scissor),U=y.scissorTest,_.viewport(tt),_.scissor(J),_.setScissorTest(U),Y=-1;return}else if(Mt.__webglFramebuffer===void 0)$.setupRenderTarget(y);else if(Mt.__hasExternalTextures)$.rebindTextures(y,z.get(y.texture).__webglTexture,z.get(y.depthTexture).__webglTexture);else if(y.depthBuffer){let Kt=y.depthTexture;if(Mt.__boundDepthTexture!==Kt){if(Kt!==null&&z.has(Kt)&&(y.width!==Kt.image.width||y.height!==Kt.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");$.setupDepthRenderbuffer(y)}}let Pt=y.texture;(Pt.isData3DTexture||Pt.isDataArrayTexture||Pt.isCompressedArrayTexture)&&(bt=!0);let Dt=z.get(y).__webglFramebuffer;y.isWebGLCubeRenderTarget?(Array.isArray(Dt[O])?G=Dt[O][Z]:G=Dt[O],H=!0):y.samples>0&&$.useMultisampledRTT(y)===!1?G=z.get(y).__webglMultisampledFramebuffer:Array.isArray(Dt)?G=Dt[Z]:G=Dt,tt.copy(y.viewport),J.copy(y.scissor),U=y.scissorTest}else tt.copy(ut).multiplyScalar(j).floor(),J.copy(Ft).multiplyScalar(j).floor(),U=de;if(Z!==0&&(G=N),_.bindFramebuffer(D.FRAMEBUFFER,G)&&_.drawBuffers(y,G),_.viewport(tt),_.scissor(J),_.setScissorTest(U),H){let Mt=z.get(y.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_CUBE_MAP_POSITIVE_X+O,Mt.__webglTexture,Z)}else if(bt){let Mt=O;for(let Pt=0;Pt<y.textures.length;Pt++){let Dt=z.get(y.textures[Pt]);D.framebufferTextureLayer(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0+Pt,Dt.__webglTexture,Z,Mt)}}else if(y!==null&&Z!==0){let Mt=z.get(y.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,Mt.__webglTexture,Z)}Y=-1};function Zc(y){let O=z.get(y);return(O.__readFormat!==y.format||O.__readType!==y.type)&&(O.__readFormat=y.format,O.__readType=y.type,O.__formatReadable=R.textureFormatReadable(y.format),O.__typeReadable=R.textureTypeReadable(y.type)),O}this.readRenderTargetPixels=function(y,O,Z,G,H,bt,Rt,Mt=0){if(!(y&&y.isWebGLRenderTarget)){Wt("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Pt=z.get(y).__webglFramebuffer;if(y.isWebGLCubeRenderTarget&&Rt!==void 0&&(Pt=Pt[Rt]),Pt){_.bindFramebuffer(D.FRAMEBUFFER,Pt);try{let Dt=y.textures[Mt],Kt=Dt.format,ee=Dt.type;y.textures.length>1&&D.readBuffer(D.COLOR_ATTACHMENT0+Mt);let It=Zc(Dt);if(It.__formatReadable===!1){Wt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(It.__typeReadable===!1){Wt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}O>=0&&O<=y.width-G&&Z>=0&&Z<=y.height-H&&D.readPixels(O,Z,G,H,xt.convert(Kt),xt.convert(ee),bt)}finally{let Dt=st!==null?z.get(st).__webglFramebuffer:null;_.bindFramebuffer(D.FRAMEBUFFER,Dt)}}},this.readRenderTargetPixelsAsync=async function(y,O,Z,G,H,bt,Rt,Mt=0){if(!(y&&y.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Pt=z.get(y).__webglFramebuffer;if(y.isWebGLCubeRenderTarget&&Rt!==void 0&&(Pt=Pt[Rt]),Pt)if(O>=0&&O<=y.width-G&&Z>=0&&Z<=y.height-H){_.bindFramebuffer(D.FRAMEBUFFER,Pt);let Dt=y.textures[Mt],Kt=Dt.format,ee=Dt.type;y.textures.length>1&&D.readBuffer(D.COLOR_ATTACHMENT0+Mt);let It=Zc(Dt);if(It.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(It.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let ce=D.createBuffer();D.bindBuffer(D.PIXEL_PACK_BUFFER,ce),D.bufferData(D.PIXEL_PACK_BUFFER,bt.byteLength,D.STREAM_READ),D.readPixels(O,Z,G,H,xt.convert(Kt),xt.convert(ee),0),D.bindBuffer(D.PIXEL_PACK_BUFFER,null);let Ae=st!==null?z.get(st).__webglFramebuffer:null;_.bindFramebuffer(D.FRAMEBUFFER,Ae);let _e=D.fenceSync(D.SYNC_GPU_COMMANDS_COMPLETE,0);return D.flush(),await tu(D,_e,4),D.bindBuffer(D.PIXEL_PACK_BUFFER,ce),D.getBufferSubData(D.PIXEL_PACK_BUFFER,0,bt),D.bindBuffer(D.PIXEL_PACK_BUFFER,null),D.deleteBuffer(ce),D.deleteSync(_e),bt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(y,O=null,Z=0){let G=Math.pow(2,-Z),H=Math.floor(y.image.width*G),bt=Math.floor(y.image.height*G),Rt=O!==null?O.x:0,Mt=O!==null?O.y:0;$.setTexture2D(y,0),D.copyTexSubImage2D(D.TEXTURE_2D,Z,0,0,Rt,Mt,H,bt),_.unbindTexture()},this.copyTextureToTexture=function(y,O,Z=null,G=null,H=0,bt=0){let Rt,Mt,Pt,Dt,Kt,ee,It,ce,Ae,_e=y.isCompressedTexture?y.mipmaps[bt]:y.image;if(Z!==null)Rt=Z.max.x-Z.min.x,Mt=Z.max.y-Z.min.y,Pt=Z.isBox3?Z.max.z-Z.min.z:1,Dt=Z.min.x,Kt=Z.min.y,ee=Z.isBox3?Z.min.z:0;else{let Te=Math.pow(2,-H);Rt=Math.floor(_e.width*Te),Mt=Math.floor(_e.height*Te),y.isDataArrayTexture?Pt=_e.depth:y.isData3DTexture?Pt=Math.floor(_e.depth*Te):Pt=1,Dt=0,Kt=0,ee=0}G!==null?(It=G.x,ce=G.y,Ae=G.z):(It=0,ce=0,Ae=0);let fe=xt.convert(O.format),Ue=xt.convert(O.type),Ct;O.isData3DTexture?($.setTexture3D(O,0),Ct=D.TEXTURE_3D):O.isDataArrayTexture||O.isCompressedArrayTexture?($.setTexture2DArray(O,0),Ct=D.TEXTURE_2D_ARRAY):($.setTexture2D(O,0),Ct=D.TEXTURE_2D),_.activeTexture(D.TEXTURE0),_.pixelStorei(D.UNPACK_FLIP_Y_WEBGL,O.flipY),_.pixelStorei(D.UNPACK_PREMULTIPLY_ALPHA_WEBGL,O.premultiplyAlpha),_.pixelStorei(D.UNPACK_ALIGNMENT,O.unpackAlignment);let Ge=_.getParameter(D.UNPACK_ROW_LENGTH),ie=_.getParameter(D.UNPACK_IMAGE_HEIGHT),dn=_.getParameter(D.UNPACK_SKIP_PIXELS),In=_.getParameter(D.UNPACK_SKIP_ROWS),si=_.getParameter(D.UNPACK_SKIP_IMAGES);_.pixelStorei(D.UNPACK_ROW_LENGTH,_e.width),_.pixelStorei(D.UNPACK_IMAGE_HEIGHT,_e.height),_.pixelStorei(D.UNPACK_SKIP_PIXELS,Dt),_.pixelStorei(D.UNPACK_SKIP_ROWS,Kt),_.pixelStorei(D.UNPACK_SKIP_IMAGES,ee);let Gi=y.isDataArrayTexture||y.isData3DTexture,ue=O.isDataArrayTexture||O.isData3DTexture;if(y.isDepthTexture){let Te=z.get(y),ri=z.get(O),me=z.get(Te.__renderTarget),ai=z.get(ri.__renderTarget);_.bindFramebuffer(D.READ_FRAMEBUFFER,me.__webglFramebuffer),_.bindFramebuffer(D.DRAW_FRAMEBUFFER,ai.__webglFramebuffer);for(let Hi=0;Hi<Pt;Hi++)Gi&&(D.framebufferTextureLayer(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,z.get(y).__webglTexture,H,ee+Hi),D.framebufferTextureLayer(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,z.get(O).__webglTexture,bt,Ae+Hi)),D.blitFramebuffer(Dt,Kt,Rt,Mt,It,ce,Rt,Mt,D.DEPTH_BUFFER_BIT,D.NEAREST);_.bindFramebuffer(D.READ_FRAMEBUFFER,null),_.bindFramebuffer(D.DRAW_FRAMEBUFFER,null)}else if(H!==0||y.isRenderTargetTexture||z.has(y)){let Te=z.get(y),ri=z.get(O);_.bindFramebuffer(D.READ_FRAMEBUFFER,I),_.bindFramebuffer(D.DRAW_FRAMEBUFFER,F);for(let me=0;me<Pt;me++)Gi?D.framebufferTextureLayer(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,Te.__webglTexture,H,ee+me):D.framebufferTexture2D(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,Te.__webglTexture,H),ue?D.framebufferTextureLayer(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,ri.__webglTexture,bt,Ae+me):D.framebufferTexture2D(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,ri.__webglTexture,bt),H!==0?D.blitFramebuffer(Dt,Kt,Rt,Mt,It,ce,Rt,Mt,D.COLOR_BUFFER_BIT,D.NEAREST):ue?D.copyTexSubImage3D(Ct,bt,It,ce,Ae+me,Dt,Kt,Rt,Mt):D.copyTexSubImage2D(Ct,bt,It,ce,Dt,Kt,Rt,Mt);_.bindFramebuffer(D.READ_FRAMEBUFFER,null),_.bindFramebuffer(D.DRAW_FRAMEBUFFER,null)}else ue?y.isDataTexture||y.isData3DTexture?D.texSubImage3D(Ct,bt,It,ce,Ae,Rt,Mt,Pt,fe,Ue,_e.data):O.isCompressedArrayTexture?D.compressedTexSubImage3D(Ct,bt,It,ce,Ae,Rt,Mt,Pt,fe,_e.data):D.texSubImage3D(Ct,bt,It,ce,Ae,Rt,Mt,Pt,fe,Ue,_e):y.isDataTexture?D.texSubImage2D(D.TEXTURE_2D,bt,It,ce,Rt,Mt,fe,Ue,_e.data):y.isCompressedTexture?D.compressedTexSubImage2D(D.TEXTURE_2D,bt,It,ce,_e.width,_e.height,fe,_e.data):D.texSubImage2D(D.TEXTURE_2D,bt,It,ce,Rt,Mt,fe,Ue,_e);_.pixelStorei(D.UNPACK_ROW_LENGTH,Ge),_.pixelStorei(D.UNPACK_IMAGE_HEIGHT,ie),_.pixelStorei(D.UNPACK_SKIP_PIXELS,dn),_.pixelStorei(D.UNPACK_SKIP_ROWS,In),_.pixelStorei(D.UNPACK_SKIP_IMAGES,si),bt===0&&O.generateMipmaps&&D.generateMipmap(Ct),_.unbindTexture()},this.initRenderTarget=function(y){z.get(y).__webglFramebuffer===void 0&&$.setupRenderTarget(y)},this.initTexture=function(y){y.isCubeTexture?$.setTextureCube(y,0):y.isData3DTexture?$.setTexture3D(y,0):y.isDataArrayTexture||y.isCompressedArrayTexture?$.setTexture2DArray(y,0):$.setTexture2D(y,0),_.unbindTexture()},this.resetState=function(){q=0,W=0,st=null,_.reset(),At.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return bn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let e=this.getContext();e.drawingBufferColorSpace=jt._getDrawingBufferColorSpace(t),e.unpackColorSpace=jt._getUnpackColorSpace()}};var zn={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};var Ye=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}},u_=new Ni(-1,1,1,-1,0,1),vc=class extends Xe{constructor(){super(),this.setAttribute("position",new We([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new We([0,2,0,0,2,0],2))}},f_=new vc,wn=class{constructor(t){this._mesh=new Ke(f_,t)}dispose(){this._mesh.geometry.dispose()}render(t){t.render(this._mesh,u_)}get material(){return this._mesh.material}set material(t){this._mesh.material=t}};var Ss=class extends Ye{constructor(t,e="tDiffuse"){super(),this.textureID=e,this.uniforms=null,this.material=null,t instanceof ge?(this.uniforms=t.uniforms,this.material=t):t&&(this.uniforms=mn.clone(t.uniforms),this.material=new ge({name:t.name!==void 0?t.name:"unspecified",defines:Object.assign({},t.defines),uniforms:this.uniforms,vertexShader:t.vertexShader,fragmentShader:t.fragmentShader})),this._fsQuad=new wn(this.material)}render(t,e,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this._fsQuad.material=this.material,this.renderToScreen?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(e),this.clear&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),this._fsQuad.render(t))}dispose(){this.material.dispose(),this._fsQuad.dispose()}};var Mr=class extends Ye{constructor(t,e){super(),this.scene=t,this.camera=e,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(t,e,n){let s=t.getContext(),r=t.state;r.buffers.color.setMask(!1),r.buffers.depth.setMask(!1),r.buffers.color.setLocked(!0),r.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),r.buffers.stencil.setTest(!0),r.buffers.stencil.setOp(s.REPLACE,s.REPLACE,s.REPLACE),r.buffers.stencil.setFunc(s.ALWAYS,a,4294967295),r.buffers.stencil.setClear(o),r.buffers.stencil.setLocked(!0),t.setRenderTarget(n),this.clear&&t.clear(),t.render(this.scene,this.camera),t.setRenderTarget(e),this.clear&&t.clear(),t.render(this.scene,this.camera),r.buffers.color.setLocked(!1),r.buffers.depth.setLocked(!1),r.buffers.color.setMask(!0),r.buffers.depth.setMask(!0),r.buffers.stencil.setLocked(!1),r.buffers.stencil.setFunc(s.EQUAL,1,4294967295),r.buffers.stencil.setOp(s.KEEP,s.KEEP,s.KEEP),r.buffers.stencil.setLocked(!0)}},Do=class extends Ye{constructor(){super(),this.needsSwap=!1}render(t){t.state.buffers.stencil.setLocked(!1),t.state.buffers.stencil.setTest(!1)}};var No=class{constructor(t,e){if(this.renderer=t,this._pixelRatio=t.getPixelRatio(),e===void 0){let n=t.getSize(new Xt);this._width=n.width,this._height=n.height,e=new Se(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:Ce}),e.texture.name="EffectComposer.rt1"}else this._width=e.width,this._height=e.height;this.renderTarget1=e,this.renderTarget2=e.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new Ss(zn),this.copyPass.material.blending=Qe,this.timer=new er}swapBuffers(){let t=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=t}addPass(t){this.passes.push(t),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(t,e){this.passes.splice(e,0,t),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(t){let e=this.passes.indexOf(t);e!==-1&&this.passes.splice(e,1)}isLastEnabledPass(t){for(let e=t+1;e<this.passes.length;e++)if(this.passes[e].enabled)return!1;return!0}render(t){this.timer.update(),t===void 0&&(t=this.timer.getDelta());let e=this.renderer.getRenderTarget(),n=!1;for(let s=0,r=this.passes.length;s<r;s++){let a=this.passes[s];if(a.enabled!==!1){if(a.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(s),a.render(this.renderer,this.writeBuffer,this.readBuffer,t,n),a.needsSwap){if(n){let o=this.renderer.getContext(),l=this.renderer.state.buffers.stencil;l.setFunc(o.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,t),l.setFunc(o.EQUAL,1,4294967295)}this.swapBuffers()}Mr!==void 0&&(a instanceof Mr?n=!0:a instanceof Do&&(n=!1))}}this.renderer.setRenderTarget(e)}reset(t){if(t===void 0){let e=this.renderer.getSize(new Xt);this._pixelRatio=this.renderer.getPixelRatio(),this._width=e.width,this._height=e.height,t=this.renderTarget1.clone(),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=t,this.renderTarget2=t.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(t,e){this._width=t,this._height=e;let n=this._width*this._pixelRatio,s=this._height*this._pixelRatio;this.renderTarget1.setSize(n,s),this.renderTarget2.setSize(n,s);for(let r=0;r<this.passes.length;r++)this.passes[r].setSize(n,s)}setPixelRatio(t){this._pixelRatio=t,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}};var Uo=class extends Ye{constructor(t,e,n=null,s=null,r=null){super(),this.scene=t,this.camera=e,this.overrideMaterial=n,this.clearColor=s,this.clearAlpha=r,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new qt}render(t,e,n){let s=t.autoClear;t.autoClear=!1;let r,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(t.getClearColor(this._oldClearColor),t.setClearColor(this.clearColor,t.getClearAlpha())),this.clearAlpha!==null&&(r=t.getClearAlpha(),t.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&t.clearDepth(),t.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),t.render(this.scene,this.camera),this.clearColor!==null&&t.setClearColor(this._oldClearColor),this.clearAlpha!==null&&t.setClearAlpha(r),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),t.autoClear=s}};var Du={name:"LuminosityHighPassShader",uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new qt(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`};var bs=class i extends Ye{constructor(t,e=1,n,s){super(),this.strength=e,this.radius=n,this.threshold=s,this.resolution=t!==void 0?new Xt(t.x,t.y):new Xt(256,256),this.clearColor=new qt(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let r=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);this.renderTargetBright=new Se(r,a,{type:Ce,depthBuffer:!1}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let h=0;h<this.nMips;h++){let f=new Se(r,a,{type:Ce,depthBuffer:!1});f.texture.name="UnrealBloomPass.h"+h,f.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(f);let u=new Se(r,a,{type:Ce,depthBuffer:!1});u.texture.name="UnrealBloomPass.v"+h,u.texture.generateMipmaps=!1,this.renderTargetsVertical.push(u),r=Math.round(r/2),a=Math.round(a/2)}let o=Du;this.highPassUniforms=mn.clone(o.uniforms),this.highPassUniforms.luminosityThreshold.value=s,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new ge({uniforms:this.highPassUniforms,vertexShader:o.vertexShader,fragmentShader:o.fragmentShader}),this.separableBlurMaterials=[];let l=[6,10,14,18,22];r=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);for(let h=0;h<this.nMips;h++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(l[h])),this.separableBlurMaterials[h].uniforms.invSize.value=new Xt(1/r,1/a),r=Math.round(r/2),a=Math.round(a/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=e,this.compositeMaterial.uniforms.bloomRadius.value=.1;let c=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=c,this.bloomTintColors=[new V(1,1,1),new V(1,1,1),new V(1,1,1),new V(1,1,1),new V(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=mn.clone(zn.uniforms),this.blendMaterial=new ge({uniforms:this.copyUniforms,vertexShader:zn.vertexShader,fragmentShader:zn.fragmentShader,premultipliedAlpha:!0,blending:Ui,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new qt,this._oldClearAlpha=1,this._basic=new Di,this._fsQuad=new wn(null)}dispose(){for(let t=0;t<this.renderTargetsHorizontal.length;t++)this.renderTargetsHorizontal[t].dispose();for(let t=0;t<this.renderTargetsVertical.length;t++)this.renderTargetsVertical[t].dispose();this.renderTargetBright.dispose();for(let t=0;t<this.separableBlurMaterials.length;t++)this.separableBlurMaterials[t].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(t,e){let n=Math.round(t/2),s=Math.round(e/2);this.renderTargetBright.setSize(n,s);for(let r=0;r<this.nMips;r++)this.renderTargetsHorizontal[r].setSize(n,s),this.renderTargetsVertical[r].setSize(n,s),this.separableBlurMaterials[r].uniforms.invSize.value=new Xt(1/n,1/s),n=Math.round(n/2),s=Math.round(s/2)}render(t,e,n,s,r){t.getClearColor(this._oldClearColor),this._oldClearAlpha=t.getClearAlpha();let a=t.autoClear;t.autoClear=!1,t.setClearColor(this.clearColor,0),r&&t.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=n.texture,t.setRenderTarget(null),t.clear(),this._fsQuad.render(t)),this.highPassUniforms.tDiffuse.value=n.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,t.setRenderTarget(this.renderTargetBright),t.clear(),this._fsQuad.render(t);let o=this.renderTargetBright;for(let l=0;l<this.nMips;l++)this._fsQuad.material=this.separableBlurMaterials[l],this.separableBlurMaterials[l].uniforms.colorTexture.value=o.texture,this.separableBlurMaterials[l].uniforms.direction.value=i.BlurDirectionX,t.setRenderTarget(this.renderTargetsHorizontal[l]),t.clear(),this._fsQuad.render(t),this.separableBlurMaterials[l].uniforms.colorTexture.value=this.renderTargetsHorizontal[l].texture,this.separableBlurMaterials[l].uniforms.direction.value=i.BlurDirectionY,t.setRenderTarget(this.renderTargetsVertical[l]),t.clear(),this._fsQuad.render(t),o=this.renderTargetsVertical[l];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,t.setRenderTarget(this.renderTargetsHorizontal[0]),t.clear(),this._fsQuad.render(t),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,r&&t.state.buffers.stencil.setTest(!0),this.renderToScreen?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(n),this._fsQuad.render(t)),t.setClearColor(this._oldClearColor,this._oldClearAlpha),t.autoClear=a}_getSeparableBlurMaterial(t){let e=[],n=t/3;for(let a=0;a<t;a++)e.push(.39894*Math.exp(-.5*a*a/(n*n))/n);let s=[],r=[];for(let a=1;a<t;a+=2){let o=e[a],l=a+1<t?e[a+1]:0,c=o+l;s.push((a*o+(a+1)*l)/c),r.push(c)}return new ge({defines:{KERNEL_PAIRS:s.length},uniforms:{colorTexture:{value:null},invSize:{value:new Xt(.5,.5)},direction:{value:new Xt(.5,.5)},centerWeight:{value:e[0]},gaussianOffsets:{value:s},gaussianWeights:{value:r}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				#include <common>

				varying vec2 vUv;

				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float centerWeight;
				uniform float gaussianOffsets[KERNEL_PAIRS];
				uniform float gaussianWeights[KERNEL_PAIRS];

				void main() {

					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * centerWeight;

					for ( int i = 0; i < KERNEL_PAIRS; i ++ ) {

						vec2 uvOffset = direction * invSize * gaussianOffsets[ i ];
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += ( sample1 + sample2 ) * gaussianWeights[ i ];

					}

					gl_FragColor = vec4( diffuseSum, 1.0 );

				}`})}_getCompositeMaterial(t){return new ge({defines:{NUM_MIPS:t},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				varying vec2 vUv;

				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor( const in float factor ) {

					float mirrorFactor = 1.2 - factor;
					return mix( factor, mirrorFactor, bloomRadius );

				}

				void main() {

					// 3.0 for backwards compatibility with previous alpha-based intensity
					vec3 bloom = 3.0 * bloomStrength * (
						lerpBloomFactor( bloomFactors[ 0 ] ) * bloomTintColors[ 0 ] * texture2D( blurTexture1, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 1 ] ) * bloomTintColors[ 1 ] * texture2D( blurTexture2, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 2 ] ) * bloomTintColors[ 2 ] * texture2D( blurTexture3, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 3 ] ) * bloomTintColors[ 3 ] * texture2D( blurTexture4, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 4 ] ) * bloomTintColors[ 4 ] * texture2D( blurTexture5, vUv ).rgb
					);

					float bloomAlpha = max( bloom.r, max( bloom.g, bloom.b ) );
					gl_FragColor = vec4( bloom, bloomAlpha );

				}`})}};bs.BlurDirectionX=new Xt(1,0);bs.BlurDirectionY=new Xt(0,1);var Sr={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#elif defined( CUSTOM_TONE_MAPPING )

				gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`};var Fo=class extends Ye{constructor(){super(),this.isOutputPass=!0,this.uniforms=mn.clone(Sr.uniforms),this.material=new fs({name:Sr.name,uniforms:this.uniforms,vertexShader:Sr.vertexShader,fragmentShader:Sr.fragmentShader}),this._fsQuad=new wn(this.material),this._outputColorSpace=null,this._toneMapping=null}render(t,e,n){this.uniforms.tDiffuse.value=n.texture,this.uniforms.toneMappingExposure.value=t.toneMappingExposure,(this._outputColorSpace!==t.outputColorSpace||this._toneMapping!==t.toneMapping)&&(this._outputColorSpace=t.outputColorSpace,this._toneMapping=t.toneMapping,this.material.defines={},jt.getTransfer(this._outputColorSpace)===ae&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===ir?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===sr?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===rr?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===ar?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===lr?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===cr?this.material.defines.NEUTRAL_TONE_MAPPING="":this._toneMapping===or&&(this.material.defines.CUSTOM_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(e),this.clear&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),this._fsQuad.render(t))}dispose(){this.material.dispose(),this._fsQuad.dispose()}};var Oo={name:"AfterimageShader",uniforms:{damp:{value:.96},tOld:{value:null},tNew:{value:null}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float damp;

		uniform sampler2D tOld;
		uniform sampler2D tNew;

		varying vec2 vUv;

		vec4 when_gt( vec4 x, float y ) {

			return max( sign( x - y ), 0.0 );

		}

		void main() {

			vec4 texelOld = texture2D( tOld, vUv );
			vec4 texelNew = texture2D( tNew, vUv );

			texelOld *= damp * when_gt( texelOld, 0.1 );

			gl_FragColor = max(texelNew, texelOld);

		}`};var Bo=class extends Ye{constructor(t=.96){super(),this.uniforms=mn.clone(Oo.uniforms),this.damp=t,this.compFsMaterial=new ge({uniforms:this.uniforms,vertexShader:Oo.vertexShader,fragmentShader:Oo.fragmentShader}),this.copyFsMaterial=new ge({uniforms:mn.clone(zn.uniforms),vertexShader:zn.vertexShader,fragmentShader:zn.fragmentShader,blending:Qe,depthTest:!1,depthWrite:!1}),this._textureComp=new Se(window.innerWidth,window.innerHeight,{magFilter:Me,type:Ce,depthBuffer:!1}),this._textureOld=new Se(window.innerWidth,window.innerHeight,{magFilter:Me,type:Ce,depthBuffer:!1}),this._compFsQuad=new wn(this.compFsMaterial),this._copyFsQuad=new wn(this.copyFsMaterial)}get damp(){return this.uniforms.damp.value}set damp(t){this.uniforms.damp.value=t}render(t,e,n){this.uniforms.tOld.value=this._textureOld.texture,this.uniforms.tNew.value=n.texture,t.setRenderTarget(this._textureComp),this._compFsQuad.render(t),this._copyFsQuad.material.uniforms.tDiffuse.value=this._textureComp.texture,this.renderToScreen?(t.setRenderTarget(null),this._copyFsQuad.render(t)):(t.setRenderTarget(e),this.clear&&t.clear(),this._copyFsQuad.render(t));let s=this._textureOld;this._textureOld=this._textureComp,this._textureComp=s}setSize(t,e){this._textureComp.setSize(t,e),this._textureOld.setSize(t,e)}dispose(){this._textureComp.dispose(),this._textureOld.dispose(),this.compFsMaterial.dispose(),this.copyFsMaterial.dispose(),this._compFsQuad.dispose(),this._copyFsQuad.dispose()}};function yc(i){let t=i>>>0;return function(){t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}var gn=new Float32Array([1,1,0,-1,1,0,1,-1,0,-1,-1,0,1,0,1,-1,0,1,1,0,-1,-1,0,-1,0,1,1,0,-1,1,0,1,-1,0,-1,-1]);function Nu(i=1){let t=yc(i),e=new Uint8Array(256);for(let o=0;o<256;o++)e[o]=o;for(let o=255;o>0;o--){let l=Math.floor(t()*(o+1)),c=e[o];e[o]=e[l],e[l]=c}let n=new Uint8Array(512),s=new Uint8Array(512);for(let o=0;o<512;o++)n[o]=e[o&255],s[o]=n[o]%12;let r=1/3,a=1/6;return function(l,c,h){let f,u,d,g,w=(l+c+h)*r,m=Math.floor(l+w),p=Math.floor(c+w),S=Math.floor(h+w),C=(m+p+S)*a,v=l-(m-C),T=c-(p-C),A=h-(S-C),P,x,b,M,E,L;v>=T?T>=A?(P=1,x=0,b=0,M=1,E=1,L=0):v>=A?(P=1,x=0,b=0,M=1,E=0,L=1):(P=0,x=0,b=1,M=1,E=0,L=1):T<A?(P=0,x=0,b=1,M=0,E=1,L=1):v<A?(P=0,x=1,b=0,M=0,E=1,L=1):(P=0,x=1,b=0,M=1,E=1,L=0);let N=v-P+a,I=T-x+a,F=A-b+a,q=v-M+2*a,W=T-E+2*a,st=A-L+2*a,Y=v-1+3*a,Q=T-1+3*a,tt=A-1+3*a,J=m&255,U=p&255,K=S&255,at=.6-v*v-T*T-A*A;if(at<0)f=0;else{let ht=s[J+n[U+n[K]]]*3;at*=at,f=at*at*(gn[ht]*v+gn[ht+1]*T+gn[ht+2]*A)}let Tt=.6-N*N-I*I-F*F;if(Tt<0)u=0;else{let ht=s[J+P+n[U+x+n[K+b]]]*3;Tt*=Tt,u=Tt*Tt*(gn[ht]*N+gn[ht+1]*I+gn[ht+2]*F)}let X=.6-q*q-W*W-st*st;if(X<0)d=0;else{let ht=s[J+M+n[U+E+n[K+L]]]*3;X*=X,d=X*X*(gn[ht]*q+gn[ht+1]*W+gn[ht+2]*st)}let j=.6-Y*Y-Q*Q-tt*tt;if(j<0)g=0;else{let ht=s[J+1+n[U+1+n[K+1]]]*3;j*=j,g=j*j*(gn[ht]*Y+gn[ht+1]*Q+gn[ht+2]*tt)}return 32*(f+u+d+g)}}var fn=i=>{let t=new qt(i);return[t.r,t.g,t.b]},et={c10:fn("#F4F7FB"),c20:fn("#E8EEF6"),c30:fn("#CCDBEB"),c40:fn("#9FBDDA"),c50:fn("#6C9AC4"),c60:fn("#497DAE"),c70:fn("#376392"),aqua:fn("#7CCAD6"),mint:fn("#8BD3B4"),lav:fn("#A7A2E6"),orchid:fn("#CF98D6"),amber:fn("#F0B46A"),coral:fn("#EC8A80")},Fu=10,we=Math.PI*2,dt=(i,t)=>[i[0]+t[0],i[1]+t[1],i[2]+t[2]],An=(i,t)=>[i[0]-t[0],i[1]-t[1],i[2]-t[2]],Ut=(i,t)=>[i[0]*t,i[1]*t,i[2]*t],d_=(i,t)=>i[0]*t[0]+i[1]*t[1]+i[2]*t[2],ko=(i,t)=>[i[1]*t[2]-i[2]*t[1],i[2]*t[0]-i[0]*t[2],i[0]*t[1]-i[1]*t[0]],jn=i=>Math.hypot(i[0],i[1],i[2]),Je=i=>{let t=jn(i)||1;return[i[0]/t,i[1]/t,i[2]/t]},En=(i,t,e)=>i+(t-i)*e,Vn=(i,t,e)=>[En(i[0],t[0],e),En(i[1],t[1],e),En(i[2],t[2],e)],As=(i,t,e)=>{let n=Math.min(1,Math.max(0,(e-i)/(t-i)));return n*n*(3-2*n)};function ye(i){let t=0;for(;t===0;)t=i();return Math.sqrt(-2*Math.log(t))*Math.cos(we*i())}function te(i){let t=i()*2-1,e=i()*we,n=Math.sqrt(1-t*t);return[n*Math.cos(e),t,n*Math.sin(e)]}function p_(i){let t=te(i);return Ut(t,Math.cbrt(i()))}function bc(i){let t=Math.abs(i[1])<.9?[0,1,0]:[1,0,0],e=Je(ko(i,t)),n=ko(i,e);return[e,n]}function Tr(i,t){let[e,n]=bc(i),s=t()*we;return dt(Ut(e,Math.cos(s)),Ut(n,Math.sin(s)))}function ws(i,t,e){let n=Tr(i,e);return Je(dt(Ut(i,Math.cos(t)),Ut(n,Math.sin(t))))}function m_(i,t){let e=1-2*(i+.5)/t,n=Math.sqrt(1-e*e),s=i*2.399963229728653;return[n*Math.cos(s),e,n*Math.sin(s)]}var br=(i,t)=>t[Math.floor(i()*t.length)];function Re(i){let t=i();return t<.4?et.c40:t<.7?et.c50:t<.82?et.c30:t<.94?et.c60:t<.97?et.c20:et.c70}function zi(i){let t=i();return t<.5?et.c30:t<.86?et.c40:et.c20}function ti(i){let t=i();return t<.45?et.c60:t<.8?et.c70:et.c50}function Gn(i,t){let e=t.reduce((r,a)=>r+a,0),n=t.map(r=>Math.floor(i*r/e)),s=i-n.reduce((r,a)=>r+a,0);for(let r=0;s>0;r=(r+1)%n.length,s--)n[r]++;return n}function en(i,t){let e=new Float64Array(i.length),n=0;for(let s=0;s<i.length;s++)n+=i[s],e[s]=n;return()=>{let s=t()*n,r=0,a=e.length-1;for(;r<a;){let o=r+a>>1;e[o]<s?r=o+1:a=o}return r}}var ei=class{constructor(t){this.pts=t,this.cum=new Float64Array(t.length);let e=0;for(let n=1;n<t.length;n++)e+=jn(An(t[n],t[n-1])),this.cum[n]=e;this.len=e||1e-6}_seg(t){let e=Math.min(1,Math.max(0,t))*this.len,n=0,s=this.pts.length-1;for(;s-n>1;){let a=n+s>>1;this.cum[a]<e?n=a:s=a}let r=this.cum[s]-this.cum[n]||1e-6;return[n,s,(e-this.cum[n])/r]}at(t){let[e,n,s]=this._seg(t);return Vn(this.pts[e],this.pts[n],s)}tangent(t){let[e,n]=this._seg(t);return Je(An(this.pts[n],this.pts[e]))}};function g_(i,t=12){let e=[],n=i.length;for(let s=0;s<n-1;s++){let r=i[Math.max(s-1,0)],a=i[s],o=i[s+1],l=i[Math.min(s+2,n-1)];for(let c=0;c<t;c++){let h=c/t,f=h*h,u=f*h,d=[0,0,0];for(let g=0;g<3;g++)d[g]=.5*(2*a[g]+(-r[g]+o[g])*h+(2*r[g]-5*a[g]+4*o[g]-l[g])*f+(-r[g]+3*a[g]-3*o[g]+l[g])*u);e.push(d)}}return e.push(i[n-1].slice()),e}var Ne=(i,t=12)=>new ei(g_(i,t));function Ts(i,t,e,n=24){let s=[];for(let r=0;r<=n;r++){let a=r/n,o=1-a;s.push([o*o*i[0]+2*o*a*t[0]+a*a*e[0],o*o*i[1]+2*o*a*t[1]+a*a*e[1],o*o*i[2]+2*o*a*t[2]+a*a*e[2]])}return new ei(s)}function Ou(i){let t=i.pts.length,e=[];for(let a=0;a<t;a++){let o=i.pts[Math.max(0,a-1)],l=i.pts[Math.min(t-1,a+1)];e.push(Je(An(l,o)))}let[n]=bc(e[0]),s=[n],r=[ko(e[0],n)];for(let a=1;a<t;a++)n=Je(An(n,Ut(e[a],d_(n,e[a])))),s.push(n),r.push(ko(e[a],n));return{T:e,N:s,B:r}}var Sc=class{constructor(t,e){this.n=t,this.i=0,this.pos=new Float32Array(t*4),this.col=new Float32Array(t*4),this.R=yc(e),this.noise=Nu(e*7+3),this.off=[0,0,0],this.s=1}add(t,e,n,s,r,a=1,o=!1){if(this.i>=this.n)return;let l=this.i++*4;this.pos[l]=t*this.s+this.off[0],this.pos[l+1]=e*this.s+this.off[1],this.pos[l+2]=n*this.s+this.off[2],this.pos[l+3]=s,this.col[l]=r[0],this.col[l+1]=r[1],this.col[l+2]=r[2],this.col[l+3]=a+(o?Fu:0)}addP(t,e,n,s,r){this.add(t[0],t[1],t[2],e,n,s,r)}reset(){this.off=[0,0,0],this.s=1}};function Hn(i,t,e=null){let n=i.R;i.reset();for(let s=0;s<t;s++){let r=(n()*2-1)*7,a=(n()*2-1)*4.4,o=-5.5+n()*7.5;if(e&&e(r,a,o)){s--;continue}let l=n()<.05,c=l?br(n,[et.lav,et.aqua,et.orchid]):ti(n),h=n()<.3?400+n()*40:-1;i.add(r,a,o,h,c,.5+n()*.45,l)}}function Ze(i,t,e,n,s=.8){let r=i.at(t),a=i.tangent(t),o=Tr(a,n),l=e*(s+(1-s)*n());return dt(r,Ut(o,l))}function Uu(i,t,e,n=0,s={}){let r=[],a=[],o=Je([n,1,0]),l=(s.trunk||2.5+i()*.5)*e,c=tn(i,r,dt(t,[0,.3*e,0]),o,l,.058*e,0,0,0,"apical",{wiggle:.035,angle:0}),h=c.poly.at(1),f=s.tuft||3+(i()<.5?1:0);for(let p=0;p<f;p++)tn(i,r,h,ws(o,.45+i()*.5,i),.6*e,.03*e,0,2,c.poly.len,"tuft",{wiggle:.18,angle:.6});for(let p of s.obliques||[.24,.4,.57,.74])tn(i,r,c.poly.at(p),ws(o,.95+i()*.35,i),(.45+i()*.35)*e,.024*e,0,1,p*c.poly.len,"oblique",{wiggle:.14,angle:.55});let u=s.basal||5+(i()<.5?1:0);for(let p=0;p<u;p++){let S=p/u*we+i()*.6,C=Je([Math.cos(S)*.95,-.5-i()*.5,Math.sin(S)*.7]);tn(i,r,dt(t,Ut(C,.22*e)),C,(.8+i()*.35)*e,.036*e,0,2,0,"basal",{wiggle:.12,angle:.55})}let d=dt(t,[0,-.34*e,0]),g=(s.axonLen||2.3)/2.3,w=Ne([d,dt(d,[.05*e,-.6*e*g,.05]),dt(d,[-.1*e,-1.3*e*g,.1]),dt(d,[.05*e,-2.3*e*g,0])],10);a.push({poly:w,r0:.022*e,r1:.016*e,dist0:0,kind:"axon"});let m=Math.max(...r.map(p=>p.dist0+p.poly.len));return{S:t,k:e,dend:r,axon:a,main:w,trunk:c,dMax:m,boutons:[]}}function Qn(i,t,e,n,s=.45){let r=.32+i()*.25,a=t.main.at(r),o=dt(Vn(a,n,.5),[0,-s-i()*.3,(i()-.5)*.4]),l=Math.sign(n[0]-a[0])||1,c=Ne([a,dt(a,[l*.22,-.18,0]),o,n],16),h=r*t.main.len;return t.axon.push({poly:c,r0:.017*t.k,r1:.013*t.k,dist0:h,kind:"collateral"}),t.boutons.push({c:n,dist:h+c.len}),h+c.len}function Mc(i,t,e,n){let s=[];for(let a=0;a<6;a++)tn(i,s,t,te(i),.42*e,.02*e,0,1,0,"idend",{wiggle:.25,angle:.7});let r=n.map(a=>{let o=[];for(let l=0;l<=40;l++){let c=l/40*we;o.push(dt(a.c,[Math.cos(c)*a.r,.12*Math.sin(c*3),Math.sin(c)*a.r*.8]))}return{ring:new ei(o),link:Ne([t,Vn(t,a.c,.5),dt(a.c,[a.r,0,0])],10)}});return{S:t,k:e,dend:s,rings:r}}function __(i,t={}){let{R:e}=i,n=!!t.portrait,s=.8,r=.12,a=(J,U,K)=>Math.abs(J)<(n?1.6:2.3)&&U>-1.2&&U<.1&&K>-2,o=n?{C:{S:[0,-2.55,.3],k:.95,lean:0,trunk:3.9,obl:[.6,.72,.84],tuft:5,basal:7,w:.3},L:{S:[-1.2,-2.15,-.3],k:.66,lean:.06,trunk:3.4,w:.17},R:{S:[1.25,-2.3,-.2],k:.64,lean:-.06,trunk:3.4,w:.17},U1:{S:[-.85,2.45,-.8],k:.48,trunk:1.6,axonLen:1.1,w:.06},U2:{S:[.95,2.75,-1],k:.46,trunk:1.6,axonLen:1.1,w:.06}}:{C:{S:[.35,-2.05,.25],k:1.32,lean:0,trunk:3.45,obl:[.6,.72,.84],tuft:5,basal:7,w:.26},L:{S:[-3.85,-.95,.35],k:.95,lean:.1,trunk:3.5,w:.16},R:{S:[3.75,-.45,.05],k:.92,lean:-.09,trunk:3.35,w:.16},U1:{S:[-1.95,2.05,-.9],k:.58,trunk:1.6,axonLen:1.1,w:.032},U2:{S:[1.95,2.2,-1.1],k:.56,trunk:1.6,axonLen:1.1,w:.032},U3:{S:[-5.3,1.6,-1.6],k:.56,trunk:2.2,w:.028},U4:{S:[5.3,1.7,-1.9],k:.56,trunk:2.2,w:.028},D1:{S:[-1.9,-1.8,-1.9],k:.66,trunk:2.6,w:.025},D2:{S:[2.05,-2.35,-2.2],k:.64,trunk:2.6,w:.025}},l={};for(let[J,U]of Object.entries(o))l[J]=Uu(e,U.S,U.k,U.lean??(e()-.5)*.12,{trunk:U.trunk,obliques:U.obl,tuft:U.tuft,basal:U.basal,axonLen:U.axonLen}),l[J].id=J;let{C:c,L:h,R:f}=l,u=(J,U)=>dt(J.S,[U*.42*J.k,-.42*J.k,(e()-.5)*.25]),d={},g=(J,U,K,at)=>d[J.id]+(J.dMax+U)/s+r-(K.dMax-at)/s,w=(J,U,K,at)=>d[K.id]+(K.dMax-at)/s-r-(J.dMax+U)/s;d.L=0;let m=Qn(e,h,c,u(c,-1));d.C=g(h,m,c,.6*c.k);let p=Qn(e,c,f,u(f,-1));d.R=g(c,p,f,.6*f.k);let S=[],C=(J,U,K)=>{let at=Qn(e,J,U,U.trunk.poly.at(K),.15);d[J.id]=w(J,at,U,K*U.trunk.poly.len)};if(l.U3&&C(l.U3,h,.7),C(l.U1,c,.72),C(l.U2,f,.72),l.U4){let J=Qn(e,l.U4,f,dt(f.trunk.poly.at(1),[.2,.25,0]),.1);d.U4=w(l.U4,J,f,f.trunk.poly.len+.3*f.k)}let v=.25-Math.min(...Object.values(d));for(let J of Object.keys(d))d[J]+=v;if(Qn(e,c,h,u(h,1)),Qn(e,f,c,u(c,1)),!n){Qn(e,l.D1,h,u(h,1)),Qn(e,l.D2,f,u(f,-1)),Qn(e,c,l.D2,u(l.D2,-1));let J=f.main.at(.08),U=dt(h.trunk.poly.at(1),[.3,.15,0]),K=Ne([J,[4.9,-.6,-.6],[5.05,1.8,-.9],[2.6,2.78,-1.1],[0,2.88,-1.2],[-2.5,2.78,-.9],U],18),at=.08*f.main.len;f.axon.push({poly:K,r0:.016,r1:.013,dist0:at,kind:"collateral"}),f.boutons.push({c:U,dist:at+K.len}),f.boutons.push({c:K.at(.55),dist:at+K.len*.55}),d.D1=200,d.D2=225}let T=(J,U,K,at)=>{let Tt=[...J.dend,...J.axon],X=en(Tt.map(ut=>ut.poly.len*(.45+ut.r0*9)*(ut.kind==="apical"?1.35:ut.kind==="collateral"?1.5:1)),e),j=Math.round(U*.13),ht=J.boutons.length?Math.round(U*.05):0,Vt=Math.round(U*.015);for(let ut=0;ut<U;ut++){if(ut<j){let Et=te(e),Jt=Et[1]>0?1-.62*Et[1]:1-.12*Et[1]*Et[1],D=!at&&e()<.08,re=D?.35*Math.cbrt(e()):e()<.25?Math.cbrt(e()):1,zt=dt(J.S,[Et[0]*.27*J.k*Jt*re,Et[1]*.36*J.k*re,Et[2]*.25*J.k*Jt*re]),R=D?et.lav:at?ti(e):zi(e);i.addP(zt,K+J.dMax/s+e()*.1,R,at?.8:1.2,D);continue}if(ut<j+Vt){let Et=e()*.12,Jt=!at&&e()<.3;i.addP(Ze(J.main,Et,.03*J.k,e,.3),K+(J.dMax+Et*J.main.len)/s,Jt?et.amber:et.c20,at?.7:1.1,Jt);continue}if(ut<j+Vt+ht){let Et=J.boutons[ut%J.boutons.length],Jt=e(),D=Jt<.6;i.addP(dt(Et.c,Ut(te(e),.06*J.k*Math.cbrt(e()))),K+(J.dMax+Et.dist)/s,Jt<.45?et.amber:Jt<.6?et.lav:et.c20,1.15,D&&!at);continue}let Ft=Tt[X()],de=e(),nt=En(Ft.r0,Ft.r1,de)*(.5+.5*e()),wt=Ft.kind==="axon"||Ft.kind==="collateral";!wt&&e()<.15&&(nt+=(.025+e()*.045)*J.k);let St=dt(Ft.poly.at(de),Ut(Tr(Ft.poly.tangent(de),e),nt)),ct=Ft.dist0+de*Ft.poly.len,Nt=wt?K+(J.dMax+ct)/s:K+(J.dMax-ct)/s,Zt,se=!1;at?Zt=ti(e):wt?(se=Ft.kind==="axon"&&Math.sin(ct*14)>.2&&e()<.3,Zt=se?et.aqua:Ft.kind==="collateral"?et.c20:et.c30):(se=e()<.04,Zt=se?et.lav:Ft.kind==="apical"?e()<.5?et.c30:et.c40:Re(e)),i.addP(St,Nt,Zt,at?.65:Ft.kind==="collateral"?.95:wt?.8:.88,se)}},A=[],P=n?5:10;for(let J=0;J<P;J++){let U,K;for(let at=0;at<40&&(U=n?-2.2+4.4*J/(P-1)+(e()-.5)*.3:-6.5+13*J/(P-1)+(e()-.5)*.6,K=-2.8+e()*4.6,!(Math.abs(U)>=(n?9:5)||K<-.3||K>1.7));at++);A.push(Uu(e,[U,K,-5+e()*1.5],.38+e()*.12,(e()-.5)*.2))}let x=n?[Mc(e,[-.9,-2.6,.6],.7,[{c:c.S,r:.42*c.k}])]:[Mc(e,[-2.5,-2.5,.8],.85,[{c:c.S,r:.42*c.k},{c:h.S,r:.4*h.k}]),Mc(e,[2.6,-2.6,.7],.85,[{c:f.S,r:.4*f.k},{c:c.S,r:.44*c.k}])],b=Object.keys(o),M=b.map(J=>o[J].w),E=n?[.07,.025,.045,.11]:[.07,.025,.045,.11],L=Gn(i.n,[...M,...E]);b.forEach((J,U)=>T(l[J],L[U],d[J],!1));let[N,I,F,q]=L.slice(b.length),W=Gn(N,A.map(()=>1));A.forEach((J,U)=>T(J,W[U],300+9*U,!0));for(let J=0;J<I;J++){let U=x[J%x.length],K=e(),at;if(K<.15)at=dt(U.S,Ut(te(e),.1*U.k));else if(K<.45){let Tt=U.dend[Math.floor(e()*U.dend.length)];at=Ze(Tt.poly,e(),.015,e,.3)}else{let Tt=U.rings[Math.floor(e()*U.rings.length)];at=K<.6?Ze(Tt.link,e(),.012,e,.3):dt(Tt.ring.at(e()),Ut(te(e),.02))}i.addP(at,-1,e()<.6?et.orchid:et.c40,.8,!0)}let st=b.flatMap(J=>l[J].dend),Y=en(st.map(J=>J.poly.len),e);for(let J=0;J<F;J++){let U=st[Y()],K=dt(U.poly.at(e()),Ut(te(e),.08+e()*.28));if(a(K[0],K[1],K[2])){J--;continue}let at=e()<.08;i.addP(K,e()<.3?400+e()*30:-1,at?et.lav:ti(e),.55,at)}Hn(i,q,a);let Q=["C","L","R","U1","U2","U3","U4","D1","D2"].filter(J=>l[J]),tt=n?l.U1:l.U3;i.meta={somata:Q.map(J=>({id:J,p:l[J].S.slice(),k:l[J].k,path:d[J]+l[J].dMax/s})),source:{p:tt.S.slice(),path:d[tt.id]+tt.dMax/s},bands:[[0,200],[200,300],[300,400],[400,440]],directional:!0}}function x_(i){let{R:t,noise:e}=i,[n,s,r,a,o]=Gn(i.n,[.6,.12,.045,.145,.09]);i.off=[.05,.22,0];let l=1.72,c=1.12,h=.7,f=[{cx:0,cy:.32,cz:.73,side:1},{cx:0,cy:.32,cz:-.73,side:-1}],u=1,d=.46,g=.46,w=[{cx:.05,cy:-.4,cz:.84,side:1},{cx:.05,cy:-.4,cz:-.84,side:-1}],m=(M,E)=>{let L=Math.sign(E[2])!==M.side,N=E[0]*l,I=E[1]*c*(E[1]<0?.68:1)-.1*Math.max(0,E[0])**2,F=E[2]*h*(L?.84:1)*(1-.16*E[0]*E[0]);return[M.cx+N,M.cy+I,M.cz+F]},p=(M,E)=>{for(let L of f){let N=(M[0]-L.cx)/l,I=M[1]-L.cy,F=I/(c*(I<0?.68:1)),q=Math.sign(M[2]-L.cz)!==L.side,W=(M[2]-L.cz)/(h*(q?.84:1)*(1-.16*Math.min(1,N*N)));if(N*N+F*F+W*W<E*E)return!0}return!1},S=(M,E)=>{for(let L of w){let N=(M[0]-L.cx)/u,I=(M[1]-L.cy)/d,F=(M[2]-L.cz)/g;if(N*N+I*I+F*F<E*E)return!0}return!1},C={frontal:et.lav,parietal:et.aqua,occipital:et.orchid,temporal:et.mint},v=0;for(let M=0;M<n&&v<n*40;v++){let E=t()<.2,L=t()<.5?0:1,N=te(t),I,F;if(E){if(F=w[L],N[2]*F.side<-.25||(I=[F.cx+N[0]*u,F.cy+N[1]*d,F.cz+N[2]*g],p(I,.985)))continue}else if(F=f[L],I=m(F,N),S(I,.98))continue;let q=2.5,W=e(I[0]*q,I[1]*q,I[2]*q),st=e(I[0]*q*2.2+11,I[1]*q*2.2,I[2]*q*2.2),Y=As(.02,.16,Math.abs(W))*(.55+.45*As(0,.12,Math.abs(st)));if(t()>.1+.9*Y)continue;if(!E&&I[1]>-.1){let Tt=.38-.34*I[1]+.05*st;if(Math.abs(I[0]-Tt)<.035)continue}let Q=(1-Y)*.07;I=[I[0]-(I[0]-F.cx)*Q,I[1]-(I[1]-F.cy)*Q,I[2]-(I[2]-F.cz)*Q];let tt="parietal";E?tt="temporal":I[0]<-1.12?tt="occipital":I[0]>.38-.34*I[1]&&(tt="frontal");let J=t()<.13,U=Y>.85&&Math.abs(W)>.32,K=J?C[tt]:U?zi(t):Re(t),at=t()<.4?(I[0]+2)*.55+st*.25:-1;i.addP(I,at,K,U?1.12:.95,J),M++}for(;i.i<n;)i.addP(m(f[0],te(t)),-1,Re(t),.9,!1);let T={cx:-1.18,cy:-.72,cz:0,a:.62,b:.4,c:.98};v=0;for(let M=0;M<s&&v<s*40;v++){let E=te(t),L=[T.cx+E[0]*T.a,T.cy+E[1]*T.b,T.cz+E[2]*T.c];if(p(L,1)||Math.abs(L[2])<.045)continue;let N=Math.sin((L[1]-L[0]*.35)*48+e(L[0]*3,L[1]*3,L[2]*3)*2.5);if(N<-.15)continue;let I=t()<.18;i.addP(L,-1,I?et.lav:N>.7?et.c30:Re(t),.85,I),M++}let A=n+s;for(;i.i<A;)i.addP([T.cx,T.cy-.3,0],-1,et.c60,.6,!1);let P=Ne([[-.42,-.38,0],[-.5,-.95,0],[-.55,-1.5,0],[-.58,-2.05,0]],12);for(let M=0;M<r;M++){let E=t(),L=.23-.07*E+.08*Math.exp(-(((E-.35)/.15)**2));i.addP(Ze(P,E,L,t,.85),E*P.len/.7,Re(t),.9,!1)}let x=[];for(let M=0;M<84;M++){let E;if(M<38){let N=-1.1+t()*2,I=[N,.1+t()*.55,.5+t()*.35],F=[N+(t()-.5)*.4,.1+t()*.55,-(.5+t()*.35)];E=[I,[I[0],I[1]+.18,.3],[(I[0]+F[0])/2,.62+t()*.2,0],[F[0],F[1]+.18,-.3],F]}else{let N=t()<.5?1:-1,I=[1.15-t()*.35,t()*.7-.15,N*(.55+t()*.25)],F=[-1.25+t()*.35,t()*.6-.05,N*(.55+t()*.25)];E=[I,[0,.55+t()*.35,N*.62],F]}let L=t()<.26;x.push({poly:Ne(E,10),c:L?br(t,[et.aqua,et.lav,et.amber]):zi(t),acc:L,off:t()*4})}let b=en(x.map(M=>M.poly.len),t);for(let M=0;M<a;M++){let E=x[b()],L=t();i.addP(dt(E.poly.at(L),Ut(te(t),.012)),L*E.poly.len/.85+E.off,E.c,.8,E.acc)}Hn(i,o)}function tn(i,t,e,n,s,r,a,o,l,c,h){let u=[e.slice()],d=e.slice(),g=n.slice();for(let p=1;p<=7;p++)g=Je(dt(g,Ut(te(i),h.wiggle))),d=dt(d,Ut(g,s/7)),u.push(d.slice());let w=new ei(u),m={poly:w,r0:r,r1:r*.72,dist0:l,kind:c,leaf:a>=o};if(t.push(m),a<o){let p=a===0&&i()<.4?3:2;for(let S=0;S<p;S++)tn(i,t,d,ws(g,h.angle*(.6+i()*.6),i),s*(.58+i()*.22),r*.72,a+1,o,l+w.len,c,h)}return m}function v_(i){let{R:t}=i,[e,n,s,r,a,o,l,c,h,f,u]=Gn(i.n,[.05,.008,.27,.04,.09,.05,.17,.055,.04,.07,.087]);i.off=[-.05,-.18,0];let d=4.2,g=[-.75,-.25,0];for(let U=0;U<e;U++){let K=te(t),at=K[1]>0?1-.45*K[1]:1,Tt=[g[0]+K[0]*.3*at,g[1]+K[1]*.42,g[2]+K[2]*.3*at],X=t()<.06;i.addP(Tt,d/.75+t()*.15,X?et.amber:zi(t),1.1,X)}for(let U=0;U<n;U++)i.addP(dt(g,Ut(p_(t),.13)),-1,et.lav,1,!0);let w=[],m={wiggle:.12,angle:.55},p=tn(t,w,dt(g,[0,.38,0]),Je([.06,1,.02]),1.85,.055,0,0,0,"dend",{wiggle:.05,angle:0}),S=p.poly.at(1);for(let U=0;U<3;U++)tn(t,w,S,ws([0,1,0],.5+t()*.4,t),.6,.03,0,2,p.poly.len,"dend",{wiggle:.18,angle:.6});for(let U of[.28,.45,.62,.78])tn(t,w,p.poly.at(U),ws([0,1,0],1+t()*.3,t),.55+t()*.25,.025,0,1,U*p.poly.len,"dend",m);for(let U=0;U<6;U++){let K=U/6*we+t()*.5,at=Je([Math.cos(K)*.9,-.55-t()*.4,Math.sin(K)*.9]);tn(t,w,dt(g,Ut(at,.28)),at,.75+t()*.25,.035,0,2,0,"dend",m)}let C=en(w.map(U=>U.poly.len*(.5+U.r0*8)),t);for(let U=0;U<s;U++){let K=w[C()],at=t(),Tt=En(K.r0,K.r1,at)*(.6+.4*t());t()<.15&&(Tt+=.03+t()*.05);let X=K.poly.at(at),j=dt(X,Ut(Tr(K.poly.tangent(at),t),Tt)),ht=t()<.05;i.addP(j,(d-(K.dist0+at*K.poly.len))/.75,ht?et.orchid:Re(t),.85,ht)}let v=Ne([[-.75,-.67,0],[-.72,-1.2,.05],[-.45,-1.75,.1],[.3,-2.05,.15],[1.2,-2,.1],[1.95,-1.65,0]],14);for(let U=0;U<r;U++){let K=t();i.addP(Ze(v,K,.022,t,.3),(d+K*v.len)/.75,et.c30,.85,!1)}let T=[];{let U=.16*v.len,K=.86*v.len;for(;U+.3<K;)T.push([U/v.len,(U+.36)/v.len]),U+=.36+.045}let A=[.75,-1.25,.6],P=new Set,x=T.map((U,K)=>[K,jn(An(v.at((U[0]+U[1])/2),A))]).sort((U,K)=>U[1]-K[1]);for(let U=0;U<3;U++)P.add(x[U][0]);for(let U=0;U<a;U++){let K=Math.floor(t()*T.length),[at,Tt]=T[K],X=En(at,Tt,t()),j=Math.min(X-at,Tt-X)/(Tt-at),ht=.075*As(0,.12,j)+.025,Vt=Ze(v,X,ht,t,.9),ut=P.has(K)?t()<.35:t()<.18,Ft=ut?P.has(K)?et.lav:et.aqua:t()<.5?et.c20:et.c30;i.addP(Vt,(d+X*v.len)/.75,Ft,1,ut)}let b=[],M=v.at(1);for(let U=0;U<3;U++)tn(t,b,M,ws(v.tangent(1),.5+t()*.4,t),.32,.015,0,2,v.len,"term",{wiggle:.2,angle:.7});let E=b.filter(U=>U.leaf).map(U=>U.poly.at(1)),L=en(b.map(U=>U.poly.len),t);for(let U=0;U<o;U++)if(U%3===0){let K=E[Math.floor(t()*E.length)],at=t()<.4;i.addP(dt(K,Ut(te(t),.045)),(d+v.len+1.2)/.75,at?et.amber:et.c30,1.05,at)}else{let K=b[L()],at=t();i.addP(Ze(K.poly,at,.015,t,.3),(d+K.dist0+at*K.poly.len)/.75,Re(t),.85,!1)}let N=[1.3,1.15,-.35],I=Ne([[.1,2.35,-.9],[.9,2.05,-.6],[1.8,1.95,-.2],[2.5,2.2,.2]],12),F=[];for(let U=0;U<18;U++){let K=Je(dt(m_(U,18),Ut(te(t),.25)));tn(t,F,dt(N,Ut(K,.15)),K,.45+t()*.45,.03,0,1+(t()<.5?1:0),0,"astro",{wiggle:.35,angle:.7})}let q=.45,W=I.at(q);F.push({poly:Ne([N,Vn(N,W,.5),W],8),r0:.03,r1:.04,dist0:0,kind:"astro"});let st=en(F.map(U=>U.poly.len),t);for(let U=0;U<l;U++){if(U<l*.12){let ht=t()<.4;i.addP(dt(N,Ut(te(t),.17*(.85+.15*t()))),-1,ht?et.mint:zi(t),1.05,ht);continue}let K=F[st()],at=t(),Tt=t()<.45,X=Tt?dt(K.poly.at(at),Ut(te(t),(.02+.06*at)*Math.sqrt(t())*1.6)):Ze(K.poly,at,.02,t,.3),j=t()<.4;i.addP(X,(K.dist0+at*K.poly.len)/.5+9,j?et.mint:Re(t),Tt?.7:.85,j)}for(let U=0;U<c;U++){let K=t(),at=Math.abs(K-q)<.07&&t()<.5,Tt=Ze(I,K,at?.16:.14,t,.9),X=at||t()<.45;i.addP(Tt,K*I.len/.6,at?et.mint:X?et.coral:ti(t),.8,X)}let Y=[];for(let U of P){let K=T[U],at=v.at((K[0]+K[1])/2),Tt=dt(Vn(A,at,.5),[0,.15,.1]);Y.push(Ne([A,Tt,at],8))}let Q=en(Y.map(U=>U.len),t);for(let U=0;U<h;U++){let K=t()<.4,at=K?et.lav:Re(t);if(U<h*.3)i.addP(dt(A,Ut(te(t),.12)),-1,at,1,K);else{let Tt=Y[Q()];i.addP(Ze(Tt,t(),.018,t,.3),-1,at,.85,K)}}let tt=[];for(let[U,K,at]of[[-2.25,1.55,-2.2],[2.35,-.25,-2.6],[-1.6,-2.3,-1.8]]){let Tt=[U,K,at];for(let X=0;X<5;X++)tn(t,tt,Tt,te(t),.45+t()*.3,.02,0,1,0,"bg",{wiggle:.2,angle:.6});tn(t,tt,Tt,Je([t()-.5,-1,t()-.5]),1,.015,0,0,0,"bg",{wiggle:.1,angle:0})}let J=en(tt.map(U=>U.poly.len),t);for(let U=0;U<f;U++){let K=tt[J()],at=t();i.addP(Ze(K.poly,at,.02,t,.2),at*K.poly.len/.6+20,ti(t),.7,!1)}Hn(i,u)}function y_(i){let{R:t}=i,[e,n,s,r,a,o,l,c,h,f,u,d]=Gn(i.n,[.17,.05,.14,.06,.07,.15,.03,.09,.06,.05,.03,.1]);i.off=[0,-.05,0];let g=[0,1.42,0],w=1.15,m=b=>{let M=b[1]>=0?b[1]*w:-.82*w*Math.pow(-b[1],.38);return[g[0]+b[0]*w,g[1]+M,g[2]+b[2]*w]};for(let b=0;b<e;b++){let M=te(t);if(M[1]>.82&&Math.hypot(M[0]+.25,M[2])<.3){b--;continue}let E=dt(m(M),Ut(te(t),.015));i.addP(E,-1,t()<.12?et.c20:Re(t),.9,!1)}let p=Ne([[-.2,2.45,0],[-.45,2.9,0],[-.95,3.35,0]],10);for(let b=0;b<n;b++){let M=t();i.addP(Ze(p,M,.3-.06*M,t,.9),(1-M)*p.len/.5,Re(t),.9,!1)}let S=[];for(let b=0;b<2e3&&S.length<46;b++){let M=.68+1.3*Math.pow(t(),1.8),E=Math.sqrt(Math.max(0,w*w-(M-g[1])**2))-.2;if(E<=.05)continue;let L=t()*we,N=Math.sqrt(t())*E,I=[Math.cos(L)*N,M,Math.sin(L)*N];S.some(F=>jn(An(F.c,I))<.21)||S.push({c:I,r:.085+t()*.02,fuse:!1})}for(let b=0;b<7;b++){let M=-.6+1.2*b/6+(t()-.5)*.05;S.push({c:[M,.6,(t()-.5)*.4],r:.09,fuse:b===2||b===5})}for(let b=0;b<s;b++){let M=S[Math.floor(t()*S.length)],E=te(t);M.fuse&&E[1]<-.2&&(E=[E[0],Math.abs(E[1])*.3,E[2]]);let L=t()<.5;i.addP(dt(M.c,Ut(E,M.r)),-1,L?br(t,[et.lav,et.orchid]):et.c30,.8,L)}let C=[{c:[-.45,1.78,.25],ax:Je([1,.4,.1]),L:.75,r:.17},{c:[.52,1.95,-.3],ax:Je([1,-.3,.3]),L:.6,r:.14}];for(let b=0;b<r;b++){let M=C[b%2],[E,L]=bc(M.ax),N=(t()-.5)*M.L,I=t()*we,F;if(t()<.7){let W=Math.max(0,Math.abs(N)-M.L/2+M.r),st=Math.sqrt(Math.max(0,M.r*M.r-W*W));F=dt(dt(M.c,Ut(M.ax,N)),dt(Ut(E,Math.cos(I)*st),Ut(L,Math.sin(I)*st)))}else{let W=Math.round(N/.1)*.1,st=(t()-.5)*2*M.r*.8;F=dt(dt(M.c,Ut(M.ax,W+Math.sin(st*20)*.02)),Ut(E,st))}let q=t()<.45;i.addP(F,-1,q?et.mint:et.c40,.8,q)}let v=S.filter(b=>b.fuse);for(let b=0;b<a;b++){let M;if(t()<.45){let I=v[Math.floor(t()*v.length)];M=[I.c[0]+ye(t)*.12,.48-t()*.3,I.c[2]+ye(t)*.12]}else{let I=t()*we,F=Math.sqrt(t())*.9;M=[Math.cos(I)*F,.18+t()*.28,Math.sin(I)*F]}let E=t(),L=E<.6,N=E<.42?et.amber:E<.6?et.lav:et.c30;i.addP(M,(.5-M[1])/.12+t()*.5,N,.75,L)}let T=[0,-.38,0];for(let b=0;b<o;b++){let M=te(t),E,L=.78;M[1]>=0?E=T[1]+.52*Math.pow(M[1],.4):(E=T[1]+.6*M[1],L*=1-.6*M[1]*M[1]);let N=[M[0]*L,E,M[2]*L];if(E<-.85&&Math.hypot(N[0],N[2])<.2){b--;continue}i.addP(dt(N,Ut(te(t),.012)),-1,t()<.1?et.c20:Re(t),.9,!1)}let A=Ne([[0,-.92,0],[.05,-1.4,0],[0,-1.95,0]],8);for(let b=0;b<l;b++){let M=t();i.addP(Ze(A,M,.21,t,.9),M*A.len/.4+6,Re(t),.85,!1)}for(let b=0;b<c;b++){let M=(t()*2-1)*2.3;if(t()>1-As(1.6,2.3,Math.abs(M))*.85){b--;continue}let E=t()*we,L=.45*(.92+.08*t());i.add(M,-2.38+Math.cos(E)*L,Math.sin(E)*L,(2.3-M)/.8,Re(t),.85,!1)}let P=[];for(let b=0;b<28;b++){let M=t()*we,E=Math.sqrt(t())*.58;P.push({c:[Math.cos(M)*E,.17,Math.sin(M)*E],col:t()<.55?et.coral:et.orchid})}for(let b=0;b<h;b++)if(t()<.45){let M=P[Math.floor(t()*P.length)];i.addP(dt(M.c,Ut(te(t),.035)),1.2+t()*.3,M.col,.9,!0)}else{let M=t()*we,E=Math.pow(t(),.7)*.62;i.add(Math.cos(M)*E,.08+t()*.06,Math.sin(M)*E,-1,t()<.5?et.c20:et.c30,.95,!1)}for(let b=0;b<f;b++){let M=En(3.6,6,t()),E=En(-.35,.95,t()),L=1.38+.1*Math.sin(M*5+E*4),N=t()<.55;i.add(Math.cos(M)*L,E,Math.sin(M)*L,-1,N?et.mint:et.c50,.75,N)}let x=Ne([[1.55,-1.95,.1],[1.68,-1.6,.12],[1.78,-1.2,.1]],8);for(let b=0;b<u;b++){let E=t()<.4?dt(x.at(1),Ut(te(t),.12)):Ze(x,t(),.05,t,.8),L=t()<.5;i.addP(E,-1,L?et.amber:et.c30,.9,L)}Hn(i,d)}function M_(i){let{R:t}=i,[e,n,s]=Gn(i.n,[.86,.04,.1]),r=[{ctrl:[[-2.1,-1.9,.2],[-1.75,.1,.1],[-.9,1.45,0],[0,1.75,0],[.9,1.45,0],[1.75,.1,-.1],[2.1,-1.9,-.2]],fibers:58,r:.24,fanA:2.4,fanB:2.4,twist:1.2*Math.PI,tint:et.coral,tintP:.24,dir:1},...[-1,1].map(c=>({ctrl:[[c*1.05,-.75,1.55],[c*1.3,.25,1.05],[c*1.4,.8,0],[c*1.3,.25,-1.1],[c*1,-.85,-1.55]],fibers:22,r:.13,fanA:2.2,fanB:2.2,twist:Math.PI,tint:et.mint,tintP:.26,dir:0})),{ctrl:[[.25,2.35,.25],[.15,1.2,.2],[0,0,.1],[-.1,-1.4,0],[-.05,-2.7,0]],fibers:50,r:.13,fanA:7,fanB:1.2,twist:.8*Math.PI,tint:et.aqua,tintP:.16,dir:1}],a=[];for(let c of r){let h=Ne(c.ctrl,20),f=Ou(h),u=h.pts.length;for(let d=0;d<c.fibers;d++){let g=t()*we,w=Math.sqrt(t()),m=t()*we,p=[];for(let v=0;v<u;v++){let T=v/(u-1),A=As(.18,0,T),P=As(.82,1,T),x=c.r*(1+c.fanA*A*A+c.fanB*P*P),b=g+c.twist*T+.08*Math.sin(T*7+m),M=dt(Ut(f.N[v],Math.cos(b)*w*x),Ut(f.B[v],Math.sin(b)*w*x));p.push(dt(h.pts[v],M))}let S=t()<c.tintP,C=c.dir===0&&t()<.5;a.push({poly:new ei(p),c:S?c.tint:Re(t),acc:S,off:t()*5,flip:C,bundle:c})}}let o=en(a.map(c=>c.poly.len),t);for(let c=0;c<e;c++){let h=a[o()],f=t(),u=h.flip?1-f:f,d=t()<.06;i.addP(dt(h.poly.at(f),Ut(te(t),.0035)),u*h.poly.len/1+h.off,d?et.c10:h.c,d?1.2:.75,h.acc&&!d)}let l=r.map(c=>({poly:Ne(c.ctrl,20),r:c.r}));for(let c=0;c<n;c++){let h=l[Math.floor(t()*l.length)],f=t();i.addP(Ze(h.poly,f,h.r*(1.4+t()*.8),t,.2),-1,ti(t),.6,!1)}Hn(i,s)}function S_(i){let{R:t}=i,[e,n,s,r,a,o,l,c,h,f,u]=Gn(i.n,[.19,.1,.06,.04,.09,.08,.13,.07,.03,.05,.16]);i.off=[-.25,.05,0],i.s=1.12;let d=Math.PI/180,g=[0,0,0],w=1.5,m=M=>{let E=(70+240*M)*d,L=w-(M>.85?(M-.85)*1.6:0);return[g[0]+Math.cos(E)*L,g[1]+Math.sin(E)*L,0]},p=M=>{let E=(70+240*M)*d;return[Math.cos(E),Math.sin(E),0]},S=[.85,-1,0],C=.55,v=M=>{let E=(-120+240*M)*d;return[S[0]+Math.cos(E)*C,S[1]+Math.sin(E)*C,0]},T=M=>{let E=(-120+240*M)*d;return[Math.cos(E),Math.sin(E),0]},A=M=>[1.95+.12*Math.sin(M*3),.95-1.45*M,0],P=M=>{let E=m(0);return Vn(E,[1.55,1.15,0],M)};for(let M=0;M<e;M++){let E=t(),L=m(E),N=p(E),I=E<.35;if(t()<.62){let F=dt(dt(L,Ut(N,ye(t)*.05)),[0,0,ye(t)*.18]),q=t()<.06;i.addP(F,E<.35?3.6+t()*.2:2.5+t()*.2,q?et.amber:I?zi(t):et.c40,1,q)}else{let F=t()*.42,q=dt(dt(L,Ut(N,-F)),[0,0,ye(t)*.15]);i.addP(q,-1,ti(t),.7,!1)}}for(let M=0;M<n;M++){let E=t(),L=v(E),N=T(E);if(t()<.65){let I=t()<.15;i.addP(dt(dt(L,Ut(N,ye(t)*.035)),[0,0,ye(t)*.16]),1.5+t()*.2,I?et.aqua:et.c30,.95,I)}else i.addP(dt(dt(L,Ut(N,t()*.3)),[0,0,ye(t)*.14]),-1,ti(t),.7,!1)}for(let M=0;M<s;M++){let E=t(),L=t()<.5?0:.16,N=t()<.2;i.addP(dt(A(E),[L+ye(t)*.04,0,ye(t)*.2]),.2*t(),N?et.lav:et.c50,.95,N)}for(let M=0;M<r;M++)i.addP(dt(P(t()),[ye(t)*.05,ye(t)*.05,ye(t)*.16]),4.2+t()*.2,et.c40,.9,!1);let x=(M,E,L,N,I,F,q)=>{let W=[];for(let Q=0;Q<E;Q++)W.push(L());let st=en(W.map(Q=>Q.len),t),Y=W.map(()=>t()<q);for(let Q=0;Q<M;Q++){let tt=st(),J=W[tt],U=t(),K=Y[tt];i.addP(dt(J.at(U),Ut(te(t),.008)),N+U*I+tt%7*.13,K?F:Re(t),.75,K)}};x(a,34,()=>{let M=dt(A(.35+t()*.6),[0,0,ye(t)*.15]),E=dt(v(.1+t()*.8),Ut(T(.5),.15));return Ts(M,dt(Vn(M,E,.5),[.35,.25,ye(t)*.2]),E)},0,1.4,et.lav,.34),x(o,30,()=>{let M=v(.15+t()*.7),E=m(.62+t()*.3);return Ts(M,dt(Vn(M,E,.5),[-.1,.05,ye(t)*.15]),E)},1.5,1,et.aqua,.34),x(l,46,()=>{let M=m(.55+t()*.35),E=m(.02+t()*.3);return Ts(M,[-.2+ye(t)*.2,0+ye(t)*.25,ye(t)*.3],E)},2.5,1.1,et.amber,.28),x(c,26,()=>{let M=m(t()*.15),E=dt(A(t()*.4),[0,0,ye(t)*.15]);return Ts(M,dt(Vn(M,E,.5),[.1,.45,ye(t)*.2]),E)},3.6,1.2,et.orchid,.2);let b=[];for(let M=0;M<12;M++){let E=t();b.push(dt(m(E),Ut(p(E),-.25-t()*.15)))}for(let M=0;M<h;M++){let E=b[Math.floor(t()*b.length)],L=te(t);i.addP(dt(E,Ut(L,Math.pow(t(),2)*.16)),-1,et.orchid,.8,!0)}x(f,16,()=>{let M=[-2.4+t()*1.4,1.9+t()*.5,ye(t)*.6],E=t()<.5?m(t()*.4):v(t());return Ts(M,[En(M[0],E[0],.3)-.3,1.3+t()*.5,ye(t)*.4],E)},.5,2.2,et.amber,.4),Hn(i,u)}function b_(i){let{R:t}=i,[e,n,s]=Gn(i.n,[.28,.64,.08]),r=[];for(let S=0;S<2e4&&r.length<110;S++){let C=[(t()*2-1)*2.1,(t()*2-1)*1.45,(t()*2-1)*1.6];(C[0]/2.1)**2+(C[1]/1.45)**2+(C[2]/1.6)**2>1||r.some(T=>jn(An(T.p,C))<.42)||r.push({p:C,deg:0,hub:!1,mod:0})}let a=6,o=[];for(let S=0;S<a;S++)o.push(r[Math.floor(S/a*r.length)].p.slice());for(let S=0;S<8;S++){let C=o.map(()=>[0,0,0,0]);for(let v of r){let T=0,A=1e9;o.forEach((P,x)=>{let b=jn(An(P,v.p));b<A&&(A=b,T=x)}),v.mod=T,C[T][0]+=v.p[0],C[T][1]+=v.p[1],C[T][2]+=v.p[2],C[T][3]++}o=C.map((v,T)=>v[3]?[v[0]/v[3],v[1]/v[3],v[2]/v[3]]:o[T])}let l=[et.c40,et.c30,et.c50,et.lav,et.c40,et.aqua],c=[!1,!1,!1,!0,!1,!0],h=[],f=new Set,u=(S,C,v)=>{let T=S<C?S+"-"+C:C+"-"+S;S===C||f.has(T)||(f.add(T),h.push({i:S,j:C,kind:v}),r[S].deg++,r[C].deg++)};r.forEach((S,C)=>{r.map((T,A)=>[A,jn(An(T.p,S.p))]).sort((T,A)=>T[1]-A[1]).slice(1,4).forEach(([T])=>u(C,T,"local"))});let d=r.map((S,C)=>[C,S.deg+t()*2-jn(S.p)*.6]).sort((S,C)=>C[1]-S[1]).slice(0,10).map(([S])=>S);d.forEach(S=>r[S].hub=!0);for(let S=0;S<d.length;S++)for(let C=S+1;C<d.length;C++)u(d[S],d[C],"rich");for(let S=0;S<22;S++)u(Math.floor(t()*r.length),Math.floor(t()*r.length),"long");for(let S=0;S<e;S++){let C=r[Math.floor(t()*r.length)],v=C.hub?.2:.06+C.deg*.01,T=dt(C.p,Ut(te(t),v*Math.pow(t(),.35))),A=l[C.mod],P=c[C.mod];C.hub&&t()<.4?(A=et.amber,P=!0):C.hub&&(A=et.c20),i.addP(T,C.hub?.3*t():-1,A,C.hub?1.25:1,P)}let g=h.map(S=>{let C=r[S.i].p,v=r[S.j].p,T=Vn(C,v,.5),A=S.kind==="local"?1.06:1.35,P=dt(Ut(T,A),Ut(te(t),.12));return Ts(C,P,v,S.kind==="local"?12:28)}),w=en(g.map((S,C)=>S.len*(h[C].kind==="local"?1:.8)),t),m=h.map(()=>t()*4),p=h.map(()=>t()<.5);for(let S=0;S<n;S++){let C=w(),v=h[C],T=g[C],A=t(),P=p[C]?1-A:A,x,b=!1;if(v.kind==="rich")b=t()<.35,x=b?et.amber:et.c30;else{let M=r[v.i],E=r[v.j];M.mod===E.mod?(x=l[M.mod],b=c[M.mod]):x=t()<.5?et.c50:et.c60}i.addP(dt(T.at(A),Ut(te(t),.007)),P*T.len/.7+m[C],x,.7,b)}Hn(i,s)}function T_(i){let{R:t}=i,[e,n,s,r,a,o,l]=Gn(i.n,[.36,.1,.1,.08,.12,.05,.09]);i.off=[.45,-.22,0];let c=[.58,1.78,0],h={neck:[.42,1.42,0],chest:[.34,1.26,0],pelvis:[.02,.15,0],shN:[.34,1.26,.2],elN:[.8,.86,.24],wrN:[1.14,1.22,.2],shF:[.3,1.26,-.2],elF:[-.22,1,-.24],wrF:[-.44,.62,-.22],hipN:[.04,.12,.14],knN:[.74,.3,.16],anN:[.57,-.52,.14],toN:[.84,-.62,.14],hipF:[-.02,.1,-.14],knF:[-.32,-.72,-.16],anF:[-.88,-1.32,-.14],toF:[-.98,-1.6,-.14]},f=[[h.neck,h.pelvis,.25,.21],[h.shN,h.elN,.095,.08],[h.elN,h.wrN,.075,.06],[h.shF,h.elF,.095,.08],[h.elF,h.wrF,.075,.06],[h.hipN,h.knN,.15,.11],[h.knN,h.anN,.1,.07],[h.anN,h.toN,.06,.05],[h.hipF,h.knF,.15,.11],[h.knF,h.anF,.1,.07],[h.anF,h.toF,.06,.05],[h.neck,c,.1,.1]],u=en(f.map(S=>jn(An(S[1],S[0]))*(S[2]+.05)),t);for(let S=0;S<e;S++){if(S<e*.13){i.addP(dt(c,Ut(te(t),.3)),-1,Re(t),.85,!1);continue}if(S<e*.25){let b=te(t);i.addP(dt([.26,.98,0],[b[0]*.27,b[1]*.38,b[2]*.25]),-1,Re(t),.85,!1);continue}let C=f[u()],v=t(),T=An(C[1],C[0]),A=Je(T),P=En(C[2],C[3],v)*(.82+.18*t()),x=dt(dt(C[0],Ut(T,v)),Ut(Tr(A,t),P));i.addP(x,-1,t()<.1?et.c20:Re(t),.85,!1)}for(let S=0;S<n;S++){let C=te(t),v=Math.pow(t(),.3),T=dt([.56,1.83,0],[C[0]*.22*v,C[1]*.15*v,C[2]*.17*v]),A=t(),P=A<.38,x=A<.2?et.amber:A<.38?et.lav:zi(t);i.addP(T,t()*3,x,.85,P)}let d=Ne([[.5,1.68,0],[.36,1.35,0],[.18,.75,0],[.06,.25,0]],10),g=(S,C)=>Ne([S,...C],8),w=[{poly:d,d0:0},{poly:g(d.at(.2),[h.shN,h.elN,h.wrN]),d0:d.len*.2},{poly:g(d.at(.2),[h.shF,h.elF,h.wrF]),d0:d.len*.2},{poly:g(d.at(1),[h.hipN,h.knN,h.anN,h.toN]),d0:d.len},{poly:g(d.at(1),[h.hipF,h.knF,h.anF,h.toF]),d0:d.len}],m=en(w.map(S=>S.poly.len),t);for(let S=0;S<s;S++){let C=w[m()],v=t(),T=t()<.3;i.addP(dt(C.poly.at(v),Ut(te(t),.012)),(C.d0+v*C.poly.len)/.55,T?et.amber:et.c20,.85,T)}for(let S=0;S<r;S++){let C=Math.floor(t()*3),v=.55+C*.27,T=t()*we;if(Math.sin(T*12+C)<-.25){S--;continue}let A=t()<.5;i.add(c[0]+Math.cos(T)*v,c[1]+Math.sin(T)*v*.92,Math.sin(T*2)*.05,T/we*4+C*.3,A?C===1?et.aqua:et.lav:et.c40,.75,A)}let p=[];for(let S=0;S<26;S++){let C=-1.45+t()*3.4,v=-.45-t()*.35-(C<0?.35:0);p.push({y:C,x0:v,x1:v-1.4-t()*.9,z:(t()-.5)*.6,off:t()*3})}for(let S=0;S<a;S++){let C=p[Math.floor(t()*p.length)],v=Math.pow(t(),1.6),T=En(C.x0,C.x1,v),A=t()<.1;i.add(T,C.y+ye(t)*.008,C.z,-T/.6+C.off,A?et.aqua:v<.3?et.c40:et.c50,.7-v*.25,A)}for(let S=0;S<o;S++){let v=.3+Math.floor(t()*3)*.32+ye(t)*.015,T=t()*we,A=t()<.2;i.add(-.95+Math.cos(T)*v,-1.63,Math.sin(T)*v*.55,v/.3,A?et.aqua:et.c50,.7,A)}Hn(i,l)}function w_(i){let{R:t}=i,[e,n,s]=Gn(i.n,[.82,.07,.11]),r=2.35,a=[],o=260;for(let u=0;u<=o;u++){let d=u/o*we,g=Math.sin(d),w=1+g*g;a.push([r*Math.cos(d)/w,r*g*Math.cos(d)/w,.45*g])}let l=new ei(a),c=Ou(l),h=[];for(let u=0;u<150;u++){let d=t()*we,g=Math.sqrt(t()),w=[];for(let p=0;p<=o;p++){let S=p/o,C=.26*(.8+.4*Math.sin(S*we*2+d)),v=d+S*we*3;w.push(dt(a[p],dt(Ut(c.N[p],Math.cos(v)*g*C),Ut(c.B[p],Math.sin(v)*g*C))))}let m=t()<.22;h.push({poly:new ei(w),c:m?br(t,[et.amber,et.lav,et.aqua,et.coral,et.mint,et.orchid]):Re(t),acc:m,off:t()*.6})}let f=en(h.map(u=>u.poly.len),t);for(let u=0;u<e;u++){let d=h[f()],g=t();i.addP(dt(d.poly.at(g),Ut(te(t),.006)),g*9+d.off,d.c,.8,d.acc)}for(let u=0;u<n;u++){let d=t(),g=dt(l.at(d),Ut(te(t),.35+t()*.5)),w=t()<.25;i.addP(g,400+t()*30,w?br(t,[et.amber,et.lav]):et.c30,.6+t()*.7,w)}Hn(i,s)}var Cn=[{key:"hero",gen:__,sway:.16,base:0,tilt:.04,fit:1,dx:0,par:.5,gateK:1,directional:!0},{key:"brain",gen:x_,sway:.6,base:-.25,tilt:.16,fit:1,dx:0},{key:"neuron",gen:v_,sway:.45,base:.1,tilt:.04,fit:.9,dx:-.3,directional:!0},{key:"synapse",gen:y_,sway:.5,base:.2,tilt:.1,fit:.84,dx:0},{key:"tracts",gen:M_,sway:.7,base:.25,tilt:.08,fit:.95,dx:-.1,directional:!0},{key:"circuit",gen:S_,sway:.4,base:0,tilt:.05,fit:1,dx:0,directional:!0},{key:"network",gen:b_,spin:.12,tilt:.2,fit:1.12,dx:0},{key:"behavior",gen:T_,sway:.42,base:0,tilt:.04,fit:1,dx:0,directional:!0},{key:"infinity",gen:w_,sway:.5,base:0,tilt:.22,fit:.72,dx:0}];function Bu(i,t,e={}){let n=new Sc(t,1e3+i*97);for(Cn[i].gen(n,e);n.i<t;)Hn(n,1);let s=n.meta;if(!s){let h=0,f=1/0,u=[0,0,0],d=[0,0,0],g=0;for(let w=0;w<t;w++){let m=n.pos[w*4+3],p=n.pos[w*4],S=n.pos[w*4+1],C=n.pos[w*4+2];m>=0&&m<400&&(m>h&&(h=m),m<f&&(f=m,u=[p,S,C])),Math.abs(p)<4&&Math.abs(S)<3.2&&C>-3&&(d[0]+=p,d[1]+=S,d[2]+=C,g++)}s={bands:[[0,h+.5],[400,440]],source:{p:u,path:Number.isFinite(f)?f:0},centroid:g?d.map(w=>w/g):[0,0,0],directional:!!Cn[i].directional}}let r=new Uint32Array(t);for(let h=0;h<t;h++)r[h]=h;let a=new Float32Array(t);for(let h=0;h<t;h++)a[h]=n.pos[h*4]+n.pos[h*4+1]*.08;r.sort((h,f)=>a[h]-a[f]);let o=new Float32Array(t*4),l=new Float32Array(t*4),c=0;for(let h=0;h<t;h++){let f=r[h]*4,u=h*4;for(let d=0;d<4;d++)o[u+d]=n.pos[f+d],l[u+d]=n.col[f+d];l[u+3]>=Fu&&c++}return{pos:o,col:l,accentRatio:c/t,meta:s}}var Tc=11,A_=`
uniform sampler2D uPos;
uniform sampler2D uCol;
uniform float uRows;
uniform float uFrom;
uniform float uTo;
uniform float uMix;
uniform float uTime;
uniform float uGlow;
uniform float uAccent;
uniform float uSize;
uniform float uPR;
uniform float uIntro;
uniform float uBeat;
uniform float uFlash;
uniform float uScatter;
uniform float uMotion;
uniform vec2 uMouse;
uniform float uMouseOn;
uniform float uAspect;
uniform float uPhase;
uniform float uSparkGain;
uniform vec4 uWaves[8];
uniform vec4 uWaveQ[8];
uniform float uHoverV;
uniform vec3 uDepolCol;
uniform float uCaGain;
uniform float uDrive;
uniform vec4 uTrail[16];
uniform float uHovPhase;
uniform float uWaveSharp;
uniform float uLTP;
uniform vec4 uTextBox[2];
uniform float uTextDim;
uniform float uGrow;
uniform vec4 uSoma[9];
uniform vec3 uBaseBlue;
uniform vec3 uSparkWarm;
uniform vec3 uSparkCool;

attribute vec2 aRef;
attribute vec4 aRand;

varying vec3 vColor;
varying float vAlpha;
varying float vSoft;

vec4 fetchTex(sampler2D t, float s) {
  return texelFetch(t, ivec2(int(aRef.x), int(aRef.y + s * uRows)), 0);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec3 flow(vec3 p, float t) {
  return vec3(
    sin(p.y * 1.9 + t * 0.83) + sin(p.z * 2.7 - t * 0.61),
    sin(p.z * 2.1 + t * 0.77) + sin(p.x * 2.3 + t * 0.53),
    sin(p.x * 1.7 - t * 0.69) + sin(p.y * 2.9 + t * 0.47)
  ) * 0.5;
}

void main() {
  vec4 pA = fetchTex(uPos, uFrom);
  vec4 pB = fetchTex(uPos, uTo);
  vec4 cA = fetchTex(uCol, uFrom);
  vec4 cB = fetchTex(uCol, uTo);

  // \u6BCF\u4E2A\u7C92\u5B50\u9519\u5F00\u51FA\u53D1\uFF0C\u5F62\u53D8\u5448\u201C\u6D41\u52A8\u201D
  float st = 0.45;
  float m = clamp(uMix * (1.0 + st) - aRand.x * st, 0.0, 1.0);
  m = m * m * (3.0 - 2.0 * m);
  float burst = sin(m * 3.14159265);

  vec3 pm = mix(pA.xyz, pB.xyz, m);
  vec3 p = pm;
  vec3 rdir = normalize(aRand.yzw * 2.0 - 1.0 + vec3(1e-4));
  p += rdir * burst * uScatter * (0.35 + aRand.x * 1.2);
  p += flow(p * 0.8 + aRand.xyz * 2.0, uTime * 0.6) * burst * 0.55 * uScatter;
  p += flow(p * 1.3, uTime * 0.35 + aRand.y * 6.2831) * 0.018 * uMotion;

  // \u5F00\u573A\uFF1A\u4ECE\u8FDC\u5904\u661F\u5C18\u6C47\u805A
  float ie = clamp(uIntro * 1.5 - aRand.y * 0.5, 0.0, 1.0);
  ie = 1.0 - pow(1.0 - ie, 3.0);
  // \u9996\u9875\u201C\u795E\u7ECF\u53D1\u751F\u201D\uFF1A\u9525\u4F53\u795E\u7ECF\u5143\u7684\u6811\u7A81\u4E0E\u8F74\u7A81\u4ECE\u5404\u81EA\u80DE\u4F53\u5411\u5916\u751F\u957F\uFF0C\u672B\u7AEF\u662F\u660E\u4EAE\u7684\u751F\u957F\u9525
  float born = 1.0;
  float cone = 0.0;
  if (uGrow < 1.0 && uFrom < 0.5 && pA.w >= 0.0 && pA.w < 300.0) {
    float g = 99.0;
    for (int i = 0; i < 9; i++) {
      vec4 sm = uSoma[i];
      if (sm.w > 0.0) g = min(g, distance(pA.xyz, sm.xyz) / sm.w);
    }
    float G = uGrow * 5.2;
    born = 1.0 - smoothstep(G, G + 0.12, g);
    cone = exp(-abs(G - g) / 0.08) * (1.0 - uGrow);
    ie = 1.0;
  }
  vec3 ip = rdir * (5.0 + aRand.x * 5.0);
  ip.z = ip.z * 0.4 - 2.0;
  p = mix(ip, p, ie);

  // \u989C\u8272\uFF1A\u70B9\u7F00\u8272\u53EF\u88AB\u201C\u8272\u5F69\u4E30\u5BCC\u5EA6\u201D\u6536\u56DE\u4E3A\u4F4E\u9971\u548C\u84DD
  float accA = step(9.5, cA.a);
  float accB = step(9.5, cB.a);
  vec3 fallback = uBaseBlue * (0.75 + aRand.z * 0.5);
  vec3 colA = mix(cA.rgb, fallback, accA * (1.0 - uAccent));
  vec3 colB = mix(cB.rgb, fallback, accB * (1.0 - uAccent));
  vec3 col = mix(colA, colB, m);
  float sizeMul = mix(cA.a - accA * 10.0, cB.a - accB * 10.0, m);

  // \u52A8\u4F5C\u7535\u4F4D\uFF1A\u6CBF\u8DEF\u5F84\u53C2\u6570\u4F20\u64AD\u7684\u5F57\u661F\u72B6\u5149\u70B9\uFF1BuPhase \u7531 CPU \u79EF\u5206\uFF0C\u70B9\u51FB\u8D8A\u5FEB\u6D41\u901F\u8D8A\u5FEB
  float path = m < 0.5 ? pA.w : pB.w;
  float neur = (path >= 0.0 && path < 400.0) ? 1.0 : 0.0;
  float spark = 0.0;
  if (path >= 0.0) {
    float e = mix(22.0, 12.0, uDrive);
    spark = (pow(fract(path - uPhase), e) + 0.6 * smoothstep(0.35, 0.8, uDrive) * pow(fract(path - uPhase + 0.5), e)) * uSparkGain;
  }
  spark *= (1.0 - burst) * uMotion;
  // \u653E\u7535\u8D8A\u5BC6\uFF0C\u7425\u73C0\u8272\uFF08\u52A8\u4F5C\u7535\u4F4D\uFF09\u7684\u6BD4\u4F8B\u8D8A\u9AD8
  vec3 sparkCol = mix(uSparkCool, uSparkWarm, step(0.5 - 0.12 * uDrive, aRand.w) * uAccent);

  // \u70B9\u51FB\u8BF1\u53D1\u7684\u52A8\u4F5C\u7535\u4F4D\uFF08\u6BCF\u4E2A\u69FD\u4F4D\uFF1AW = \u8D77\u70B9 xyz + \u8D77\u59CB\u65F6\u95F4\uFF1BQ = \u7A7A\u95F4\u95E8\u534A\u5F84, \u5F3A\u5EA6, \u8D77\u59CB\u8DEF\u5F84\u503C, \u5F53\u524D\u6CE2\u524D\u8DEF\u5F84\u503C\uFF09
  // \u6709\u8DEF\u5F84\u7684\u795E\u7ECF\u7A81\uFF1A\u6CE2\u524D\u6CBF\u8DEF\u5F84\u53C2\u6570\u201C\u987A\u5411\u201D\u4F20\u64AD\uFF08\u6811\u7A81\u2192\u80DE\u4F53\u2192\u8F74\u7A81\u2192\u4E0B\u4E00\u4E2A\u795E\u7ECF\u5143\uFF09\uFF0C\u53EA\u5728\u968F\u65F6\u95F4\u6269\u5F20\u7684\u7A7A\u95F4\u95E8\u5185\u70B9\u4EAE\uFF1B
  // \u65E0\u8DEF\u5F84\u7684\u7C92\u5B50\uFF08\u819C\u3001\u661F\u5C18\uFF09\uFF1A\u53EA\u611F\u53D7\u5230\u4E00\u5708\u5F84\u5411\u7684\u53BB\u6781\u5316\u73AF\u3002\u6CE2\u524D\u4E4B\u540E\u662F\u77ED\u6682\u53D8\u6697\u7684\u4E0D\u5E94\u671F\u3002
  float wv = 0.0;
  float refr = 0.0;
  for (int i = 0; i < 8; i++) {
    vec4 W = uWaves[i];
    if (W.w < -1e5) continue;
    float age = uTime - W.w;
    if (age < 0.0 || age > 7.0) continue;
    vec4 Q = uWaveQ[i];
    float fade = Q.y; // \u632F\u5E45\u5728 CPU \u4E0A\u6309\u5404\u81EA\u7684\u8870\u51CF\u7387\u8BA1\u7B97
    if (fade <= 0.0) continue;
    float d = distance(pm, W.xyz);
    if (Q.z >= 0.0) {
      if (path >= Q.z - 0.02 && neur > 0.5) {
        float gate = 1.0 - smoothstep(Q.x, Q.x + 0.6, d);
        float fp = path - Q.w;
        float head = exp(-fp * fp * uWaveSharp);
        float tail = fp < 0.0 ? exp(fp * 3.0) * 0.3 : 0.0;
        wv = max(wv, (head + tail) * gate * fade);
        refr = max(refr, (fp < -0.3 ? exp((fp + 0.3) * 1.2) : 0.0) * gate * fade * 0.8);
      }
      wv = max(wv, exp(-d * d * 60.0) * exp(-age * 4.0) * fade);
    } else {
      float fr = d - Q.x;
      float w = 0.09 + 0.035 * Q.x;
      wv = max(wv, exp(-(fr * fr) / (w * w)) * fade);
      refr = max(refr, fade * (1.0 - smoothstep(-0.25, 0.0, fr)) * exp(fr * 0.8));
    }
  }
  wv = min(wv, 1.6) * (uMotion * 0.5 + 0.5);

  // \u9499\u6210\u50CF\u5F0F\u7684\u81EA\u53D1\u95EA\u70C1\uFF1A\u7EA6 6% \u7684\u7C92\u5B50\u7F13\u6162\u5730\u4EAE\u8D77\u518D\u8870\u51CF\uFF0C\u653E\u7535\u8D8A\u9891\u7E41\u8D8A\u660E\u663E
  float caP = 4.0 + aRand.x * 5.0;
  float caPh = fract(uTime / caP + aRand.w * 7.31);
  float ca = step(0.94, aRand.z) * smoothstep(0.0, 0.012, caPh) * exp(-caPh * caP / 0.8) * uCaGain;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec4 clip = projectionMatrix * mv;
  vec2 ndc = clip.xy / clip.w;
  vec2 dv = ndc - uMouse;
  dv.x *= uAspect;
  float dm = length(dv);
  // \u60AC\u505C = \u9608\u4E0B\u5206\u7EA7\u7535\u4F4D\u573A\uFF1A\u7C92\u5B50\u4E0D\u79FB\u52A8\uFF08\u4E0D\u518D\u662F\u653E\u5927\u955C\uFF09\uFF0C\u53EA\u6309\u7535\u7D27\u5F20\u6027\u8870\u51CF\u53D8\u4EAE\uFF1B
  // EPSP \u5149\u5E26\u6CBF\u795E\u7ECF\u7A81\uFF08\u6309\u8DEF\u5F84\u53C2\u6570\uFF09\u6D41\u5411\u80DE\u4F53\uFF0C\u800C\u4E0D\u662F\u5C4F\u5E55\u4E0A\u7684\u540C\u5FC3\u5706\uFF1B\u79BB\u5B50\u901A\u9053\u968F\u673A\u5F00\u5408\u95EA\u70C1\uFF1B
  // uHoverV \u662F\u4F1A\u65F6\u95F4\u603B\u548C\u7684\u819C\u7535\u4F4D\uFF08\u6C38\u8FDC\u4F4E\u4E8E\u9608\u503C\uFF0C\u53EA\u6709\u70B9\u51FB\u624D\u4EA7\u751F\u5CF0\u7535\u4F4D\uFF09
  float field = exp(-dm / 0.11) * (1.0 - smoothstep(0.24, 0.36, dm)) * uMouseOn;
  float memb = neur > 0.5 ? 1.0 : 0.2;
  float epsp = mix(1.0, 0.55 + 0.45 * cos(6.2831853 * (path * 2.0 - uHovPhase)), uMotion * neur);
  float chan = neur * step(0.84, fract(aRand.w * 91.7 + floor(uTime * (8.0 + 8.0 * aRand.x)) * 0.618034)) * (1.0 - smoothstep(0.0, 0.16, dm)) * uMotion;
  float dep = field * memb * (0.35 + 0.65 * uHoverV) * epsp + chan * field * 0.5;
  // \u8D6B\u5E03\u5C3E\u8FF9\uFF1A\u5149\u6807\u626B\u8FC7\u7684\u8DEF\u5F84\u88AB\u77ED\u6682\u201C\u589E\u5F3A\u201D\uFF08\u65E9\u671F LTP\uFF09\uFF0C\u53D1\u5149\u5E76\u4F20\u9012\u66F4\u5F3A\u7684\u7535\u6D41\uFF0C\u7EA6 2.5 \u79D2\u540E\u8870\u51CF
  float hebb = 0.0;
  vec2 asp = vec2(uAspect, 1.0);
  for (int i = 0; i < 15; i++) {
    vec4 a = uTrail[i];
    vec4 b = uTrail[i + 1];
    if (b.z <= 0.0) break;
    vec2 pa = (ndc - a.xy) * asp;
    vec2 ba = (b.xy - a.xy) * asp;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    vec2 q = pa - ba * h;
    hebb = max(hebb, mix(a.z, b.z, h) * exp(-dot(q, q) / 0.0036));
  }
  hebb *= (neur > 0.5 ? 1.0 : 0.2) * uMotion;
  spark *= (1.0 + 1.4 * hebb) * (1.0 + 0.5 * uLTP);

  // \u9996\u9875\u6587\u5B57\u80CC\u540E\u7684\u201C\u906E\u7F69\u201D\uFF1A\u6807\u9898\u4E0E\u63CF\u8FF0\u533A\u57DF\u5185\u7684\u7C92\u5B50\u7565\u5FAE\u53D8\u6697\uFF0C\u4FDD\u8BC1\u53EF\u8BFB\u6027
  float inT = smoothstep(0.0, 0.04, min(min(ndc.x - uTextBox[0].x, uTextBox[0].z - ndc.x), min(ndc.y - uTextBox[0].y, uTextBox[0].w - ndc.y)));
  float inC = smoothstep(0.0, 0.04, min(min(ndc.x - uTextBox[1].x, uTextBox[1].z - ndc.x), min(ndc.y - uTextBox[1].y, uTextBox[1].w - ndc.y)));
  float veil = 1.0 - uTextDim * (0.25 * inT + 0.45 * inC);
  float vz = 1.0 - 0.25 * uTextDim * max(inT, inC);
  spark *= vz;
  wv *= vz;
  gl_Position = projectionMatrix * mv;

  float depth = max(0.5, -mv.z);
  float pulse = 1.0 + uBeat * 0.28 * aRand.y + uFlash * 0.5;
  // \u5C3A\u5BF8\u589E\u76CA\u5C01\u9876\uFF08\xD73\uFF09\uFF0C\u907F\u514D\u9AD8\u8367\u5149 + \u5BC6\u96C6\u653E\u7535\u65F6\u7684\u586B\u5145\u7387\u7206\u70B8
  float boost = min(spark * 1.8 + wv * 1.5 + dep * 0.25 + hebb * 0.25 + ca * 0.5 + cone * 1.2, 2.0);
  gl_PointSize = uSize * sizeMul * (0.65 + aRand.y * 0.7) * uPR * (11.0 / depth) * (1.0 + boost) * pulse * (0.78 + 0.22 * uGlow) * born;
  gl_PointSize = min(gl_PointSize, 40.0 * uPR);

  float bright = (0.28 + 0.72 * uGlow) * (0.9 + uBeat * 0.22 + uFlash * 0.55) * (1.0 - 0.45 * refr) * (1.0 + 0.6 * hebb)
               * (1.0 + 0.25 * uLTP * neur) * veil;
  col = mix(col, uDepolCol, 0.3 * hebb);
  float hot = 0.7 + 1.1 * uGlow;
  // \u5CF0\u7535\u4F4D\u9876\u7AEF\u624D\u662F\u7425\u73C0\u8272\uFF08\u5168\u6216\u65E0\uFF09\uFF0C\u9608\u4E0B\u7684\u5206\u7EA7\u7535\u4F4D\u59CB\u7EC8\u4FDD\u6301\u4F4E\u9971\u548C\u84DD
  vec3 apCol = mix(uDepolCol, mix(uDepolCol, uSparkWarm, uAccent), smoothstep(0.55, 1.0, wv));
  vColor = col * bright + sparkCol * spark * hot
         + apCol * wv * hot * 0.9
         + uDepolCol * (dep * (0.8 + 0.5 * uGlow) + ca * 0.9 + hebb * 0.35 + cone * 0.9);
  vAlpha = (0.55 + 0.45 * aRand.z) * (0.2 + 0.8 * ie) * born;
  vSoft = uGlow;
}
`,E_=`
varying vec3 vColor;
varying float vAlpha;
varying float vSoft;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d2 = dot(c, c) * 4.0;
  if (d2 > 1.0) discard;
  float k = mix(9.0, 3.6, clamp(vSoft * 0.5, 0.0, 1.0));
  float a = exp(-d2 * k) * vAlpha;
  gl_FragColor = vec4(vColor, a);
}
`,C_={uniforms:{tDiffuse:{value:null},uAspect:{value:1},uInner:{value:new qt("#0b1728")},uOuter:{value:new qt("#03060b")}},vertexShader:`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,fragmentShader:`
    uniform sampler2D tDiffuse;
    uniform float uAspect;
    uniform vec3 uInner;
    uniform vec3 uOuter;
    varying vec2 vUv;
    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      // \u4FDD\u8272\u76F8\u7684\u9AD8\u5149\u538B\u7F29\uFF1A\u5BC6\u96C6\u5904\u4FDD\u6301\u4F4E\u9971\u548C\u84DD\uFF0C\u800C\u4E0D\u662F\u53E0\u52A0\u6210\u767D\u8272
      float m = max(c.r, max(c.g, c.b));
      const float knee = 0.5;
      if (m > knee) {
        float t = knee + (1.0 - knee) * (1.0 - exp(-(m - knee) / (1.0 - knee)));
        c *= t / m;
      }
      vec2 p = (vUv - vec2(0.5, 0.46)) * vec2(uAspect, 1.0);
      vec3 bg = mix(uInner, uOuter, smoothstep(0.05, 0.95, length(p)));
      gl_FragColor = vec4(c + bg, 1.0);
    }
  `},zo=class{constructor(t,{count:e,width:n,shapeCount:s,pixelRatio:r}){this.count=e,this.width=n,this.rows=e/n,this.shapeCount=s,this.renderer=new Po({canvas:t,antialias:!1,powerPreference:"high-performance"}),this.renderer.setPixelRatio(r),this.renderer.setClearColor(0,1),this.renderer.toneMapping=cn,this.scene=new Ws,this.camera=new Be(35,1,.1,100),this.camera.position.set(0,0,Tc);let a=this.rows*s;this.posData=new Float32Array(n*a*4),this.colData=new Float32Array(n*a*4),this.posTex=this._tex(this.posData,n,a),this.colTex=this._tex(this.colData,n,a);let o=new Xe;o.setAttribute("position",new ke(new Float32Array(e*3),3));let l=new Float32Array(e*2),c=new Float32Array(e*4);for(let f=0;f<e;f++)l[f*2]=f%n,l[f*2+1]=Math.floor(f/n),c[f*4]=Math.random(),c[f*4+1]=Math.random(),c[f*4+2]=Math.random(),c[f*4+3]=Math.random();o.setAttribute("aRef",new ke(l,2)),o.setAttribute("aRand",new ke(c,4)),this.rnd=c,this.anchors=new Uint32Array(e>2e4?2400:1600);for(let f=0;f<this.anchors.length;f++)this.anchors[f]=Math.floor(Math.random()*e);this.waves=Array.from({length:8},()=>({alive:!1,t0:-99})),this.uniforms={uPos:{value:this.posTex},uCol:{value:this.colTex},uRows:{value:this.rows},uFrom:{value:0},uTo:{value:0},uMix:{value:0},uTime:{value:0},uGlow:{value:1},uAccent:{value:1},uSize:{value:2.6},uPR:{value:r},uIntro:{value:0},uBeat:{value:0},uFlash:{value:0},uScatter:{value:1},uMotion:{value:1},uMouse:{value:new Xt(9,9)},uMouseOn:{value:0},uPhase:{value:0},uSparkGain:{value:1},uWaves:{value:Array.from({length:8},()=>new he(0,0,0,-1e6))},uWaveQ:{value:Array.from({length:8},()=>new he(0,0,-1,0))},uHoverV:{value:0},uDepolCol:{value:new V(...et.c30)},uCaGain:{value:.7},uDrive:{value:0},uTrail:{value:Array.from({length:16},()=>new he(0,0,0,0))},uHovPhase:{value:0},uWaveSharp:{value:30},uLTP:{value:0},uTextBox:{value:[new he(9,9,9,9),new he(9,9,9,9)]},uTextDim:{value:0},uGrow:{value:1},uSoma:{value:Array.from({length:9},()=>new he(0,0,0,0))},uAspect:{value:1},uBaseBlue:{value:new V(...et.c40)},uSparkWarm:{value:new V(...et.amber)},uSparkCool:{value:new V(...et.c30)}},this.material=new ge({uniforms:this.uniforms,vertexShader:A_,fragmentShader:E_,transparent:!0,depthWrite:!1,depthTest:!1,blending:Ui}),this.points=new Js(o,this.material),this.points.frustumCulled=!1,this.group=new Jn,this.group.add(this.points),this.scene.add(this.group),this.composer=new No(this.renderer),this.composer.addPass(new Uo(this.scene,this.camera)),this.afterimage=new Bo(0),this.afterimage.enabled=!1,this.afterimage.compFsMaterial.fragmentShader=this.afterimage.compFsMaterial.fragmentShader.replace("texelOld *= damp * when_gt( texelOld, 0.1 );","texelOld *= damp * step( 0.1, max( texelOld.r, max( texelOld.g, texelOld.b ) ) );"),this.composer.addPass(this.afterimage),this.bloom=new bs(new Xt(256,256),1,.6,0);let h=["#ccdbeb","#9fbdda","#9fbdda","#6c9ac4","#497dae"];this.bloom.bloomTintColors=h.map(f=>{let u=new qt(f);return new V(u.r,u.g,u.b).multiplyScalar(1.35)}),this.bloom.compositeMaterial.uniforms.bloomTintColors.value=this.bloom.bloomTintColors,this.composer.addPass(this.bloom),this.bgPass=new Ss(C_),this.composer.addPass(this.bgPass),this.composer.addPass(new Fo),this.setGlow(1)}_tex(t,e,n){let s=new hs(t,e,n,je,un);return s.minFilter=Me,s.magFilter=Me,s.generateMipmaps=!1,s.needsUpdate=!0,s}setShape(t,e,n){let s=t*this.count*4;this.posData.set(e,s),this.colData.set(n,s);let r=this.width*4;for(let a=0;a<this.rows;a++)this.posTex.addUpdateRange(s+a*r,r),this.colTex.addUpdateRange(s+a*r,r);this.posTex.needsUpdate=!0,this.colTex.needsUpdate=!0}resize(t,e,n){this.renderer.setPixelRatio(n),this.renderer.setSize(t,e,!1),this.composer.setPixelRatio(n),this.composer.setSize(t,e),this.camera.aspect=t/e,this.camera.updateProjectionMatrix(),this.uniforms.uPR.value=n,this.uniforms.uAspect.value=t/e,this.bgPass.uniforms.uAspect.value=t/e}setGlow(t){this.uniforms.uGlow.value=t,this.baseBloom=.12+.78*t,this.bloom.strength=this.baseBloom,this.bloom.radius=.45+.2*Math.min(t,1.5),this.bloom.threshold=.015}emitWave(t,{strength:e=1,seedPath:n=-1,gate:s=!0,vMul:r=1,decay:a=.45,life:o=7,ceil:l=1/0,gateR0:c=0}={}){let h=this.waves.findIndex(u=>!u.alive);h<0&&(h=this.waves.reduce((u,d,g)=>d.t0<this.waves[u].t0?g:u,0));let f=this.waves[h];Object.assign(f,{alive:!0,t0:this.uniforms.uTime.value,front:n,gateR:s?c:99,gate:s,strength:e,seedPath:n,vMul:r,decay:a,life:o,ceil:l,amp:e}),this.uniforms.uWaves.value[h].set(t[0],t[1],t[2],f.t0),this._syncWave(h)}_syncWave(t){let e=this.waves[t];this.uniforms.uWaveQ.value[t].set(e.gateR,e.alive?e.amp:0,e.seedPath,e.front)}stepWaves(t,e,n=1.1){let s=this.uniforms.uTime.value;for(let r=0;r<this.waves.length;r++){let a=this.waves[r];if(!a.alive)continue;let o=s-a.t0;if(a.amp=a.strength*Math.exp(-o*a.decay),o>a.life||a.amp<.02||a.seedPath>=0&&a.front>a.ceil){a.alive=!1,this.uniforms.uWaves.value[r].w=-1e6,this._syncWave(r);continue}a.seedPath>=0&&(a.front+=e*a.vMul*t),a.gate&&(a.gateR+=n*e*a.vMul*t),this._syncWave(r)}}setMeta(t,e){this.metas=this.metas||[],this.metas[t]=e}rebaseTime(t){for(let e=0;e<this.waves.length;e++){let n=this.waves[e];n.t0-=t,n.alive&&(this.uniforms.uWaves.value[e].w=n.t0)}}bandTop(t,e){let n=this.metas&&this.metas[t];if(!n||e<0)return 1/0;for(let[s,r]of n.bands)if(e>=s&&e<r)return r;return 1/0}_localInto(t,e){let n=this.uniforms,s=.45,r=Math.min(1,Math.max(0,n.uMix.value*(1+s)-this.rnd[t*4]*s));r=r*r*(3-2*r);let a=(n.uFrom.value*this.count+t)*4,o=(n.uTo.value*this.count+t)*4,l=this.posData;return e[0]=l[a]+(l[o]-l[a])*r,e[1]=l[a+1]+(l[o+1]-l[a+1])*r,e[2]=l[a+2]+(l[o+2]-l[a+2])*r,e[3]=r<.5?l[a+3]:l[o+3],e}pickLocal(t,e,n=.14){this.group.updateMatrixWorld(),this.camera.updateMatrixWorld();let r=(this._M||(this._M=new ve)).multiplyMatrices(this.camera.projectionMatrix,this.camera.matrixWorldInverse).multiply(this.group.matrixWorld).elements,a=this.camera.aspect,o=this.uniforms.uMix.value<.5?this.uniforms.uFrom.value:this.uniforms.uTo.value,l=(A,P,x)=>{let b=r[3]*A+r[7]*P+r[11]*x+r[15];if(b<=.01)return 1/0;let M=((r[0]*A+r[4]*P+r[8]*x+r[12])/b-t)*a,E=(r[1]*A+r[5]*P+r[9]*x+r[13])/b-e;return M*M+E*E},c=this.metas&&this.metas[o];if(c&&c.somata&&this.uniforms.uMix.value<.02){let A=null,P=1/0;for(let x of c.somata){let b=.085*x.k,M=l(x.p[0],x.p[1],x.p[2]);M<b*b&&M<P&&(P=M,A=x)}if(A)return{p:A.p.slice(),path:A.path,shape:o}}let h=this._lp||(this._lp=new Float32Array(4)),f=this._best||(this._best=new Float32Array(4)),u=this._bestN||(this._bestN=new Float32Array(4)),d=n*n,g=d*2.9,w=!1,m=!1;for(let A=0;A<this.anchors.length;A++){this._localInto(this.anchors[A],h);let P=h[2];if(Math.abs(h[0])>6.2||Math.abs(h[1])>4.2||P<-4.5)continue;let x=l(h[0],h[1],P)*(1+Math.max(0,-P)*.35);h[3]>=0&&h[3]<400?x<g&&(g=x,u.set(h),m=!0):x<d&&(d=x,f.set(h),w=!0)}if(m)return{p:[u[0],u[1],u[2]],path:u[3],shape:o};if(w)return{p:[f[0],f[1],f[2]],path:-1,shape:o};let p=(this._inv||(this._inv=new ve)).copy(this.group.matrixWorld).invert(),S=new V().setFromMatrixPosition(this.camera.matrixWorld).applyMatrix4(p),v=new V(t,e,.5).unproject(this.camera).applyMatrix4(p).sub(S).normalize();if(Math.abs(v.z)<1e-4)return{p:[0,0,0],path:-1,shape:o};let T=-S.z/v.z;return{p:[S.x+v.x*T,S.y+v.y*T,0],path:-1,shape:o}}randomLocal(){let t=this._lp||(this._lp=new Float32Array(4));for(let e=0;e<20;e++)if(this._localInto(this.anchors[Math.floor(Math.random()*this.anchors.length)],t),Math.abs(t[0])<5.5&&Math.abs(t[1])<3.8&&t[2]>-3)return[t[0],t[1],t[2]];return[0,0,0]}setWarp(t,e=!0){let n=e?t:0;this.camera.position.z=Tc-.55*n,this.afterimage.enabled=n>.01,this.afterimage.uniforms.damp.value=.82*Math.pow(n,1.5),this.bloom.strength=this.baseBloom+.22*n*this.uniforms.uGlow.value}visibleHalfSize(){let t=Math.tan(Zl.degToRad(this.camera.fov/2))*Tc;return[t*this.camera.aspect,t]}render(){this.composer.render()}};var Rn=.11029411764705882,Cr=60/136,Rr=256,R_=Rr*Rn,P_=4,_n=32e3,Es=Math.round(R_*_n),wr=Es/_n,Ar=i=>440*Math.pow(2,(i-69)/12),I_=.6,ku=i=>650+Math.max(1,i)*420,L_={Dm:{root:38,pad:[57,62,65,69],arp:[50,57,62,65]},Bb:{root:34,pad:[53,58,62,65],arp:[46,53,58,62]},F:{root:41,pad:[57,60,65,69],arp:[53,60,65,69]},C:{root:36,pad:[55,60,64,67],arp:[48,55,60,64]},A:{root:33,pad:[52,57,61,64],arp:[45,52,57,61]}},D_=["Dm","Bb","F","C","Dm","Bb","C","A","Bb","C","Dm","Dm","Bb","C","A","A"],N_=[[0,0,6,74],[0,6,2,69],[0,8,4,74],[0,12,2,76],[0,14,2,77],[1,0,6,77],[1,6,2,76],[1,8,4,74],[1,12,4,72],[2,0,4,72],[2,4,4,77],[2,8,6,81],[2,14,2,79],[3,0,8,79],[3,8,4,76],[3,12,4,72],[4,0,6,74],[4,6,2,69],[4,8,4,74],[4,12,2,77],[4,14,2,81],[5,0,8,82],[5,8,4,81],[5,12,4,77],[6,0,6,79],[6,6,2,76],[6,8,4,72],[6,12,4,79],[7,0,8,81],[7,8,4,76],[7,12,4,73],[8,0,4,77],[8,4,4,82],[8,8,4,81],[8,12,4,77],[9,0,6,79],[9,6,2,81],[9,8,4,79],[9,12,4,76],[10,0,6,77],[10,6,2,76],[10,8,8,74],[11,0,4,81],[11,4,8,86],[11,12,4,84],[12,0,6,82],[12,6,2,81],[12,8,4,79],[12,12,4,77],[13,0,4,76],[13,4,4,79],[13,8,8,84],[14,0,8,85],[14,8,8,81],[15,0,4,76],[15,4,4,81],[15,8,4,85],[15,12,4,88]],zu=[0,2,1,2,0,2,1,2,0,2,1,2,0,3,2,1],U_=[0,6,8],F_=[3,10,12,14,15],Er=[{key:"pad",level:0,label:"\u548C\u5F26\u57AB",trim:.8},{key:"pulse",level:1,label:"\u5F26\u4E50\u987F\u5F13 + \u592A\u9F13",trim:.62},{key:"drive",level:2,label:"\u5E95\u9F13 + \u8D1D\u65AF",trim:.36},{key:"groove",level:3,label:"\u519B\u9F13 + \u9572 + \u592A\u9F13\u9F50\u594F",trim:.5},{key:"hero",level:4,label:"\u82F1\u96C4\u4E3B\u65CB\u5F8B",trim:1.25},{key:"epic",level:5,label:"\u94DC\u7BA1\u9F50\u594F",trim:.72}],Vo=class{constructor(t,e=0){this.ctx=t,this.tOff=e,this.out=t.createGain(),this.out.connect(t.destination),this.rev=t.createGain(),this.rev.gain.value=.55;let n=t.createBiquadFilter();n.type="highpass",n.frequency.value=250;let s=t.createConvolver();s.buffer=O_(t,2.8,2.6),this.rev.connect(n).connect(s).connect(t.destination),this.del=t.createGain(),this.del.gain.value=.5;let r=t.createDelay(1.5);r.delayTime.value=Rn*3;let a=t.createGain();a.gain.value=.32;let o=t.createBiquadFilter();o.type="lowpass",o.frequency.value=2600,this.del.connect(r),r.connect(o).connect(a).connect(r),o.connect(t.destination),this.noise=B_(t);let l=new Float32Array(1024);for(let c=0;c<1024;c++)l[c]=Math.tanh((c/1023*2-1)*2.2);this.drivePre=t.createGain(),this.drivePre.gain.value=.6,this.drive=t.createWaveShaper(),this.drive.curve=l,this.drive.oversample="4x",this.drivePre.connect(this.drive).connect(this.out),this.pans=[-.35,.35,-.5,.5].map(c=>{let h=t.createStereoPanner();return h.pan.value=c,h.connect(this.out),h.connect(this.del),h})}env(t,e,n,s,r){t.gain.setValueAtTime(0,e),t.gain.linearRampToValueAtTime(n,e+s),t.gain.setTargetAtTime(0,e+s,r/4)}noiseSrc(t,e){let n=this.ctx.createBufferSource();return n.buffer=this.noise,n.start(t,(t+this.tOff)*7.31%1.2),n.stop(t+e),n}kick(t,e){let{ctx:n}=this,s=n.createOscillator(),r=n.createGain();s.frequency.setValueAtTime(165,t),s.frequency.exponentialRampToValueAtTime(42,t+.13),this.env(r,t,e,.003,.42),s.connect(r).connect(this.out),s.start(t),s.stop(t+.6);let a=this.noiseSrc(t,.04),o=n.createBiquadFilter();o.type="highpass",o.frequency.value=3500;let l=n.createGain();this.env(l,t,e*.22,.001,.02),a.connect(o).connect(l).connect(this.out)}taiko(t,e,n){let{ctx:s}=this,r=s.createOscillator(),a=s.createGain();r.frequency.setValueAtTime(n*1.6,t),r.frequency.exponentialRampToValueAtTime(n*.62,t+.25),this.env(a,t,e*.85,.004,.7),r.connect(a).connect(this.out),r.start(t),r.stop(t+1);let o=this.noiseSrc(t,.3),l=s.createBiquadFilter();l.type="bandpass",l.frequency.value=n*2.4,l.Q.value=1.2;let c=s.createGain();this.env(c,t,e*.5,.002,.2),o.connect(l).connect(c),c.connect(this.out),c.connect(this.rev)}snare(t,e){let{ctx:n}=this,s=this.noiseSrc(t,.35),r=n.createBiquadFilter();r.type="bandpass",r.frequency.value=1900,r.Q.value=.7;let a=n.createGain();this.env(a,t,e*.8,.002,.22),s.connect(r).connect(a),a.connect(this.out),a.connect(this.rev);let o=n.createOscillator();o.type="triangle",o.frequency.setValueAtTime(200,t),o.frequency.exponentialRampToValueAtTime(150,t+.1);let l=n.createGain();this.env(l,t,e*.5,.002,.12),o.connect(l).connect(this.out),o.start(t),o.stop(t+.3)}hat(t,e,n){let{ctx:s}=this,r=this.noiseSrc(t,n?.35:.08),a=s.createBiquadFilter();a.type="highpass",a.frequency.value=7600;let o=s.createGain();this.env(o,t,e,.001,n?.22:.045),r.connect(a).connect(o).connect(this.out)}bass(t,e,n,s){let{ctx:r}=this,a=Ar(e),o=r.createOscillator(),l=r.createOscillator();o.type="sawtooth",l.type="square",o.frequency.value=a,l.frequency.value=a*.5;let c=r.createBiquadFilter();c.type="lowpass",c.Q.value=5,c.frequency.setValueAtTime(260,t),c.frequency.exponentialRampToValueAtTime(1300,t+.02),c.frequency.exponentialRampToValueAtTime(320,t+n);let h=r.createGain();h.gain.setValueAtTime(0,t),h.gain.linearRampToValueAtTime(s,t+.006),h.gain.setTargetAtTime(s*.55,t+.006,n*.4),h.gain.setTargetAtTime(0,t+n,.012);let f=r.createGain();f.gain.value=.5,o.connect(c),l.connect(f).connect(c),c.connect(h).connect(this.drivePre),o.start(t),l.start(t),o.stop(t+n+.1),l.stop(t+n+.1)}pluck(t,e,n,s){let{ctx:r}=this,a=Ar(e),o=r.createOscillator(),l=r.createOscillator();o.type="sawtooth",l.type="sawtooth",o.frequency.value=a,l.frequency.value=a,l.detune.value=9;let c=r.createBiquadFilter();c.type="lowpass",c.Q.value=2,c.frequency.setValueAtTime(3200,t),c.frequency.exponentialRampToValueAtTime(600,t+.16);let h=r.createGain();this.env(h,t,n*.5,.004,.17),o.connect(c),l.connect(c),c.connect(h).connect(this.pans[s]),o.start(t),l.start(t),o.stop(t+.3),l.stop(t+.3)}pad(t,e,n){let{ctx:s}=this,r=s.createBiquadFilter();r.type="lowpass",r.Q.value=.8,r.frequency.setValueAtTime(1650,t),r.frequency.linearRampToValueAtTime(2750,t+n*.6);let a=s.createGain(),o=.085;a.gain.setValueAtTime(0,t),a.gain.linearRampToValueAtTime(o,t+.35),a.gain.setValueAtTime(o,t+n-.05),a.gain.linearRampToValueAtTime(0,t+n+.5),r.connect(a),a.connect(this.out),a.connect(this.rev);for(let l of e)for(let c of[-11,0,11]){let h=s.createOscillator();h.type="sawtooth",h.frequency.value=Ar(l),h.detune.value=c,h.connect(r),h.start(t),h.stop(t+n+.55)}}brass(t,e,n){let{ctx:s}=this,r=s.createBiquadFilter();r.type="lowpass",r.Q.value=3,r.frequency.setValueAtTime(500,t),r.frequency.exponentialRampToValueAtTime(3800,t+.05),r.frequency.exponentialRampToValueAtTime(900,t+.4);let a=s.createGain();this.env(a,t,n*.32,.015,.45),r.connect(a),a.connect(this.out),a.connect(this.rev);for(let o of[e[0]-12,...e])for(let l of[-7,7]){let c=s.createOscillator();c.type="sawtooth",c.frequency.value=Ar(o),c.detune.value=l,c.connect(r),c.start(t),c.stop(t+.7)}}lead(t,e,n,s){let{ctx:r}=this,a=Ar(e),o=r.createOscillator(),l=r.createOscillator(),c=r.createOscillator();o.type="sawtooth",l.type="square",c.type="sawtooth",o.frequency.value=a,l.frequency.value=a,c.frequency.value=a/2,l.detune.value=6;let h=r.createOscillator();h.frequency.value=5.6;let f=r.createGain();f.gain.setValueAtTime(0,t),f.gain.linearRampToValueAtTime(a*.006,t+Math.min(.35,n)),h.connect(f),f.connect(o.frequency),f.connect(l.frequency);let u=r.createBiquadFilter();u.type="lowpass",u.Q.value=1.2,u.frequency.setValueAtTime(1400,t),u.frequency.linearRampToValueAtTime(3600,t+.08);let d=r.createGain(),g=t+n;d.gain.setValueAtTime(0,t),d.gain.linearRampToValueAtTime(s*.42,t+.03),d.gain.linearRampToValueAtTime(s*.36,Math.max(t+.05,g-.06)),d.gain.linearRampToValueAtTime(0,g+.12);let w=r.createGain();w.gain.value=.35;let m=r.createGain();m.gain.value=.3,o.connect(u),l.connect(w).connect(u),c.connect(m).connect(u),u.connect(d),d.connect(this.out),d.connect(this.del),d.connect(this.rev);for(let p of[o,l,c,h])p.start(t),p.stop(g+.2)}};function O_(i,t,e){let n=Math.floor(i.sampleRate*t),s=i.createBuffer(2,n,i.sampleRate),r=12345,a=()=>(r=r*1664525+1013904223>>>0,r/4294967296);for(let o=0;o<2;o++){let l=s.getChannelData(o);for(let c=0;c<n;c++)l[c]=(a()*2-1)*Math.pow(1-c/n,e)}return s}function B_(i){let t=i.sampleRate*2,e=i.createBuffer(1,t,i.sampleRate),n=e.getChannelData(0),s=987654;for(let r=0;r<t;r++)s=s*1664525+1013904223>>>0,n[r]=s/4294967296*2-1;return e}function k_(i,t,e=0,n=Rr){for(let s=e;s<n;s++){let r=s*Rn-t.tOff,a=s%16,o=Math.floor(s/16),l=L_[D_[o]];switch(i){case"pad":a===0&&t.pad(r,l.pad,Rn*16);break;case"pulse":t.pluck(r,l.arp[zu[a]],a%4===0?.32:.22,a%2?1:0),U_.includes(a)&&t.taiko(r,a===0?1:.62,82);break;case"drive":a%4===0&&t.kick(r,.95),a%2===0&&t.bass(r,l.root+(a===6||a===14?12:0),Rn*1.8,a===0?.55:.42);break;case"groove":(a===4||a===12)&&t.snare(r,.7),o%4===3&&a>=8&&t.snare(r,.18+(a-8)*.06),a%4===2&&t.hat(r,.22,a===14),t.pluck(r,l.arp[zu[a]]+12,.1,a%2?2:3),F_.includes(a)&&t.taiko(r,.62,a>=14?120:82);break;case"hero":for(let[c,h,f,u]of N_)c===o&&h===a&&t.lead(r,u,f*Rn,.27);break;case"epic":(a===0||a===10)&&t.brass(r,l.pad,a===0?.32:.24),a%2===1&&t.hat(r,.1,!1),a===14&&t.kick(r,.7);break}}}function Gu(i,t,e){try{return new AudioBuffer({numberOfChannels:i,length:t,sampleRate:e})}catch{return new OfflineAudioContext(i,1,e).createBuffer(i,t,e)}}var z_=4;async function V_(i){let t=window.OfflineAudioContext||window.webkitOfflineAudioContext,e=Es,n=[new Float32Array(e),new Float32Array(e)],s=z_*16;for(let a=0;a<Rr;a+=s){let o=a*Rn,l=new t(2,Math.ceil((s*Rn+P_)*_n),_n);k_(i,new Vo(l,o),a,a+s);let c=await l.startRendering();await new Promise(f=>setTimeout(f,0));let h=Math.round(o*_n);for(let f=0;f<2;f++){let u=c.getChannelData(f),d=n[f];for(let g=0;g<u.length;g++)d[(h+g)%e]+=u[g]}}let r=Gu(2,e+2,_n);for(let a=0;a<2;a++){let o=r.getChannelData(a);o.set(n[a]),o[e]=n[a][0],o[e+1]=n[a][1]}return r}async function Vu(i,t){let e=window.OfflineAudioContext||window.webkitOfflineAudioContext,n=new e(2,Math.ceil(i*_n),_n);return t(n,new Vo(n)),n.startRendering()}function G_(i,t){let e=i.createBiquadFilter();e.type="highpass",e.frequency.value=38,e.connect(i.destination);let n=i.createOscillator(),s=i.createGain();n.frequency.setValueAtTime(80,0),n.frequency.exponentialRampToValueAtTime(42,1),s.gain.setValueAtTime(0,0),s.gain.linearRampToValueAtTime(.5,.008),s.gain.setTargetAtTime(0,.01,.26),n.connect(s).connect(e),n.start(0),n.stop(1.69);let r=t.noiseSrc(0,1.4),a=i.createBiquadFilter();a.type="lowpass",a.frequency.setValueAtTime(7e3,0),a.frequency.exponentialRampToValueAtTime(180,1.2);let o=i.createGain();t.env(o,0,.22,.005,1),r.connect(a).connect(o),o.connect(i.destination),o.connect(t.rev)}function H_(i,t){let e=i.createOscillator(),n=i.createGain();e.type="triangle",e.frequency.setValueAtTime(1500,0),e.frequency.exponentialRampToValueAtTime(320,.05),n.gain.setValueAtTime(0,0),n.gain.linearRampToValueAtTime(.5,.0015),n.gain.setTargetAtTime(0,.002,.018),e.connect(n).connect(i.destination),e.start(0),e.stop(.15);let s=t.noiseSrc(0,.02),r=i.createBiquadFilter();r.type="bandpass",r.frequency.value=3200,r.Q.value=1.5;let a=i.createGain();t.env(a,0,.35,8e-4,.012),s.connect(r).connect(a).connect(i.destination)}function W_(){let i=Gu(1,Es+2,_n),t=i.getChannelData(0),e=.006;for(let n=0;n<Rr/4;n++){let s=n*4*Rn,r=Math.round(s*_n),a=Math.min(Es,Math.round((s+Cr)*_n));for(let o=r;o<a;o++){let l=o/_n-s;t[o]=-(l<e?l/e:Math.exp(-(l-e)/.09))}}return t[Es]=t[0],t[Es+1]=t[1],i}var Go=class{constructor(){this.ctx=null,this.desired=!1,this.volume=.8,this.level=1,this.buffers={},this.sfx={},this.stems={},this.loopT0=null,this.lastPos=-1,this.lastAudible=0,this.lastImpact=-10,this.clicks=[],this.onStatus=null,this.status="idle",this.preparing=null,this.op=Promise.resolve()}get playing(){return this.desired}get uiState(){return this.desired?!this.ctx||this.loopT0==null?"loading":this.ctx.state!=="running"?"blocked":"on":this.status==="error"&&!this.buffers.pad?"error":"off"}_emit(t){t&&(this.status=t),this.onStatus&&this.onStatus(this.uiState)}_serial(t){return this.op=this.op.then(t).catch(e=>console.warn("\u914D\u4E50",e)),this.op}prepare(){return this.preparing?this.preparing:(this.status="preparing",this.preparing=(async()=>{try{this.sfx.impact=await Vu(1.7,G_),this.sfx.spike=await Vu(.15,H_);for(let t of Er)this._emit(`rendering ${t.key}`),this.buffers[t.key]=await V_(t.key),this.ctx&&this.loopT0!=null&&this._startStem(t.key,!0),await new Promise(e=>setTimeout(e,30));this._emit("ready")}catch(t){console.warn("\u914D\u4E50\u9884\u6E32\u67D3\u5931\u8D25",t),this.preparing=null,this._emit("error")}})(),this.preparing)}_build(){let t=window.AudioContext||window.webkitAudioContext,e;try{e=new t({latencyHint:"balanced"})}catch{e=new t}this.ctx=e;try{navigator.audioSession&&(navigator.audioSession.type="playback")}catch{}this.master=e.createGain(),this.master.gain.value=0;let n=e.createDynamicsCompressor();n.threshold.value=-1,n.knee.value=0,n.ratio.value=20,n.attack.value=.003,n.release.value=.25,this.master.connect(n).connect(e.destination),this.music=e.createGain(),this.music.gain.value=I_,this.music.connect(this.master),this.sfxBus=e.createGain(),this.sfxBus.gain.value=.65,this.sfxBus.connect(this.master),this.padLP=e.createBiquadFilter(),this.padLP.type="lowpass",this.padLP.Q.value=.5,this.padLP.frequency.value=ku(this.level),this.duck=e.createGain(),this.duck.gain.value=1,this.padLP.connect(this.duck).connect(this.music),this.duckDepth=e.createGain(),this.duckDepth.gain.value=0,this.duckDepth.connect(this.duck.gain);for(let o of Er){let l=e.createGain();l.gain.value=0,l.connect(o.key==="pad"?this.padLP:this.music),this.stems[o.key]={gain:l,src:null,startAt:0}}e.addEventListener("statechange",()=>{this._emit()});let s=o=>{o.target&&o.target.closest&&o.target.closest("[data-sound-toggle]")||this.desired&&!document.hidden&&this.ctx.state!=="running"&&this.ctx.resume().then(()=>this._fadeIn(),()=>{})};for(let o of["pointerdown","keydown","touchend"])addEventListener(o,s,{capture:!0,passive:!0});let r=()=>this._serial(()=>this._suspendSoft()),a=()=>this._serial(()=>this._resumeSoft());document.addEventListener("visibilitychange",()=>document.hidden?r():a()),addEventListener("pagehide",r),addEventListener("pageshow",a)}_loopPos(t){return((t-this.loopT0)%wr+wr)%wr}_startStem(t,e=!1){let n=this.buffers[t],s=this.stems[t];if(!n||!s||s.src||this.loopT0==null)return;let r=this.ctx,a=r.currentTime+.05;e&&(a=this.loopT0+Math.ceil((a-this.loopT0)/Cr)*Cr);let o=r.createBufferSource();o.buffer=n,o.loop=!0,o.loopStart=0,o.loopEnd=wr,o.connect(s.gain),o.start(a,this._loopPos(a)),s.src=o,s.startAt=a;let l=Er.find(h=>h.key===t),c=s.gain.gain;c.cancelScheduledValues(r.currentTime),c.setValueAtTime(0,r.currentTime),l.level<=this.level&&c.setTargetAtTime(l.trim,a,.02)}_startClock(){let t=this.ctx;this.loopT0=t.currentTime+.1;let e=t.createBufferSource();e.buffer=W_(),e.loop=!0,e.loopStart=0,e.loopEnd=wr,e.connect(this.duckDepth),e.start(this.loopT0);for(let n of Er)this._startStem(n.key)}_fadeIn(){let t=this.ctx.currentTime;this.master.gain.cancelScheduledValues(t),this.master.gain.setTargetAtTime(this.volume,t,.15),this._emit()}async _suspendSoft(){!this.ctx||!this.desired||this.ctx.state!=="running"||(this.master.gain.setTargetAtTime(0,this.ctx.currentTime,.02),await new Promise(t=>setTimeout(t,90)),document.hidden&&this.ctx.state==="running"&&await this.ctx.suspend())}async _resumeSoft(){if(!(!this.ctx||!this.desired||document.hidden)){try{await this.ctx.resume()}catch{}this.ctx.state==="running"?this._fadeIn():this._emit()}}start(){this.desired=!0,this.ctx||this._build();let t=this.ctx.state!=="running"?this.ctx.resume().catch(()=>{}):null;return this.prepare(),this._emit(),this._serial(async()=>{if(t&&await t,this.loopT0==null){if(await new Promise(e=>{let n=()=>this.buffers.pad||this.status==="error"||!this.desired?e():setTimeout(n,50);n()}),!this.desired)return;if(!this.buffers.pad){this.desired=!1,this._emit();return}this._startClock()}if(this.desired){if(this.ctx.state!=="running")try{await this.ctx.resume()}catch{}this._applyLevel(!0),this.ctx.state==="running"?(this._fadeIn(),this.impact()):this._emit()}})}stop(){if(this.desired=!1,this._emit(),!this.ctx)return Promise.resolve();let t=this.ctx.currentTime;return this.master.gain.cancelScheduledValues(t),this.master.gain.setTargetAtTime(0,t,.08),this._serial(async()=>{await new Promise(e=>setTimeout(e,400)),!this.desired&&this.ctx.state==="running"&&await this.ctx.suspend(),this.desired&&this.ctx.state!=="running"&&(await this.ctx.resume(),this._fadeIn())})}setVolume(t){this.volume=t,this.ctx&&this.desired&&this.master.gain.setTargetAtTime(t,this.ctx.currentTime,.05)}setLevel(t){this.level=Math.max(0,Math.min(5,t)),this._applyLevel(!1)}_applyLevel(t){if(!this.ctx)return;let n=this.ctx.currentTime,s=this.loopT0==null?n:this.loopT0+Math.ceil((n+.03-this.loopT0)/Cr)*Cr;for(let r of Er){if(!this.stems[r.key].src)continue;let a=r.level<=this.level,o=this.stems[r.key].gain.gain;if(o.cancelAndHoldAtTime)o.cancelAndHoldAtTime(n);else{let h=o.value;o.cancelScheduledValues(n),o.setValueAtTime(h,n)}let l=this.stems[r.key].startAt,c=l>n;a?c?o.setTargetAtTime(r.trim,l,.02):t?o.setTargetAtTime(r.trim,n,.03):o.setTargetAtTime(r.trim,Math.max(n,s-.02),.06):o.setTargetAtTime(0,n,t||c?.03:.45)}this.padLP.frequency.setTargetAtTime(ku(this.level),n,.5),this.duckDepth.gain.setTargetAtTime(this.level>=2?.42:.1,n,.3)}pollBeats(){if(!this.ctx||!this.desired||this.loopT0==null||this.ctx.state!=="running")return 0;let t=this.ctx.currentTime-(this.ctx.outputLatency||this.ctx.baseLatency||0);if(t<this.loopT0)return 0;let e=this._loopPos(t),n=t-this.lastAudible;if(this.lastAudible=t,this.lastPos<0||n>.25||n<0)return this.lastPos=e,0;let s=Math.floor(this.lastPos/Rn),r=Math.floor(e/Rn);r<s&&(r+=Rr),this.lastPos=e;let a=0;for(let o=s+1;o<=r;o++){let l=o%16;this.level>=2&&l%4===0?a=Math.max(a,l===0?1:.75):this.level>=1&&(l===0||l===8)&&(a=Math.max(a,.7)),this.level>=5&&l===14&&(a=Math.max(a,.6))}return a}_playSfx(t,e,n=1){if(!t||!this.ctx||!this.desired||this.ctx.state!=="running")return null;let s=this.ctx,r=s.createBufferSource();r.buffer=t,r.playbackRate.value=n;let a=s.createGain();return a.gain.value=e,r.connect(a).connect(this.sfxBus),r.start(s.currentTime+.005),r.onended=()=>a.disconnect(),{src:r,g:a}}impact(){if(!this.ctx)return;let t=this.ctx.currentTime;t-this.lastImpact<.7||this._playSfx(this.sfx.impact,.6)&&(this.lastImpact=t)}spike(t=0){if(!this.ctx)return;let e=this.ctx.currentTime;if(e-(this.lastSpike||-1)<.06)return;let n=.38/(1+.12*Math.max(0,t-3)),s=this._playSfx(this.sfx.spike,n,1+Math.min(1,t/8)*.6);if(s){if(this.lastSpike=e,this.clicks.push(s),this.clicks.length>6){let r=this.clicks.shift();r.g.gain.setTargetAtTime(0,e,.008);try{r.src.stop(e+.05)}catch{}}s.src.addEventListener("ended",()=>{let r=this.clicks.indexOf(s);r>=0&&this.clicks.splice(r,1)})}}};var X_=(i,t,e)=>Math.min(e,Math.max(t,i)),q_=(i,t,e)=>{let n=X_((e-i)/(t-i),0,1);return n*n*(3-2*n)},Y_="a,button,input,select,label,textarea,.panel,.topbar,.dots,.hud";function Hu({field:i,audio:t,dots:e,reduceMotion:n,accent:s,shapeMeta:r,currentShape:a,onLtp:o}){let l={last:-1,rate:0,rateSlow:0,k:0,M:0,spikes:[],ltpCool:0,ltp:0},c={x:9,y:9,on:0,onTarget:0,V:0,speed:0,lastMove:-10,lastT:0,phase:0},h=0,f=matchMedia("(hover: hover) and (pointer: fine)").matches,u=matchMedia("(min-width: 821px)"),d=document.getElementById("stimLayer"),g=Array.from({length:8},()=>{let nt=document.createElement("i");return nt.className="stim",d.appendChild(nt),nt}),w=0,m=document.getElementById("bouton"),p=m.querySelector(".b-arc"),S=-1,C=document.getElementById("ltpToast"),v=document.getElementById("vm"),T=document.getElementById("vmRead"),A=v?v.getContext("2d"):null,P=[],x=[],b=nt=>[nt.clientX/innerWidth*2-1,-(nt.clientY/innerHeight*2-1)],M=nt=>!!(nt.target&&nt.target.closest&&nt.target.closest(Y_));addEventListener("pointermove",nt=>{if(nt.pointerType==="touch")return;let[wt,St]=b(nt),ct=performance.now()/1e3,Nt=Math.max(.001,ct-c.lastT),Zt=Math.hypot(wt-c.x,St-c.y);c.speed=c.speed*.7+Zt/Nt*.3,Zt>.02&&(c.lastMove=ct),c.lastT=ct,c.x=wt,c.y=St;let se=M(nt)?0:1;!se&&c.onTarget&&(x.length=0),c.onTarget=se;let Et=x[0],Jt=innerWidth/innerHeight;c.onTarget&&(!Et||Math.hypot((wt-Et[0])*Jt,St-Et[1])>=.03)&&(x.unshift([wt,St,.55+.45*Math.min(1,c.speed/1.5),ct]),x.length>16&&x.pop()),f&&!n&&(m.style.transform=`translate3d(${nt.clientX}px, ${nt.clientY}px, 0)`,m.classList.toggle("show",c.onTarget===1))},{passive:!0}),document.addEventListener("mouseleave",()=>{c.onTarget=0,x.length=0,m.classList.remove("show")}),addEventListener("blur",()=>{c.onTarget=0,x.length=0}),addEventListener("mousedown",nt=>{nt.detail>=2&&!M(nt)&&!(nt.target.closest&&nt.target.closest(".sec:not(.hero) .sec-inner"))&&nt.preventDefault()});let E=null;addEventListener("pointerdown",nt=>{if(!M(nt)){if(nt.pointerType==="touch"){E={x:nt.clientX,y:nt.clientY,t:performance.now()};return}nt.button===0&&N(nt.clientX,nt.clientY)}},{passive:!0}),addEventListener("pointerup",nt=>{if(nt.pointerType!=="touch"||!E)return;if(Math.hypot(nt.clientX-E.x,nt.clientY-E.y)<10&&performance.now()-E.t<300){let[St,ct]=b(nt);c.x=St,c.y=ct,c.on=1,c.lastMove=c.lastT=performance.now()/1e3,c.V=Math.max(c.V,.6),N(nt.clientX,nt.clientY)}E=null},{passive:!0}),addEventListener("pointercancel",()=>E=null);let L=0;function N(nt,wt){let St=performance.now()/1e3,ct=St-l.last;if(l.last>0&&ct<.035){I(nt,wt,!0);return}l.last=St,L=St+3,l.rate=Math.min(14,l.rate+1/.9),l.rateSlow+=1/3;let Nt=ct<1?1-.35*Math.exp(-ct/.15):1;if(n&&(Nt*=.6),l.spikes.push(St),l.spikes.length>40&&l.spikes.shift(),I(nt,wt,!1),m.classList.remove("fire"),m.offsetWidth,m.classList.add("fire"),t.spike(l.rate),!i)return;let[Zt,se]=[nt/innerWidth*2-1,-(wt/innerHeight*2-1)],Et=i.pickLocal(Zt,se,.14);Et.path>=0?i.emitWave(Et.p,{strength:Nt,seedPath:Et.path,gate:!0,ceil:i.bandTop(Et.shape,Et.path)}):i.emitWave(Et.p,{strength:Nt,seedPath:-1,gate:!0})}function I(nt,wt,St){let ct=g[w];if(w=(w+1)%g.length,ct.className=St?"stim refr":"stim",ct.style.left=nt+"px",ct.style.top=wt+"px",!ct.animate)return;if(n){ct.animate([{opacity:1,transform:"translate(-50%, -50%) scale(0.3)"},{opacity:0,transform:"translate(-50%, -50%) scale(0.3)"}],{duration:300});return}let Nt=420-200*l.k,Zt=56-16*l.k;ct.animate([{transform:"translate(-50%, -50%) scale(0.05)",opacity:1},{transform:`translate(-50%, -50%) scale(${Zt/28})`,opacity:0}],{duration:Nt,easing:"cubic-bezier(0.2, 0.7, 0.3, 1)"})}let F=0;function q(nt,wt){C.innerHTML=nt,C.classList.remove("show"),C.offsetWidth,C.classList.add("show"),clearTimeout(F),F=setTimeout(()=>{C.classList.remove("show")},wt)}let W=document.createElement("li");W.className="rail-ap",W.setAttribute("aria-hidden","true"),e[0].closest("ol").appendChild(W);let st=null,Y=[];function Q(){let nt=W.parentElement.getBoundingClientRect();Y=e.map(wt=>{let St=wt.getBoundingClientRect();return St.top+St.height/2-nt.top})}let tt=[];function J(nt,wt){if(n||!W.animate||nt===wt||nt<0)return;Y.length!==e.length&&Q();let St=Y,ct=nt<wt?1:-1,Nt=[];for(let re=nt;Nt.push(re),re!==wt;re+=ct);let Zt=40*(1.4-.9*l.k),se=30*(1.4-.9*l.k),Et=Nt.length*(Zt+se)+200,Jt=[],D=0;for(;tt.length;)clearTimeout(tt.pop());Nt.forEach(re=>{Jt.push({transform:`translateY(${St[re]}px)`,opacity:1,offset:D/Et});let zt=e[re];tt.push(setTimeout(()=>{zt.classList.add("node-flash"),setTimeout(()=>zt.classList.remove("node-flash"),140)},D)),D+=Zt,Jt.push({transform:`translateY(${St[re]}px)`,opacity:1,offset:D/Et}),D+=se}),Jt.push({transform:`translateY(${St[wt]}px)`,opacity:0,offset:1}),st&&st.cancel(),st=W.animate(Jt,{duration:Et,easing:"linear"})}let U=0,K=0,at=NaN,Tt=0;function X(){if(!v)return;U=v.clientWidth,K=v.clientHeight;let nt=Math.min(2,devicePixelRatio||1);v.width=Math.max(1,Math.round(U*nt)),v.height=Math.max(1,Math.round(K*nt)),A.setTransform(nt,0,0,nt,0,0),at=NaN}function j(nt,wt){let St=-1;for(let Zt=l.spikes.length-1;Zt>=0;Zt--)if(l.spikes[Zt]<=nt){St=l.spikes[Zt];break}let ct=-70+13*wt;if(St<0)return ct;let Nt=nt-St;return Nt<.025?ct+(40-ct)*(Nt/.025):Nt<.085?40-120*((Nt-.025)/.06):ct+(-80-ct)*Math.exp(-(Nt-.085)/.3)}function ht(nt,wt){if(!A||!u.matches||(U||X(),!(l.spikes.length&&nt-l.spikes[l.spikes.length-1]<2.2)&&Math.abs(wt-at)<.002))return;at=wt;let ct=A,Nt=U,Zt=K;ct.clearRect(0,0,Nt,Zt);let se=Zt-5,Et=_=>1+(45-_)/135*(se-2);ct.lineWidth=1,ct.strokeStyle="#376392",ct.beginPath(),ct.moveTo(0,Et(-70)),ct.lineTo(Nt,Et(-70)),ct.stroke(),ct.setLineDash([3,3]),ct.strokeStyle="#2e5076",ct.beginPath(),ct.moveTo(0,Et(-55)),ct.lineTo(Nt,Et(-55)),ct.stroke(),ct.setLineDash([]);let Jt=2,D=P.length-1,re=_=>{for(;D>0&&P[D][0]>_;)D--;return P.length?P[Math.max(0,D)][1]:0},zt=[];for(let _=Nt;_>=0;_--){let k=nt-Jt*(1-_/Nt);zt.push([_,j(k,re(k))+Math.sin(k*91.7)*.25+Math.sin(k*57.3)*.2])}zt.reverse(),ct.lineWidth=1.2,ct.strokeStyle="#9fbdda",ct.beginPath(),zt.forEach(([_,k],z)=>z?ct.lineTo(_,Et(Math.min(k,0))):ct.moveTo(_,Et(Math.min(k,0)))),ct.stroke(),ct.lineWidth=1.5,ct.strokeStyle=s()>.05?"#f0b46a":"#ccdbeb",ct.beginPath();let R=!1;for(let[_,k]of zt)k>0?(R||ct.moveTo(_,Et(0)),ct.lineTo(_,Et(k)),R=!0):R&&(ct.lineTo(_,Et(0)),R=!1);ct.stroke(),ct.strokeStyle="#6c9ac4",ct.beginPath();for(let _ of l.spikes){let k=Nt*(1-(nt-_)/Jt);k<0||(ct.moveTo(k,Zt-3),ct.lineTo(k,Zt))}ct.stroke()}function Vt(nt,wt){if(!T||!u.matches||nt-Tt<.1)return;Tt=nt;let St=j(nt,wt);T.textContent=`${St>=0?"+":"\u2212"}${Math.abs(Math.round(St))} mV \xB7 ${l.rate.toFixed(1)} Hz \xB7 \u6D41\u901F \xD7${(1+2.2*l.k).toFixed(1)}`}addEventListener("resize",()=>{Y=[],U=0});function ut(nt,wt){let St=r(nt);!i||!St||(St.directional?i.emitWave(St.source.p,{gate:!0,seedPath:St.source.path,ceil:i.bandTop(nt,St.source.path),...wt}):i.emitWave(St.centroid||[0,0,0],{seedPath:-1,gate:!0,...wt,strength:(wt.strength||.75)*.8}))}let Ft=5;function de(nt,wt){let St=wt/1e3;l.rate*=Math.exp(-nt/.9),l.rateSlow*=Math.exp(-nt/3);let ct=1-Math.exp(-l.rate/3.5);n&&(ct=Math.min(ct,.5)),l.k+=(ct-l.k)*(1-Math.exp(-nt/(ct>l.k?.06:.5))),l.M=q_(2,6,l.rateSlow);let Nt=l.k;c.speed*=Math.exp(-nt*6);let se=c.onTarget>0?.85*Math.exp(-c.speed/1.2):0;c.V+=(se-c.V)*(1-Math.exp(-nt/.5));let Et=St-c.lastMove,Jt=Et>6?Math.exp(-(Et-6)/4):1,D=c.V*(.3+.7*Jt),re=c.onTarget*(Et>2.5?.3:1);for(c.on+=(re-c.on)*(1-Math.exp(-nt/.25)),c.phase=(c.phase+nt*1.8)%1,P.push([St,D]);P.length&&P[0][0]<St-2.2;)P.shift();if(f&&p){let zt=Math.round(69.1*(1-Math.min(1,D/.85)));zt!==S&&(S=zt,p.style.strokeDashoffset=String(zt))}if(l.ltpCool-=nt,l.ltp*=Math.exp(-nt/2.5),l.M>.75&&l.ltpCool<=0&&(l.ltpCool=8,l.ltp=1,q("<b>\u9AD8\u9891\u523A\u6FC0 \u2192 \u8BF1\u5BFC LTP</b><span>\u793A\u610F\uFF1A\u771F\u5B9E\u5B9E\u9A8C\u5E38\u7528 100 Hz \u5F3A\u76F4\u523A\u6FC0\u6216 \u03B8 \u8282\u5F8B\u4E32\u523A\u6FC0</span>",3200),ut(a(),{strength:.9,vMul:2}),o&&o()),i){let zt=i.uniforms;for(h=(h+nt*.55*(1+2.2*Nt))%256,zt.uPhase.value=h,zt.uDrive.value=Nt,zt.uSparkGain.value=1+.8*Nt,zt.uWaveSharp.value=30/(1+1.2*Nt),zt.uCaGain.value=.6+.5*Nt,zt.uLTP.value=l.ltp,zt.uHoverV.value=D,zt.uHovPhase.value=c.phase,zt.uMouse.value.set(c.x,c.y),zt.uMouseOn.value=n?c.on*.6:c.on;x.length&&x[x.length-1][2]*Math.exp(-(St-x[x.length-1][3])/1.6)<.02;)x.pop();let R=zt.uTrail.value;for(let z=0;z<R.length;z++){let $=x[z];$?R[z].set($[0],$[1],$[2]*Math.exp(-(St-$[3])/1.6),0):R[z].set(0,0,0,0)}let _=a(),k=1.6+8.4*Nt;if(i.stepWaves(nt,k,_===0?1:1.3),Ft-=nt,Ft<=0&&(Ft=-Math.log(1-Math.random())*5,!n&&!document.hidden&&St>L)){let z=r(_);if(_===0&&z&&z.somata){let $=z.somata[Math.floor(Math.random()*Math.min(7,z.somata.length))];i.emitWave($.p,{strength:.32,seedPath:$.path,gate:!0,ceil:i.bandTop(0,$.path)})}else i.emitWave(i.randomLocal(),{strength:.32,seedPath:-1,gate:!0})}}ht(St,D),Vt(St,D)}return{update:de,hopRail:J,arrive(nt){ut(nt,{strength:n?.38:.75,vMul:1.6,gateR0:.4})},ignite(){ut(0,{strength:.9,vMul:3,decay:.12,life:9})},get k(){return l.k}}}var be=(i,t=document)=>t.querySelector(i),Dr=(i,t=document)=>Array.from(t.querySelectorAll(i)),Nc=(i,t,e)=>Math.min(e,Math.max(t,i)),Rs=(i,t,e)=>i+(t-i)*e,Wu=(i,t,e)=>{let n=Nc((e-i)/(t-i),0,1);return n*n*(3-2*n)},Ku=i=>Math.atan2(Math.sin(i),Math.cos(i)),Z_=(i,t,e)=>i+Ku(t-i)*e;document.documentElement.classList.add("js");var Qu=[],Nr=Dr(".sec"),Vi=Cn.length,J_=[1,2,2,3,3,4,4,5,5],ii=matchMedia("(prefers-reduced-motion: reduce)").matches,Xo={glow:100,tglow:100,accent:100,psize:100,vol:80,font:"Oswald"},Ve={...Xo};try{let i=localStorage.getItem("np-settings-v2");if(i)Ve={...Xo,...JSON.parse(i)};else{let t=JSON.parse(localStorage.getItem("np-settings")||"null");t&&(delete t.font,Ve={...Xo,...t,tglow:t.glow??Xo.tglow},localStorage.setItem("np-settings-v2",JSON.stringify(Ve)),localStorage.removeItem("np-settings"))}}catch{}var Uc=()=>{try{localStorage.setItem("np-settings-v2",JSON.stringify(Ve))}catch{}};function $_(){for(let i of Dr(".neon .line")){let t=i.textContent;i.setAttribute("aria-label",t),i.textContent="",[...t].forEach((e,n)=>{let s=document.createElement("span");s.className=e===" "?"ch sp":"ch",s.textContent=e===" "?"\xA0":e,s.style.setProperty("--i",n),s.setAttribute("aria-hidden","true"),i.appendChild(s)})}}function Pr(){let i=innerHeight;for(let t of Dr(".title.fit")){let e=Dr(".line",t),n=t.parentElement.clientWidth;if(!n)continue;let s=t.dataset.size,r=s==="hero"?Math.min(i*.24,250):s==="outro"?Math.min(i*.12,130):Math.min(i*.2,190),a=e[0];a.style.fontSize="100px";let o=a.getBoundingClientRect().width||1,l=Math.max(28,Math.min(r,100*n*.98/o));t.style.fontSize=l+"px",a.style.fontSize="";for(let c of e.slice(1)){let h=parseFloat(c.dataset.follow||"1");c.style.fontSize=l*h+"px";let f=c.getBoundingClientRect().width;f>n&&(c.style.fontSize=l*h*n*.98/f+"px")}}of()}function Xu(i,t,e){let n=[1,3,5].map(r=>parseInt(i.slice(r,r+2),16)),s=[1,3,5].map(r=>parseInt(t.slice(r,r+2),16));return"rgb("+n.map((r,a)=>Math.round(Rs(r,s[a],e))).join(",")+")"}var $o=1,Ec=1,wc=0;function Cc(i){$o=i,!wc&&(wc=requestAnimationFrame(()=>{wc=0,K_(Math.min(2,$o*Ec))}))}function K_(i){let t=document.documentElement.style;t.setProperty("--tglow",i.toFixed(2));let e=i<1?Xu("#6c9ac4","#9fbdda",i):Xu("#9fbdda","#ccdbeb",(i-1)*.45);if(t.setProperty("--neon-stroke",e),i<.02){t.setProperty("--neon-filter","none");return}let n=Math.min(i,1.7);t.setProperty("--neon-filter",`drop-shadow(0 0 ${(.6+1.2*i).toFixed(1)}px rgba(108,154,196,${(.3+.3*n).toFixed(2)})) drop-shadow(0 0 ${(3+9*i).toFixed(1)}px rgba(73,125,174,${(.28+.32*n).toFixed(2)})) drop-shadow(0 0 ${(10+26*i).toFixed(1)}px rgba(55,99,146,${(.22+.34*n).toFixed(2)}))`)}function Q_(){Ec=1.25,Cc($o),document.documentElement.classList.add("ltp"),setTimeout(()=>{Ec=1,Cc($o),document.documentElement.classList.remove("ltp")},1200)}var j_=be("#dots"),ju=Nr.map((i,t)=>{let e=document.createElement("li"),n=document.createElement("button");return n.type="button",n.innerHTML=`<span>${i.dataset.label}</span>`,n.setAttribute("aria-label",`\u8DF3\u5230\uFF1A${i.dataset.label}`),n.addEventListener("click",()=>i.scrollIntoView({behavior:ii?"auto":"smooth"})),e.appendChild(n),j_.appendChild(e),n}),tx=be("#hudIdx"),ex=be("#hudName"),nx=be("#hudBar"),nn=new Go;nn.setVolume(Ve.vol/100);var qo=be("#soundBtn"),tf=be("#heroPlay"),qu={off:["\u5F00\u542F\u914D\u4E50","\u25B6 \u70B9\u71C3\u914D\u4E50"],loading:["\u914D\u4E50\u8F7D\u5165\u4E2D\u2026","\u914D\u4E50\u8F7D\u5165\u4E2D\u2026"],on:["\u914D\u4E50\uFF1A\u5F00","\u275A\u275A \u6682\u505C\u914D\u4E50"],blocked:["\u70B9\u51FB\u6062\u590D\u914D\u4E50","\u25B6 \u70B9\u51FB\u6062\u590D\u914D\u4E50"],error:["\u914D\u4E50\u4E0D\u53EF\u7528 \xB7 \u91CD\u8BD5","\u25B6 \u91CD\u8BD5\u914D\u4E50"]};function Fc(){let i=nn.uiState;qo.setAttribute("aria-pressed",String(nn.playing)),qo.dataset.state=i,be(".label",qo).textContent=qu[i][0],tf.textContent=qu[i][1]}nn.onStatus=Fc;function ef(){let i=nn.uiState;i==="off"||i==="blocked"||i==="error"?nn.start():nn.stop(),Fc()}qo.addEventListener("click",ef);tf.addEventListener("click",ef);var Oc=be("#panel"),tl=be("#panelBtn");function Bc(i){Oc.hidden=!i,tl.setAttribute("aria-expanded",String(i)),i&&be("#glow").focus({preventScroll:!0})}tl.addEventListener("click",()=>Bc(Oc.hidden));be("#panelClose").addEventListener("click",()=>{Bc(!1),tl.focus()});document.addEventListener("keydown",i=>{i.key==="Escape"&&!Oc.hidden&&(Bc(!1),tl.focus())});var oe=null,nf=2.6;function ix(i){let t=(i.value-i.min)/(i.max-i.min)*100;i.style.setProperty("--fill",t+"%")}function Fr(i,t){let e=be("#"+i),n=be("#"+i+"Out");e.value=Ve[i];let s=()=>{Ve[i]=Number(e.value),n&&(n.textContent=e.value+"%"),ix(e),t(Ve[i])};return e.addEventListener("input",()=>{s(),Uc()}),s(),{input:e,update:s}}var sf=i=>Dr(`.presets[data-target="${i}"] button`),rf=(i,t)=>sf(i).forEach(e=>e.setAttribute("aria-pressed",String(Number(e.dataset.value)===t))),Ko={};Ko.glow=Fr("glow",i=>{let t=i/100;oe&&oe.setGlow(t),document.documentElement.style.setProperty("--glow",t.toFixed(2)),rf("glow",i)});Ko.tglow=Fr("tglow",i=>{Cc(i/100),rf("tglow",i)});for(let i of["glow","tglow"])sf(i).forEach(t=>t.addEventListener("click",()=>{Ko[i].input.value=t.dataset.value,Ko[i].update(),Uc()}));Fr("accent",i=>{oe&&(oe.uniforms.uAccent.value=i/100),document.documentElement.style.setProperty("--ap",i>5?"#f0b46a":"#ccdbeb")});Fr("psize",i=>{oe&&(oe.uniforms.uSize.value=nf*(i/100))});Fr("vol",i=>nn.setVolume(i/100));var Rc=be("#font");Rc.value=Ve.font;var Yu={Oswald:600,Syncopate:700};function af(i){document.documentElement.style.setProperty("--display-weight",String(Yu[i]||400)),document.documentElement.style.setProperty("--font-display",`'${i}', 'Oswald', 'Anton', Impact, 'Arial Narrow Bold', sans-serif`),document.fonts&&document.fonts.load&&document.fonts.load(`${Yu[i]||400} 100px "${i}"`).then(Pr,Pr),Pr()}Rc.addEventListener("change",()=>{Ve.font=Rc.value,Uc(),af(Ve.font)});$_();af(Ve.font);document.fonts&&document.fonts.ready&&document.fonts.ready.then(Pr);var wi=[],Pc=[];function sx(){if(wi=Nr.map(n=>n.offsetTop),Pr(),of(),!oe)return;let[i,t]=oe.visibleHalfSize(),e=innerWidth<=820||i/t<1.05;Pc=Nr.map((n,s)=>{let r=n.dataset.side,a=Cn[s].fit||1,o=s===Vi-1;if(e){if(s===0)return{x:0,y:t*.12,s:Math.min(1,i/1.9)};let h=Math.min(1,i/2.6)*a;return{x:0,y:o?t*.5:t*.36,s:h*.92}}let l=Math.min(1.05,t/3.5)*a,c=(Cn[s].dx||0)*l;return r==="left"?{x:i*.43+c,y:0,s:l}:r==="right"?{x:-i*.43+c,y:0,s:l}:{x:0,y:o?t*.5:0,s:l}})}function of(){let t=n=>{let s=n.filter(Boolean).map(r=>r.getBoundingClientRect());return s.length?[Math.min(...s.map(r=>r.left))-8,Math.min(...s.map(r=>r.top))+scrollY-8,Math.max(...s.map(r=>r.right))+8,Math.max(...s.map(r=>r.bottom))+scrollY+8]:null},e=be("#hero");Qu=[t([be(".kicker",e),be(".title",e)]),t([be(".desc",e),be(".hero-cta",e),be(".tap-hint",e)])]}function rx(i){let t=innerWidth,e=innerHeight;Qu.forEach((n,s)=>{if(!n)return;let r=n[1]-scrollY,a=n[3]-scrollY;i.uTextBox.value[s].set(n[0]/t*2-1,1-a/e*2,n[2]/t*2-1,1-r/e*2)})}function ax(){let i=scrollY,t=0;for(;t<wi.length-1&&wi[t+1]<=i+1;)t++;return t>=wi.length-1?wi.length-1:t+Nc((i-wi[t])/(wi[t+1]-wi[t]),0,1)}var ox=be("#gl"),Ir=be("#loading"),kc=Math.min(innerWidth,innerHeight)<700||(navigator.hardwareConcurrency||8)<=4,Qo=kc?16384:32768,lx=256,lf=()=>Math.min(devicePixelRatio||1,kc?1.5:1.75);try{oe=new zo(ox,{count:Qo,width:lx,shapeCount:Vi,pixelRatio:lf()}),oe.setGlow(Ve.glow/100),oe.uniforms.uAccent.value=Ve.accent/100,oe.uniforms.uSize.value=nf*(Ve.psize/100),/[?&]debug\b/.test(location.search)&&(window.__np={field:oe,audio:nn}),ii&&(oe.uniforms.uMotion.value=.35,oe.uniforms.uScatter.value=.35)}catch(i){console.error(i),document.documentElement.classList.add("no-webgl"),Ir.textContent="\u5F53\u524D\u6D4F\u89C8\u5668\u65E0\u6CD5\u542F\u7528 WebGL2\uFF0C\u7C92\u5B50\u65E0\u6CD5\u663E\u793A\uFF1B\u6587\u5B57\u5185\u5BB9\u4E0E\u914D\u4E50\u4ECD\u53EF\u4F7F\u7528\u3002"}function cf(){oe&&oe.resize(innerWidth,innerHeight,lf()),sx()}addEventListener("resize",cf);cf();var Ic=()=>innerWidth<=820||innerWidth/innerHeight<1.05,Lc=Ic(),Ur=0,Ps=-1;function hf(i){let{pos:t,col:e,meta:n}=Bu(i,Qo,{portrait:Lc});oe.setShape(i,t,e),oe.setMeta(i,n),ff[i]=n,i===0&&oe.uniforms.uSoma.value.forEach((r,a)=>{let o=n.somata&&n.somata[a];o?r.set(o.p[0],o.p[1],o.p[2],o.k):r.set(0,0,0,0)})}async function cx(){for(let i=0;i<Vi;i++)hf(i),Ur=i+1,Ir.textContent=`\u6B63\u5728\u751F\u6210\u795E\u7ECF\u7C92\u5B50 ${Ur} / ${Vi} \xB7 ${Qo.toLocaleString("en-US")} \u4E2A\u7C92\u5B50`,i===0&&(Ps=performance.now()),await new Promise(t=>requestAnimationFrame(()=>setTimeout(t,0)));Ir.textContent=`${Qo.toLocaleString("en-US")} \u4E2A\u7C92\u5B50\u5DF2\u5C31\u7EEA \xB7 ${Vi} \u79CD\u5F62\u6001`,setTimeout(()=>{Ir.style.opacity="0"},2600)}var Zu=0;addEventListener("resize",()=>{!oe||Ur<1||Ic()===Lc||(clearTimeout(Zu),Zu=setTimeout(()=>{Lc=Ic(),hf(0)},400))});var Lr=!1;function uf(){if(Lr)return;Lr=!0,document.documentElement.classList.add("ignite");let i=()=>nn.prepare();window.requestIdleCallback?requestIdleCallback(i,{timeout:4e3}):setTimeout(i,1500)}setTimeout(uf,ii?0:4500);var jo={px:0,py:0};addEventListener("pointermove",i=>{jo.px=i.clientX/innerWidth*2-1,jo.py=-(i.clientY/innerHeight*2-1)},{passive:!0});var ff=[],df=0,Yo=Hu({field:oe,audio:nn,dots:ju,reduceMotion:ii,accent:()=>Ve.accent/100,shapeMeta:i=>ff[i],currentShape:()=>df,onLtp:Q_}),ni=0,Zo=-1,Ju=performance.now(),Ac=0,Ho=0,Wo=0,Dc=0,Cs={x:0,y:0};function $u(i,t){let e=Cn[i],n=ii?.3:1;return e.spin?Ku(t*e.spin*n+i):e.base+e.sway*n*Math.sin(t*.22+i*1.7)}var Jo=!1;function pf(i){Yo.hopRail(Zo,i),Jo=!0,Nr.forEach((e,n)=>e.classList.toggle("is-active",n===i)),document.documentElement.classList.toggle("at-hero",i===0),ju.forEach((e,n)=>e.setAttribute("aria-current",String(n===i)));let t=Nr[i];tx.textContent=String(i===Vi-1?7:i).padStart(2,"0")+" / 07",ex.textContent=`${t.dataset.label} \xB7 ${t.dataset.scale}`,nx.style.setProperty("--p",i/(Vi-1)*100+"%"),nn.setLevel(J_[i]),Zo!==-1&&(nn.impact(),Dc=.5),Zo=i}function mf(i){let t=Math.min(.05,(i-Ju)/1e3);Ju=i,Ac+=t,Ho+=t,Ho>4096&&(Ho-=4096,oe&&oe.rebaseTime(4096));let e=ax(),n=Math.round(e);if(n!==Zo&&pf(n),Wo=Math.max(Wo*Math.exp(-t*7),nn.pollBeats()),Yo.update(t,i),oe){ni+=(e-ni)*(1-Math.exp(-t*5)),Math.abs(e-ni)<1e-4&&(ni=e);let s=Math.max(0,Ur-1),r=Math.min(ni,s),a=Math.floor(r),o=Math.min(s,a+1),l=o===a?0:Wu(.08,.92,r-a),c=oe.uniforms;c.uFrom.value=a,c.uTo.value=o,c.uMix.value=l,c.uTime.value=Ho;let h=Ps<0?0:Math.min(1,(i-Ps)/(ii?800:3200));c.uIntro.value=1-Math.pow(1-h,2);let f=Ps<0?0:Nc((i-Ps-200)/3e3,0,1);f=1-Math.pow(1-f,2),(ii||ni>.05||Lr)&&(f=1),f>=1&&!Lr&&Ps>=0&&(!ii&&ni<=.05&&Yo.ignite(),uf(),Jo=!1),c.uGrow.value=f,df=l<.5?a:o,c.uTextDim.value=1-Wu(0,.6,ni),c.uTextDim.value>0&&rx(c),Dc*=Math.exp(-t*3.2),c.uBeat.value=Wo,c.uFlash.value=Dc,Jo&&Lr&&h>=1&&Math.abs(e-ni)<.03&&Ur>Math.round(e)&&(Jo=!1,Yo.arrive(Math.round(e))),Cs.x+=(jo.px-Cs.x)*(1-Math.exp(-t*2)),Cs.y+=(jo.py-Cs.y)*(1-Math.exp(-t*2));let u=Pc[a]||{x:0,y:0,s:1},d=Pc[o]||u,g=oe.group;g.position.x=Rs(u.x,d.x,l),g.position.y=Rs(u.y,d.y,l),g.scale.setScalar(Rs(u.s,d.s,l)*(1+Wo*.012));let w=Rs(Cn[a].par??1,Cn[o].par??1,l);g.rotation.y=Z_($u(a,Ac),$u(o,Ac),l)+Cs.x*.22*w,g.rotation.x=Rs(Cn[a].tilt,Cn[o].tilt,l)-Cs.y*.12*w;let m=oe.renderer.domElement;oe.setWarp(Math.sin(Math.PI*l),!ii&&!kc&&m.width*m.height<42e5),oe.render()}requestAnimationFrame(mf)}pf(0);Fc();requestAnimationFrame(mf);oe&&cx().catch(i=>{console.error(i),Ir.textContent="\u7C92\u5B50\u751F\u6210\u5931\u8D25\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u91CD\u8BD5\u3002"});})();
/*! Bundled license information:

three/build/three.core.js:
three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2026 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
