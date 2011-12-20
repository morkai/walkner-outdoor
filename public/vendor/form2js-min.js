/**
 * Copyright (c) 2010 Maxim Vasiliev
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var form2js=(function(){function e(m,l,n,k,p){if(typeof n=="undefined"||n==null){n=true}if(typeof l=="undefined"||l==null){l="."}if(arguments.length<5){p=false}m=typeof m=="string"?document.getElementById(m):m;var q=[],j,o=0;if(m.constructor==Array||(typeof NodeList!="undefined"&&m.constructor==NodeList)){while(j=m[o++]){q=q.concat(d(j,k,p))}}else{q=d(m,k,p)}return b(q,n,l)}function b(s,A,C){var p={},q={},y,x,w,v,u,r,n,t,o,m,z,D,B;for(y=0;y<s.length;y++){u=s[y].value;if(A&&(u===""||u===null)){continue}D=s[y].name;B=D.split(C);r=[];n=p;t="";for(x=0;x<B.length;x++){z=B[x].split("][");if(z.length>1){for(w=0;w<z.length;w++){if(w==0){z[w]=z[w]+"]"}else{if(w==z.length-1){z[w]="["+z[w]}else{z[w]="["+z[w]+"]"}}m=z[w].match(/([a-z_]+)?\[([a-z_][a-z0-9_]+?)\]/i);if(m){for(v=1;v<m.length;v++){if(m[v]){r.push(m[v])}}}else{r.push(z[w])}}}else{r=r.concat(z)}}for(x=0;x<r.length;x++){z=r[x];if(z.indexOf("[]")>-1&&x==r.length-1){o=z.substr(0,z.indexOf("["));t+=o;if(!n[o]){n[o]=[]}n[o].push(u)}else{if(z.indexOf("[")>-1){o=z.substr(0,z.indexOf("["));m=z.replace(/(^([a-z_]+)?\[)|(\]$)/gi,"");t+="_"+o+"_"+m;if(!q[t]){q[t]={}}if(o!=""&&!n[o]){n[o]=[]}if(x==r.length-1){if(o==""){n.push(u);q[t][m]=n[n.length-1]}else{n[o].push(u);q[t][m]=n[o][n[o].length-1]}}else{if(!q[t][m]){if((/^[a-z_]+\[?/i).test(r[x+1])){n[o].push({})}else{n[o].push([])}q[t][m]=n[o][n[o].length-1]}}n=q[t][m]}else{t+=z;if(x<r.length-1){if(!n[z]){n[z]={}}n=n[z]}else{n[z]=u}}}}}return p}function d(k,j,l){var i=a(k,j,l);return i.length>0?i:g(k,j,l)}function g(k,j,m){var i=[],l=k.firstChild;while(l){i=i.concat(a(l,j,m));l=l.nextSibling}return i}function a(l,j,n){var k,m,i,o=f(l,n);k=j&&j(l);if(k&&k.name){i=[k]}else{if(o!=""&&l.nodeName.match(/INPUT|TEXTAREA/i)){m=c(l);i=[{name:o,value:m}]}else{if(o!=""&&l.nodeName.match(/SELECT/i)){m=c(l);i=[{name:o.replace(/\[\]$/,""),value:m}]}else{i=g(l,j,n)}}}return i}function f(i,j){if(i.name&&i.name!=""){return i.name}else{if(j&&i.id&&i.id!=""){return i.id}else{return""}}}function c(i){if(i.disabled){return null}switch(i.nodeName){case"INPUT":case"TEXTAREA":switch(i.type.toLowerCase()){case"radio":case"checkbox":if(i.checked&&i.value==="true"){return true}if(!i.checked&&i.value==="true"){return false}if(i.checked){return i.value}break;case"button":case"reset":case"submit":case"image":return"";break;default:return i.value;break}break;case"SELECT":return h(i);break;default:break}return null}function h(o){var k=o.multiple,j=[],n,p,m;if(!k){return o.value}for(n=o.getElementsByTagName("option"),p=0,m=n.length;p<m;p++){if(n[p].selected){j.push(n[p].value)}}return j}return e})();
(function(a){a.fn.toObject=function(c){var b=[],d={mode:"first",delimiter:".",skipEmpty:true,nodeCallback:null,useIdIfEmptyName:false};if(c){a.extend(d,c)}switch(d.mode){case"first":return form2js(this.get(0),d.delimiter,d.skipEmpty,d.nodeCallback,d.useIdIfEmptyName);break;case"all":this.each(function(){b.push(form2js(this,d.delimiter,d.skipEmpty,d.nodeCallback,d.useIdIfEmptyName))});return b;break;case"combine":return form2js(Array.prototype.slice.call(this),d.delimiter,d.skipEmpty,d.nodeCallback,d.useIdIfEmptyName);break}}})(jQuery);